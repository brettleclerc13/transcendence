from django.urls import re_path
from .consumers import PongGameConsumer

websocket_urlpatterns = [
    re_path(r"^game/(?P<room_name>[\w-]+)/$", PongGameConsumer.as_asgi()),
]
