from django.shortcuts import render

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from user.serializer import MessageSerializer
from user.models import UserProfile, Message, FriendRequest, Conversation
from django.http import JsonResponse
