import json
from channels.generic.websocket import AsyncWebsocketConsumer

class GameConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Called when a WebSocket connection is initiated
        self.room_name = "pong_room"  # This could be a unique room for each game instance
        self.room_group_name = f"pong_{self.room_name}"

        # Join the WebSocket to a room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()  # Accept the WebSocket connection

    async def disconnect(self, close_code):
        # Called when the WebSocket connection is closed
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        # Called when a message is received from the WebSocket
        data = json.loads(text_data)
        action = data.get("action")

        if action == "move_paddle":
            # Handle paddle movement
            paddle_position = data.get("position")
            # Process game logic here

        # Send an update back to the WebSocket group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "game_update",
                "data": data  # This is where you pass game state updates
            }
        )

    async def game_update(self, event):
        # Send updates to the WebSocket
        data = event["data"]

        await self.send(text_data=json.dumps({
            "type": "game_update",
            "data": data
        }))