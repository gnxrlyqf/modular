from rest_framework import serializers
from .models import Project, ProjectVote


class ProjectSerializer(serializers.ModelSerializer):
    net_votes = serializers.SerializerMethodField()
    upvotes = serializers.SerializerMethodField()
    downvotes = serializers.SerializerMethodField()
    user_vote = serializers.SerializerMethodField()
    username = serializers.CharField(source='user.username', read_only=True)

    def _vote_list(self, obj):
        return list(obj.votes.all())

    def get_net_votes(self, obj):
        return sum(v.vote for v in self._vote_list(obj))

    def get_upvotes(self, obj):
        return sum(1 for v in self._vote_list(obj) if v.vote == 1)

    def get_downvotes(self, obj):
        return sum(1 for v in self._vote_list(obj) if v.vote == -1)

    def get_user_vote(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return 0
        uid = request.user.id
        for v in self._vote_list(obj):
            if v.user_id == uid:
                return v.vote
        return 0

    class Meta:
        model = Project
        fields = '__all__'
        read_only_fields = ['user', 'created_at', 'updated_at']
