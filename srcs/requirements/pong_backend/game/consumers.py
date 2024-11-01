import json
from channels.generic.websocket import AsyncWebsocketConsumer

class PongConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Accept the connection
        await self.accept()

        # Add the user to a group for broadcasting
        await self.channel_layer.group_add('players', self.channel_name)

    async def disconnect(self, close_code):
        # Leave the group
        await self.channel_layer.group_discard('players', self.channel_name)

    async def receive(self, text_data):
        # Handle incoming messages
        data = json.loads(text_data)
        # Process data and broadcast to other players
        await self.channel_layer.group_send(
            'players',
            {
                'type': 'game_message',
                'message': data,
            }
        )

    async def game_message(self, event):
        # Send message to WebSocket
        await self.send(text_data=json.dumps(event['message']))
