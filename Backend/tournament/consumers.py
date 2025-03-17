import json
import asyncio
from utils.redis import RedisManager
from urllib.parse import parse_qs
from user.models import UserProfile
from django.core.exceptions import ObjectDoesNotExist
from rest_framework_simplejwt.tokens import AccessToken
from channels.generic.websocket import AsyncWebsocketConsumer

class TournamentConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_id = self.scope["url_route"]["kwargs"]["room_id"]
        self.room_group_name = f"tournament_{self.room_id}"

        self.user = await self.authenticate_user()
        if not self.user:
            await self.close(code=4001)  
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

    async def disconnect(self, close_code):
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

        if message_type == "user_connected":
            user_data = {
                "id": self.user.id,  #questonable
                "tournament_name": self.user.tournament_name,
                "profile_picture": self.user.profile_picture,
                "is_on_page": True
            }

            players = await RedisManager.get_all_users_list(user_key)
            self.tournament_id = f"player_{len(players) + 1}"
            await RedisManager.store_user_data(user_key, self.tournament_id, user_data)
            connected_users = await RedisManager.get_all_users_json(user_key)

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "new_user_joined",
                    "users": connected_users,
                }
            )
        elif message_type == "user_disconnected":
            if self.tournament_id != None:
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
            return await asyncio.get_event_loop().run_in_executor(
                None, lambda: UserProfile.objects.get(id=user_id)
            )
        except ObjectDoesNotExist:
            return None
    
    async def update_tournament_state(self):
        user_key = f"tournament:{self.room_id}:users"
        state_key = f"tournament:{self.room_id}:state"
        players = await RedisManager.get_all_users_list(user_key)
        num_players = len(players)

        if num_players < 4:
            new_state = "waiting_for_players"
        elif num_players == 4:
            new_state = "tournament_starting" #for now a simple state manager would need to upgarde this
        else:
            new_state = await RedisManager.get_state(state_key)

        await RedisManager.set_tournament_state(self.room_id, new_state)

        # Broadcast the updated state to all players
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "tournament_state_update",
                "state": new_state
            }
        )

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
