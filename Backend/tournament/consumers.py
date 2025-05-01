import json
import asyncio
import random
import time
from django.contrib.auth.models import User
from utils.redis import RedisManager
from match.models import Match
from urllib.parse import parse_qs
from user.models import UserProfile
from django.core.exceptions import ObjectDoesNotExist
from rest_framework_simplejwt.tokens import AccessToken
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from channels.layers import get_channel_layer
from tmatch.models import TournamentMatch

DEBUG_ACTIONS = False
DEBUG_ERRORS = False
DEBUG_INFO = False

class TournamentConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_id = self.scope["url_route"]["kwargs"]["room_id"]
        self.room_group_name = f"tournament_{self.room_id}"
        self.tournament_id = None
        user_key = f"tournament:{self.room_id}:users"
        state_key = f"tournament:{self.room_id}:state"

        self.user = await self.authenticate_user()
        self.redis = await RedisManager.get_redis()
        if not self.user:
            await self.close(code=4001)  
            return
        check =  await self.is_returning_user(self.user.id)
        players = await RedisManager.get_all_users_list_map(user_key)
        if check == None and len(players) >= 4:
            if DEBUG_INFO:
                print("Room Full", flush=True)
            await self.close(code=4000)
            return
        '''
        if await RedisManager.get_state(state_key)  == "tournament finished":
            if DEBUG_INFO:
                print("tournament is finished", flush=True)
            await self.close(code=4002)
            return
        '''
        
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await asyncio.sleep(0.1)

        await self.accept()

        await self.send(text_data=json.dumps({
            "type": "Connected to tournament",
        }))

    async def disconnect(self, close_code):
        user_key = f"tournament:{self.room_id}:users"
        if self.tournament_id != None:
            await RedisManager.update_user_data_map(user_key, self.tournament_id, "is_on_page", "false")
        await asyncio.sleep(0)
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "user_disconnected",
                "user_id": self.channel_name, #For now sending channel name, should upgarde this
            }
        )
        await asyncio.sleep(0)
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get("type")
        user_key = f"tournament:{self.room_id}:users"
        state_key = f"tournament:{self.room_id}:state"
        tournament_ended = f"{self.room_id}:ended"
        end_display = f"{self.room_id}:end_display"
        users_for_end = f"{self.room_id}:users_for_end"

        if message_type == "user_connected":
            if await RedisManager.get_state(tournament_ended) == "true":
                if DEBUG_INFO:
                    print(f"tried to connect after end user id: {self.user.id}", flush=True)
                await self.get_display(True)
                return
            self.tournament_id =  await self.is_returning_user(self.user.id)
            if self.tournament_id == None:
                user_data = {
                    "id": self.user.id,  
                    "tournament_name": await sync_to_async(lambda: self.user.tournament_name)(),
                    "profile_picture": await sync_to_async(lambda: self.user.profile_picture.url if self.user.profile_picture else None)(),
                    "is_on_page": "true",
                    "is_waiting_finals": "false"
                }
                players = await RedisManager.get_all_users_list_map(user_key)
                self.tournament_id = f"player_{len(players) + 1}"
                await RedisManager.store_user_data_map(user_key, self.tournament_id, user_data)
                connected_users = await RedisManager.get_all_users_json(user_key)
                await asyncio.sleep(0)
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "new_user_joined",
                        "users": connected_users,
                        "id": self.tournament_id
                    }
                )
                await asyncio.sleep(0)
                await self.update_display()
            else:
                connected_users = await RedisManager.get_all_users_json(user_key)
                await asyncio.sleep(0)
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "new_user_joined",
                        "users": connected_users,
                        "id": self.tournament_id
                    }
                )
                await asyncio.sleep(0)
                await RedisManager.update_user_data_map(user_key, self.tournament_id, "is_on_page", "true")
                await self.get_display(False)
            await self.update_tournament_state()
        elif message_type == "user_disconnected":
            if self.tournament_id != None and await RedisManager.get_state(state_key) in ["waiting for players", "unknown"]:
                await RedisManager.delete_user_data_map(user_key, self.tournament_id)
                players = await RedisManager.get_all_users_list_map(user_key)
                await self.update_display()
                #if len(players) == 0:
                    #save_tournament_outcome(self.room_id,True, False, None)
                self.tournament_id = None
    
    async def update_display(self):
        user_key = f"tournament:{self.room_id}:users"

        connected_users = await RedisManager.get_all_users_json(user_key)
        layers = ["first_layer_1", "first_layer_2", "first_layer_3", "first_layer_4", "second_layer_1", "second_layer_2", "third_layer"]

        display_json = {layer: "none" for layer in layers}
        user_ids = list(connected_users.keys())[:4]
        for idx,user_id in enumerate(user_ids):
            display_json[layers[idx]] = user_id
        await asyncio.sleep(0)
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "tournament_display_update",
                "state": display_json
            }
        )
        await asyncio.sleep(0)
    
    async def get_display(self, is_end: bool):
        display_state_key = f"tournament:{self.room_id}:display_state"
        user_key = f"tournament:{self.room_id}:users"
        users_for_end = f"{self.room_id}:users_for_end"
        end_display = f"{self.room_id}:end_display"

        if is_end:
            display = await RedisManager.get_json(end_display)
            connected_users = await RedisManager.get_all_users_json(users_for_end)
        else:
            display = await RedisManager.get_json(display_state_key)
            connected_users = await RedisManager.get_all_users_json(user_key)
        
        await self.send(text_data=json.dumps({
            "type": "new_user",
            "users": connected_users,
            "id": self.tournament_id
        }))
        await asyncio.sleep(0.2)
        await self.send(text_data=json.dumps({
            "type": "tournament_display_update",
            "state": display,
        }))
        await asyncio.sleep(0.5)

    async def refresh_display(self):
        display_state_key = f"tournament:{self.room_id}:display_state"

        display = await RedisManager.get_json(display_state_key)
        await asyncio.sleep(0)
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "tournament_display_update",
                "state": display
            }
        )
        await asyncio.sleep(0)
            
    
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
            if DEBUG_ERRORS:
                print(f"JWT Authentication Error: {e}")
            return None  


    async def get_user(self, user_id):

        try:
            if DEBUG_INFO:
                print(f"user_id type: {type(user_id)} user id {user_id}", flush=True)
            user = await asyncio.get_event_loop().run_in_executor(
                None, lambda: UserProfile.objects.get(id=user_id)
            )
            return user
        except ObjectDoesNotExist:
            return None


    async def is_returning_user(self, new_user_id):
        user_key = f"tournament:{self.room_id}:users"
        existing_users = await RedisManager.get_all_users_json(user_key)  # Fetch current users

        for user_id, user_data in existing_users.items():  
            if user_data.get("id") == new_user_id:
                if DEBUG_INFO:
                    print(f"User {new_user_id} is a RETURNING player, stored under {user_id}.")
                return user_id 
        if DEBUG_INFO:
            print(f"User {new_user_id} is a NEW player.")
        return None  
    
    async def update_tournament_state(self):
        user_key = f"tournament:{self.room_id}:users"
        state_key = f"tournament:{self.room_id}:state"
        display_state_key = f"tournament:{self.room_id}:display_state"
        save_tournament_key = f"tournament:{self.room_id}:saved"
        tournament_ended = f"{self.room_id}:ended"
        users_for_end = f"{self.room_id}:users_for_end"
        end_display = f"{self.room_id}:end_display"
        players = await RedisManager.get_all_users_list_map(user_key)
        num_players = len(players)
        previous_state = await RedisManager.get_state(state_key) 

        if DEBUG_INFO:
            print(f"number of players: {num_players} and Previous State: {previous_state}", flush=True)
            print(f"going to try tp update state by consumer {self.tournament_id}", flush=True)
        if num_players < 4 and previous_state in ["waiting for players", "unknown"]:
            new_state = "waiting for players"
        elif num_players == 4 and previous_state in ["waiting for players", "unknown"]:
            new_state = "tournament_starting"
            all_users = await RedisManager.get_all_users_json(user_key)
            for user_id, user_data in all_users.items():
                await RedisManager.store_user_data_map(users_for_end, user_id, user_data)
            await RedisManager.give_expiry_time(users_for_end, 7200)
            asyncio.create_task(notify_absent_players_and_wait(self.room_id))
        elif previous_state == "playing finals":
            winner = await self.get_tournament_winner_id()
            if winner != None:
                was_set = await self.redis.execute("SET", save_tournament_key, self.channel_name, "NX")
                if was_set:
                    if DEBUG_ACTIONS:
                        print(f"{self.tournament_id} Ran playing finals case to save the tournament outcome", flush=True)
                    display_state = await RedisManager.get_json(display_state_key)
                    display_state["third_layer"] = winner
                    await RedisManager.delete_keys(end_display)
                    await RedisManager.set_expiry_json(end_display, 600, display_state)
                    await asyncio.sleep(0)
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            "type": "tournament_display_update",
                            "state": display_state,
                        }
                    )
                    await asyncio.sleep(0)
                    tournament_users = await RedisManager.get_all_users_json(user_key)
                    winner_data = tournament_users.get(winner)
                    await RedisManager.set_expiry_key(tournament_ended, 600)
                    await save_tournament_outcome(self.room_id, True, False, int(winner_data["id"]))
                    new_state = "tournament finished"
                    await RedisManager.delete_keys(save_tournament_key)
                else:
                    await self.get_display(False)
                    if DEBUG_ACTIONS:
                        print(f"{self.tournament_id} tried to run playing finals case to save the tournament outcome", flush=True)
                    new_state = await RedisManager.get_state(state_key)
            else:
                new_state = "playing finals"
        elif previous_state == "playing first stage":
            was_set = await self.redis.execute("SET", save_tournament_key, self.channel_name, "NX")
            if was_set:
                if DEBUG_ACTIONS:
                    print(f"{self.tournament_id} Ran playing first stage case to run check non final match winners", flush=True)
                asyncio.create_task(self.check_non_final_match_winners())
                new_state = await RedisManager.get_state(state_key)
            else:
                await self.get_display(False)
                if DEBUG_ACTIONS:
                    print(f"{self.tournament_id} tried to run playing first stage case to run check non final match winners", flush=True)
                new_state = await RedisManager.get_state(state_key)
        else:
            new_state = await RedisManager.get_state(state_key)

        await RedisManager.set_state(state_key, new_state)


    async def check_non_final_match_winners(self):
        try:
            user_key = f"tournament:{self.room_id}:users"
            display_state_key = f"tournament:{self.room_id}:display_state"
            save_tournament_key = f"tournament:{self.room_id}:saved"

            tournament = await sync_to_async(TournamentMatch.objects.prefetch_related("matches").get)(id=self.room_id)

            non_final_matches = await sync_to_async(
                lambda: list(tournament.matches.filter(is_finale=False, is_ongoing=False, is_finished=True))
            )()

            if not non_final_matches:
                if DEBUG_INFO:
                    print(f"⚠️ No finished non-final matches for tournament {self.room_id}.", flush=True)
                await RedisManager.delete_keys(save_tournament_key)
                return "nope"

            tournament_users = await RedisManager.get_all_users_json(user_key)
            display_state = await RedisManager.get_json(display_state_key)

            winners = []
            for match in non_final_matches:
                winner = await sync_to_async(lambda: match.winner)()
                if winner:
                    winners.append(winner)
                else:
                    await save_tournament_outcome(self.room_id, True, False, None)
                    await asyncio.sleep(0)
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            "type": "tournament_crashed",
                        }
                    )
                    await asyncio.sleep(0)

            if not winners:
                if DEBUG_INFO:
                    print(f"⚠️ No winners yet in non-final matches for tournament {self.room_id}.", flush=True)
                await RedisManager.delete_keys(save_tournament_key)
                return  "nope"
            if DEBUG_ACTIONS:
                print(f"🏆 Found {len(winners)} winners in tournament {self.room_id} non-finals.", flush=True)

            if len(winners) == 1:
                victor = None
                for tournament_id, user_data in tournament_users.items():
                    if user_data.get("id", None) == winners[0].id:
                        victor = (tournament_id, user_data)
                        break
                if victor == None:
                    if DEBUG_ERRORS:
                        print("⚠️ Victor is none even though len(winners) is 1", flush=True)
                    await RedisManager.delete_keys(save_tournament_key)
                    return "nope"

                waiting_players = []
                for tournament_id, user_data in tournament_users.items():
                    if user_data.get("is_waiting_finals", "false") == "true":  
                        waiting_players.append((tournament_id, user_data)) 
                if victor[0] in [display_state["first_layer_1"],display_state["first_layer_2"]]:
                    display_state["second_layer_1"] = victor[0]
                elif victor[0] in [display_state["first_layer_3"],display_state["first_layer_4"]]:
                    display_state["second_layer_2"] = victor[0]
                else:
                    if DEBUG_ERRORS:
                        print(f"⚠️ Victor {victor[0]} not found in the expected first layer positions.", flush=True)
                    await RedisManager.delete_keys(save_tournament_key)
                    return "nope"
                await asyncio.sleep(0)
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "tournament_display_update",
                        "state": display_state
                    }
                )
                await asyncio.sleep(0)
                if not waiting_players:
                    await RedisManager.update_user_data_map(user_key, victor[0], "is_waiting_finals", "true")
                    await RedisManager.delete_keys(save_tournament_key)
                    return "nope"
                if len(waiting_players) == 1 and waiting_players[0][0] == victor[0]:
                    await RedisManager.delete_keys(save_tournament_key)
                    return "nope"

                if len(waiting_players) == 1 and waiting_players[0][0] != victor[0]:
                    await RedisManager.update_user_data_map(user_key, victor[0], "is_waiting_finals", "true")
                    absent_players = []
                    if waiting_players[0][1].get("is_on_page", "false") != "true":
                        absent_players.append(waiting_players[0][1])
                    if victor[1].get("is_on_page", "false") != "true":
                        absent_players.append(victor[1])
                    if not absent_players:
                        await timer(self.room_id, 5, "Finals starting in")
                        await handle_finals_start(self.room_id)
                    else:
                        asyncio.create_task(notify_and_wait_for_reconnect(self.room_id, absent_players))
                    await RedisManager.delete_keys(save_tournament_key)
                    return "nope"
                if len(waiting_players) > 1:
                    print (f"something went wrong! first waiting player: {waiting_players[0][0]} second: {waiting_players[1][0]} and the victor: {victor[0]}")    
            elif len(winners) == 2:
                victor1 = None
                victor2 = None
                for tournament_id, user_data in tournament_users.items():
                    if user_data.get("id", None) == winners[0].id:
                        victor1 = (tournament_id, user_data)
                    if user_data.get("id", None) == winners[1].id:
                        victor2 = (tournament_id, user_data)
                if victor1 == None or victor2 == None:
                    if DEBUG_ERRORS:
                        print("one of the 2 victors is none even though there are 2 winners", flush=True)
                    await RedisManager.delete_keys(save_tournament_key)
                    return "nope"
                await RedisManager.update_user_data_map(user_key, victor1[0], "is_waiting_finals", "true")
                await RedisManager.update_user_data_map(user_key, victor2[0], "is_waiting_finals", "true")
                if victor1[0] in [display_state["first_layer_1"],display_state["first_layer_2"]]:
                    display_state["second_layer_1"] = victor1[0]
                elif victor1[0] in [display_state["first_layer_3"],display_state["first_layer_4"]]:
                    display_state["second_layer_2"] = victor1[0]
                else:
                    if DEBUG_ERRORS:
                        print(f"⚠️ Victor {victor1[0]} not found in the expected first layer positions.", flush=True)
                    await RedisManager.delete_keys(save_tournament_key)
                    return "nope"
                if victor2[0] in [display_state["first_layer_1"],display_state["first_layer_2"]]:
                    display_state["second_layer_1"] = victor2[0]
                elif victor2[0] in [display_state["first_layer_3"],display_state["first_layer_4"]]:
                    display_state["second_layer_2"] = victor2[0]
                else:
                    if DEBUG_ERRORS:
                        print(f"⚠️ Victor {victor2[0]} not found in the expected first layer positions.", flush=True)
                    await RedisManager.delete_keys(save_tournament_key)
                    return "nope"
                await asyncio.sleep(0)
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "tournament_display_update",
                        "state": display_state
                    }
                )
                await asyncio.sleep(0)
                absent_players = []
                if victor1[1].get("is_on_page", "false") != "true":
                        absent_players.append(victor1[1])
                if victor2[1].get("is_on_page", "false") != "true":
                        absent_players.append(victor2[1])
                if not absent_players:
                    await timer(self.room_id, 5, "Finals starting in")
                    await handle_finals_start(self.room_id)
                else:
                    asyncio.create_task(notify_and_wait_for_reconnect(self.room_id, absent_players))
                return "nope"
        except TournamentMatch.DoesNotExist:
            if DEBUG_ERRORS:
                print(f"❌ Tournament {self.room_id} not found!", flush=True)
        except Exception as e:
            if DEBUG_ERRORS:
                print(f"❌ Error in check_non_final_match_winners: {e}", flush=True)
    
    async def get_tournament_winner_id(self):
        try:
            tournament = await sync_to_async(TournamentMatch.objects.prefetch_related("matches").get)(id=self.room_id)

            final_match = await sync_to_async(lambda: tournament.matches.filter(is_finale=True, is_ongoing=False, is_finished=True).first())()

            if not final_match:
                await RedisManager.delete_keys(save_tournament_key)
                if DEBUG_INFO:
                    print(f"❌ No final match found. final match is still ongoing tournament: {self.room_id}.", flush=True)
                return None

            winner = await sync_to_async(lambda: final_match.winner)()
            if not winner:
                if DEBUG_INFO:
                    print(f"⚠️ Tournament {self.room_id} final match has No winner", flush=True)
                return None

            user_key = f"tournament:{self.room_id}:users"
            tournament_users = await RedisManager.get_all_users_json(user_key)

            for tournament_id, user_data in tournament_users.items():
                if str(user_data.get("id")) == str(winner.id):
                    if DEBUG_INFO:
                        print(f"🏆 Tournament {self.room_id} has a winner! Tournament ID: {tournament_id}, User: {winner.username}", flush=True)
                    return tournament_id  
            if DEBUG_INFO:
                print(f"⚠️ Winner {winner.username} not found in Redis for Tournament {self.room_id}.", flush=True)
            return None
        except TournamentMatch.DoesNotExist:
            if DEBUG_ERRORS:
                print(f"❌ Tournament {self.room_id} not found!", flush=True)
            return None
        except Exception as e:
            if DEBUG_ERRORS:
                print(f"❌ Error checking tournament winner: {e}", flush=True)
            return None

    async def tournament_crashed(self, event):
        await self.send(text_data=json.dumps({
            "type": "tournament_crashed",
        }))

    async def new_user_joined(self, event):
        await self.send(text_data=json.dumps({
            "type": "new_user",
            "users": event["users"],
            "id": event["id"]
        }))

    async def user_disconnected(self, event):
        try:
            await self.send(text_data=json.dumps({
                "type": "user_left",
                "user_id": event["user_id"]
            }))
        except Exception as e:
            if DEBUG_ERRORS:
                print("couldnt send user_disconnected", flush=True)

    async def tournament_message(self, event):
        await self.send(text_data=json.dumps({
            "type": "tournament_message",
            "message": event["message"],
            "sender": event["sender"],
        }))

    async def tournament_countdown(self, event):
        sending_time = time.perf_counter()
        await self.send(text_data=json.dumps({
            "type": "tournament_countdown",
            "message": event["message"],
        }))

    async def tournament_display_update(self, event):
        display_state_key = f"tournament:{self.room_id}:display_state"
        user_key = f"tournament:{self.room_id}:users"
        
        players = await RedisManager.get_all_users_list_map(user_key)
        num_players = len(players)
        if num_players >= 4:
            await self.send(text_data=json.dumps({
                "type": "new_user",
                "users": await RedisManager.get_all_users_json(user_key),
                "id": "none"
            }))
        await asyncio.sleep(0.25)
        await RedisManager.add_json(display_state_key, event["state"])
        await self.send(text_data=json.dumps({
            "type": "tournament_display_update",
            "state": event["state"],
        }))
        await asyncio.sleep(0.5)


    async def tournament_match_created(self, event):
        if self.tournament_id in event["players"]:
            await self.send(text_data=json.dumps({
            "type": "tournament_match_created",
            "match_id": event["match_id"],
            "message": event["message"]
        }))

######################################################################################################################################################################################
async def handle_finals_start(room_id):
    try:
        user_key = f"tournament:{room_id}:users"
        state_key = f"tournament:{room_id}:state"
        display_state_key = f"tournament:{room_id}:display_state"
        save_tournament_key = f"tournament:{room_id}:saved"
        tournament_ended = f"{room_id}:ended"
        channel_layer = get_channel_layer()
        

        tournament_users = await RedisManager.get_all_users_json(user_key)
        display_state = await RedisManager.get_json(display_state_key)

        waiting_players = [
            (tournament_id, user_data)
            for tournament_id, user_data in tournament_users.items()
            if user_data.get("is_waiting_finals", "false") == "true"
        ]

        if len(waiting_players) != 2:
            if DEBUG_ERRORS:
                print(f"⚠️ Tournament {room_id} does not have exactly 2 finalists. Ending tournament.", flush=True)
            await RedisManager.set_state(state_key, "tournament finished")
            await RedisManager.set_expiry_key(tournament_ended, 600)
            return

        present_players = [player for player in waiting_players if player[1].get("is_on_page", "false") == "true"]

        if len(present_players) == 1:
            winner_tournament_id, winner_data = present_players[0]
            await RedisManager.set_state(state_key, "tournament finished")
            await RedisManager.set_expiry_key(tournament_ended, 600)
            if DEBUG_ACTIONS:
                print(f"🏆 Tournament {room_id} winner by default: {winner_data['id']}", flush=True)
            display_state["third_layer"] = winner_tournament_id
            await channel_layer.group_send(
                f"tournament_{room_id}",
                {
                    "type": "tournament_display_update",
                    "state": display_state
                }
            )
            await save_tournament_outcome(room_id, True, False, int(winner_data["id"]))
            return

        if len(present_players) == 0:
            if DEBUG_ACTIONS:
                print(f"🚫 Tournament {room_id} ended: No players showed up for the finals.", flush=True)
            await save_tournament_outcome(room_id, True, False, None)
            return

        player_1, player_2 = waiting_players[0][0], waiting_players[1][0]  # Extract tournament_ids
        if DEBUG_ACTIONS:
            print(f"🔥 Finals starting between {player_1} and {player_2}!", flush=True)

        await RedisManager.set_state(state_key, "playing finals")
        await RedisManager.delete_keys(save_tournament_key)
        await create_tournament_match(room_id, player_1, player_2, is_finale=True)


    except Exception as e:
        if DEBUG_ERRORS:
            print(f"❌ Error in handle_finals_start: {e}", flush=True)


async def four_players_start(room_id, present_players):
    state_key = f"tournament:{room_id}:state"
    await RedisManager.set_state(state_key, "playing first stage")
    channel_layer = get_channel_layer()

    if len(present_players) != 4:
        if DEBUG_ERRORS:
            print(f"❌ Error: Expected 4 players, but got {len(present_players)}", flush=True)
        return

    random.shuffle(present_players)
    match_1 = (present_players[0], present_players[1])
    match_2 = (present_players[2], present_players[3])

    display_state = {
        "first_layer_1": match_1[0],
        "first_layer_2": match_1[1],
        "first_layer_3": match_2[0],
        "first_layer_4": match_2[1],
        "second_layer_1": "none",
        "second_layer_2": "none",
        "third_layer": "none",
    }

    await RedisManager.add_json(f"tournament:{room_id}:display_state", display_state)

    await channel_layer.group_send(
        f"tournament_{room_id}",
        {
            "type": "tournament_display_update",
            "state": display_state
        }
    )

    # Start the two matches
    await timer(room_id, 5, "First match starting in")
    await create_tournament_match(room_id, match_1[0], match_1[1], is_finale=False)
    await create_tournament_match(room_id, match_2[0], match_2[1], is_finale=False)

    if DEBUG_ACTIONS:
        print(f"✅ Tournament progressing: Matches - {match_1[0]} vs {match_1[1]} & {match_2[0]} vs {match_2[1]}", flush=True)



async def three_players_start(room_id, present_players):
        state_key = f"tournament:{room_id}:state"
        await RedisManager.set_state(state_key, "playing first stage")
        channel_layer = get_channel_layer()

        players = present_players 
        all_ids = ["player_1", "player_2", "player_3", "player_4"]
        if len(players) != 3:
            if DEBUG_ERRORS:
                print(f"❌ Error: Expected 3 players, but got {len(players)}", flush=True)
            return

        match_players = random.sample(players, 2)
        waiting_player = [player for player in players if player not in match_players][0]
        last_player = [player for player in all_ids if player not in players][0]

        user_key = f"tournament:{room_id}:users"
        await RedisManager.update_user_data_map(user_key, waiting_player, "is_waiting_finals", "true")

        await channel_layer.group_send(
            f"tournament_{room_id}",
            {
                "type": "tournament_display_update",
                "state": {
                    "first_layer_1": match_players[0],
                    "first_layer_2": match_players[1],
                    "first_layer_3": waiting_player,
                    "first_layer_4": last_player,
                    "second_layer_1": "none",
                    "second_layer_2": waiting_player,
                    "third_layer": "none",
                }
            }
        )

        await timer(room_id, 5, "First match starting in")
        await create_tournament_match(room_id, match_players[0], match_players[1], is_finale=False)
        if DEBUG_ACTIONS:
            print(f"✅ Tournament progressing: Match between {match_players[0]} vs {match_players[1]}, {waiting_player} advances to finals!", flush=True)

async def two_players_start(room_id, present_players):
        state_key = f"tournament:{room_id}:state"
        await RedisManager.set_state(state_key, "playing finals")
        channel_layer = get_channel_layer()

        players = present_players
        all_ids = ["player_1", "player_2", "player_3", "player_4"]
        first_layer_1 = players[0]
        first_layer_3 = players[1]
        for id in all_ids:
            if id not in players:
                first_layer_2 = id
                players.append(id)
                break
    
        for id in all_ids:
            if id not in players:
                first_layer_4 = id
                break
        await channel_layer.group_send(
            f"tournament_{room_id}",
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

        await timer(room_id, 5, "Finals starting in")
        await create_tournament_match(room_id, players[0], players[1], is_finale=True)

async def create_tournament_match(room_id: str, tournament_id_1: str, tournament_id_2: str, is_finale: bool):
    try:
        tournament = await sync_to_async(TournamentMatch.objects.get)(id=room_id)
        user_key = f"tournament:{room_id}:users"
        tournament_users = await RedisManager.get_all_users_json(user_key)

        player1_data = tournament_users.get(tournament_id_1)
        player2_data = tournament_users.get(tournament_id_2)

        if not player1_data or not player2_data:
            if DEBUG_ERRORS:
                print(f"❌ Error: One or both tournament IDs are invalid ({tournament_id_1}, {tournament_id_2})", flush=True)
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

        if DEBUG_ACTIONS:
            print(f"✅ Match {new_match.id} created for tournament {room_id}: {player1.username} vs {player2.username}", flush=True)

    except TournamentMatch.DoesNotExist:
        if DEBUG_ERRORS:
            print(f"❌ Tournament {room_id} not found!", flush=True)
    except UserProfile.DoesNotExist:
        if DEBUG_ERRORS:
            print(f"❌ One or both players not found! (IDs: {player1_id}, {player2_id})", flush=True)
    except Exception as e:
        if DEBUG_ERRORS:
            print(f"❌ Error creating match: {e}", flush=True)

async def notify_and_wait_for_reconnect(room_id, absent_players):
        try:
            if DEBUG_ACTIONS:
                print(f"Notifying and waiting for players to start finals in room {room_id}", flush=True)
            for player in absent_players:
                await send_chat_notification(room_id, player["id"], "⚠️ You need to reconnect to play the tournament finals!")

            await timer(room_id, 5, "Finals starting in")

            await handle_finals_start(room_id)
        except Exception as e:
            if DEBUG_ERRORS:
                print(f"❌ Error in notify_and_wait_for_reconnect: {e}", flush=True)

async def notify_absent_players_and_wait(room_id):
    try:  
        user_key = f"tournament:{room_id}:users"
        state_key = f"tournament:{room_id}:state"
        await RedisManager.set_state(state_key, "tournament ongoing")

        players = await RedisManager.get_all_users_json(user_key)
        
        absent_players = [
            user for user in players.values()
            if isinstance(user, dict) and user.get("is_on_page", "").lower() != "true"
        ]

        for player in absent_players:
            await send_chat_notification(room_id, player["id"], "⚠️ Tournament is starting! Please join now!")

        channel_layer = get_channel_layer()

        await timer(room_id, 15, "Tournament starting in")

        players_after_wait = await RedisManager.get_all_users_json(user_key)

        # Filtering present players
        present_players = [
            user for user in players_after_wait.values()
            if isinstance(user, dict) and user.get("is_on_page", "").lower() == "true"
        ]
        present_tournament_ids = [
            user_id for user_id, user in players_after_wait.items()
            if isinstance(user, dict) and user.get("is_on_page", "").lower() == "true"
        ]

        if not present_players:
            if DEBUG_INFO:
                print(f"⚠️ No players showed up. Ending tournament {room_id}.", flush=True)
            await save_tournament_outcome(room_id, True, False, None)
            return
        if DEBUG_INFO:
            print(f"players PRESENT!! {present_players}", flush=True)

        if len(present_players) == 1:
            if DEBUG_ACTIONS:
                print(f"✅ Only one player present: {present_players[0].get('id')}. Declaring them as winner.", flush=True)

            display = {
                "first_layer_1": "player_1",
                "first_layer_2": "player_2",
                "first_layer_3": "player_3",
                "first_layer_4": "player_4",
                "second_layer_1": "player_1",
                "second_layer_2": "player_1",
                "third_layer": "player_1",
            }

            # Ensure there is a valid player ID before accessing
            winner_id = present_tournament_ids[0] if present_tournament_ids else None
            if winner_id:
                if winner_id == "player_1":
                    display["second_layer_1"], display["second_layer_2"], display["third_layer"] = "player_1", "player_3", "player_1"
                elif winner_id == "player_2":
                    display["second_layer_1"], display["second_layer_2"], display["third_layer"] = "player_2", "player_3", "player_2"
                elif winner_id == "player_3":
                    display["second_layer_1"], display["second_layer_2"], display["third_layer"] = "player_1", "player_3", "player_3"
                elif winner_id == "player_4":
                    display["second_layer_1"], display["second_layer_2"], display["third_layer"] = "player_1", "player_4", "player_4"

                await channel_layer.group_send(
                    f"tournament_{room_id}",  
                    {
                        "type": "tournament_display_update",
                        "state": display
                    }
                )
                tournament_users = await RedisManager.get_all_users_json(user_key)
                winner = tournament_users.get(winner_id, {}).get("id")
                if winner is None:
                    if DEBUG_ERRORS:
                        print(f"⚠️ No user ID found for {winner_id}", flush=True)
                else:
                    await save_tournament_outcome(room_id, True, False, int(winner))
            else:
                if DEBUG_ERRORS:
                    print("⚠️ No valid winner ID found. Tournament outcome not saved.", flush=True)

        elif len(present_players) == 2:
            if DEBUG_ACTIONS:
                print(f"✅ Two players showed up for finals: {present_tournament_ids}", flush=True)
            await two_players_start(room_id, present_tournament_ids)

        elif len(present_players) == 3:
            if DEBUG_ACTIONS:
                print(f"✅ Three players present. Starting tournament phase.", flush=True)
            await three_players_start(room_id, present_tournament_ids)

        elif len(present_players) == 4:
            if DEBUG_ACTIONS:
                print(f"✅ All four players are present. Starting tournament.", flush=True)
            await four_players_start(room_id, present_tournament_ids)

    except Exception as e:
        if DEBUG_ERRORS:
            print(f"❌ EXCEPTION IN notify_absent_players_and_wait: {e}", flush=True)


async def save_tournament_outcome(room_id: str, is_finished: bool, is_ongoing: bool, winner: int | None):
    display_state_key = f"tournament:{room_id}:display_state"
    await RedisManager.delete_tournament_data(room_id)
    try:
        if DEBUG_INFO:
            print(f"winner is: {winner}", flush=True)
        tournament = await sync_to_async(TournamentMatch.objects.get)(id=room_id)
        winner_obj = None
        if winner is not None:  
            winner_obj = await sync_to_async(UserProfile.objects.select_related('user').get)(id=winner)
        tournament.is_finished = is_finished
        tournament.is_ongoing = is_ongoing
        tournament.tournament_winner = winner_obj.user if winner_obj else None
        await asyncio.sleep(0.2)
        await sync_to_async(tournament.save)()
        
        if DEBUG_ACTIONS:
            print(f"✅ Tournament {room_id} updated: Finished={is_finished}, Ongoing={is_ongoing}, Winner={winner_obj.user.username if winner_obj else 'None'}", flush=True)

    except TournamentMatch.DoesNotExist:
        if DEBUG_ERRORS:
            print(f"❌ Error: Tournament {room_id} not found!", flush=True)
    except UserProfile.DoesNotExist:
        if DEBUG_ERRORS:
            print(f"❌ Error: Winner user with ID {winner} not found!", flush=True)
    except Exception as e:
        if DEBUG_ERRORS:
            print(f"❌ EXCEPTION IN save tournament outcome: {e}", flush=True)

async def timer(room_id, seconds, message_prefix):
    channel_layer = get_channel_layer()
    for i in range(seconds + 1):
            loop_start = time.perf_counter()
            if (i < seconds):
                message = f"{message_prefix} {seconds - i} {'second' if seconds - i == 1 else 'seconds'}"
            else:
                message = None
            await channel_layer.group_send(
                f"tournament_{room_id}",  
                {
                    "type": "tournament_countdown",
                    "message": message
                }
            )
            loop_end = time.perf_counter()
            remaining_time = max(0, 1 - (loop_end - loop_start))
            await asyncio.sleep(remaining_time)

    
    
async def send_chat_notification(room_id, user_id, message):
    chat_group_name = f"contacts_{user_id}"
    
    if DEBUG_ACTIONS:
        print(f"sending to group named: {chat_group_name}", flush=True)

    channel_layer = get_channel_layer()
    await channel_layer.group_send(
        chat_group_name,
        {
            "type": "popup_tournament",
            "message": message
        }
    )