import json
from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
import django
django.setup()  # Force l'initialisation de Django

from django.contrib.auth import get_user_model
User = get_user_model()


# from .models import Message, UserProfile, Conversation

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
        self.room_group_name = f'chat_{self.conversation_id}'
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        try:
            from user.models import Message, Conversation
            data = json.loads(text_data)

            if not isinstance(data, dict):
                print("Erreur : Données mal formatées", type(data), data)
                return

            if "message" not in data or "sender" not in data:
                print("Erreur : 'message' ou 'sender' manquant", list(data.keys()), data)
                return

            # if "messageData" not in data or "message" not in data["messageData"] or "sender" not in data["messageData"]:
            #     print("❌ Erreur : 'message' ou 'sender' manquant", data)
            #     return

            message = data['message']
            sender = data['sender']

            try:
                sender = await database_sync_to_async(User.objects.get)(id=sender)
            except User.DoesNotExist:
                return

            conversation = await database_sync_to_async(Conversation.objects.get)(id=self.conversation_id)
            new_message = await database_sync_to_async(Message.objects.create)(
                sender=sender,
                conversation=conversation,
                text=message
            )

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "chat_message",
                    "message": message,
                    "sender": sender.id,
                    "conversation_id": self.conversation_id,
                }
            )

        except Exception as e:
            print(f"Erreur WebSocket : {e}")

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            "message": event["message"],
            "sender": event["sender"],
            "conversation_id": event["conversation_id"],
        }))

class ContactConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user_id = self.scope['url_route']['kwargs']['user_id']
        self.room_group_name = f'contacts_{self.user_id}'
        print(f"Connecting to contact group: {self.room_group_name}")
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def notify_update(self, event):
        print(f"🔔 Mise à jour pour {self.user_id}: {event}")
        await self.send(text_data=json.dumps(event))

