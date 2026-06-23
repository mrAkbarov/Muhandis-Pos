from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('apps', '0008_product_image'),
    ]

    operations = [
        migrations.AddField(
            model_name='product',
            name='size',
            field=models.CharField(blank=True, max_length=50),
        ),
        migrations.AddField(
            model_name='product',
            name='unit',
            field=models.CharField(blank=True, default='dona', max_length=20),
        ),
    ]
