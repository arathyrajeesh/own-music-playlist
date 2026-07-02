from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import IntegrityError
from .models import Song
from .serializers import SongSerializer
import os
import subprocess
import tempfile
import shutil

# Video file extensions we support for conversion
VIDEO_EXTENSIONS = {'.mp4', '.mkv', '.avi', '.mov', '.webm', '.flv', '.wmv', '.m4v', '.3gp'}


def is_video_file(filename):
    ext = os.path.splitext(filename)[1].lower()
    return ext in VIDEO_EXTENSIONS


def convert_video_to_mp3(video_path):
    """
    Convert a video file to MP3 using ffmpeg.
    Returns (mp3_path, duration_seconds) or raises an exception.
    """
    if not shutil.which('ffmpeg'):
        raise RuntimeError(
            'ffmpeg is not installed on the server. '
            'Run: sudo apt-get install ffmpeg'
        )

    # Write output to a temp file
    tmp_dir = tempfile.mkdtemp()
    mp3_path = os.path.join(tmp_dir, 'converted.mp3')

    cmd = [
        'ffmpeg', '-y',
        '-i', video_path,
        '-vn',                # no video
        '-acodec', 'libmp3lame',
        '-ab', '192k',        # 192 kbps audio
        '-ar', '44100',       # sample rate
        mp3_path
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
    if result.returncode != 0:
        raise RuntimeError(f'ffmpeg conversion failed: {result.stderr[-500:]}')

    # Get duration using ffprobe
    duration = 0
    try:
        probe_cmd = [
            'ffprobe', '-v', 'error',
            '-show_entries', 'format=duration',
            '-of', 'default=noprint_wrappers=1:nokey=1',
            mp3_path
        ]
        probe_result = subprocess.run(probe_cmd, capture_output=True, text=True, timeout=30)
        duration = int(float(probe_result.stdout.strip()))
    except Exception:
        pass

    return mp3_path, tmp_dir, duration


class SongViewSet(viewsets.ModelViewSet):
    serializer_class = SongSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'artist', 'album', 'genre']

    def get_queryset(self):
        queryset = Song.objects.filter(
            uploaded_by=self.request.user
            ).order_by('-uploaded_at')
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

    def create(self, request, *args, **kwargs):
        from django.core.files import File

        title = request.data.get('title', '').strip()
        artist = request.data.get('artist', '').strip()
        album = request.data.get('album', '').strip()
        genre = request.data.get('genre', '').strip()
        uploaded_file = request.FILES.get('file')

        # Duplicate check
        if Song.objects.filter(
            title__iexact=title,
            artist__iexact=artist,
            uploaded_by=request.user
        ).exists():
            return Response(
                {'error': f'You already have "{title}" by "{artist}" in your library.'},
                status=status.HTTP_409_CONFLICT
            )

        # ── Video → Audio path ──────────────────────────────────────────
        if uploaded_file and is_video_file(uploaded_file.name):
            tmp_video_path = None
            tmp_dir = None
            try:
                # Write incoming video to a temp file
                suffix = os.path.splitext(uploaded_file.name)[1]
                with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
                    for chunk in uploaded_file.chunks():
                        tmp.write(chunk)
                    tmp_video_path = tmp.name

                mp3_path, tmp_dir, detected_duration = convert_video_to_mp3(tmp_video_path)

                # Read the MP3 into memory BEFORE cleanup
                from django.core.files.base import ContentFile
                with open(mp3_path, 'rb') as f:
                    mp3_bytes = f.read()

            except RuntimeError as e:
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                import traceback
                print("VIDEO CONVERT ERROR:", traceback.format_exc())
                return Response(
                    {'error': f'Video conversion failed: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            finally:
                # Clean up temp files now that bytes are already in memory
                if tmp_video_path:
                    try:
                        os.unlink(tmp_video_path)
                    except Exception:
                        pass
                if tmp_dir:
                    shutil.rmtree(tmp_dir, ignore_errors=True)

            # Save Song using in-memory MP3 bytes
            try:
                safe_name = (title[:40] + '.mp3').replace('/', '_')
                song = Song(
                    title=title,
                    artist=artist,
                    album=album,
                    genre=genre,
                    duration=detected_duration,
                    uploaded_by=request.user,
                )
                song.file.save(safe_name, ContentFile(mp3_bytes), save=True)

                cover = request.FILES.get('cover_image')
                if cover:
                    song.cover_image.save(cover.name, cover, save=True)

                from .serializers import SongSerializer
                return Response(SongSerializer(song).data, status=status.HTTP_201_CREATED)
            except Exception as e:
                import traceback
                print("SONG SAVE ERROR:", traceback.format_exc())
                return Response(
                    {'error': f'Failed to save song: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        # ── Normal audio upload path ─────────────────────────────────────
        try:
            return super().create(request, *args, **kwargs)
        except IntegrityError:
            return Response(
                {'error': 'This song already exists in your library.'},
                status=status.HTTP_409_CONFLICT
            )

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

    @action(detail=False, methods=['post'], url_path='add-from-url')
    def add_from_url(self, request):
        """Download audio from a URL (YouTube, SoundCloud, etc.) using yt-dlp and save as a Song."""
        import yt_dlp
        from django.core.files import File

        url   = request.data.get('url', '').strip()
        title  = request.data.get('title', '').strip()
        artist = request.data.get('artist', '').strip()
        album  = request.data.get('album', '').strip()
        genre  = request.data.get('genre', '').strip()

        if not url:
            return Response({'error': 'URL is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if not title:
            return Response({'error': 'Title is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if not artist:
            return Response({'error': 'Artist is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Duplicate check
        if Song.objects.filter(
            title__iexact=title,
            artist__iexact=artist,
            uploaded_by=request.user
        ).exists():
            return Response(
                {'error': f'You already have "{title}" by "{artist}" in your library.'},
                status=status.HTTP_409_CONFLICT
            )

        tmp_dir = tempfile.mkdtemp()
        try:
            output_template = os.path.join(tmp_dir, 'audio.%(ext)s')
            ydl_opts = {
                'format': 'bestaudio/best',
                'outtmpl': output_template,
                'quiet': True,
                'no_warnings': True,
                'postprocessors': [{
                    'key': 'FFmpegExtractAudio',
                    'preferredcodec': 'mp3',
                    'preferredquality': '192',
                }],
            }

            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=True)
                detected_title  = info.get('title', title)
                detected_artist = info.get('uploader', artist)
                duration_secs   = int(info.get('duration', 0))

            # Use user-provided values if set, else fall back to detected
            final_title  = title  or detected_title
            final_artist = artist or detected_artist

            # Find the downloaded mp3
            mp3_path = os.path.join(tmp_dir, 'audio.mp3')
            if not os.path.exists(mp3_path):
                # fallback: find any audio file
                for f in os.listdir(tmp_dir):
                    mp3_path = os.path.join(tmp_dir, f)
                    break

            with open(mp3_path, 'rb') as f:
                safe_name = f"{final_title[:40]}.mp3".replace('/', '_')
                song = Song(
                    title=final_title,
                    artist=final_artist,
                    album=album or '',
                    genre=genre or '',
                    duration=duration_secs,
                    uploaded_by=request.user,
                )
                song.file.save(safe_name, File(f), save=True)

            from .serializers import SongSerializer
            return Response(SongSerializer(song).data, status=status.HTTP_201_CREATED)

        except yt_dlp.utils.DownloadError as e:
            return Response(
                {'error': f'Could not download from that URL. Make sure the link is public and valid.\nDetail: {str(e)[:200]}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'An error occurred: {str(e)[:300]}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        finally:
            shutil.rmtree(tmp_dir, ignore_errors=True)

