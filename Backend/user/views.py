from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from rest_framework.permissions import IsAuthenticated
from .serializer import UserSerializer, MatchSerializer, CustomTokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView

# Create your views here.

class UserAPIView(APIView):  # User registration and management
    def post(self, request):
        print("Request Data:", request.data)
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

class CheckEmailAPIView(APIView):
	def post(self, request):
		email = request.data.get('email', None)
		if email and User.objects.filter(email=email).exists():
			return Response({"exists": True}, status=status.HTTP_200_OK)
		return Response({"exists": False}, status=status.HTTP_200_OK)

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
		profile_data = {
			"username": user.username,
			"email": user.email,
            "nationality": getattr(user, "nationality", ""),
            "bio": getattr(user, "bio", ""),
            "age": getattr(user, "age", None),
            "profile_picture": getattr(user, "profile_picture", ""),
            "tournament_name": getattr(user, "tournament", {}).get("_name", ""),
            "is_online": getattr(user, "is_online", False),
		}
		return Response(profile_data, status=status.HTTP_200_OK)

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
