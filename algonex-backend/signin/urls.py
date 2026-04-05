from django.urls import path
from .views import SigninFormView, RegisterStep1View, RegisterStep2View

urlpatterns = [
    path("signin/", SigninFormView.as_view(), name="signin-form"),
    path("step1/", RegisterStep1View.as_view(), name="register-step1"),
    path("step2/", RegisterStep2View.as_view(), name="register-step2"),
]
