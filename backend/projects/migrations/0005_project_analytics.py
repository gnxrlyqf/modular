from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0004_projectvote'),
    ]

    operations = [
        migrations.AddField(
            model_name='project',
            name='analytics',
            field=models.JSONField(blank=True, default=dict, null=True),
        ),
    ]
