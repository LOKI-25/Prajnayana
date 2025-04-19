import datetime
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import *
from .serializers import *
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q




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
    

class HabitsViewSet(viewsets.ModelViewSet):
    serializer_class = HabitsSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Habits.objects.filter(Q(user=self.request.user) | Q(user__isnull=True)).distinct()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    
class HabitTrackingViewSet(viewsets.ModelViewSet):
    serializer_class = HabitTrackingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # filter by date
        search = self.request.GET.get('search', None)
        if search:
            search = datetime.datetime.strptime(search, '%Y-%m-%d').date()
            return HabitTracking.objects.filter(habit__user=self.request.user,date=search)
        
        return HabitTracking.objects.filter(habit__user=self.request.user)

class JournalEntryViewSet(viewsets.ModelViewSet):
    serializer_class = JournalEntrySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # filter by date
        search = self.request.GET.get('search', None)
        if search:
            search = datetime.datetime.strptime(search, '%Y-%m-%d').date()
            return JournalEntry.objects.filter(user=self.request.user,date=search).order_by("-timestamp")
        return JournalEntry.objects.filter(user=self.request.user).order_by("-timestamp")
    
class KnowledgeHubViewSet(viewsets.ModelViewSet):
    serializer_class = KnowledgeHubSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        search = self.request.GET.get('search', None)
        if search:
            return KnowledgeHub.objects.filter(title__icontains=search)
        return KnowledgeHub.objects.filter()
    
class ArticleViewSet(viewsets.ModelViewSet):
    serializer_class = ArticleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        request = self.request
        search_query = request.GET.get('search', '')
        category_query = request.GET.get('k_id', '')

        if search_query:
            return Article.objects.filter(
                Q(title__icontains=search_query) |
                Q(summary__icontains=search_query) |
                Q(content__icontains=search_query) |
                Q(tags__icontains=search_query)
            ).distinct()

        if category_query:
            return Article.objects.filter(knowledgehub__id=category_query)
        return Article.objects.all()
    

class VisionBoardViewSet(viewsets.ModelViewSet):
    serializer_class = VisionBoardSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return VisionBoard.objects.filter(user=self.request.user)
    


   
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_questionaire_score(request):
    user = request.user
    print(request.data)
    time_taken = timezone.datetime
    test_session = TestSession.objects.create(user=user,date_taken=time_taken,score=0)
    user_responses=[]
    for res in request.data['responses']:
        # question=DiscoveryQuestion.objects.
        user_responses.append(QuestionaireUserResponse(test_session=test_session,question_id=res['question_id'],selected_option=res['selected_option']))
        test_session.score+=res['selected_option']+1
    test_session.save()
    #bulk create user responses
    QuestionaireUserResponse.objects.bulk_create(user_responses)
    print("UserResponses Created",test_session,user_responses)
    return Response({"message": "Questionaire score generated successfully"}, status=status.HTTP_201_CREATED)



