from django.db import models
from django.contrib.auth.models import User
from user.models import UserProfile

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
