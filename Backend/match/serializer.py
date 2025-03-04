from rest_framework import serializers
from .models import Match

class MatchSerializer(serializers.ModelSerializer):
	player1_username = serializers.ReadOnlyField(source='player1.username')
	player2_username = serializers.ReadOnlyField(source='player2.username')
	winner_username = serializers.ReadOnlyField(source='winner.username')
	looser_username = serializers.ReadOnlyField(source='looser.username')

	class Meta:
		model = Match
		fields = [
			'id', 'player1', 'player2', 'player1_username', 'player2_username',
			'score_player1', 'score_player2', 'is_finished', 'is_ongoing',
			'winner', 'winner_username', 'looser', 'looser_username',
			'invite_game', 'created_at'
		]
		read_only_fields = ['id', 'created_at', 'winner', 'looser']
	def create(self, validated_data):
		validated_data['player1'] = self.context['request'].user
		return super().create(validated_data)

	def validate(self, data):
		"""
		Custom validation to ensure:
		- player1 and player2 cannot be the same user
		- score values cannot be negative
		"""
		player1 = self.context['request'].user  # Always use the authenticated user
		player2 = data.get('player2', self.instance.player2 if self.instance else None)

		if player1 and player2 and player1 == player2:
			raise serializers.ValidationError("Player1 and Player2 cannot be the same user.")

		if 'score_player1' in data and data['score_player1'] < 0:
			raise serializers.ValidationError("score_player1 cannot be negative.")
        
		if 'score_player2' in data and data['score_player2'] < 0:
			raise serializers.ValidationError("score_player2 cannot be negative.")

		return data
