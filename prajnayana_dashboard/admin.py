from django.contrib import admin
from .models import *

# Register your models here.
@admin.register(QuestionaireUserResponse)
class QuestionaireUserResponseAdmin(admin.ModelAdmin):
    pass

@admin.register(DiscoveryQuestion)
class DiscoveryQuestionAdmin(admin.ModelAdmin):
    pass

@admin.register(TestSession)
class TestSessionAdmin(admin.ModelAdmin):
    pass

@admin.register(Habits)
class HabitsAdmin(admin.ModelAdmin):
    pass

@admin.register(HabitTracking)
class HabitTrackingAdmin(admin.ModelAdmin):
    pass


@admin.register(KnowledgeHub)
class KnowledgeHubAdmin(admin.ModelAdmin):
    pass

@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    pass

@admin.register(JournalEntry)
class JournalEntryAdmin(admin.ModelAdmin):
    pass
