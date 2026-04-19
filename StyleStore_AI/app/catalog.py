from __future__ import annotations

from dataclasses import dataclass

import httpx

from .config import Settings
from .schemas import ApiResponseDto, PageDto, ProductDto


@dataclass(slots=True)
class CatalogDocument:
    product: ProductDto
    text: str


def _format_size_summary(product: ProductDto) -> str:
    sizes: list[str] = []
    for item in product.productSizes:
        size_name = item.size.name if item.size and item.size.name else None
        stock = item.stock if item.stock is not None else 0
        if size_name:
            sizes.append(f"{size_name}:{stock}")
    return ", ".join(sizes) if sizes else "unknown"


def build_product_text(product: ProductDto) -> str:
    category_name = product.category.name if product.category and product.category.name else "unknown"
    return (
        f"Product: {product.name}\n"
        f"Category: {category_name}\n"
        f"Gender: {product.gender or 'unknown'}\n"
        f"Brand: {product.brand or 'unknown'}\n"
        f"Material: {product.material or 'unknown'}\n"
        f"Color: {product.color or 'unknown'}\n"
        f"Price: {product.price}\n"
        f"Sizes: {_format_size_summary(product)}\n"
        f"Description: {product.description or 'No description'}"
    )


async def fetch_all_products(settings: Settings) -> list[CatalogDocument]:
    results: list[CatalogDocument] = []
    page = 0

    async with httpx.AsyncClient(base_url=settings.api_base_url, timeout=30.0) as client:
        while len(results) < settings.max_products:
            response = await client.get(
                settings.api_products_path,
                params={"page": page, "size": settings.api_page_size, "sortBy": "createdAt", "sortDir": "desc"},
            )
            response.raise_for_status()

            payload = ApiResponseDto.model_validate(response.json())
            page_data = PageDto.model_validate(payload.data)

            for product in page_data.content:
                results.append(CatalogDocument(product=product, text=build_product_text(product)))
                if len(results) >= settings.max_products:
                    break

            if page_data.last is True or not page_data.content:
                break

            page += 1

    return results
