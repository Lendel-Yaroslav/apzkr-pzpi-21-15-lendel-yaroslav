from rest_framework import serializers
from .models import *


class TypeGrainSerializer(serializers.ModelSerializer):
    class Meta:
        model = TypeGrain
        fields = '__all__'

    def to_representation(self, instance):
        return instance.to_dict()


class GrainSerializer(serializers.ModelSerializer):
    type = TypeGrainSerializer()

    class Meta:
        model = Grain
        fields = '__all__'

    def to_representation(self, instance):
        return {
            'sort': instance.sort,
            'type': instance.type.get_display_name(),  # Используем get_display_name для отображения типа зерна
        }


class ConditionsSerializer(serializers.ModelSerializer):
    grain_type = TypeGrainSerializer()

    class Meta:
        model = Conditions
        fields = '__all__'

    def to_representation(self, instance):
        return {
            'grain_type': instance.grain_type.to_dict(),
            'mintemperature': instance.mintemperature,
            'minhumidity': instance.minhumidity,
            'maxtemperature': instance.maxtemperature,
            'maxhumidity': instance.maxhumidity,
        }


class ElevatorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Elevator
        fields = '__all__'


class TankGrainSerializer(serializers.ModelSerializer):
    class Meta:
        model = TankGrain
        fields = ['id', 'fulled_capacity', 'max_capacity', 'elevator', 'number', 'temperature', 'humidity']
        extra_kwargs = {
            'elevator': {'required': False},
            'number': {'required': False},
            'temperature': {'required': False},
            'humidity': {'required': False},
        }

    def to_representation(self, instance):
        grain_data = None
        if instance.grain:
            grain_data = {
                'sort': instance.grain.sort,
                'type': instance.grain.type.get_display_name(),
            }

        elevator_data = {
            'id': instance.elevator.id,
            'el_name': instance.elevator.el_name
        }

        return {
            'id': instance.id,
            'number': instance.number,
            'fulled_capacity': instance.fulled_capacity,  # Corrected field name
            'max_capacity': instance.max_capacity,
            'temperature': instance.temperature,
            'humidity': instance.humidity,
            'grain': grain_data,
            'elevator': elevator_data
        }


class DataSerializer(serializers.ModelSerializer):
    tankgrain = TankGrainSerializer()

    class Meta:
        model = Data
        fields = '__all__'

    def to_representation(self, instance):
        return {
            'timestamp': instance.timestamp,
            'tankgrain': instance.tankgrain.to_representation(instance.tankgrain),
            'temperature': instance.temperature,
            'humidity': instance.humidity,
        }
