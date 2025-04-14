from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *

router = DefaultRouter()
router.register('discovery_questions', DiscoveryQuestionViewSet, basename='discovery_question')
router.register('test_sessions', TestSessionViewSet, basename='test_session')
router.register('user_responses', QuestionaireUserResponseViewSet, basename='user_response')
router.register('habits', HabitsViewSet, basename='habit')
router.register('habit_tracking', HabitTrackingViewSet, basename='habit_tracking')
router.register('journal', JournalEntryViewSet, basename='journal')
router.register('knowledge-hub', KnowledgeHubViewSet, basename='knowledge_hub')
router.register('vision-board', VisionBoardViewSet, basename='vision_board')

urlpatterns = [
    path('', include(router.urls)),
    path('user_responses_api/',generate_questionaire_score),
]
