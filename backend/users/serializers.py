from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import get_user_model
from django.db import models
from .models import Friendship, Profile
User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    email = serializers.EmailField(required=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "password"]

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists")
        return value

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Email already in use")
        return value

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        user.is_verified = False
        user.save()
        return user

class ProfileSerializer(serializers.ModelSerializer):
    def_settings = serializers.JSONField()
    class Meta:
        model = Profile
        fields = ['bio', 'avatar', 'xp', 'level', 'def_settings', 'display_name', 'two_factor_enabled']
        read_only_fields = ['xp', 'level', 'two_factor_enabled']

class UserSearchSerializer(serializers.ModelSerializer):
    profile_id = serializers.IntegerField(source='profile.id', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'profile_id']

class FriendshipSerializer(serializers.ModelSerializer):
    sender_name = serializers.ReadOnlyField(source='sender.display_name')
    receiver_name = serializers.ReadOnlyField(source='receiver.display_name')

    class Meta:
        model = Friendship
        fields = ['id', 'sender', 'sender_name', 'receiver', 'receiver_name', 'status', 'created_at']
        read_only_fields = ['sender', 'status']

    def validate(self, data):
        sender = self.context['request'].user.profile
        receiver = data.get('receiver')

        # 1. self-friending
        if sender == receiver:
            raise serializers.ValidationError("You cannot send a friend request to yourself.")

        # 2. friendship/request already exists in either direction
        exists = Friendship.objects.filter(
            (models.Q(sender=sender) & models.Q(receiver=receiver)) |
            (models.Q(sender=receiver) & models.Q(receiver=sender))
        ).exists()

        if exists:
            raise serializers.ValidationError("A friendship or request already exists between these users.")

        return data