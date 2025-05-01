from django.db import models
from django.contrib.auth.models import User
from django_otp.plugins.otp_totp.models import TOTPDevice
from os import getenv
from rest_framework import serializers
from django.core.exceptions import ValidationError
import os
import mimetypes

# Try to import python-magic, but provide fallback if not available
try:
    import magic
    HAS_MAGIC = True
except ImportError:
    HAS_MAGIC = False
    print("Warning: python-magic is not installed. Using fallback file type detection.")


def user_directory_path(instance, filename):
	return f"profile_pictures/{instance.user.id}/{filename}"

# Create your models here.

class UserProfile(models.Model):
	user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
	nationality = models.CharField(max_length=50, blank=True, null=True)
	bio = models.CharField(max_length=500, blank=True, null=True)
	age = models.PositiveIntegerField(blank=True, null=True)
	profile_picture = models.ImageField(upload_to='profile_pictures/', blank=True, null=True)
	tournament_name = models.CharField(max_length=20, blank=True, null=True)
	is_online = models.BooleanField(default=True, blank=True, null=True)
	friends = models.ManyToManyField("self", blank=True, symmetrical=True)
	blocked_users = models.ManyToManyField("self", symmetrical=False, related_name="blocked_by", blank=True)
	has_2fa = models.BooleanField(default=False)

	def validate_profile_picture(self, value):
		if not value:
			return value

		# Size validation
		max_size = 2 * 1024 * 1024  # 2MB
		if value.size > max_size:
			raise serializers.ValidationError("The image file size should not exceed 2MB.")

		# File extension validation
		ext = os.path.splitext(value.name)[1].lower()
		valid_extensions = ['.png', '.jpg', '.jpeg', '.webp']
		if ext not in valid_extensions:
			raise serializers.ValidationError(f"Unsupported file extension. Allowed extensions are: {', '.join(valid_extensions)}")

		# Content type validation
		valid_mime_types = ['image/png', 'image/jpeg', 'image/webp']

		if HAS_MAGIC:
			try:
				# Read the first 2048 bytes to determine file type
				file_content = value.read(2048)
				mime = magic.Magic(mime=True)
				content_type = mime.from_buffer(file_content)

				value.seek(0)

				if content_type not in valid_mime_types:
					raise serializers.ValidationError(
						f"Unsupported file type. File appears to be {content_type}. Allowed types are: {', '.join(valid_mime_types)}"
					)
			except Exception as e:
				raise serializers.ValidationError(f"Error validating file: {str(e)}")
		else:
			# Fallback method using file extension and basic checks
			try:
				# Check file signature manually for common image formats
				file_content = value.read(8)  # Read first 8 bytes0
				value.seek(0)

				# Convert bytes to hex for signature checking
				hex_signature = ''.join([f'{byte:02x}' for byte in file_content])

				# Check signatures
				is_png = hex_signature.startswith('89504e47')
				is_jpeg = hex_signature.startswith('ffd8ff')
				is_webp = b'WEBP' in file_content

				if not (is_png or is_jpeg or is_webp):
					guessed_type = mimetypes.guess_type(value.name)[0]
					if guessed_type not in valid_mime_types:
						raise serializers.ValidationError(
							f"File does not appear to be a valid image. Allowed types are: PNG, JPEG, WebP"
						)
			except Exception as e:
				raise serializers.ValidationError(f"Error validating file: {str(e)}")

		return value

	def __str__(self):
		return f"{self.user.username}'s profile"

	def enable_2fa(self):
		if not self.has_2fa:
			# Clean up any existing devices first
			self.user.totpdevice_set.all().delete()
			# Create a new device with proper issuer name
			device = TOTPDevice.objects.create(user=self.user, name="default")
			device.issuer = f"{getenv('NEXT_PUBLIC_WS_HOST')}:{getenv('NEXT_PUBLIC_WS_PORT')} - {self.user.username}"
			device.save()
			self.has_2fa = True
			self.save()

	def disable_2fa(self):
		# Delete all TOTP devices for this user
		self.user.totpdevice_set.all().delete()
		self.has_2fa = False
		self.save()

	def block_user(self, user_to_block):
		self.blocked_users.add(user_to_block)

	def unblock_user(self, user_to_unblock):
		self.blocked_users.remove(user_to_unblock)

	def is_blocked(self, user):
		return self.blocked_users.filter(id=user.id).exists()


class Match(models.Model):
	user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="matches")
	opponent = models.CharField(max_length=20)
	date = models.DateField()
	score = models.IntegerField()
	opponent_score = models.IntegerField()
	result = models.CharField(max_length=10, choices=[('Win', 'Win'), ('Lose', 'Lose')])

	def __str__(self):
		return f"Match against {self.opponent} on {self.date}"

	def __str__(self):
		return f"Match against {self.opponent} on {self.date}"

class Conversation(models.Model):
    participants = models.ManyToManyField(User)

    def __str__(self):
        return f"Conversation {self.id} entre {', '.join([p.username for p in self.participants.all()])}"

class Message(models.Model):
    sender = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, null=True, blank=True)
    text = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

class FriendRequest(models.Model):
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sent_requests")
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name="received_requests")
    status = models.CharField(
        max_length=10,
        choices=[("pending", "Pending"), ("accepted", "Accepted"), ("declined", "Declined")],
        default="pending"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.sender.username} → {self.receiver.username} ({self.status})"
