# Generated by Django 5.2.3 on 2025-07-25 23:41

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('account_management', '0005_userprofile'),
    ]

    operations = [
        migrations.AddField(
            model_name='userfiles',
            name='is_upload_complete',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='userfiles',
            name='total_chunks',
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='userfiles',
            name='upload_id',
            field=models.CharField(blank=True, max_length=100, null=True, unique=True),
        ),
        migrations.AddField(
            model_name='userfiles',
            name='uploaded_chunks',
            field=models.IntegerField(default=0),
        ),
        migrations.CreateModel(
            name='FileChunk',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('chunk_number', models.IntegerField()),
                ('chunk_size', models.IntegerField()),
                ('chunk_hash', models.CharField(blank=True, max_length=64, null=True)),
                ('is_uploaded', models.BooleanField(default=False)),
                ('uploaded_at', models.DateTimeField(auto_now_add=True)),
                ('user_file', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='chunks', to='account_management.userfiles')),
            ],
            options={
                'ordering': ['chunk_number'],
                'unique_together': {('user_file', 'chunk_number')},
            },
        ),
    ]
