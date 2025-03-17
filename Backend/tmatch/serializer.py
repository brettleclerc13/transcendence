from rest_framework import serializers
from .models import TournamentMatch

class TournamentSerializer(serializers.ModelSerializer):
	players_usernames = serializers.SerializerMethodField()
	winner_username = serializers.ReadOnlyField(source='tournament_winner.username')

	class Meta:
		model = TournamentMatch
		fields = '__all__'
		read_only_fields = ['id', 'created_at', 'tournament_winner', 'is_ongoing', 'is_finished']
    
	def get_players_usernames(self, obj):
		return [player.username for player in obj.players.all()]

	def create(self, validated_data):
		request = self.context.get("request")
		if not request or not request.user.is_authenticated:
			raise serializers.ValidationError({"players": "User must be authenticated."})
        
		tournament = TournamentMatch.objects.create()
		tournament.players.add(request.user)  # Add creator as the first player
		return tournament
	