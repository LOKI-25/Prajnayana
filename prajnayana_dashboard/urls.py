from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *

router = DefaultRouter()
router.register(r'discovery_questions', DiscoveryQuestionViewSet, basename='discovery_question')
router.register(r'test_sessions', TestSessionViewSet, basename='test_session')
router.register(r'user_responses', QuestionaireUserResponseViewSet, basename='user_response')

urlpatterns = [
    path('', include(router.urls)),
]
