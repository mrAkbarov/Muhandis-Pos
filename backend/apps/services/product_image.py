from io import BytesIO

from django.core.files.base import ContentFile
from PIL import Image


def save_product_image_as_webp(product, uploaded_file):
    img = Image.open(uploaded_file)

    if img.mode in ("RGBA", "LA", "P"):
        background = Image.new("RGB", img.size, (255, 255, 255))
        background.paste(
            img,
            mask=img.split()[-1] if len(img.split()) > 3 else None,
        )
        img = background
    else:
        img = img.convert("RGB")

    target_size = (600, 600)

    img.thumbnail(target_size, Image.Resampling.LANCZOS)

    canvas = Image.new("RGB", target_size, (255, 255, 255))

    x = (target_size[0] - img.width) // 2
    y = (target_size[1] - img.height) // 2

    canvas.paste(img, (x, y))

    buf = BytesIO()

    canvas.save(
        buf,
        format="WEBP",
        quality=85,
        optimize=True,
    )

    buf.seek(0)

    if product.image:
        product.image.delete(save=False)

    product.image.save(
        f"product_{product.pk}.webp",
        ContentFile(buf.read()),
        save=True,
    )

    return product