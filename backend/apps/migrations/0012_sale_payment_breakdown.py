from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('apps', '0011_remove_customer_merge_credit'),
    ]

    operations = [
        migrations.AddField(
            model_name='sale',
            name='payment_breakdown',
            field=models.JSONField(blank=True, default=dict, verbose_name="Aralash to'lov (Naqd/Karta/Online)"),
        ),
    ]
