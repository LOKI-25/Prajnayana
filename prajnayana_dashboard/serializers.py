from rest_framework import serializers
from .models import *

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
        if QuestionaireUserResponse.objects.filter(test_session=test_session, question=attrs['question']).exists():
            raise serializers.ValidationError("Response for this question already exists.")
        return attrs

    def create(self, validated_data):
        res = QuestionaireUserResponse.objects.create(**validated_data)
        res.test_session.update_score()
        return res