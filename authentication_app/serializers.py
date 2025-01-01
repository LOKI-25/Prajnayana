from django.contrib.auth.password_validation import validate_password
from rest_framework.serializers import ModelSerializer, ValidationError
from rest_framework import serializers
from .models import User




# UserSerializer
class UserSerializer(ModelSerializer):
    class Meta:
        model = User
        fields = ['id','username', 'email', 'first_name', 'last_name', 'gender', 'year_of_birth']

    def update(self, instance, validated_data):
        user = User.objects.filter(pk=instance.pk)
        user.update(**validated_data)
        return user.first()


        



class RegisterSerializer(ModelSerializer):
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'confirm_password', 'first_name', 'last_name', 'gender', 'year_of_birth']
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def validate(self, data):
        # Check if passwords match
        if data['password'] != data['confirm_password']:
            raise ValidationError({"password": "Passwords do not match"})
        
        # Validate password using Django's built-in validators
        validate_password(data['password'])
        
        return data

    def create(self, validated_data):
        # Remove confirm_password from validated_data as it's not needed for user creation
        validated_data.pop('confirm_password')
        return User.objects.create_user(**validated_data)