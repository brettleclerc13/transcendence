from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from .models import Match
from .serializer import MatchSerializer

class MatchAPIView(generics.ListCreateAPIView):
	"""
	Handles listing matches and creating a new match.
	Also allows PATCH updates for a player joining a match.
	"""
	serializer_class = MatchSerializer
	permission_classes = [IsAuthenticated]

	def get_queryset(self):
		"""
		Allow filtering matches based on query params (e.g., user, winner, looser, match ID).
		"""
		queryset = Match.objects.all()
		if not queryset.exists():
			return Match.objects.none()

		filter_params = {
			'id': self.request.query_params.get('id'),
			'player1': self.request.query_params.get('player1'),
			'player2': self.request.query_params.get('player2'),
			'winner': self.request.query_params.get('winner'),
			'looser': self.request.query_params.get('looser'),
			'is_ongoing': self.request.query_params.get('is_ongoing'),
			'is_finished': self.request.query_params.get('is_finished'),
		}

		# Apply filters dynamically
		for key, value in filter_params.items():
			if value is not None:
				if key == 'player2' and value == '':
					queryset = queryset.filter(player2__isnull=True)
				else:
					queryset = queryset.filter(**{key: value})

		return queryset

	def post(self, request, *args, **kwargs):
		print(f"Authenticated user: {request.user}")  # Check if user is authenticated
		print(f"Headers: {request.headers}")  # See headers received
		print(f"Body: {request.data}")  # Debug request data
		return self.create(request, *args, **kwargs)

	def perform_create(self, serializer):
		"""
		Creates a match with the authenticated user as player1.
        Also allows setting `invite_game` flag.
		"""
		print("Received POST request with data:", self.request.data)
		invite_game = self.request.data.get('invite_game', False)
		match = serializer.save(player1=self.request.user, invite_game=invite_game)
		return Response({'match_id': match.id}, status=status.HTTP_201_CREATED)

	def patch(self, request, *args, **kwargs):
		"""
		Allows player2 to join a match.
		"""
		match_id = kwargs.get('pk')
		user = request.user

		try:
			with transaction.atomic():
				match = Match.objects.select_for_update().get(id=match_id)

				# Ensure player2 is not already set
				if match.player2 is not None:
					return Response({'error': 'Player2 has already joined this match.'}, status=status.HTTP_400_BAD_REQUEST)

				# Prevent player1 from joining as player2
				if match.player1 == user:
					return Response({'error': 'You cannot join your own match as player2.'}, status=status.HTTP_400_BAD_REQUEST)

				# Assign player2 and set match as ongoing
				match.player2 = user
				match.is_ongoing = True
				match.save()

			return Response(MatchSerializer(match).data, status=status.HTTP_200_OK)

		except Match.DoesNotExist:
			return Response({'error': 'Match not found.'}, status=status.HTTP_404_NOT_FOUND)
