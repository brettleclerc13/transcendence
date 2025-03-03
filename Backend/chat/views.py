from django.shortcuts import render

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from .serializer import MessageSerializer
from .models import UserProfile, Message, FriendRequest, Conversation
from django.http import JsonResponse


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


# class SearchAPIView(APIView):

#     def get(self, request):
#         query = request.query_params.get("query", "").strip()
#         if not query:
#             return Response({"error": "Query parameter is required"}, status=status.HTTP_400_BAD_REQUEST)
        
#         users = User.objects.filter(username__icontains=query).values("username")[:3]
#         # serializer = UserSerializer([user.user for user in users], many=True)
#         return Response(list(users), status=status.HTTP_200_OK)

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
    permission_classes = [IsAuthenticated]

    def post(self, request, request_id):
        try:
            friend_request = FriendRequest.objects.get(id=request_id, receiver=request.user, status="pending")
        except FriendRequest.DoesNotExist:
            return Response({"error": "Friend request not found"}, status=status.HTTP_404_NOT_FOUND)

        friend_request.status = "declined"
        friend_request.save()
        return Response({"message": "Friend request declined"}, status=status.HTTP_200_OK)

class PendingFriendRequestsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        requests = FriendRequest.objects.filter(receiver=request.user, status="pending").values("id", "sender__username")
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