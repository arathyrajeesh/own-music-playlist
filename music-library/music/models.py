from django.db import models
from django.contrib.auth.models import User

class Song(models.Model):
    title = models.CharField(max_length=255)
    artist = models.CharField(max_length=255)
    album = models.CharField(max_length=255, blank=True, null=True)
    genre = models.CharField(max_length=100, blank=True, null=True)
    file = models.FileField(upload_to='songs/')
    cover_image = models.ImageField(upload_to='covers/', blank=True, null=True)
    duration = models.IntegerField(default=0, help_text="Duration in seconds")
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='uploaded_songs')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # Prevent the same user uploading the same title+artist combination twice
        unique_together = ('title', 'artist', 'uploaded_by')

    def __str__(self):
        return f"{self.title} - {self.artist}"
