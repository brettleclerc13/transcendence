from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import logout
from django.contrib.auth.models import User
from rest_framework.permissions import IsAuthenticated
from .serializer import UserSerializer, MatchSerializer, CustomTokenObtainPairSerializer, MessageSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import UserProfile, Match, Message, FriendRequest

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

class ProfileAPIView(APIView):
	permission_classes = [IsAuthenticated]
        
	def get(self, request):
		if not request.user.is_authenticated:
			return Response({"error": "User not authenticated"}, status=status.HTTP_401_UNAUTHORIZED)

		user = request.user
		profile = user.profile
		profile_data = {
			"username": user.username,
			"email": user.email,
            "nationality": profile.nationality,
            "bio": profile.bio,
            "age": profile.age,
            "profile_picture": profile.profile_picture,
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
		profile_fields = ["nationality", "bio", "age", "profile_picture", "tournament_name", "is_online"]
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

class MatchAPIView(APIView):

    def get(self, request):
        try:
            if request.body:
                data = request.data
                validate_request_data_match(data)
                user = data.get('user', None)
                opponent = data.get('opponent', None)
                date = data.get('date', None)
                result = data.get('result', None)

                queryset = Match.objects.all()
                if user:
                    queryset = queryset.filter(user__id=user)
                if opponent:
                    queryset = queryset.filter(opponent=opponent)
                if date:
                    queryset = queryset.filter(date=date)
                if result:
                    queryset = queryset.filter(result=result)
            else:
                queryset = Match.objects.all()
            
            serializer = MatchSerializer(queryset, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
    def post(self, request):
        try:
            serializer = MatchSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
    def put(self, request, pk=None):
        try:
            match = Match.objects.get(pk=pk)
            serializer = MatchSerializer(match, data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return Response({"error": "Match not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
    def patch(self, request, pk=None):
        try:
            match = Match.objects.get(pk=pk)
            serializer = MatchSerializer(match, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return Response({"error": "Match not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
    def delete(self, request, pk=None):
        try:
            match = Match.objects.get(pk=pk)
            match.delete()
            return Response({"message": "Match deleted successfully"}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"error": "Match not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)  

# API made for the management of the friend list of the user
class FriendListAPIView(APIView):
    permission_classes = [IsAuthenticated]
     
    def get(self, request):
        user = request.user
        profile = user.profile
        friends = profile.friends.all()

        friends_data = [
            {
                "id": friend.user.id,
                "username": friend.user.username,
                "profile_picture": friend.profile_picture,
            }
            for friend in friends
        ]

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
    def post(self, request):
        serializer = MessageSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request):
        messages = Message.objects.filter(conversation_id=request.query_params.get('conversation_id')).order_by('timestamp')
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)


class SearchAPIView(APIView):
    def get(self, request):
        query = request.query_params.get("query", "").strip()
        if not query:
            return Response({"error": "Query parameter is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        users = User.objects.filter(username__icontains=query).values("username")[:3]
        # serializer = UserSerializer([user.user for user in users], many=True)
        return Response(list(users), status=status.HTTP_200_OK)


class SendFriendRequestAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        sender = request.user
        receiver_username = request.data.get("receiver_username")

        if not receiver_username:
            return Response({"error": "Receiver username is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            receiver = User.objects.get(username=receiver_username)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        if sender == receiver:
            return Response({"error": "You cannot send a friend request to yourself"}, status=status.HTTP_400_BAD_REQUEST)

        sender_profile = sender.profile
        receiver_profile = receiver.profile

        if receiver_profile in sender_profile.friends.all():
            return Response({"error": "You are already friends"}, status=status.HTTP_400_BAD_REQUEST)

        if FriendRequest.objects.filter(sender=sender, receiver=receiver, status="pending").exists():
            return Response({"error": "Friend request already sent"}, status=status.HTTP_400_BAD_REQUEST)

        FriendRequest.objects.create(sender=sender, receiver=receiver)
        return Response({"message": "Friend request sent"}, status=status.HTTP_201_CREATED)

class AcceptFriendRequestAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, request_id):
        try:
            friend_request = FriendRequest.objects.get(id=request_id, receiver=request.user, status="pending")
        except FriendRequest.DoesNotExist:
            return Response({"error": "Friend request not found"}, status=status.HTTP_404_NOT_FOUND)

        friend_request.status = "accepted"
        friend_request.save()

        friend_request.sender.profile.friends.add(friend_request.receiver.profile)
        friend_request.receiver.profile.friends.add(friend_request.sender.profile)

        return Response({"message": "Friend request accepted"}, status=status.HTTP_200_OK)

class DeclineFriendRequestAPIView(APIView):
    def post(self, request, request_id):
        try:
            friend_request = FriendRequest.objects.get(id=request_id, receiver=request.user, status="pending")
        except FriendRequest.DoesNotExist:
            return Response({"error": "Friend request not found"}, status=status.HTTP_404_NOT_FOUND)

        friend_request.status = "declined"
        friend_request.save()
        return Response({"message": "Friend request declined"}, status=status.HTTP_200_OK)

class PendingFriendRequestsAPIView(APIView):
    def get(self, request):
        requests = FriendRequest.objects.filter(receiver=request.user, status="pending").values("id", "sender__username")
        return Response(list(requests), status=status.HTTP_200_OK)
