import qrcode
import io
import base64
import os

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import logout
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from .serializer import UserSerializer, UserProfileSerializer, CustomTokenObtainPairSerializer, CustomTokenRefreshSerializer, CustomTokenVerifySerializer, MessageSerializer
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import UserProfile, Message, FriendRequest, Conversation
from rest_framework_simplejwt.views import TokenVerifyView
from django.contrib.auth.hashers import check_password
from django.http import JsonResponse
from user.websocket_utils import notify_user_update, notify_block_status
from django_otp.plugins.otp_totp.models import TOTPDevice
from os import getenv

# ===========================     USER     =========================== #

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
        user = request.user

        if hasattr(user, 'profile'):
            user.profile.is_online = False
            user.profile.save()

        logout(request)

        return Response({"message": "Logout successful"}, status=status.HTTP_200_OK)

class CustomTokenObtainPairView(TokenObtainPairView):
	serializer_class = CustomTokenObtainPairSerializer

class CustomTokenRefreshView(TokenRefreshView):
	serializer_class = CustomTokenRefreshSerializer

class CustomTokenVerifyView(TokenVerifyView):
	serializer_class = CustomTokenVerifySerializer


# ===========================     2FA     =========================== #

class GenerateQRCodeView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		user = request.user

		# Delete any existing devices to prevent duplicates
		existing_devices = TOTPDevice.objects.filter(user=user, name="default")
		if existing_devices.count() > 1:
			# Keep only the most recent device if multiple exist
			latest_device = existing_devices.latest('id')
			existing_devices.exclude(id=latest_device.id).delete()
			device = latest_device
			created = False
		elif existing_devices.count() == 1:
			device = existing_devices.first()
			created = False
		else:
			# Create a new device if none exists
			device = TOTPDevice.objects.create(user=user, name="default")
			created = True

		# Always update the issuer to ensure it's correct
		device.issuer = f"{getenv('NEXT_PUBLIC_WS_HOST')}:{getenv('NEXT_PUBLIC_WS_PORT')} - {user.username}"
		device.save()

		otp_uri = device.config_url

		qr = qrcode.make(otp_uri)
		buffered = io.BytesIO()
		qr.save(buffered, format="PNG")
		qr_base64 = base64.b64encode(buffered.getvalue()).decode()

		return Response({"qr_code": f"data:image/png;base64,{qr_base64}"}, status=status.HTTP_200_OK)

class Enable2FAView(APIView):
	permission_classes = [IsAuthenticated]

	def post(self, request):
		user = request.user
		otp_code = request.data.get("otp")

		if not otp_code:
			return Response({"error": "OTP is required"}, status=status.HTTP_400_BAD_REQUEST)

		try:
			# Try to find the most recent device
			devices = TOTPDevice.objects.filter(user=user, name="default")
			if devices.count() > 0:
				device = devices.latest('id')
			else:
				raise TOTPDevice.DoesNotExist
		except TOTPDevice.DoesNotExist:
			return Response({"error": "QR code not generated or expired"}, status=status.HTTP_400_BAD_REQUEST)

		if not device.verify_token(otp_code):
			return Response({"error": "Invalid OTP"}, status=status.HTTP_400_BAD_REQUEST)

		# Clean up any other devices before enabling 2FA
		devices.exclude(id=device.id).delete()

		# Update the profile
		user.profile.has_2fa = True
		user.profile.save()

		print(f"2FA enabled for user {user.username}", flush=True)
		return Response({"message": "2FA enabled successfully"}, status=status.HTTP_200_OK)

class Disable2FAView(APIView):
	permission_classes = [IsAuthenticated]

	def post(self, request):
		user = request.user
		otp_code = request.data.get("otp")

		try:
			# Try to find the most recent device
			devices = TOTPDevice.objects.filter(user=user, name="default")
			if devices.count() > 0:
				device = devices.latest('id')
			else:
				raise TOTPDevice.DoesNotExist
		except TOTPDevice.DoesNotExist:
			return Response({"error": "2FA is not enabled"}, status=status.HTTP_400_BAD_REQUEST)

		if not device.verify_token(otp_code):
			return Response({"error": "Invalid OTP"}, status=status.HTTP_400_BAD_REQUEST)

		# Delete all TOTP devices for this user
		TOTPDevice.objects.filter(user=user).delete()

		# Update the profile
		user.profile.has_2fa = False
		user.profile.save()

		return Response({"message": "2FA disabled successfully"}, status=status.HTTP_200_OK)

class Check2FAView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		user = request.user
		profile = user.profile

		return Response({"has_2fa": profile.has_2fa}, status=status.HTTP_200_OK)

class Verify2FAView(APIView):
	permission_classes = [IsAuthenticated]

	def post(self, request):
		user = request.user
		otp_code = request.data.get("otp")

		try:
			# Try to find the most recent device
			devices = TOTPDevice.objects.filter(user=user, name="default")
			if devices.count() > 0:
				device = devices.latest('id')
			else:
				raise TOTPDevice.DoesNotExist
		except TOTPDevice.DoesNotExist:
			return Response({"error": "2FA is not enabled"}, status=status.HTTP_400_BAD_REQUEST)

		if not device.verify_token(otp_code):
			return Response({"error": "Invalid OTP"}, status=status.HTTP_400_BAD_REQUEST)

		return Response({"message": "OTP verified successfully"}, status=status.HTTP_200_OK)


# ===========================     PROFILE     =========================== #

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
		print(f"Received data: {request.data}", flush=True)
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

		# Validate and update password
		old_password = data.get("old_password")
		new_password = data.get("new_password")

		if old_password or new_password:
			print(f"old_password: ", old_password)
			print(f"new_password: ", new_password)
			if not old_password:
				return Response({"error": "Old password is required to change password."}, status=status.HTTP_400_BAD_REQUEST)

			if not check_password(old_password, user.password):
				return Response({"error": "Old password is incorrect."}, status=status.HTTP_400_BAD_REQUEST)

			if not new_password:
				return Response({"error": "New password cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)

			if len(new_password) < 8 or len(new_password) > 128:
				return Response({"error": "New password must be between 8 and 128 characters."}, status=status.HTTP_400_BAD_REQUEST)

			if not any(c.isupper() for c in new_password) or not any(c.isdigit() for c in new_password) or not any(c in "!@#?_" for c in new_password):
				return Response(
					{"error": "Password must contain at least one uppercase letter, one number, and one special character (! @ # ? _)."},
					status=status.HTTP_400_BAD_REQUEST,
				)

			# Update password
			user.set_password(new_password)

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
			try:
				# Validate the file using our custom validator
				file = request.FILES["profile_picture"]
				validated_file = profile.validate_profile_picture(file)

				# If validation passes, save the file
				profile.profile_picture = validated_file
				profile.save()
				return Response({
					"message": "Profile picture updated successfully.",
					"profile_picture": profile.profile_picture.url
				}, status=status.HTTP_200_OK)
			except Exception as e:
				return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

		return Response({"error": "No profile picture provided."}, status=status.HTTP_400_BAD_REQUEST)

class PublicProfileAPIView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		username = request.query_params.get("username")

		if username:
			try:
				user = User.objects.get(username=username)
			except User.DoesNotExist:
				return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
		else:
			return Response({"error": "Username is required"}, status=status.HTTP_400_BAD_REQUEST)

		profile = user.profile
		profile_data = {
			"nationality": profile.nationality,
			"bio": profile.bio,
			"age": profile.age,
			"profile_picture": profile.profile_picture.url if profile.profile_picture else None,
			"tournament_name": profile.tournament_name,
			"is_online": profile.is_online,
		}
		return Response(profile_data, status=status.HTTP_200_OK)


# ===========================     CHAT     =========================== #

class FriendListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        profile = user.profile
        friends = profile.friends.all()

        friends_data = []

        for friend in friends:
            profile_picture_url = None
            if friend.profile_picture:

                profile_picture_url = friend.profile_picture.url

                # Remplacer 'backend' par 'localhost:8001' si nécessaire
                # if "backend" in profile_picture_url:
                #     profile_picture_url = profile_picture_url.replace("backend", "127.0.0.1")

            friends_data.append({
                "id": friend.user.id,
                "username": friend.user.username,
                "profile_picture": profile_picture_url,
            })

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