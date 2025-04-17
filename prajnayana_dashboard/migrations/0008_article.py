# Generated by Django 4.2.17 on 2025-04-17 00:38

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('prajnayana_dashboard', '0007_visionboard_favorite'),
    ]

    operations = [
        migrations.CreateModel(
            name='Article',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=255)),
                ('summary', models.TextField()),
                ('reflective_question_1', models.CharField(blank=True, max_length=300, null=True)),
                ('reflective_question_2', models.CharField(blank=True, max_length=300, null=True)),
                ('content', models.TextField()),
                ('date_added', models.DateField(auto_now_add=True)),
                ('level', models.IntegerField(default=1)),
                ('image_url', models.URLField()),
                ('tags', models.CharField(blank=True, max_length=300, null=True)),
                ('knowledgehub', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='prajnayana_dashboard.knowledgehub')),
            ],
        ),
    ]
