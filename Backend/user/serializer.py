from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password
from .models import *

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(username=data['email'], password=data['password'])
        if not user:
            raise serializers.ValidationError("Invalid email or password.")
        return {'user': user}

class UserSerializer(serializers.ModelSerializer):
    class Meta:
            model = User
            fields = ['id', 'user', 'email', 'password', 'nationality', 'bio', 'age', 'profile_picture', 'tournament_name']
            extra_kwargs = {
                  'id' : {'required': False},
                  'password': {'write_only': True},
                  'nationality' : {'required': False},
                  'bio' : {'required': False},
                  'age' : {'required': False},
                  'profile_picture' : {'required': False},
                  'tournament_name' : {'required': False},
            }
    
    def create(self, validated_data): # Hash the password before saving
        validated_data['password'] = make_password(validated_data['password'])
        return super().create(validated_data)

class MatchSerializer(serializers.ModelSerializer):
    class Meta:
            model = Match
            fields = ['id', 'user', 'opponent', 'date', 'score', 'opponent_score', 'result']

    def validate(self, data):
        #so far Primary key is "id". here we using user to check.
        #it's best if either we move primary key to user or change this line to use id.
        # this should be decided intandem with frontend
        if not User.objects.filter(user=data['user']).exists():
            raise serializers.ValidationError("User does not exist.")
        return data