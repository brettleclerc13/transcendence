from django.db import models
from django.contrib.auth.models import User
from tmatch.models import TournamentMatch
import uuid

class Match(models.Model):

	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
	player1 = models.ForeignKey(User, on_delete=models.CASCADE, related_name="matches_as_player1")
	player2 = models.ForeignKey(User, on_delete=models.CASCADE, related_name="matches_as_player2", null=True, blank=True)
	score_player1 = models.IntegerField(default=0)
	score_player2 = models.IntegerField(default=0)
	is_finished = models.BooleanField(default=False)
	is_ongoing = models.BooleanField(default=False)
	is_tournament = models.BooleanField(default=False)
	is_finale = models.BooleanField(default=False)
	winner = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="match_wins")
	looser = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="match_losses")
	invite_game = models.BooleanField(default=False)
	created_at = models.DateTimeField(auto_now_add=True)

	def __str__(self):
		return f"Match {self.id} - {self.player1.username} vs {self.player2.username if self.player2 else 'Waiting...'}"
