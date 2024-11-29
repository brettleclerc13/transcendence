from django.db import models
from django.contrib.auth.hashers import check_password as django_check_password
from django.contrib.auth.hashers import make_password

# Create your models here.

class User(models.Model):
    user = models.CharField(max_length=20, unique=True)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=100)
    nationality = models.CharField(max_length=50, blank=True, null=True)
    bio = models.CharField(max_length=500, blank=True, null=True)
    age = models.PositiveIntegerField(blank=True, null=True)
    profile_picture = models.CharField(max_length=100, blank=True, null=True)
    tournament_name = models.CharField(max_length=20, blank=True, null=True)
    
    def set_password(self, raw_password: str):
        self.password = make_password(raw_password)

    def check_password(self, raw_password: str):
        return django_check_password(raw_password, self.password)

    def __str__(self):
        return self.user

class Match(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="matches")
    opponent = models.CharField(max_length=20)
    date = models.DateField()
    score = models.IntegerField()
    opponent_score = models.IntegerField()
    result = models.CharField(max_length=10, choices=[('Win', 'Win'), ('Lose', 'Lose')])

    def __str__(self):
        return f"Match against {self.opponent} on {self.date}"