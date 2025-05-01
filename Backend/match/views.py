from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from .models import Match
from .serializer import MatchSerializer, MatchSummarySerializer
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
from uuid import UUID
from rest_framework.views import APIView
from django.db.models import Q
from rest_framework.throttling import AnonRateThrottle
from rest_framework.permissions import AllowAny

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

		# Convert ID to UUID safely
		if filter_params['id']:
			try:
				filter_params['id'] = UUID(filter_params['id'])
			except ValueError:
				raise ValidationError({'id': _("Invalid match ID format.")})

		# Apply filters dynamically
		for key, value in filter_params.items():
			if value is not None and value != "null":
				if key == 'player2' and value == '':
					queryset = queryset.filter(player2__isnull=True)
				else:
					queryset = queryset.filter(**{key: value})

		return queryset

	def get_serializer_context(self):
		"""Pass request context to serializer so it can access `request.user`."""
		context = super().get_serializer_context()
		context.update({"request": self.request})
		return context

	def perform_create(self, serializer):
		"""
		Creates a match with the authenticated user as player1.
        Also allows setting `invite_game` flag.
		"""
		print(f"Authenticated user: {self.request.user}")  # Debugging line
		print(f"User is authenticated: {self.request.user.is_authenticated}")  # Check if user is authenticated
		print(f"Received POST request with data:", self.request.data)

		invite_game = self.request.data.get('invite_game', False)

		# Ensure player1 is set in the serializer
		serializer.validated_data['player1'] = self.request.user

		match = serializer.save(player1=self.request.user, invite_game=invite_game)
		return Response({'match_id': match.id}, status=status.HTTP_201_CREATED)

class MatchRetrieveUpdateAPIView(generics.RetrieveUpdateAPIView):
	"""
	Handles retrieving and updating a single match.
	"""
	serializer_class = MatchSerializer
	permission_classes = [IsAuthenticated]
	queryset = Match.objects.all()
	lookup_field = 'id'  # Set UUID as lookup field

	def patch(self, request, *args, **kwargs):
		"""
		Allows player2 to join a match.
		"""
		print("Received PATCH request with data:", request.data)
		match_id = kwargs.get('id')  # This now correctly maps to the URL
		print("Match ID:", match_id)
		user = request.user

		try:
			with transaction.atomic():
				match = Match.objects.select_for_update().get(id=match_id)

				# If user is player1, return the match data for game rendering
				if match.player1 == user:
					return Response(MatchSerializer(match).data, status=status.HTTP_200_OK)
				
				# Ensure player2 is not already set
				if match.player2 is not None:
					return Response({'error': 'Player2 has already joined this match.'}, status=status.HTTP_400_BAD_REQUEST)

				# Assign player2 and set match as ongoing
				match.player2 = user
				match.is_ongoing = True
				match.save()

			return Response(MatchSerializer(match).data, status=status.HTTP_200_OK)

		except Match.DoesNotExist:
			return Response({'error': 'Match not found.'}, status=status.HTTP_404_NOT_FOUND)

class MatchHistoryView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		user = request.user
		matches = Match.objects.filter(
			Q(winner=user) | Q(looser=user),
			is_finished=True
		)

		if not matches.exists():
			return Response([], status=status.HTTP_200_OK)

		serializer = MatchSerializer(matches, many=True)
		return Response(serializer.data)

class MatchCLIView(APIView):
	permission_classes = [AllowAny]
	throttle_classes = [AnonRateThrottle]

	def get(self, request):
		queryset = Match.objects.all()
		if not queryset.exists():
			return Match.objects.none()

		filter_params = {
			'is_ongoing': self.request.query_params.get('is_ongoing'),
			'is_finished': self.request.query_params.get('is_finished'),
		}

		# Apply filters dynamically
		for key, value in filter_params.items():
			if value is not None and value != "null":
				queryset = queryset.filter(**{key: value})

		serializer = MatchSummarySerializer(queryset, many=True)
		return Response(serializer.data)

class MatchCheckView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		user = request.user
		ongoing_matches = Match.objects.filter(
			is_ongoing=True,
			player1=user
		) | Match.objects.filter(
			is_ongoing=True,
			player2=user
		)
		print(f"ongoing matches: {ongoing_matches}")
		serializer = MatchSerializer(ongoing_matches, many=True)
		return Response(serializer.data)
