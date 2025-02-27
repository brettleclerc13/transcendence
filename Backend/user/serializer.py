from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile, Message
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer, TokenRefreshSerializer
from django.contrib.auth import authenticate

class UserProfileSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = ['user' ,'nationality', 'bio', 'age', 'profile_picture', 'tournament_name', 'is_online']

    def get_user(self, obj):
        return {"id": obj.user.id, "username": obj.user.username}

class UserSerializer(serializers.ModelSerializer):
	profile = UserProfileSerializer(required=False)
	class Meta:
		model = User
		fields = ['id', 'username', 'email', 'password', 'profile']
		extra_kwargs = {
			'password': {'write_only': True},
		}

	def validate(self, data):
		# Check for duplicate email
		if User.objects.filter(email=data.get('email')).exists():
			raise serializers.ValidationError({"email": "A user with this email already exists."})
        
		# Check for duplicate username
		if User.objects.filter(username=data.get('username')).exists():
			raise serializers.ValidationError({"username": "A user with this username already exists."})

		return data

	def create(self, validated_data):
		profile_data = validated_data.pop('profile', {})
		user = User.objects.create_user(
			username=validated_data['username'],
			email=validated_data['email'],
            password=validated_data['password'] #create_user hashes the password internally, (default: PBKDF2 with a SHA256 hash)
		)
		UserProfile.objects.create(user=user, **profile_data)
		return user

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

class CustomTokenRefreshSerializer(TokenRefreshSerializer):
	def validate(self, attrs):
		try:
			data = super().validate(attrs) # Calls the default TokenRefreshSerializer validation

			# Decode the refresh token manually
			refresh_token = attrs["refresh"]
			decoded_token = UntypedToken(refresh_token)  # This will raise an error if the token is invalid

			user_id = decoded_token.payload.get("user_id")

			if user_id and not User.objects.filter(id=user_id).exists():
				raise serializers.ValidationError("User does not exist")

			return data

		except User.DoesNotExist:
			raise serializers.ValidationError("User does not exist")
		except Exception as e:
			raise serializers.ValidationError(str(e))
	
class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = '__all__'
