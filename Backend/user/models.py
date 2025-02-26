from django.db import models
from django.contrib.auth.models import User

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

	def __str__(self):
		return f"{self.user.username}'s profile"

	def block_user(self, user_to_block):
		self.blocked_users.add(user_to_block)

	def unblock_user(self, user_to_unblock):
		self.blocked_users.remove(user_to_unblock)

	def is_blocked(self, user):
		return self.blocked_users.filter(id=user.id).exists()
    
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
