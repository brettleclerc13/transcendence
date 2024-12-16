from django.shortcuts import render
from .models import User, Match 

import logging
logger = logging.getLogger(__name__)

import sys

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token

from rest_framework.renderers import JSONRenderer

from . serializer import UserSerializer, MatchSerializer, LoginSerializer

# Create your views here.

def validate_request_data_user(data):
    allowed_fields = {'user', 'nationality', 'age', 'tournament_name'}
    for key in data.keys():
        if key not in allowed_fields:
            raise ValueError(f"Invalid field: {key}")
        
def validate_request_data_match(data):
    allowed_fields = {'user', 'opponent', 'date', 'result'}
    for key in data.keys():
        if key not in allowed_fields:
            raise ValueError(f"Invalid field: {key}")

class ListUserAPIView(APIView):

    renderer_classes = [JSONRenderer]  # Désactiver l'interface HTML

    def get(self, request):
        users = User.objects.all()  # Récupère tous les utilisateurs
        user_data = [
            {
                'id': user.id,
                'username': user.user,
                'email': user.email,
            }
            for user in users
        ]
        return Response(user_data, status=status.HTTP_200_OK)

class LoginAPIView(APIView):

    def post(self, request):
        print("Goodbye cruel world!", file=sys.stderr)
        print(f"data : {request.data}", file=sys.stderr)
        serializer = LoginSerializer(data=request.data)
        print("Check 2", file=sys.stderr)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            # Générer un token d'authentification
            # token, _ = Token.objects.get_or_create(user=user)
            return Response({'message': 'Login successful', 'user': user.id}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        #     return Response({"token": token.key}, status=status.HTTP_200_OK)
        # return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserAPIView(APIView): # Allow to register a new User
    
    def get(self, request):
        try:
            if request.body:
                data = request.query_params
                validate_request_data_user(data)
                user = data.get('user', None)
                nationality = data.get('nationality', None)
                age = data.get('age', None)
                tournament_name = data.get('tournament_name', None)

                queryset = User.objects.all()
                if user:
                    queryset = queryset.filter(user=user)
                if age:
                    queryset = queryset.filter(age=age)
                if nationality:
                    queryset = queryset.filter(nationality=nationality)
                if tournament_name:
                    queryset = queryset.filter(tournament_name=tournament_name)
            else:
                queryset = User.objects.all()
            
            serializer = UserSerializer(queryset, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request):
        try:
            logger.info("Received POST request with data: %s", request.data)
            serializer = UserSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save()
                logger.info("User created successfully: %s", serializer.data)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            logger.warning("Validation errors: %s", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error("Error in POST request: %s", str(e), exc_info=True)
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk=None):
        try:
            user = User.objects.get(pk=pk)
            serializer = UserSerializer(user, data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    def patch(self, request, pk=None):
        try:
            user = User.objects.get(pk=pk)
            serializer = UserSerializer(user, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
    def delete(self, request, pk=None):
        try:
            user = User.objects.get(pk=pk)
            user.delete()
            return Response({"message": "User deleted successfully"}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        

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
    

#USERS
#	details (map):
#		email -> email
#		age -> number
#		nationality -> string
#		bio -> string
#		profile_pic -> string (png path)
#
#	game_stats (map):
#	tournament_name -> string (default required)
#	match_history (map)
#		adversary -> string
#		date -> date
#		win -> number
#		loss -> number