from django.shortcuts import render
from .models import Counter
from django.http import JsonResponse

#from rest_framework.views import APIView
#from rest_framework.response import Response
#from . serializer import *


# Create your views here.
def increment_counter(request):
    counter, created = Counter.objects.get_or_create(id=1)
    counter.count += 1
    counter.save()
    return JsonResponse({'count': counter.count})

#USERS
#	details (map):
#		email -> email
#		age -> number
#		nationality -> string
#		bio -> string
#		profile_pic -> string (png path)
#
#	game_stats (map):
#	tournament_name -> string (default required)
#	match_history (map)
#		adversary -> string
#		date -> date
#		win -> number
#		loss -> number