from rest_framework import serializers
from .models import Favorite
from music.serializers import SongSerializer

class FavoriteSerializer(serializers.ModelSerializer):
    song_details = SongSerializer(source='song', read_only=True)

    class Meta:
        model = Favorite
        fields = ('id', 'song', 'song_details', 'created_at')
        read_only_fields = ('id', 'created_at')
