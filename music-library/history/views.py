from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from .models import HistoryEntry
from .serializers import HistoryEntrySerializer
from music.models import Song

class HistoryEntryViewSet(viewsets.ModelViewSet):
    serializer_class = HistoryEntrySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return HistoryEntry.objects.filter(user=self.request.user).order_by('-played_at')[:15]

    def create(self, request, *args, **kwargs):
        song_id = request.data.get('song')
        if not song_id:
            return Response({'error': 'song id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            song = Song.objects.get(id=song_id)
        except Song.DoesNotExist:
            return Response({'error': 'Song not found'}, status=status.HTTP_404_NOT_FOUND)
        
        entry, created = HistoryEntry.objects.get_or_create(user=request.user, song=song)
        if not created:
            entry.save()
        
        serializer = self.get_serializer(entry)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
