from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from .models import Favorite
from .serializers import FavoriteSerializer
from music.models import Song

class FavoriteViewSet(viewsets.ModelViewSet):
    serializer_class = FavoriteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Favorite.objects.filter(user=self.request.user).order_by('-created_at')

    def create(self, request, *args, **kwargs):
        song_id = request.data.get('song')
        if not song_id:
            return Response({'error': 'song id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            song = Song.objects.get(id=song_id)
        except Song.DoesNotExist:
            return Response({'error': 'Song not found'}, status=status.HTTP_404_NOT_FOUND)
        
        favorite, created = Favorite.objects.get_or_create(user=request.user, song=song)
        if not created:
            favorite.delete()
            return Response({'status': 'unfavorited', 'song_id': song_id})
        
        serializer = self.get_serializer(favorite)
        return Response({'status': 'favorited', 'data': serializer.data})
