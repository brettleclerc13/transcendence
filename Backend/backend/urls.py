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
from django.conf import settings
from django.urls import path
from django.conf.urls.static import static
from match.views import MatchAPIView, MatchRetrieveUpdateAPIView, MatchHistoryView, MatchCLIView, MatchCheckView
from tmatch.views import TournamentAPIView, TournamentRetrieveUpdateAPIView, TournamentHistoryView, TournamentCheckView
from user.views import RegisterAPIView, LogoutAPIView, ProfileAPIView, PublicProfileAPIView, CustomTokenObtainPairView, CustomTokenRefreshView, CustomTokenVerifyView, BlockUserAPIView, UnblockUserAPIView, BlockedUsersAPIView, FriendListAPIView, MessageAPIView, SearchAPIView, SendFriendRequestAPIView, AcceptFriendRequestAPIView, DeclineFriendRequestAPIView, PendingFriendRequestsAPIView, GetOrCreateConversationAPIView, GenerateQRCodeView, Enable2FAView, Disable2FAView, Verify2FAView, Check2FAView

urlpatterns = [
	path('admin/', admin.site.urls),

	path('register/', RegisterAPIView.as_view(), name='register'),
	path('logout/', LogoutAPIView.as_view(), name='logout'),
	path('profile/', ProfileAPIView.as_view(), name='profile'),
	path('public_profile/', PublicProfileAPIView.as_view(), name='public-profile'),
    
	path("2fa/generate_qr/", GenerateQRCodeView.as_view(), name="generate_qr"),
    path("2fa/enable/", Enable2FAView.as_view(), name="enable_2fa"),
    path("2fa/disable/", Disable2FAView.as_view(), name="disable_2fa"),
    path("2fa/verify/", Verify2FAView.as_view(), name="verify_2fa"),
    path("2fa/check/", Check2FAView.as_view(), name="check_2fa"),

	path('matches/', MatchAPIView.as_view(), name="Match-get-post"),
	path('matches/<uuid:id>/', MatchRetrieveUpdateAPIView.as_view(), name="match-patch"),
	path('match-history/', MatchHistoryView.as_view(), name="match-history-get"),
    path('match-list/', MatchCLIView.as_view(), name="match-list-get"),
	path('match-check/', MatchCheckView.as_view(), name="match-check-get"),

	path('tournaments/', TournamentAPIView.as_view(), name="Tournament-get-post"),
	path('tournaments/<uuid:id>/', TournamentRetrieveUpdateAPIView.as_view(), name="tournament-patch-put"),
	path('tournament-history/', TournamentHistoryView.as_view(), name="tournament-history-get"),
	path('tournament-check/', TournamentCheckView.as_view(), name="tournament-check-get"),

	path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
	path('token/refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),
	path('token/verify/', CustomTokenVerifyView.as_view(), name='token_verify'),

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
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
