# Generated by Django 2.2.9 on 2020-01-24 14:17

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("pootle_translationproject", "0003_realpath_can_be_none"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="translationproject", options={"base_manager_name": "objects"},
        ),
    ]
