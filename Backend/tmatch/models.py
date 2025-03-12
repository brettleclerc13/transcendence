from django.db import models
from django.contrib.auth.models import User
from models import Match
import uuid

class TournamentMatch(models.Model):

	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	players = models.ManyToManyField(User, related_name="tournament_players")
	matches = models.ManyToManyField(Match, related_name="tournament_matches")
	max_players = models.IntegerField(default=4)
	is_finished = models.BooleanField(default=False)
	is_ongoing = models.BooleanField(default=False)
	tournament_winner = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="won_matches")
	created_at = models.DateTimeField(auto_now_add=True)

	def __str__(self):
		return f"Tournament Match {self.id}"
