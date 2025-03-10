import json
import asyncio
from utils.redis import RedisManager
from channels.generic.websocket import AsyncWebsocketConsumer

class TournamentConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_id = self.scope["url_route"]["kwargs"]["room_id"]
        self.room_group_name = f"tournament_{self.room_id}"

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
        await RedisManager.delete_user_data(user_key, self.channel_name)
        await self.update_tournament_state()

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

        if message_type == "user_data":
            user_data = {
                "id": self.channel_name,  # need to update this one
                "username": data.get("username", "Unknown"),
            }

            user_key = f"tournament:{self.room_id}:users"
            await RedisManager.store_user_data(user_key, self.channel_name, user_data)
            await self.update_tournament_state()

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "new_user_joined",
                    "user_data": user_data,
                }
            )
    
    async def update_tournament_state(self):
        user_key = f"tournament:{self.room_id}:users"
        players = await RedisManager.get_all_users(user_key)
        num_players = len(players)

        if num_players < 4:
            new_state = "waiting_for_players"
        elif num_players == 4:
            new_state = "tournament_starting" #for now a simple state manager would need to upgarde this
        else:
            new_state = await RedisManager.get_tournament_state(self.room_id)  

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
            "user_data": event["user_data"]
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
