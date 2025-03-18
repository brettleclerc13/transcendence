"""
ASGI config for backend project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/asgi/
"""

import os
import django
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from channels.auth import AuthMiddlewareStack

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

application = get_asgi_application()

import game.routing, chat.routing, tournament.routing

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AllowedHostsOriginValidator(
        AuthMiddlewareStack(
            URLRouter(
                game.routing.websocket_urlpatterns +
                tournament.routing.websocket_urlpatterns +
				chat.routing.websocket_urlpatterns
            )
        )
    ),
})

print("WebSocket URL patterns loaded:", game.routing.websocket_urlpatterns, tournament.routing.websocket_urlpatterns, chat.routing.websocket_urlpatterns)
