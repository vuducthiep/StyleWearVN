from typing import Any

from pydantic import BaseModel, Field


class SizeDto(BaseModel):
    id: int | None = None
    name: str | None = None


class ProductSizeDto(BaseModel):
    id: int | None = None
    size: SizeDto | None = None
    stock: int | None = None


class CategoryDto(BaseModel):
    id: int | None = None
    name: str | None = None
    description: str | None = None
    status: str | None = None
    createdAt: str | None = None
    updatedAt: str | None = None


class ProductDto(BaseModel):
    id: int
    name: str
    description: str | None = None
    gender: str | None = None
    brand: str | None = None
    material: str | None = None
    color: str | None = None
    price: float
    thumbnail: str | None = None
    status: str | None = None
    createdAt: str | None = None
    updatedAt: str | None = None
    category: CategoryDto | None = None
    productSizes: list[ProductSizeDto] = Field(default_factory=list)


class PageDto(BaseModel):
    content: list[ProductDto] = Field(default_factory=list)
    number: int | None = None
    size: int | None = None
    totalPages: int | None = None
    totalElements: int | None = None
    last: bool | None = None


class ApiResponseDto(BaseModel):
    success: bool
    message: str
    data: Any


class ChatRequest(BaseModel):
    question: str
    top_k: int | None = None
    gender: str | None = None
    category: str | None = None
    brand: str | None = None
    max_price: float | None = None


class RecommendedProduct(BaseModel):
    id: int | None = None
    name: str
    price: float | None = None
    category: str | None = None
    brand: str | None = None
    thumbnail: str | None = None
    score: float | None = None


class ChatResponse(BaseModel):
    answer: str
    products: list[RecommendedProduct] = Field(default_factory=list)
    source_count: int = 0


class ReindexResponse(BaseModel):
    indexed_products: int
    vector_store_dir: str
