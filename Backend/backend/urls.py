"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from user.views import RegisterAPIView , MatchAPIView, LogoutAPIView, ProfileAPIView, CustomTokenObtainPairView, FriendListAPIView, MessageAPIView, SearchAPIView, SendFriendRequestAPIView, AcceptFriendRequestAPIView, DeclineFriendRequestAPIView, PendingFriendRequestsAPIView, GetOrCreateConversationAPIView, BlockUserAPIView, UnblockUserAPIView, BlockedUsersAPIView
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
	path('admin/', admin.site.urls),
	path('api/', include([
	
		path('register/', RegisterAPIView.as_view(), name='register'),
		path('logout/', LogoutAPIView.as_view(), name='logout'),
		path('profile/', ProfileAPIView.as_view(), name='profile'),
		path('matches/', MatchAPIView.as_view(), name="Match-get-post"),
		path('matches/<int:pk>/', MatchAPIView.as_view(), name="Match-put/patch-delete"),

		path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
		path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

		path('friends/', FriendListAPIView.as_view(), name='friend_list'),
		path('messages/', MessageAPIView.as_view(), name='messages'),
		path('get_or_create_conversation/', GetOrCreateConversationAPIView.as_view(), name='get_or_create_conversation'),
		path('search/', SearchAPIView.as_view(), name="search"),

		path("friends/request/send/", SendFriendRequestAPIView.as_view(), name="send_friend_request"),
		path("friends/request/accept/<int:request_id>/", AcceptFriendRequestAPIView.as_view(), name="accept_friend_request"),
		path("friends/request/decline/<int:request_id>/", DeclineFriendRequestAPIView.as_view(), name="decline_friend_request"),
		path("friends/request/pending/", PendingFriendRequestsAPIView.as_view(), name="pending_friend_requests"),

		path('block-user/<int:user_id>/', BlockUserAPIView.as_view(), name='block_user'),
    	path('unblock-user/<int:user_id>/', UnblockUserAPIView.as_view(), name='unblock_user'),
    	path('blocked-users/', BlockedUsersAPIView.as_view(), name='blocked_users'),
	])),
]
