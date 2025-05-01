from rest_framework import generics, status
from .models import TournamentMatch
from rest_framework.permissions import IsAuthenticated
from .serializer import TournamentSerializer
from rest_framework.response import Response
from django.db import transaction
from rest_framework.views import APIView
from django.core.exceptions import ValidationError
from uuid import UUID
from django.utils.translation import gettext_lazy as _

class TournamentAPIView(generics.ListCreateAPIView):
	serializer_class = TournamentSerializer
	permission_classes = [IsAuthenticated]

	def get_queryset(self):
		queryset = TournamentMatch.objects.all()
		if not queryset.exists():
			return TournamentMatch.objects.none()
		
		filter_params = {
			'id': self.request.query_params.get('id'),
			'tournament_winner': self.request.query_params.get('tournament_winner'),
			'is_ongoing': self.request.query_params.get('is_ongoing'),
			'is_finished': self.request.query_params.get('is_finished'),
			'max_players': self.request.query_params.get('max_players'),
		}

		if filter_params['id']:
			try:
				filter_params['id'] = UUID(filter_params['id'])
			except ValueError:
				raise ValidationError({'id': _("Invalid tournament ID format.")})

		for key, value in filter_params.items():
			if value is not None and value != "null":
				queryset = queryset.filter(**{key: value})
		
		player_id = self.request.query_params.get('player')
		if player_id:
			queryset = queryset.filter(players__id=player_id)

		return queryset

	def get_serializer_context(self):
		context = super().get_serializer_context()
		context.update({"request": self.request})
		return context

	def perform_create(self, serializer):
		print("Received tournamentdata:", self.request.data)
		try:
			tournament = serializer.save()
			return Response({'tournament_id': tournament.id}, status=status.HTTP_201_CREATED)
		except ValidationError as e:
			print("Validation Error:", e.detail)  # Logs to console
			return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)
		except Exception as e:
			print("Unexpected Error:", str(e))  # Logs unexpected errors
			return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class TournamentRetrieveUpdateAPIView(generics.RetrieveUpdateAPIView):
	serializer_class = TournamentSerializer
	permission_classes = [IsAuthenticated]
	queryset = TournamentMatch.objects.all()
	lookup_field = 'id'

	def patch(self, request, *args, **kwargs):
		tournament_id = kwargs.get('id')
		user = request.user

		try:
			with transaction.atomic():
				tournament = TournamentMatch.objects.select_for_update().get(id=tournament_id)
                
				if tournament.is_finished:
					return Response({'error': 'Tournament already finished.'}, status=status.HTTP_400_BAD_REQUEST)

				if tournament.players.count() >= tournament.max_players:
					return Response({'error': 'Tournament is full.'}, status=status.HTTP_400_BAD_REQUEST)

				if not user in tournament.players.all():
					tournament.players.add(user)

				if tournament.players.count() > 1:
					tournament.is_ongoing = True
					tournament.save()
			
			tournament.refresh_from_db()
			return Response(TournamentSerializer(tournament).data, status=status.HTTP_200_OK)
		except TournamentMatch.DoesNotExist:
			return Response({'error': 'Tournament not found.'}, status=status.HTTP_404_NOT_FOUND)
	
	def put(self, request, *args, **kwargs):
		tournament_id = kwargs.get('id')
		user = request.user

		try:
			with transaction.atomic():
				tournament = TournamentMatch.objects.select_for_update().get(id=tournament_id)

				if tournament.is_finished:
					return Response({'error': 'Tournament already finished.'}, status=status.HTTP_400_BAD_REQUEST)

				if user not in tournament.players.all():
					return Response({'error': 'You are not in this tournament.'}, status=status.HTTP_400_BAD_REQUEST)

				tournament.players.remove(user)

				# Check if the tournament should still be ongoing
				if tournament.players.count() < 1:
					tournament.is_ongoing = False
					tournament.save()

			tournament.refresh_from_db()
			return Response(TournamentSerializer(tournament).data, status=status.HTTP_200_OK)
		except TournamentMatch.DoesNotExist:
			return Response({'error': 'Tournament not found.'}, status=status.HTTP_404_NOT_FOUND)


class TournamentHistoryView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		user = request.user
		tournaments = TournamentMatch.objects.filter(players=user, is_finished=True)
		serializer = TournamentSerializer(tournaments, many=True)
		return Response(serializer.data)

class TournamentCheckView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request):
		user = request.user
		ongoing_tournaments = TournamentMatch.objects.filter(is_ongoing=True, players__in=[user])
		print(f"User {user} tournaments:", ongoing_tournaments)  # Debug log
		serializer = TournamentSerializer(ongoing_tournaments, many=True)
		return Response(serializer.data)
