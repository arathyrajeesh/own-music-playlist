from rest_framework import serializers
from .models import Song

class SongSerializer(serializers.ModelSerializer):
    uploaded_by_username = serializers.ReadOnlyField(source='uploaded_by.username')

    class Meta:
        model = Song
        fields = (
            'id', 'title', 'artist', 'album', 'genre', 
            'file', 'cover_image', 'duration', 
            'uploaded_by', 'uploaded_by_username', 'uploaded_at'
        )
        read_only_fields = ('id', 'uploaded_by', 'uploaded_at')
