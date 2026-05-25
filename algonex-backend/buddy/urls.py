from django.urls import path
from .views import BuddyChatView

urlpatterns = [
    path("chat/", BuddyChatView.as_view(), name="buddy-chat"),
]
