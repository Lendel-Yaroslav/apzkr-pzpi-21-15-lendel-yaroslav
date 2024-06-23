from BACK.views import *
from django.urls import path
from . import views
from rest_framework.schemas import get_schema_view

schema_view = get_schema_view(title='Your API')

urlpatterns = [
    path('csrf-token/', views.get_csrf_token, name='get_csrf_token'),
    path('login/', views.userlogin, name='userlogin'),
    path('register/', views.register, name='register'),
    path('logout/', views.logout_user, name='logout'),
    path('api/elevators/', views.ElevatorListView.as_view(), name='elevator_list'),
    path('api/bunkers/', views.BunkerListView2.as_view(), name='bunker_list'),
    path('add_elevator/', views.add_elevator, name='add_elevator'),
    path('api/elevators/<int:elevator_id>/', views.delete_elevator, name='delete_elevator'),
    path('api/elevators/<int:id>/edit/', views.ElevatorEditDetailView.as_view(), name='elevator_edit'),
    path('api/elevators/<int:id>/bunkers/', views.get_elevator_bunkers, name='get_elevator_bunkers'),
    path('add_grain/', views.add_grain, name='add_grain'),
    path('api/grain_types/', views.grain_types, name='grain_types'),
    path('api/sort_choices/', views.sort_choices, name='sort_choices'),
    path('api/elevators/<int:elevator_id>/add_bunker/', views.add_bunker_api, name='add_bunker_api'),
    path('api/bunkers/<int:bunker_id>/', views.BunkerFilterView.as_view(), name='bunker_list'),
    path('api/bunkers/<int:bunker_id>/update/', views.update_bunker, name='update_bunker'),
    path('api/bunkers/<int:bunker_id>/delete/', views.delete_bunker, name='delete_bunker'),
    path('api/bunkers/<int:bunker_id>/delete/', delete_bunker, name='delete_bunker'),
    path('api/tankgrains/<int:pk>/unload_grain/', views.unload_grain, name='unload_grain'),
    path('api/load_bunkers/', views.BunkerListView2.as_view(), name='bunker_list'),
    path('api/comparison_results/', comparison_results, name='comparison_results'),
    path('comparison_results/', views.comparison_results, name='comparison_results'),
    path('handle_sensor_data/', views.handle_sensor_data, name='handle_sensor_data'),
    path('api/compare-data/', views.compare_data_view, name='compare_data'),
    path('observation_history/<int:tankId>/', views.observation_history, name='observation_history'),
]

