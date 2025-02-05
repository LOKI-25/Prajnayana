from django.db import models
from authentication_app.models import User

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
        return score_map.get(self.selected_option, 0)

    def __str__(self):
        return f"{self.test_session.user.username} - {self.question.text} - {self.get_selected_option_display()}"
