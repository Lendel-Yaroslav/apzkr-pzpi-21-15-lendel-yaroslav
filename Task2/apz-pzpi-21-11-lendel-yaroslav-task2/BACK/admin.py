from tkinter import Pack

from django.contrib import admin
from .models import *

# Register your models here.

admin.site.register(Elevator)
admin.site.register(TankGrain)
admin.site.register(Grain)
admin.site.register(TypeGrain)
admin.site.register(Conditions)
admin.site.register(Data)


