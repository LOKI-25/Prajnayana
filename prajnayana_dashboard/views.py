from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import *
from .serializers import *
from django.utils import timezone
from rest_framework.exceptions import ValidationError

class DiscoveryQuestionViewSet(viewsets.ModelViewSet):
    queryset = DiscoveryQuestion.objects.all()
    serializer_class = DiscoveryQuestionSerializer
    permission_classes = [IsAuthenticated] 

class TestSessionViewSet(viewsets.ModelViewSet):
    serializer_class = TestSessionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return TestSession.objects.filter(user=self.request.user)
    

    def perform_create(self, serializer):
        test_session_exist = TestSession.objects.filter(
            user=self.request.user,
            date_taken__date=timezone.now().date() 
        ).exists()

        if test_session_exist:
            raise ValidationError("You already have a test session for today.")  # Raise error if a session exists
        
        # Save the TestSession with the user
        serializer.save(user=self.request.user) 

class QuestionaireUserResponseViewSet(viewsets.ModelViewSet):
    serializer_class = QuestionaireUserResponseSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        test_session_id = self.request.data.get('test_session')
        test_session = TestSession.objects.get(id=test_session_id)
        serializer.save(test_session=test_session)

    def get_queryset(self):
        return QuestionaireUserResponse.objects.filter(test_session__user=self.request.user)
