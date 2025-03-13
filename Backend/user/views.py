from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import logout
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from .serializer import UserSerializer, CustomTokenObtainPairSerializer, CustomTokenRefreshSerializer, MessageSerializer, MatchSerializer
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.core.files.storage import default_storage
from .models import UserProfile, Match, Message, FriendRequest, Conversation
from django.http import JsonResponse
from user.websocket_utils import notify_user_update, notify_block_status

# Create your views here.

class RegisterAPIView(APIView):  # User registration and management
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        print("Errors:", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk=None):
        try:
            user = User.objects.get(pk=pk)
            user.delete()
            return Response({"message": "User deleted successfully"}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

class LogoutAPIView(APIView):
    def post(self, request):
        logout(request)
        return Response({"message": "Logout successful"}, status=status.HTTP_200_OK)

class CustomTokenObtainPairView(TokenObtainPairView):
	serializer_class = CustomTokenObtainPairSerializer

class CustomTokenRefreshView(TokenRefreshView):
	serializer_class = CustomTokenRefreshSerializer

class ProfileAPIView(APIView):
	permission_classes = [IsAuthenticated]

	def get_parser_classes(self):
		"""Dynamically set parsers based on the request method."""
		if self.request.method in ["PATCH"]:
			return [MultiPartParser(), FormParser()]  # Expect form data for PATCH (image upload)
		return [JSONParser()]  # Expect JSON for GET and POST

	def get(self, request):
		user = request.user
		profile = user.profile
		profile_data = {
            "id": user.id,
			"username": user.username,
			"email": user.email,
            "nationality": profile.nationality,
            "bio": profile.bio,
            "age": profile.age,
            "profile_picture": profile.profile_picture.url if profile.profile_picture else None,
            "tournament_name": profile.tournament_name,
            "is_online": profile.is_online,
		}
		return Response(profile_data, status=status.HTTP_200_OK)
        
	def post(self, request):
		user = request.user
		profile = user.profile
		data = request.data

		# Validate and update user fields
		username = data.get("username")
		if username and username != user.username:
			if User.objects.filter(username=username).exists():
				return Response({"error": "Username already exists."}, status=status.HTTP_400_BAD_REQUEST)
			user.username = username

		email = data.get("email")
		if email and email != user.email:
			if User.objects.filter(email=email).exists():
				return Response({"error": "Email already exists."}, status=status.HTTP_400_BAD_REQUEST)
			user.email = email

		# Validate and update profile fields
		profile_fields = ["nationality", "bio", "age", "tournament_name", "is_online"]
		for field in profile_fields:
			if field in data:
				value = data[field]
				if field == "age" and (not isinstance(value, int) or value < 0):
					return Response({"error": "Age must be a positive integer."}, status=status.HTTP_400_BAD_REQUEST)
				setattr(profile, field, value)

		# Save updated data
		user.save()
		profile.save()

		return Response({"message": "Profile updated successfully."}, status=status.HTTP_200_OK)

	def patch(self, request):
		user = request.user
		profile = user.profile

		if "profile_picture" in request.FILES:
			profile.profile_picture = request.FILES["profile_picture"]
			profile.save()
			return Response({"message": "Profile picture updated successfully.", "profile_picture": profile.profile_picture.url}, status=status.HTTP_200_OK)

		return Response({"error": "No profile picture provided."}, status=status.HTTP_400_BAD_REQUEST)

class FriendListAPIView(APIView):
    permission_classes = [IsAuthenticated]
     
    def get(self, request):
        user = request.user
        profile = user.profile
        friends = profile.friends.all()

        friends_data = []

        for friend in friends:
            # Vérifie si profile_picture existe et génère l'URL absolue
            profile_picture_url = None
            if friend.profile_picture:
                profile_picture_url = request.build_absolute_uri(friend.profile_picture.url)
                
                # Si l'URL ne contient pas le port :8001, on l'ajoute manuellement
                if "127.0.0.1" in profile_picture_url and ":8001" not in profile_picture_url:
                    profile_picture_url = profile_picture_url.replace("http://127.0.0.1", "http://127.0.0.1:8001")


            friends_data.append({
                "id": friend.user.id,
                "username": friend.user.username,
                "profile_picture": profile_picture_url,
            })

        # friends_data = [
        #     {
        #         "id": friend.user.id,
        #         "username": friend.user.username,
        #         "profile_picture": request.build_absolute_uri(friend.profile_picture.url) if friend.profile_picture else None,
        #     }
        #     for friend in friends
        # ]

        return Response(friends_data, status=status.HTTP_200_OK)
        
    def post(self, request):
        user = request.user
        profile = user.profile
        friend_id = request.data.get("friend_id")

        try:
            friend_profile = UserProfile.objects.get(user_id=friend_id)
        except UserProfile.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        
        if friend_profile == profile:
            return Response({"error": "You cannot add yourself as a friend."}, status=status.HTTP_400_BAD_REQUEST)
        
        profile.friends.add(friend_profile)
        return Response({"message": "Friend added successfully."}, status=status.HTTP_200_OK)
        
    def delete(self, request):
        user = request.user
        profile = user.profile
        friend_id = request.data.get("friend_id")

        try:
            friend_profile = UserProfile.objects.get(user_id=friend_id)
        except UserProfile.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        
        profile.friends.remove(friend_profile)
        return Response({"message": "Friend removed successfully."}, status=status.HTTP_200_OK)
        

class MessageAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        conversation_id = request.data.get("conversation")

        if not conversation_id:
            return Response({"error": "conversation_id is missing"}, status=400)
        
        conversation = get_object_or_404(Conversation, id=conversation_id)
        participants = conversation.participants.all()
        
        if request.user not in conversation.participants.all():
            return Response({"error": "You are not part of this conversation"}, status=status.HTTP_403_FORBIDDEN)
        
        for participant in conversation.participants.all():
            if request.user.profile.is_blocked(participant) or participant.profile.is_blocked(request.user):
                return Response({"error": "You cannot send messages to this user."}, status=status.HTTP_403_FORBIDDEN)
        
        serializer = MessageSerializer(data={
            "sender": request.user.id,
            "conversation": conversation.id,
            "text": request.data.get("text")
        })

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        print("Erreurs du serializer :", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request):
        conversation_id = request.query_params.get("conversation_id")
        conversation = get_object_or_404(Conversation, id=conversation_id)

        if request.user not in conversation.participants.all():
            return Response({"error": "You are not part of this conversation"}, status=status.HTTP_403_FORBIDDEN)
        
        blocked_users = request.user.profile.blocked_users.all()
        messages = Message.objects.filter(conversation=conversation).exclude(sender__profile__in=blocked_users).order_by('timestamp')
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)


# # class SearchAPIView(APIView):

# #     def get(self, request):
# #         query = request.query_params.get("query", "").strip()
# #         if not query:
# #             return Response({"error": "Query parameter is required"}, status=status.HTTP_400_BAD_REQUEST)
        
# #         users = User.objects.filter(username__icontains=query).values("username")[:3]
# #         # serializer = UserSerializer([user.user for user in users], many=True)
# #         return Response(list(users), status=status.HTTP_200_OK)

class SearchAPIView(APIView):

    def get(self, request):
        query = request.query_params.get("query", "").strip()
        if not query:
            return Response({"error": "Query parameter is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        users = User.objects.filter(username__icontains=query).values("username")[:3]
        return JsonResponse(list(users), safe=False)


class SendFriendRequestAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        sender = request.user
        receiver_username = request.data.get("receiver_username")

        if not receiver_username:
            return Response({"warning": "Receiver username is required"}, status=status.HTTP_200_OK)

        try:
            receiver = User.objects.get(username=receiver_username)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        if sender == receiver:
            return Response({"warning": "You cannot send a friend request to yourself"}, status=status.HTTP_200_OK)

        sender_profile = sender.profile
        receiver_profile = receiver.profile

        if receiver_profile in sender_profile.friends.all():
            return Response({"warning": "You are already friends"}, status=status.HTTP_200_OK)

        if FriendRequest.objects.filter(sender=sender, receiver=receiver, status="pending").exists():
            return Response({"warning": "Friend request already sent"}, status=status.HTTP_200_OK)

        friend_request = FriendRequest.objects.create(sender=sender, receiver=receiver)

        notify_user_update(receiver.id, "friend_request", {"from": sender.username, "request_id": friend_request.id})

        return Response({"message": "Friend request sent"}, status=status.HTTP_201_CREATED)

class AcceptFriendRequestAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, request_id):
        try:
            friend_request = FriendRequest.objects.get(id=request_id, receiver=request.user, status="pending")
        except FriendRequest.DoesNotExist:
            return Response({"error": "Friend request not found"}, status=status.HTTP_404_NOT_FOUND)

        sender = friend_request.sender
        receiver = friend_request.receiver

        if sender.profile.friends.filter(id=receiver.id).exists():
            return Response({"error": "Already friends"}, status=status.HTTP_400_BAD_REQUEST)

        sender.profile.friends.add(receiver.profile)
        receiver.profile.friends.add(sender.profile)

        friend_request.delete()

        notify_user_update(sender.id, "new_friend", {"username": receiver.username})
        notify_user_update(receiver.id, "new_friend", {"username": sender.username})

        return Response({"message": "Friend request accepted"}, status=status.HTTP_200_OK)

class DeclineFriendRequestAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, request_id):
        try:
            friend_request = FriendRequest.objects.get(id=request_id, receiver=request.user, status="pending")
        except FriendRequest.DoesNotExist:
            return Response({"error": "Friend request not found or already processed"}, status=status.HTTP_404_NOT_FOUND)

        friend_request.delete()

        return Response({"message": "Friend request declined"}, status=status.HTTP_200_OK)

class PendingFriendRequestsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        requests = FriendRequest.objects.filter(receiver=request.user, status="pending").values("id", "sender__username")
        if not requests:
            return Response({"message": "No pending friend requests"}, status=status.HTTP_200_OK)
        return Response(list(requests), status=status.HTTP_200_OK)

class GetOrCreateConversationAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):

        if not request.user.is_authenticated:
            return Response({"error": "User not authenticated"}, status=401)
        other_user_id = request.data.get("user_id")
        other_user = get_object_or_404(User, id=other_user_id)

        conversation = Conversation.objects.filter(participants=request.user).filter(participants=other_user).first()

        if not conversation:
            conversation = Conversation.objects.create()
            conversation.participants.add(request.user, other_user)
            print(f"Conversation créée avec les participants : {conversation.participants.all()}")

        return Response({"id": conversation.id})
    

class BlockUserAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, user_id):
        user_to_block = get_object_or_404(User, id=user_id)
        profile = request.user.profile

        if user_to_block.profile in profile.blocked_users.all():
            return Response({"error": "User is already blocked."}, status=status.HTTP_400_BAD_REQUEST)

        profile.block_user(user_to_block.profile)
        notify_block_status(user_to_block, "blocked")
        return Response({"message": f"{user_to_block.username} has been blocked."}, status=status.HTTP_200_OK)

class UnblockUserAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, user_id):
        user_to_unblock = get_object_or_404(User, id=user_id)
        profile = request.user.profile

        if user_to_unblock.profile not in profile.blocked_users.all():
            return Response({"error": "User is not blocked."}, status=status.HTTP_400_BAD_REQUEST)

        profile.unblock_user(user_to_unblock.profile)
        notify_block_status(user_to_unblock, "unblocked")
        return Response({"message": f"{user_to_unblock.username} has been unblocked."}, status=status.HTTP_200_OK)

class BlockedUsersAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = request.user.profile
        blocked_users = profile.blocked_users.all()
        blocked_list = [{"id": user.user.id, "username": user.user.username} for user in blocked_users]
        return Response(blocked_list, status=status.HTTP_200_OK)