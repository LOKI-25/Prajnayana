# Generated by Django 4.2.17 on 2025-04-19 19:25

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('prajnayana_dashboard', '0009_remove_knowledgehub_category_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='habits',
            name='user',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL),
        ),
    ]
