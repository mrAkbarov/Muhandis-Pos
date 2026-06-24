from django.core.management.base import BaseCommand

from apps.models import Product
from apps.services.product_image import save_product_image_as_webp


class Command(BaseCommand):
    help = "Convert all product images to WEBP and normalize size"

    def handle(self, *args, **options):
        products = Product.objects.exclude(image="").exclude(image__isnull=True)

        total = products.count()

        self.stdout.write(
            self.style.SUCCESS(f"Found {total} products with images")
        )

        converted = 0

        for product in products.iterator(chunk_size=100):
            try:
                with product.image.open("rb") as f:
                    save_product_image_as_webp(product, f)

                converted += 1

                self.stdout.write(
                    f"[{converted}/{total}] Converted: {product.name}"
                )

            except Exception as exc:
                self.stdout.write(
                    self.style.ERROR(
                        f"Failed: {product.name} -> {exc}"
                    )
                )

        self.stdout.write(
            self.style.SUCCESS(
                f"Done. Converted {converted} images."
            )
        )