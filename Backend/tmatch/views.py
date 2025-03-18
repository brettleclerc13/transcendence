from rest_framework import generics, status
from .models import TournamentMatch
from rest_framework.permissions import IsAuthenticated
from .serializer import TournamentSerializer
from rest_framework.response import Response
from django.db import transaction
from rest_framework.views import APIView

class TournamentAPIView(generics.ListCreateAPIView):
	serializer_class = TournamentSerializer
	permission_classes = [IsAuthenticated]

	def get_queryset(self):
		return TournamentMatch.objects.all()

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
                
				if user in tournament.players.all():
					return Response({'error': 'You are already in this tournament.'}, status=status.HTTP_400_BAD_REQUEST)

				if tournament.players.count() >= tournament.max_players:
					return Response({'error': 'Tournament is full.'}, status=status.HTTP_400_BAD_REQUEST)

				tournament.players.add(user)

				if tournament.players.count() == tournament.max_players:
					tournament.is_ongoing = True
					tournament.save()

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
		ongoing_tournaments = TournamentMatch.objects.filter(is_ongoing=True, players=user)
		serializer = TournamentSerializer(ongoing_tournaments, many=True)
		return Response(serializer.data)
