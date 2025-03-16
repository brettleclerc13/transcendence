from django.urls import re_path
from .consumers import ChatConsumer, ContactConsumer

websocket_urlpatterns = [
    re_path(r"ws/chat/(?P<conversation_id>\d+)/$", ChatConsumer.as_asgi()),
	re_path(r"ws/contacts/(?P<user_id>\d+)/$", ContactConsumer.as_asgi())
]
