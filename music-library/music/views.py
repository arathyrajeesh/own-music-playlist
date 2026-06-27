from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Song
from .serializers import SongSerializer

class SongViewSet(viewsets.ModelViewSet):
    serializer_class = SongSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'artist', 'album', 'genre']

    def get_queryset(self):
        queryset = Song.objects.filter(
            uploaded_by=self.request.user
            ).order_by('-uploaded_at')
        # Manual filtering
        artist = self.request.query_params.get('artist')
        album = self.request.query_params.get('album')
        genre = self.request.query_params.get('genre')
        if artist:
            queryset = queryset.filter(artist__iexact=artist)
        if album:
            queryset = queryset.filter(album__iexact=album)
        if genre:
            queryset = queryset.filter(genre__iexact=genre)
        
        return queryset

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)

    @action(detail=False, methods=['get'])
    def filters(self, request):
        """Returns unique lists of artists, albums, and genres for filtering."""
        songs = Song.objects.filter(uploaded_by=request.user)
        artists = list(songs.values_list('artist', flat=True).distinct().order_by('artist'))
        albums = list(songs.values_list('album', flat=True).distinct().order_by('album'))
        genres = list(songs.values_list('genre', flat=True).distinct().order_by('genre'))
        
        artists = [a for a in artists if a]
        albums = [a for a in albums if a]
        genres = [g for g in genres if g]

        return Response({
            'artists': artists,
            'albums': albums,
            'genres': genres
        })
