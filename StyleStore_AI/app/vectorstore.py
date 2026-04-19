from __future__ import annotations

from pathlib import Path

from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document

from .catalog import CatalogDocument
from .config import Settings


def get_embeddings(settings: Settings) -> HuggingFaceEmbeddings:
    return HuggingFaceEmbeddings(model_name=settings.embedding_model)


def get_vectorstore(settings: Settings) -> Chroma:
    Path(settings.vector_store_dir).mkdir(parents=True, exist_ok=True)
    return Chroma(
        collection_name="stylestore_products",
        persist_directory=settings.vector_store_dir,
        embedding_function=get_embeddings(settings),
    )


def _sanitize_metadata(raw: dict) -> dict:
    sanitized: dict = {}
    for key, value in raw.items():
        if value is None:
            continue
        if isinstance(value, (str, int, float, bool)):
            sanitized[key] = value
    return sanitized


def rebuild_vectorstore(settings: Settings, catalog: list[CatalogDocument]) -> int:
    vectorstore = get_vectorstore(settings)
    try:
        vectorstore.delete_collection()
    except Exception:
        pass
    vectorstore = get_vectorstore(settings)

    documents: list[Document] = []
    ids: list[str] = []

    for item in catalog:
        category_name = item.product.category.name if item.product.category and item.product.category.name else None
        metadata = _sanitize_metadata(
            {
                "product_id": item.product.id,
                "name": item.product.name,
                "category": category_name,
                "gender": item.product.gender,
                "brand": item.product.brand,
                "price": item.product.price,
                "thumbnail": item.product.thumbnail,
            }
        )
        documents.append(
            Document(
                page_content=item.text,
                metadata=metadata,
            )
        )
        ids.append(str(item.product.id))

    if documents:
        vectorstore.add_documents(documents=documents, ids=ids)

    return len(documents)
