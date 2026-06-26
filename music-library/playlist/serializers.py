from rest_framework import serializers
from .models import Playlist
from music.serializers import SongSerializer

class PlaylistSerializer(serializers.ModelSerializer):
    songs_count = serializers.IntegerField(source='songs.count', read_only=True)
    songs = SongSerializer(many=True, read_only=True)

    class Meta:
        model = Playlist
        fields = ('id', 'name', 'songs', 'songs_count', 'created_at')
        read_only_fields = ('id', 'created_at')
