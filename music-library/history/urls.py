from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import HistoryEntryViewSet

router = DefaultRouter()
router.register(r'', HistoryEntryViewSet, basename='history')

urlpatterns = [
    path('', include(router.urls)),
]
