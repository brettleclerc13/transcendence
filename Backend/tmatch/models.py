from django.db import models
from django.contrib.auth.models import User
import uuid

class TournamentMatch(models.Model):
	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	players = models.ManyToManyField(User, related_name="tournament_players")
	matches = models.ManyToManyField('match.Match', related_name="tournament_matches")
	max_players = models.IntegerField(default=4)
	is_finished = models.BooleanField(default=False)
	is_ongoing = models.BooleanField(default=False)
	is_tournament = models.BooleanField(default=True)
	tournament_winner = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="tournament_wins")
	created_at = models.DateTimeField(auto_now_add=True)

	def __str__(self):
		return f"Tournament Match {self.id}"
