from django.shortcuts import render
from .models import Counter
from django.http import JsonResponse
# Create your views here.

def incement_counter(request):
    counter, created = Counter.objects.get_or_create(id=1)
    counter.count += 1
    counter.save()
    return JsonResponse({'count': counter.count})