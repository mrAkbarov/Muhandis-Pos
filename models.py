from datetime import datetime


class Product:
    id: int
    title: str
    price: float
    discount_price: float
    quantity: int
    description: str
    updated_at: datetime
    created_at: datetime
