from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import get_user_model
from django.db import models
from .models import Friendship, Profile, Message, Notification
User = get_user_model()


class _RelativeImageField(serializers.ImageField):
    """ImageField that always serializes to a root-relative URL.

    Default DRF behavior absolutizes URLs when a request is in context, which
    yields http://backend:8000/media/... — unreachable from the browser since
    the SPA accesses media through the Vite proxy on the host. Forcing the
    relative URL keeps avatars loadable through `/media/...` everywhere.
    """

    def to_representation(self, value):
        if not value:
            return None
        try:
            return value.url
        except ValueError:
            return None

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
    avatar = _RelativeImageField(required=False, allow_null=True)
    class Meta:
        model = Profile
        fields = ['bio', 'avatar', 'xp', 'level', 'def_settings', 'display_name', 'two_factor_enabled']
        read_only_fields = ['xp', 'level', 'two_factor_enabled']

class UserSearchSerializer(serializers.ModelSerializer):
    profile_id = serializers.IntegerField(source='profile.id', read_only=True)
    is_online = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'profile_id', 'is_online']

    def get_is_online(self, obj):
        try:
            return obj.profile.is_online
        except Exception:
            return False

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


class MessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.ReadOnlyField(source='sender.user.username')
    receiver_username = serializers.ReadOnlyField(source='receiver.user.username')

    class Meta:
        model = Message
        fields = ['id', 'sender', 'receiver', 'sender_username', 'receiver_username', 'content', 'created_at', 'read_at']
        read_only_fields = ['sender', 'created_at', 'read_at']

    def validate_content(self, value):
        v = (value or '').strip()
        if not v:
            raise serializers.ValidationError("Message content cannot be empty.")
        if len(v) > 2000:
            raise serializers.ValidationError("Message too long (max 2000 chars).")
        return v


class NotificationSerializer(serializers.ModelSerializer):
    actor_username = serializers.ReadOnlyField(source='actor.user.username')
    actor_display_name = serializers.ReadOnlyField(source='actor.display_name')
    actor_avatar = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            'id', 'type', 'actor', 'actor_username', 'actor_display_name', 'actor_avatar',
            'related_id', 'read_at', 'created_at',
        ]
        read_only_fields = fields

    def get_actor_avatar(self, obj):
        return obj.actor.avatar.url if obj.actor.avatar else None


class PublicProfileSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='user.username')
    avatar = _RelativeImageField(required=False, allow_null=True, read_only=True)
    projects = serializers.SerializerMethodField()
    is_friend = serializers.SerializerMethodField()
    is_blocked_by_me = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = ['id', 'username', 'display_name', 'bio', 'avatar', 'projects', 'is_friend', 'is_blocked_by_me']

    def get_projects(self, obj):
        from projects.models import Project
        from projects.serializers import ProjectSerializer
        qs = Project.objects.filter(user=obj.user).order_by('-updated_at')
        return ProjectSerializer(qs, many=True).data

    def get_is_friend(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        me = request.user.profile
        return Friendship.objects.filter(
            (models.Q(sender=me, receiver=obj) | models.Q(sender=obj, receiver=me)),
            status='accepted',
        ).exists()

    def get_is_blocked_by_me(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        me = request.user.profile
        return Friendship.objects.filter(sender=me, receiver=obj, status='blocked').exists()