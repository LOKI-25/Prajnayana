from django.urls import path
from .views import *
from rest_framework.routers import DefaultRouter
from django.urls import include

router = DefaultRouter()
router.register('users', UserViewSet, basename='user')

urlpatterns = [
    path('', include(router.urls)),
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('get_all_users/', get_all_users, name='users'),

    # path('logout/', LogoutView.as_view(), name='logout'),
]
