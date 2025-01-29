from django.db import models
from django.contrib.auth.models import User

# Create your models here.

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    nationality = models.CharField(max_length=50, blank=True, null=True)
    bio = models.CharField(max_length=500, blank=True, null=True)
    age = models.PositiveIntegerField(blank=True, null=True)
    profile_picture = models.CharField(max_length=100, blank=True, null=True)
    tournament_name = models.CharField(max_length=20, blank=True, null=True)
    is_online = models.BooleanField(default=True, blank=True, null=True)

    friends = models.ManyToManyField("self", blank=True, symmetrical=True)

    def __str__(self):
        return f"{self.user.username}'s profile"

class Match(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="matches")
    opponent = models.CharField(max_length=20)
    date = models.DateField()
    score = models.IntegerField()
    opponent_score = models.IntegerField()
    result = models.CharField(max_length=10, choices=[('Win', 'Win'), ('Lose', 'Lose')])

    def __str__(self):
        return f"Match against {self.opponent} on {self.date}"
    
class Message(models.Model):
    sender_id = models.IntegerField()
    conversation_id = models.IntegerField()
    text = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
