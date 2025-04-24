from django.db import models
from authentication_app.models import User
from django.utils import timezone

class DiscoveryQuestion(models.Model):
    text = models.TextField()

    def __str__(self):
        return self.text

class TestSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    score = models.IntegerField(default=None,null=True,blank=True)
    date_taken = models.DateTimeField(auto_now_add=True)


    def __str__(self):
        return f"Test for {self.user.username} on {self.date_taken}"
    
    def calculate_score(self):
        """Calculate the score based on the user's responses."""
        responses = QuestionaireUserResponse.objects.filter(test_session=self)
        total_score = sum(response.get_numeric_score() for response in responses)
        return total_score

    def update_score(self):
        """Update the score field for the test session."""
        self.score = self.calculate_score()
        self.save()

class QuestionaireUserResponse(models.Model):
    LIKERT_CHOICES = [
        ('1', 'Disagree'),
        ('2', 'Somewhat Disagree'),
        ('3', 'Neither Agree nor Disagree'),
        ('4', 'Somewhat Agree'),
        ('5', 'Agree'),
    ]

    test_session = models.ForeignKey(TestSession, related_name='responses', on_delete=models.CASCADE)
    question = models.ForeignKey(DiscoveryQuestion, on_delete=models.CASCADE)
    selected_option = models.CharField(max_length=1, choices=LIKERT_CHOICES)

    def get_numeric_score(self):
        """Return the numeric value corresponding to the selected option."""
        score_map = {
            '1': 1,  # Disagree
            '2': 2,  # Somewhat Disagree
            '3': 3,  # Neither Agree nor Disagree
            '4': 4,  # Somewhat Agree
            '5': 5,  # Agree
        }
        return score_map.get(self.selected_option, 1)

    def __str__(self):
        return f"{self.test_session.user.username} - {self.question.text} - {self.get_selected_option_display()}"
    

class Habits(models.Model):
    habit = models.CharField(max_length=255)
    user = models.ForeignKey(User,on_delete=models.CASCADE,null=True,blank=True)
    description = models.TextField()

    def __str__(self):
        return f" {self.habit}"
    
class HabitTracking(models.Model):
    habit = models.ForeignKey(Habits,on_delete=models.CASCADE)
    date = models.DateField(default=timezone.now)
    is_done = models.BooleanField(default=False)
    user = models.ForeignKey(User,on_delete=models.CASCADE,null=True,blank=True)



    def __str__(self):
        return f" {self.habit.habit}"


class JournalEntry(models.Model):
    MOOD_CHOICES = [
        ("Happy", "Happy"),
        ("Sad", "Sad"),
        ("Neutral", "Neutral"),
        ("Excited", "Excited"),
        ("Stressed", "Stressed"),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    date = models.DateField(default=timezone.now)
    timestamp = models.DateTimeField(auto_now_add=True) 
    mood = models.CharField(max_length=10, choices=MOOD_CHOICES, default="neutral")
    content = models.TextField()

    def __str__(self):
        return f"Journal ({self.mood}) by {self.user} on {self.date} at {self.timestamp.time()}"

class KnowledgeHubCategory(models.TextChoices):
    MINDFULNESS_TECHNIQUES = "Mindfulness Techniques"
    EMOTIONAL_RESILIENCE = "Emotional Resilience"
    SELF_AWARENESS = "Self-Awareness"
    PERSONAL_GROWTH = "Personal Growth"
    COMMUNITY_STORIES = "Community Stories"


class KnowledgeHub(models.Model): # Also knows as article
    content = models.TextField()
    date_added = models.DateField(auto_now_add=True)
    level = models.IntegerField(default=1)
    image_url = models.URLField()
    title = models.CharField(choices=KnowledgeHubCategory.choices, max_length=255)

    def __str__(self):
        return self.title
    
    
class Article(models.Model):
    title = models.CharField(max_length=255)
    summary=models.TextField()
    reflective_question_1 = models.CharField(max_length=300,null=True,blank=True)
    reflective_question_2 = models.CharField(max_length=300,null=True,blank=True)
    content = models.TextField()
    date_added = models.DateField(auto_now_add=True)
    level = models.IntegerField(default=1)
    image_url = models.URLField()
    knowledgehub = models.ForeignKey(KnowledgeHub,null=True,on_delete=models.SET_NULL)
    tags = models.CharField(max_length=300,null=True,blank=True)

    def __str__(self):
        return self.title

    


class VisionBoardCategory(models.TextChoices):
    QUOTE = "Quote"
    AFFIRMATION = "Affirmation"
    GOAL = "Goal"
    CBT= "CBT"
    WIN="Win"

class VisionBoard(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    category = models.CharField(choices=VisionBoardCategory.choices, max_length=255)
    favorite = models.BooleanField(default=False)


    def __str__(self):
        return f"Vision Board by {self.user.username}"
