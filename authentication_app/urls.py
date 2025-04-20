from django.urls import path
from .views import *
from rest_framework.routers import DefaultRouter
from django.urls import include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
router = DefaultRouter()
router.register('users', UserViewSet, basename='user')




    

urlpatterns = [
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('get_all_users/', get_all_users, name='users'),
    path('user',get_user),
    path('', include(router.urls)),
]
