from django import forms
from django.forms import inlineformset_factory

from .models import *
from django.contrib.auth.forms import UserCreationForm, UsernameField


# Форма для входу користувача
class LoginUserForm(forms.Form):
    username = UsernameField()
    password = forms.CharField()


# Форма для реєстрації користувача
class RegisterUserForm(UserCreationForm):
    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'password1', 'password2']

    def clean(self):
        cleaned_data = super().clean()
        password1 = cleaned_data.get("password1")
        password2 = cleaned_data.get("password2")

        if password1 and password2 and password1 != password2:
            self.add_error('password2', 'Passwords do not match')
        return cleaned_data

    def clean_username(self):
        username = self.cleaned_data.get('username')
        if User.objects.filter(username=username).exists():
            raise forms.ValidationError("Username already exists")
        return username

    def clean_email(self):
        email = self.cleaned_data.get('email')
        if User.objects.filter(email=email).exists():
            raise forms.ValidationError("Email already registered")
        return email


# Форма для додавання місць (локацій)
class ElevatorForm(forms.ModelForm):
    class Meta:
        model = Elevator
        fields = ['el_name']
        # Поля, які не повинні виводитись у формі
        exclude = ['User']


class GrainBunkerForm(forms.ModelForm):
    class Meta:
        model = TankGrain
        fields = ['number', 'max_capacity', 'elevator']


class GrainForm(forms.ModelForm):
    class Meta:
        model = Grain
        fields = ['sort', 'type']
        widgets = {
            'sort': forms.Select(choices=SORT_CHOICES),
            'type': forms.Select(choices=GRAIN_TYPE_CHOICES),
        }
