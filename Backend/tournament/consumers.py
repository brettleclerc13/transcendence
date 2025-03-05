import json
import asyncio
from utils.redis import RedisManager
from channels.generic.websocket import AsyncWebsocketConsumer

class TournamentConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_id = self.scope["url_route"]["kwargs"]["room_id"]
        self.room_group_name = f"tournament_{self.room_id}"

        # Join the WebSocket group for this tournament
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        # Accept the WebSocket connection
        await self.accept()

        # Send a welcome message to the client
        await self.send(text_data=json.dumps({
            "message": f"Connected to tournament {self.room_id}",
            "room_id": self.room_id,
        }))

    async def disconnect(self, close_code):
        # Remove the connection from the tournament group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        # Handle messages received from the WebSocket
        data = json.loads(text_data)
        message_type = data.get("type")

        if message_type == "chat":
            # Example: Broadcast chat messages to the tournament group
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "tournament_message",
                    "message": data.get("message"),
                    "sender": self.channel_name,
                }
            )

    async def tournament_message(self, event):
        # Send tournament messages to all connected users
        await self.send(text_data=json.dumps({
            "type": "tournament_message",
            "message": event["message"],
            "sender": event["sender"],
        }))
