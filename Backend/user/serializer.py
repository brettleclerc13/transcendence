from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Match, UserProfile
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate

class UserProfileSerializer(serializers.ModelSerializer):
     class Meta:
        model = UserProfile
        fields = ['nationality', 'bio', 'age', 'profile_picture', 'tournament_name']

class UserSerializer(serializers.ModelSerializer):
	profile = UserProfileSerializer(required=False)
	class Meta:
		model = User
		fields = ['username', 'email', 'password', 'profile']
		extra_kwargs = {
			'password': {'write_only': True},
		}

	def validate_email(self, value):
		if User.objects.filter(email=value).exists():
			raise serializers.ValidationError("A user with this email already exists.")
		return value

	def create(self, validated_data):
		profile_data = validated_data.pop('profile', {})
		user = User.objects.create_user(
			username=validated_data['username'],
			email=validated_data['email'],
            password=validated_data['password'] #create_user hashes the password internally, (default: PBKDF2 with a SHA256 hash)
		)
		UserProfile.objects.create(user=user, **profile_data)
		return user

	def update(self, instance, validated_data):
		profile_data = validated_data.pop('profile', {})
		profile = instance.profile

		instance.username = validated_data.get('username', instance.username)
		instance.email = validated_data.get('email', instance.email)
		if 'password' in validated_data:
			instance.set_password(validated_data['password'])
		instance.save()

		profile.nationality = profile_data.get('nationality', profile.nationality)
		profile.bio = profile_data.get('bio', profile.bio)
		profile.age = profile_data.get('age', profile.age)
		profile.profile_picture = profile_data.get('profile_picture', profile.profile_picture)
		profile.tournament_name = profile_data.get('tournament_name', profile.tournament_name)
		profile.save()

		return instance

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
	def validate(self, attrs):
		email = attrs.get("username")  # `username` is the default field; treat it as `email`
		password = attrs.get("password")

		user = authenticate(username=email, password=password)

		if not user:
			raise serializers.ValidationError("Invalid email or password")

		# Pass validated user to parent serializer
		data = super().validate(attrs)
		data.update({"user_id": user.id, "email": user.email})

		return data

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