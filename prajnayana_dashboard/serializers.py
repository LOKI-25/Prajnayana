from rest_framework import serializers
from .models import *
from authentication_app.serializers import UserSerializer

class DiscoveryQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = DiscoveryQuestion
        fields = ['id', 'text']

class TestSessionSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()
    date_taken = serializers.DateTimeField(format="%Y-%m-%d %H:%M:%S", read_only=True)
    score = serializers.IntegerField(required=False) 

    class Meta:
        model = TestSession
        fields = ['id', 'user', 'score', 'date_taken']

    def validate(self, attrs):
        score = attrs.get('score', None)
        
        if score is not None and score < 0:
            raise serializers.ValidationError("Score must be a positive number.")
        return attrs

class QuestionaireUserResponseSerializer(serializers.ModelSerializer):
    question = DiscoveryQuestionSerializer(read_only=True)
    question_id = serializers.CharField(write_only=True)  
    selected_option = serializers.CharField(source='get_selected_option_display') 

    class Meta:
        model = QuestionaireUserResponse
        fields = ['id', 'test_session', 'question','question_id', 'selected_option']

    def validate(self, attrs):
        test_session = attrs.get('test_session')
        question_id = attrs.pop('question_id')
        attrs['question'] = DiscoveryQuestion.objects.get(id=question_id)
        if test_session and QuestionaireUserResponse.objects.filter(test_session=test_session, question=attrs['question']).exists():
            raise serializers.ValidationError("Response for this question already exists.")
        return attrs

    def create(self, validated_data):
        res = QuestionaireUserResponse.objects.create(**validated_data)
        res.test_session.update_score()
        return res
    
class HabitsSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()
    
    class Meta:
        model = Habits
        fields = ['id', 'habit','description' ,'user']

class HabitTrackingSerializer(serializers.ModelSerializer):
    habit_id = serializers.IntegerField(write_only=True)  
    date = serializers.DateField(format="%Y-%m-%d", required=False)
    user = serializers.StringRelatedField(read_only=True)
    habit = HabitsSerializer(read_only=True)  

    class Meta:
        model = HabitTracking
        fields = ['id', 'user', 'habit', 'habit_id', 'date', 'is_done']

    def validate(self, attrs):
        habit_id = attrs.pop("habit_id")  
        habit = Habits.objects.filter(id=habit_id).first()  

        if not habit:
            raise serializers.ValidationError("Habit not found.")

        if habit.user != self.context["request"].user:
            raise serializers.ValidationError("You can only track habits that belong to you.")

        attrs["habit"] = habit
        return attrs

    def create(self, validated_data):
        return super().create(validated_data)
    

class JournalEntrySerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()
    date = serializers.DateField(format="%Y-%m-%d", required=False)
    class Meta:
        model = JournalEntry
        fields = ["id", "user", "date", "timestamp", "mood", "content"]
        read_only_fields = ["user", "timestamp"]

    def validate(self, attrs):
        attrs['user'] = self.context["request"].user
        return attrs

    
class KnowledgeHubSerializer(serializers.ModelSerializer):
    class Meta:
        model = KnowledgeHub
        fields = '__all__'


        
class ArticleSerializer(serializers.ModelSerializer):
    knowledgehub = KnowledgeHubSerializer(read_only=True)

    class Meta:
        model = Article
        fields = '__all__'

class VisionBoardSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    class Meta:
        model = VisionBoard
        fields = '__all__'
        extra_kwargs = {'user': {'required': False}}

    def validate(self, attrs):
        if attrs.get('category') not in VisionBoardCategory.choices:
            raise serializers.ValidationError("Invalid category.")
        attrs['user'] = self.context["request"].user
        return attrs





    
    
