from django.urls import re_path
from .consumers import ChatConsumer, ContactConsumer

websocket_urlpatterns = [
    re_path(r"(?P<conversation_id>\d+)/$", ChatConsumer.as_asgi()),
	re_path(r"contacts/$", ContactConsumer.as_asgi())
]
