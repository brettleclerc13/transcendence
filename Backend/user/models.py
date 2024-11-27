from django.db import models

# Create your models here.

class User(models.Model):
    user = models.CharField(max_length=20, unique=True)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=100)
    nationality = models.CharField(max_length=50)
    bio = models.CharField(max_length=500)
    age = models.CharField()
    profile_picture = models.CharField(max_length=100)
    tournament_name = models.CharField(max_length=20)

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