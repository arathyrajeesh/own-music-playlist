from rest_framework import serializers
from .models import HistoryEntry
from music.serializers import SongSerializer

class HistoryEntrySerializer(serializers.ModelSerializer):
    song_details = SongSerializer(source='song', read_only=True)

    class Meta:
        model = HistoryEntry
        fields = ('id', 'song', 'song_details', 'played_at')
        read_only_fields = ('id', 'played_at')
