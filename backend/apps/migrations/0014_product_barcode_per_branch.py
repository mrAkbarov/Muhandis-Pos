from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('apps', '0013_sale_payment_breakdown'),
    ]

    operations = [
        migrations.AlterField(
            model_name='product',
            name='barcode',
            field=models.CharField(blank=True, max_length=14, verbose_name='Shtrix-kod'),
        ),
        migrations.AddConstraint(
            model_name='product',
            constraint=models.UniqueConstraint(
                condition=models.Q(('barcode__gt', '')),
                fields=('branch', 'barcode'),
                name='unique_product_barcode_per_branch',
            ),
        ),
    ]
