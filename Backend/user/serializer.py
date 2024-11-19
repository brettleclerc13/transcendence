from rest_framework import serializers
from .models import *

class UserSerializer(serializers.ModelSerializer):
    class Meta:
            model = User
            fields = ['id', 'user', 'email', 'password', 'nationality', 'bio', 'age', 'profile_picture', 'tournament_name']
            extra_kwargs = {
                  'id' : {'required': False},
                  'nationality' : {'required': False},
                  'bio' : {'required': False},
                  'age' : {'required': False},
                  'profile_picture' : {'required': False},
                  'tournament_name' : {'required': False},
            }

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