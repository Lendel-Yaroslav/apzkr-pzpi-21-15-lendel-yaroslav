from django.contrib.auth.models import User
from django.db import models

from .constants import *


class User(User):
    class Meta:
        proxy = True


class TypeGrain(models.Model):
    type = models.IntegerField(choices=GRAIN_TYPE_CHOICES)

    def __str__(self):
        return self.get_display_name()

    def get_display_name(self):
        return dict(GRAIN_TYPE_CHOICES).get(self.type)

    def to_dict(self):
        return {
            'type': self.type,
            'display_name': self.get_display_name(),
        }


class Grain(models.Model):
    sort = models.IntegerField(choices=SORT_CHOICES)
    type = models.ForeignKey(TypeGrain, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.type.get_display_name()} - {dict(SORT_CHOICES).get(self.sort)}"


class Conditions(models.Model):
    grain_type = models.ForeignKey(TypeGrain, on_delete=models.CASCADE)
    mintemperature = models.FloatField()
    minhumidity = models.FloatField()
    maxtemperature = models.FloatField()
    maxhumidity = models.FloatField()

    def __str__(self):
        return dict(GRAIN_TYPE_CHOICES)[self.grain_type.type]


class Elevator(models.Model):
    el_name = models.CharField(max_length=50)

    user = models.ForeignKey(User, on_delete=models.CASCADE)

    def __str__(self):
        return self.el_name


class TankGrain(models.Model):
    number = models.CharField(max_length=50)
    fulled_capacity = models.IntegerField(blank=True)
    max_capacity = models.IntegerField(blank=True)
    temperature = models.FloatField(null=True, blank=True)
    humidity = models.FloatField(null=True, blank=True)
    grain = models.ForeignKey(Grain, on_delete=models.CASCADE, null=True, blank=True)
    elevator = models.ForeignKey(Elevator, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.number} - {self.elevator.el_name}"


class Data(models.Model):
    timestamp = models.DateTimeField(auto_now_add=True)
    tankgrain = models.ForeignKey(TankGrain, on_delete=models.CASCADE)
    temperature = models.FloatField(null=True, blank=True)
    humidity = models.FloatField(null=True, blank=True)
