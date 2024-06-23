import json
import logging

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db.models import Prefetch, Sum
from django.http import HttpResponse
from django.http import JsonResponse, HttpResponseBadRequest
from django.middleware.csrf import get_token
from django.shortcuts import get_object_or_404, render, redirect
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_POST
from django.views.decorators.http import require_http_methods
from rest_framework import viewsets, generics, status
from rest_framework.decorators import api_view, permission_classes, renderer_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from rest_framework.views import APIView

from .forms import *
from .models import Elevator, TankGrain, Data, Conditions, TypeGrain, Grain
from .serializers import *

logger = logging.getLogger(__name__)


def get_csrf_token(request):
    token = get_token(request)
    return JsonResponse({'csrfToken': token})


@csrf_exempt
def get_user_bunkers(request):
    if request.method == 'GET':
        # Фільтруємо бункери лише для поточного користувача
        user_bunkers = TankGrain.objects.filter(user=request.user)
        # Повертаємо список бункерів у відповідь на запит
        return JsonResponse({'bunkers': list(user_bunkers.values())})
    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)


@csrf_exempt
def logout_user(request):
    logout(request)
    return JsonResponse({'message': 'User logged out successfully'})


@csrf_exempt
def logout_view(request):
    logout(request)
    return JsonResponse({'message': 'Користувач вийшов з акаунту'})


@csrf_exempt
def userlogin(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            username = data.get('username')
            password = data.get('password')
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)

        if username is None or password is None:
            return JsonResponse({'error': 'Username or password not provided'}, status=400)

        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return JsonResponse({'message': 'Login successful'})
        else:
            return JsonResponse({'error': 'Invalid credentials'}, status=400)
    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)


# Функція для виходу користувача
def logout_user(request):
    if request.method == 'POST':
        logout(request)
        return JsonResponse({'message': 'Logged out successfully'}, status=200)
    return JsonResponse({'error': 'Invalid request method'}, status=400)


# Функція для реєстрації користувача
@csrf_exempt
@require_POST
def register(request):
    try:
        data = json.loads(request.body)
        form = RegisterUserForm(data)

        if form.is_valid():
            form.save()
            return JsonResponse({'success': True})
        else:
            errors = {field: error[0] for field, error in form.errors.items()}
            return JsonResponse({'success': False, 'errors': errors}, status=400)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def add_elevator(request):
    if request.user.is_authenticated:
        if request.method == 'POST':
            data = json.loads(request.body)
            elevator_form = ElevatorForm(data)

            if elevator_form.is_valid():
                elevator = elevator_form.save(commit=False)
                elevator.user = request.user
                elevator.save()

                num_bunkers = int(data.get('num_bunkers'))
                bunker_capacity = int(data.get('bunker_capacity'))

                for i in range(num_bunkers):
                    granbunker_data = {
                        'number': str(i + 1),  # Assuming 'number' field is CharField
                        'max_capacity': bunker_capacity,
                        'elevator': elevator.id
                    }
                    granbunker_form = GrainBunkerForm(data=granbunker_data)

                    if granbunker_form.is_valid():
                        granbunker_form.save()
                    else:
                        return JsonResponse({'errors': granbunker_form.errors}, status=400)

                return JsonResponse({'message': 'Elevator and bunkers added successfully'}, status=200)
            else:
                return JsonResponse({'errors': elevator_form.errors}, status=400)
        else:
            return JsonResponse({'error': 'Invalid request method'}, status=405)
    else:
        return JsonResponse({'error': 'Unauthorized'}, status=401)


@csrf_exempt
def delete_elevator(request, elevator_id):
    if request.method == 'DELETE':
        elevator_instance = get_object_or_404(Elevator, pk=elevator_id)
        elevator_instance.delete()
        return JsonResponse({'message': 'Elevator deleted successfully'}, status=204)
    return JsonResponse({'error': 'Invalid request method'}, status=400)


def add_bunker_api(request, elevator_id):
    elevator = get_object_or_404(Elevator, id=elevator_id)
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            serializer = TankGrainSerializer(data=data)
            if serializer.is_valid():
                bunker = TankGrain(
                    elevator=elevator,
                    number=TankGrain.objects.filter(elevator=elevator).count() + 1,
                    max_capacity=serializer.validated_data['max_capacity'],
                    temperature=None,
                    humidity=None
                )
                bunker.save()
                return JsonResponse(TankGrainSerializer(bunker).data, status=201)
            return JsonResponse(serializer.errors, status=400)
        except json.JSONDecodeError as e:
            return JsonResponse({'error': 'Invalid JSON format'}, status=400)
    return JsonResponse({'message': 'Method not allowed'}, status=405)


@api_view(['GET'])
def bunker_detail(request, bunker_id):
    try:
        bunker = TankGrain.objects.get(pk=bunker_id)
    except TankGrain.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)
    serializer = TankGrainSerializer(bunker)
    return Response(serializer.data)


@api_view(['PUT'])
def bunker_update(request, bunker_id):
    try:
        bunker = TankGrain.objects.get(pk=bunker_id)
    except TankGrain.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    data = request.data
    grain_data = data.pop('grain')
    grain_type = TypeGrain.objects.get(type=grain_data['type'])
    grain, created = Grain.objects.get_or_create(type=grain_type, sort=grain_data['sort'])

    data['grain'] = grain.id
    serializer = TankGrainSerializer(bunker, data=data)

    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ElevatorEditDetailView(APIView):
    def get(self, request, id):
        try:
            elevator = Elevator.objects.get(id=id)
            response_data = {
                'el_name': elevator.el_name,
            }
            return JsonResponse(response_data)
        except Elevator.DoesNotExist:
            return JsonResponse({'error': 'Elevator not found'}, status=status.HTTP_404_NOT_FOUND)

    def put(self, request, id):
        try:
            current_elevator = Elevator.objects.get(id=id)
            data = request.data

            if 'el_name' in data:
                current_elevator.el_name = data['el_name']
                current_elevator.save()

            return JsonResponse({'message': 'Elevator updated successfully'})
        except Elevator.DoesNotExist:
            return JsonResponse({'error': 'Elevator not found'}, status=status.HTTP_404_NOT_FOUND)


def grain_types(request):
    types = TypeGrain.objects.all()
    return JsonResponse([type.to_dict() for type in types], safe=False)


def sort_choices(request):
    return JsonResponse(SORT_CHOICES, safe=False)


@csrf_exempt
def add_grain(request):
    user = request.user
    grain_form = GrainForm(request.POST)
    # Debug: Print received POST data
    logger.debug("Received POST data: %s", request.POST)
    logger.debug("grain_form: %s", grain_form)

    if grain_form.is_valid():
        logger.debug("Valid grain_form: %s", grain_form)
        grain = grain_form.save(commit=False)
        grain.user = user
        grain.save()

        elevator_id = request.POST.get('elevator')
        bunker_id = request.POST.get('bunker')

        try:
            elevator = Elevator.objects.get(pk=elevator_id, user=user)
            bunker = TankGrain.objects.get(pk=bunker_id, elevator=elevator)
        except (Elevator.DoesNotExist, TankGrain.DoesNotExist):
            return HttpResponseBadRequest("Invalid elevator or bunker selected.")

        if bunker.grain and (bunker.grain.sort != grain.sort or bunker.grain.type != grain.type):
            return HttpResponseBadRequest("Different sorts and types of grain cannot be mixed in one bunker.")

        try:
            fulled_capacity = int(request.POST.get('num_grains'))
        except ValueError:
            return HttpResponseBadRequest("Invalid number of grains.")

        if fulled_capacity > bunker.max_capacity:
            return HttpResponseBadRequest("The bunker does not have enough capacity to store this quantity of grain.")

        bunker.grain = grain
        bunker.fulled_capacity = fulled_capacity
        bunker.save()

        return JsonResponse({'message': 'Grain added successfully'})
    else:
        # Debug: Print form errors
        logger.debug("Form errors: %s", grain_form.errors)
        return JsonResponse({'error': 'Invalid form data', 'details': grain_form.errors})


def get_elevator_bunkers(request, id):
    if request.method == 'GET':
        try:
            bunkers = TankGrain.objects.filter(elevator_id=id)
            data = [{'id': bunker.id, 'number': bunker.number} for bunker in bunkers]
            return JsonResponse(data, safe=False)
        except TankGrain.DoesNotExist:
            return JsonResponse({'error': 'Bunkers not found for this elevator'}, status=404)
    else:
        return JsonResponse({'error': 'Method not allowed'}, status=405)


def handle_sensor_data(request):
    if request.method == 'POST':
        temperature = request.POST.get('temperature')
        humidity = request.POST.get('humidity')
        tanknumberid = request.POST.get('tanknumberid')

        if not temperature or not humidity or not tanknumberid:
            return HttpResponse("Missing data.", status=400)

        try:
            temperature = float(temperature)
            humidity = float(humidity)
        except ValueError:
            return HttpResponse("Invalid temperature or humidity format.", status=400)

        tank_grain = get_object_or_404(TankGrain, id=tanknumberid)

        tank_grain.temperature = temperature
        tank_grain.humidity = humidity
        tank_grain.save()

        record_sensor_data(tank_grain, temperature, humidity)

        return JsonResponse({"message": "Data received successfully"})
    else:
        return HttpResponse("Only POST requests are allowed.")


def compare_data_view(request):
    user = request.user

    tank_grains = TankGrain.objects.filter(elevator__user=user)

    results = []
    for tank_grain in tank_grains:
        if tank_grain.grain:
            try:
                condition = get_object_or_404(Conditions, grain_type=tank_grain.grain.type)
                temperature_ok = condition.mintemperature <= tank_grain.temperature <= condition.maxtemperature
                humidity_ok = condition.minhumidity <= tank_grain.humidity <= condition.maxhumidity

                message = 'All good' if temperature_ok and humidity_ok else 'Conditions not met'
                if not temperature_ok:
                    message = f'Temperature out of range! Expected: {condition.mintemperature}-{condition.maxtemperature}, got: {tank_grain.temperature}'
                if not humidity_ok:
                    message = f'Humidity out of range! Expected: {condition.minhumidity}-{condition.maxhumidity}, got: {tank_grain.humidity}'

                # Получаем номер бункера и название элеватора
                bunker_number = tank_grain.number
                elevator_name = tank_grain.elevator.el_name

                results.append({
                    'bunker_number': bunker_number,
                    'elevator_name': elevator_name,
                    'temperature_ok': temperature_ok,
                    'humidity_ok': humidity_ok,
                    'message': message
                })
            except Conditions.DoesNotExist:
                results.append({
                    'bunker_number': tank_grain.number,
                    'elevator_name': tank_grain.elevator.el_name,
                    'temperature_ok': False,
                    'humidity_ok': False,
                    'message': 'Conditions not found for grain type'
                })
        else:
            results.append({
                'bunker_number': tank_grain.number,
                'elevator_name': tank_grain.elevator.el_name,
                'temperature_ok': False,
                'humidity_ok': False,
                'message': 'Grain type is not specified for this tank'
            })

    response_data = {'results': results}

    # Добавляем дополнительное поле, если есть более 3 ошибок
    if len(results) > 3:
        response_data['more_than_three_errors'] = True

    return JsonResponse(response_data)


def record_sensor_data(tank_grain, temperature, humidity):
    Data.objects.create(tankgrain=tank_grain, temperature=temperature, humidity=humidity)


def comparison_results(request):
    grain_sort = request.GET.get('grain_sort')
    grain_type = request.GET.get('grain_type')
    elevator = request.GET.get('elevator')

    # Получаем текущего пользователя
    user = request.user

    # Используем TankGrain как основу для запроса данных, ограничиваем по юзеру
    results = TankGrain.objects.filter(elevator__user=user)

    if grain_sort:
        results = results.filter(grain__sort=grain_sort)
    if grain_type:
        results = results.filter(grain__type__type=grain_type)
    if elevator:
        results = results.filter(elevator__el_name=elevator)

    # Преобразуем результаты в список словарей для JSON-ответа
    results_list = []
    for result in results:
        # Проверяем, что у бункера есть связь с зерном
        grain_type_name = result.grain.type.get_display_name() if result.grain and result.grain.type else ''

        result_dict = {
            'tank_id': result.id,
            'elevator_name': result.elevator.el_name,
            'tank_number': result.number,
            'grain_type': grain_type_name,
            'temperature': result.temperature if result.temperature is not None else '',
            'humidity': result.humidity if result.humidity is not None else '',
            # Добавьте другие поля, если необходимо
        }
        results_list.append(result_dict)

    # Сортируем результаты по названию элеватора
    results_list.sort(key=lambda x: x['elevator_name'])

    # Возвращаем JSON-ответ
    return JsonResponse({'results': results_list})


def observation_history(request, tankId):
    # Отримуємо дані для вибраного бункера
    observations = Data.objects.filter(tankgrain_id=tankId).values('timestamp', 'temperature', 'humidity')

    # Отримуємо інформацію про вибраний бункер і елеватор
    tank = get_object_or_404(TankGrain.objects.select_related('elevator'), id=tankId)

    tank_info = {
        'number': tank.number,
        'elevator': {
            'el_name': tank.elevator.el_name,
        }
    }

    data = {
        'tank': tank_info,
        'observations': list(observations)
    }

    return JsonResponse(data)


class TypeGrainViewSet(viewsets.ModelViewSet):
    queryset = TypeGrain.objects.all()
    serializer_class = TypeGrainSerializer


class GrainViewSet(viewsets.ModelViewSet):
    queryset = Grain.objects.all()
    serializer_class = GrainSerializer


class ConditionsViewSet(viewsets.ModelViewSet):
    queryset = Conditions.objects.all()
    serializer_class = ConditionsSerializer


class ElevatorViewSet(viewsets.ModelViewSet):
    queryset = Elevator.objects.all()
    serializer_class = ElevatorSerializer


class TankGrainViewSet(viewsets.ModelViewSet):
    queryset = TankGrain.objects.all()
    serializer_class = TankGrainSerializer


class DataViewSet(viewsets.ModelViewSet):
    queryset = Data.objects.all()
    serializer_class = DataSerializer


class ElevatorListView(View):
    def get(self, request):
        elevators = Elevator.objects.filter(user=request.user).prefetch_related(
            Prefetch('tankgrain_set', queryset=TankGrain.objects.order_by('number'))
        ).values(
            'id', 'el_name'
        )
        return JsonResponse(list(elevators), safe=False)


class BunkerListView(generics.ListAPIView):
    queryset = TankGrain.objects.all()
    serializer_class = TankGrainSerializer


class BunkerFilterView(generics.ListAPIView):
    serializer_class = TankGrainSerializer

    def get_queryset(self):
        bunker_id = self.kwargs['bunker_id']
        queryset = TankGrain.objects.filter(id=bunker_id)
        return queryset


class CompareResultsView(View):
    def get(self, request):
        results = compare_data_view(request)
        serialized_results = DataSerializer(results, many=True).data
        return JsonResponse(serialized_results, safe=False)


@csrf_exempt
@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_bunker(request, bunker_id):
    try:
        bunker = TankGrain.objects.get(id=bunker_id)
    except TankGrain.DoesNotExist:
        return Response({'error': 'Bunker not found'}, status=status.HTTP_404_NOT_FOUND)

    serializer = TankGrainSerializer(bunker, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@csrf_exempt
def delete_bunker(request, bunker_id):
    if request.method == 'DELETE':

        try:
            bunker = TankGrain.objects.get(pk=bunker_id)
            bunker.delete()
            return JsonResponse({'message': 'Бункер успішно видалено'}, status=200)
        except TankGrain.DoesNotExist:
            return JsonResponse({'error': 'Бункер не знайдено'}, status=404)
        except Exception as e:
            return JsonResponse({'error': 'Помилка видалення бункера: {}'.format(str(e))}, status=500)
    else:
        return JsonResponse({'error': 'Метод не дозволено'}, status=405)


@csrf_exempt
def unload_grain(request, pk):
    if request.method != 'POST':
        return HttpResponseBadRequest("Invalid request method.")

    try:
        tank = get_object_or_404(TankGrain, pk=pk)
    except TankGrain.DoesNotExist:
        return JsonResponse({'error': 'Tank not found'}, status=404)

    try:
        data = json.loads(request.body)
        amount_to_unload = int(data.get('amount'))

        if amount_to_unload <= 0:
            return JsonResponse({'error': 'Invalid amount specified'}, status=400)

        if tank.fulled_capacity < amount_to_unload:
            return JsonResponse({'error': 'Not enough grain in the tank'}, status=400)

        tank.fulled_capacity -= amount_to_unload
        tank.save()
        return JsonResponse({'message': 'Grain unloaded successfully'}, status=200)

    except (ValueError, TypeError, KeyError):
        return JsonResponse({'error': 'Invalid data provided'}, status=400)


class BunkerListView2(generics.ListAPIView):
    queryset = TankGrain.objects.all()
    serializer_class = TankGrainSerializer

    def get_queryset(self):
        user = self.request.user
        return TankGrain.objects.filter(elevator__user=user)
