from rest_framework import serializers
from .models import Match

class MatchSerializer(serializers.ModelSerializer):
	player1_username = serializers.ReadOnlyField(source='player1.username')
	player2_username = serializers.ReadOnlyField(source='player2.username')
	winner_username = serializers.ReadOnlyField(source='winner.username')
	looser_username = serializers.ReadOnlyField(source='looser.username')
	result = serializers.SerializerMethodField()
	match_type = serializers.SerializerMethodField()
	score = serializers.SerializerMethodField()

	class Meta:
		model = Match
		fields = "__all__"
		extra_kwargs = {
            "player1": {"read_only": True},  # Ensure player1 is not required in request
            "player2": {"required": False},  # Optional in requests
        }
		read_only_fields = ['id', 'created_at', 'winner', 'looser']

	def get_result(self, obj):
		request = self.context.get("request")
		if request is None:
			return None 
		if obj.winner == request.user:
			return 'won'
		else:
			return 'lost'


	def get_match_type(self, obj):
		return '1v1'
	
	def get_score(self, obj):
		return f"{obj.score_player1} / {obj.score_player2}"

	def create(self, validated_data):
			"""
			Set `player1` from request user before saving.
			"""
			request = self.context.get("request")
			if request and request.user.is_authenticated:
				validated_data["player1"] = request.user
			else:
				raise serializers.ValidationError({"player1": "User must be authenticated."})

			return super().create(validated_data)

	def validate(self, data):
		"""
		Custom validation to ensure:
		- player1 and player2 cannot be the same user
		- score values cannot be negative
		"""
		request = self.context.get('request')
		if not request or not hasattr(request, 'user'):
			raise serializers.ValidationError("Request user is required.")
		
		if not request.user.is_authenticated:
			raise serializers.ValidationError("You must be logged in to create a match.")

		player1 = request.user  # Ensure player1 is always the authenticated user
		player2 = data.get('player2', self.instance.player2 if self.instance else None)

		 # If updating, check existing instance
		if self.instance and not player2:
			player2 = self.instance.player2

		if player1 and player2 and player1 == player2:
			raise serializers.ValidationError("Player1 and Player2 cannot be the same user.")

		if data.get('score_player1', 0) < 0 or data.get('score_player2', 0) < 0:
			raise serializers.ValidationError("scores cannot be negative.")

		return data

class MatchSummarySerializer(serializers.ModelSerializer):
	player1_username = serializers.ReadOnlyField(source='player1.username')
	player2_username = serializers.ReadOnlyField(source='player2.username')

	class Meta:
		model = Match
		fields = ['id', 'player1_username', 'player2_username']
