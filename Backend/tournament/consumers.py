import json
import asyncio
from utils.redis import RedisManager
from urllib.parse import parse_qs
from user.models import UserProfile
from django.core.exceptions import ObjectDoesNotExist
from rest_framework_simplejwt.tokens import AccessToken
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from channels.layers import get_channel_layer

class TournamentConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_id = self.scope["url_route"]["kwargs"]["room_id"]
        self.room_group_name = f"tournament_{self.room_id}"
        user_key = f"tournament:{self.room_id}:users"

        self.user = await self.authenticate_user()
        if not self.user:
            await self.close(code=4001)  
            return
        players = await RedisManager.get_all_users_list_map(user_key)
        if len(players) >= 4:
            print("Room Full", flush=True)
            await self.close(code=4000)
            return

        self.tournament_id = None
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

        await self.send(text_data=json.dumps({
            "message": f"Connected to tournament {self.room_id}",
            "room_id": self.room_id,
        }))

    async def disconnect(self, close_code):async def create_tournament_match(room_id: str, player1_id: int, player2_id: int):
    try:
        # ✅ Fetch the tournament object (sync-to-async required)
        tournament = await sync_to_async(TournamentMatch.objects.get)(id=room_id)

        # ✅ Fetch the user objects for player1 and player2
        player1 = await sync_to_async(User.objects.get)(id=player1_id)
        player2 = await sync_to_async(User.objects.get)(id=player2_id)

        # ✅ Create a new match entry
        new_match = await sync_to_async(Match.objects.create)(
            player1=player1,
            player2=player2,
            is_ongoing=True,  
            is_finished=False,
            is_tournament=True  # Mark as tournament game
        )

        # ✅ Link the match to the tournament's ManyToManyField
        await sync_to_async(tournament.matches.add)(new_match)

        # ✅ Notify players about the match
        channel_layer = get_channel_layer()
        await channel_layer.group_send(
            f"tournament_{room_id}",  # Tournament group name
            {
                "type": "tournament_match_created",
                "match_id": str(new_match.id),
                "player1": player1.username,
                "player2": player2.username,
                "message": f"⚔️ A match has been created! {player1.username} vs {player2.username}",
            }
        )

        print(f"✅ Match {new_match.id} created for tournament {room_id}: {player1.username} vs {player2.username}", flush=True)

    except TournamentMatch.DoesNotExist:
        print(f"❌ Tournament {room_id} not found!", flush=True)
    except User.DoesNotExist:
        print(f"❌ One or both players not found! (IDs: {player1_id}, {player2_id})", flush=True)
    except Exception as e:
        print(f"❌ Error creating match: {e}", flush=True)
        user_key = f"tournament:{self.room_id}:users"
        if self.tournament_id != None:
            await RedisManager.update_user_data_map(user_key, self.tournament_id, "is_on_page", False)
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "user_disconnected",
                "user_id": self.channel_name, #For now sending channel name, should upgarde this
            }
        )

        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get("type")
        user_key = f"tournament:{self.room_id}:users"
        state_key = f"tournament:{self.room_id}:state"

        if message_type == "user_connected":
            self.tournament_id = self.is_returning_user(self.user.id)
            if self.tournament_id == None:
                user_data = {
                    "id": self.user.id,  #questonable
                    "tournament_name": await sync_to_async(lambda: self.user.tournament_name)(),
                    "profile_picture": await sync_to_async(lambda: self.user.profile_picture.url if self.user.profile_picture else None)(),
                    "is_on_page": True,
                    "is_waiting_finals": False
                }
                players = await RedisManager.get_all_users_list_map(user_key)
                self.tournament_id = f"player_{len(players) + 1}"
                await RedisManager.store_user_data_map(user_key, self.tournament_id, user_data)
            else:
                await RedisManager.update_user_data_map(user_key, self.tournament_id, "is_on_page", True)
            connected_users = await RedisManager.get_all_users_json(user_key)

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "new_user_joined",
                    "users": connected_users,
                }
            )
        elif message_type == "user_disconnected":
            if self.tournament_id != None and await RedisManager.get_state(state_key) in ["waiting for players", "unknown"]:
                await RedisManager.delete_user_data_map(user_key, self.tournament_id)
            
    
    async def authenticate_user(self):
        try:
            query_params = parse_qs(self.scope["query_string"].decode())  
            token = query_params.get("token", [None])[0]  

            if not token:
                return None  

            decoded_token = AccessToken(token)  
            user_id = decoded_token["user_id"]  

            return await self.get_user(user_id)
        
        except Exception as e:
            print(f"JWT Authentication Error: {e}")
            return None  

    async def get_user(self, user_id):
        try:
            return await asyncio.get_event_loop().run_in_executor(user_data = {
                    "id": self.user.id,  #questonable
                    "tournament_name": await sync_to_async(lambda: self.user.tournament_name)(),
                    "profile_picture": await sync_to_async(lambda: self.user.profile_picture.url if self.user.profile_picture else None)(),
                    "is_on_page": True,
                    "is_waiting_finals": False
                
                None, lambda: UserProfile.objects.get(id=user_id)
            )
        except ObjectDoesNotExist:
            return None

    async def is_returning_user(self, new_user_id):
        user_key = f"tournament:{self.room_id}:users"
        existing_users = await RedisManager.get_all_users_json(user_key)  # Fetch current users

        for user_id, user_data in existing_users.items():  
            if user_data.get("id") == new_user_id:
                print(f"User {new_user_id} is a RETURNING player, stored under {user_id}.")
                return user_id 

        print(f"User {new_user_id} is a NEW player.")
        return None  
    
    async def update_tournament_state(self):
        user_key = f"tournament:{self.room_id}:users"
        state_key = f"tournament:{self.room_id}:state"
        display_state_key = f"tournament:{self.room_id}:display_state"
        save_tournament_key = f"tournament:{self.room_id}:saved"
        players = await RedisManager.get_all_users_list_map(user_key)
        num_players = len(players)
        previous_state = await RedisManager.get_state(state_key) 

        if num_players < 4 and previous_state in ["waiting for players", "unknown"]:
            new_state = "waiting_for_players"
        elif num_players == 4 and previous_state in ["waiting for players", "unknown"]:
            new_state = "tournament_starting" #for now a simple state manager would need to upgarde this
            #Notify users NOT on page and Start Tournament.
            asyncio.create_task(notify_absent_players_and_wait(self.room_name))
        elif previous_state == "playing finals":
            winner = self.get_tournament_winner_id()
            if winner != None:
                was_set = await self.redis.execute("SET", save_tournament_key, self.channel_name, "NX")
                if was_set:
                    display_state = await RedisManager.get_json(display_state_key)
                    display_state["third_layer"] = winner
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            "type": "tournament_display_update",
                            "state": display_state,
                        }
                    )
                    tournament_users = await RedisManager.get_all_users_json(user_key)
                    winner_data = tournament_users.get(winner)
                    save_tournament_outcome(self.room_name, True, False, int(winner_data["id"]))
                    new_state = "tournament finished"
                    await RedisManager.delete_keys(save_tournament_key)
            else:
                new_state = "playing finals"
        else:
            new_state = await RedisManager.get_state(state_key)

        await RedisManager.set_state(state_key, new_state)

        # Broadcast the updated state to all players
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "tournament_state_update",
                "state": new_state
            }
        )

    async def get_tournament_winner_id(self):
    try:
        tournament = await sync_to_async(TournamentMatch.objects.prefetch_related("matches").get)(id=self.room_id)

        final_match = await sync_to_async(lambda: tournament.matches.filter(is_finale=True, is_ongoing=False, is_finished=True).first())()

        if not final_match:
            print(f"❌ No final match found. final match is still ongoing tournament: {self.room_id}.", flush=True)
            return None

        winner = await sync_to_async(lambda: final_match.winner)()
        if not winner:
            print(f"⚠️ Tournament {self.room_id} final match has No winner", flush=True)
            return None

        user_key = f"tournament:{self.room_id}:users"
        tournament_users = await RedisManager.get_all_users_json(user_key)

        for tournament_id, user_data in tournament_users.items():
            if str(user_data.get("id")) == str(winner.id):
                print(f"🏆 Tournament {self.room_id} has a winner! Tournament ID: {tournament_id}, User: {winner.username}", flush=True)
                return tournament_id  
        print(f"⚠️ Winner {winner.username} not found in Redis for Tournament {self.room_id}.", flush=True)
        return None
    except TournamentMatch.DoesNotExist:
        print(f"❌ Tournament {self.room_id} not found!", flush=True)
        return None
    except Exception as e:
        print(f"❌ Error checking tournament winner: {e}", flush=True)
        return None

    async def tournament_state_update(self, event):
        await self.send(text_data=json.dumps({
            "type": "tournament_state",
            "state": event["state"]
        }))

    async def new_user_joined(self, event):
        await self.send(text_data=json.dumps({
            "type": "new_user",
            "users": event["users"]
        }))

    async def user_disconnected(self, event):
        await self.send(text_data=json.dumps({
            "type": "user_left",
            "user_id": event["user_id"]
        }))

    async def tournament_message(self, event):
        await self.send(text_data=json.dumps({
            "type": "tournament_message",
            "message": event["message"],
            "sender": event["sender"],
        }))

    async def tournament_notification(self, event):
        await self.send(text_data=json.dumps({
            "type": "tournament_message",
            "message": event["message"],
        }))

    async def tournament_display_update(self, event):
        display_state_key = f"tournament:{self.room_id}:display_state"
        await RedisManager.add_json(display_state_key, json.dumps(event["state"]))
        await self.send(text_data=json.dumps({
            "type": "tournament_display_update",
            "state": event["state"],
        }))

    async def tournament_match_created(self, event):
        if self.tournament_id in event["players"]:
            await self.send(text_data=json.dumps({
            "type": "tournament_match_created",
            "match_id": event["match_id"],
            "message": event["message"]
        }))

    async def three_players_start(self, event):
        state_key = f"tournament:{self.room_id}:state"
    
    async def two_players_start(self, event):
        state_key = f"tournament:{self.room_id}:state"

        players = event["players"]
        all_ids = ["player_1", "player_2", "player_3", "player_4"]
        first_layer_1 = players[0]
        first_layer_3 = players[1]
        for id in all_ids:
            if id not in players:
                first_layer_2 = id
                if id != first_layer_2:
                    first_layer_4 = id
        
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "tournament_display_update",
                "state": {
                    "first_layer_1": first_layer_1,
                    "first_layer_2": first_layer_2,
                    "first_layer_3": first_layer_3,
                    "first_layer_4": first_layer_4,
                    "second_layer_1": players[0],
                    "second_layer_2": players[1],
                    "third_layer": "none",
                }
            }
        )

        await RedisManager.set_state(state_key, "playing finals")

        create_tournament_match(self.room_name, players[0], players[1], true)



        

######################################################################################################################################################################################

async def create_tournament_match(room_id: str, tournament_id_1: str, tournament_id_2: str, is_finale: bool):
    try:
        tournament = await sync_to_async(TournamentMatch.objects.get)(id=room_id)
        user_key = f"tournament:{room_id}:users"
        tournament_users = await RedisManager.get_all_users_json(user_key)

        player1_data = tournament_users.get(tournament_id_1)
        player2_data = tournament_users.get(tournament_id_2)

        if not player1_data or not player2_data:
            print(f"❌ Error: One or both tournament IDs are invalid ({player1_tournament_id}, {player2_tournament_id})", flush=True)
            return

        player1_id = player1_data["id"]
        player2_id = player2_data["id"]

        player1 = await sync_to_async(User.objects.get)(id=player1_id)
        player2 = await sync_to_async(User.objects.get)(id=player2_id)

        new_match = await sync_to_async(Match.objects.create)(
            player1=player1,
            player2=player2,
            is_ongoing=True,  
            is_finished=False,
            is_tournament=True,
            is_finale=is_finale
        )

        await sync_to_async(tournament.matches.add)(new_match)

        channel_layer = get_channel_layer()
        await channel_layer.group_send(
            f"tournament_{room_id}",    
            {
                "type": "tournament_match_created",
                "match_id": str(new_match.id),
                "players": [tournament_id_1, tournament_id_2],
                "message": "Game Created!",
            }
        )

        print(f"✅ Match {new_match.id} created for tournament {room_id}: {player1.username} vs {player2.username}", flush=True)

    except TournamentMatch.DoesNotExist:
        print(f"❌ Tournament {room_id} not found!", flush=True)
    except User.DoesNotExist:
        print(f"❌ One or both players not found! (IDs: {player1_id}, {player2_id})", flush=True)
    except Exception as e:
        print(f"❌ Error creating match: {e}", flush=True)


async def notify_absent_players_and_wait(room_name):
    user_key = f"tournament:{room_id}:users"
    state_key = f"tournament:{room_id}:state"
    await RedisManager.set_state(state_key, "tournament onging")

    players = await RedisManager.get_all_users_json(user_key)
    absent_players = [user for user in players.values() if user["is_on_page"].lower() != "true"]

    for player in absent_players:three_players_start
        await send_chat_notification(room_name, player["id"], "⚠️ Tournament is starting! Please join now!")


     channel_layer = get_channel_layer()

    # Send the message to the group
    await channel_layer.group_send(
        f"tournament_{room_name}",  
        {
            "type": "tournament_notification",
            "message": "Tournament is starting! Get Ready!"
        }
    )

    await asyncio.sleep(30)


    players_after_wait = await RedisManager.get_all_users_json(user_key)
    present_players = [user for user in players_after_wait.values() if user["is_on_page"].lower() == "true"]
    present_tournament_ids  = [user_id for user_id, user in players_after_wait.items() if user["is_on_page"].lower() == "True"]

    if len(present_players) == 0:
        save_tournament_outcome(room_name, True, False, None)
    elif len(present_players) == 1:
        save_tournament_outcome(room_name, True, False, present_players[0]["id"])
    elif len(present_players) == 2:
        await channel_layer.group_send(
        f"tournament_{room_name}",  
        {
            "type": "two_players_start",
            "players": present_tournament_ids 
        }
    )
    elif len(present_players) == 3:
        await channel_layer.group_send(
        f"tournament_{room_name}", 
        {
            "type": "three_players_start",
            "players": present_tournament_ids 
        }
    )
    elif len(present_players) == 4:
        await channel_layer.group_send(
        f"tournament_{room_name}",
        {  
            "type": "four_players_start",
            "players": present_tournament_ids 
        }
    )


async def save_tournament_outcome(room_name: str, is_finished: bool, is_ongoing: bool, winner: int | None):
    await RedisManager.delete_tournament_data(room_name)
    try:
        tournament = await sync_to_async(TournamentMatch.objects.get)(id=room_name)

        winner = None
        if winner_id is not None:
            winner = await sync_to_async(User.objects.get)(id=winner_id)

        tournament.is_finished = is_finished
        tournament.is_ongoing = is_ongoing
        tournament.tournament_winner = winner

        await sync_to_async(tournament.save)()

        print(f"✅ Tournament {room_name} updated: Finished={is_finished}, Ongoing={is_ongoing}, Winner={winner.username if winner else 'None'}", flush=True)

    except TournamentMatch.DoesNotExist:
        print(f"❌ Error: Tournament {room_name} not found!", flush=True)
    
    
async def send_chat_notification(room_name, user_id, message):
    chat_group_name = f"chat_{user_id}"

    await self.channel_layer.group_send(
        chat_group_name,
        {
            "type": "chat.message",
            "message": message
        }
    )