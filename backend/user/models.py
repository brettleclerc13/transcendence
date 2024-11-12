from django.db import models

# Create your models here.
class Counter(models.Model):
    count = models.PositiveBigIntegerField(default=0)