from rest_framework import serializers
from django.contrib.auth.models import User
from .models import  UserProfile, Message
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer, TokenRefreshSerializer
from django.contrib.auth import authenticate
from bleach import clean
from django_otp.plugins.otp_totp.models import TOTPDevice

class UserProfileSerializer(serializers.ModelSerializer):
	user = serializers.SerializerMethodField()
	profile_picture = serializers.SerializerMethodField()

	class Meta:
		model = UserProfile
		fields = ['user', 'profile_picture', 'age', 'nationality', 'bio', 'is_online', 'tournament_name']

	def validate_profile_picture(self, value):
		if not value:
			return value

		# Use the model's validation method
		from .models import UserProfile
		model_instance = UserProfile()
		return model_instance.validate_profile_picture(value)

	def get_profile_picture(self, obj):
		return obj.profile_picture.url if obj.profile_picture else None

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
		if "email" in data and User.objects.filter(email=data.get('email')).exists():
			raise serializers.ValidationError({"email": "A user with this email already exists."})

		# Check for duplicate username
		if "username" in data and User.objects.filter(username=data.get('username')).exists():
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
	otp = serializers.CharField(required=False, allow_blank=True, allow_null=True)

	def validate(self, attrs):
		email = attrs.get("username")  # `username` is the default field; treat it as `email`
		password = attrs.get("password")
		otp = attrs.get("otp")

		user = authenticate(username=email, password=password)

		if not user:
			raise serializers.ValidationError("Invalid email or password")

		if user.profile.has_2fa and not otp:
			return {
                "otp_required": True,
                "user_id": user.id,
                "email": user.email,
                "message": "2FA verification required"
            }

		if user.profile.has_2fa and otp:
			try:
				# Try to find the most recent device
				devices = TOTPDevice.objects.filter(user=user, name="default")
				if devices.count() > 0:
					device = devices.latest('id')
				else:
					raise serializers.ValidationError("2FA is not enabled")

				if not device.verify_token(otp):
					raise serializers.ValidationError("Invalid OTP")
			except serializers.ValidationError:
				raise serializers.ValidationError("Invalid OTP")

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

class CustomTokenVerifySerializer(serializers.Serializer):
	token = serializers.CharField()

	def validate(self, attrs):
		token = attrs.get("token")

		try:
			# Decode the token
			decoded_token = UntypedToken(token)
			user_id = decoded_token.payload.get("user_id")

			# Ensure the user still exists
			if not User.objects.filter(id=user_id).exists():
				raise serializers.ValidationError("User does not exist")

		except Exception as e:
			raise serializers.ValidationError(str(e))

		return attrs

class MessageSerializer(serializers.ModelSerializer):
	class Meta:
		model = Message
		fields = '__all__'

	def to_representation(self, instance):
		data = super().to_representation(instance)
		data['content'] = clean(data['content'], tags=[])
		return data

def to_representation(self, instance):
	data = super(self.__class__, self).to_representation(instance)
	for field in self.Meta.fields:
		value = data.get(field)
		if isinstance(value, str):
			data[field] = clean(value, tags=[])
	return data

serializer_classes = [
    UserProfileSerializer,
    UserSerializer,
    MessageSerializer,
]

for serializer in serializer_classes:
	if hasattr(serializer, 'Meta'):
		serializer.to_representation = to_representation
