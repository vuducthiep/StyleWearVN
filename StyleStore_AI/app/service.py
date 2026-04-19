from __future__ import annotations

from typing import Any

from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate
from langchain_community.chat_models import ChatOllama
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI

from .config import Settings
from .vectorstore import get_vectorstore


def get_llm(settings: Settings):
    provider = settings.llm_provider.strip().lower()

    if provider == "ollama":
        return ChatOllama(model=settings.llm_model, base_url=settings.ollama_base_url, temperature=0.2)

    if provider == "gemini":
        return ChatGoogleGenerativeAI(
            model=settings.llm_model,
            google_api_key=settings.gemini_api_key,
            temperature=0.2,
        )

    if provider == "openai":
        return ChatOpenAI(
            model=settings.llm_model,
            temperature=0.2,
            api_key=settings.openai_api_key,
            base_url=settings.openai_base_url,
        )

    raise ValueError(f"Unsupported LLM provider: {settings.llm_provider}")


def _product_from_metadata(metadata: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": metadata.get("product_id"),
        "name": metadata.get("name"),
        "price": metadata.get("price"),
        "category": metadata.get("category"),
        "brand": metadata.get("brand"),
        "thumbnail": metadata.get("thumbnail"),
    }


def answer_question(
    settings: Settings,
    question: str,
    top_k: int,
    gender: str | None = None,
    category: str | None = None,
    brand: str | None = None,
    max_price: float | None = None,
) -> tuple[str, list[dict[str, Any]], int]:
    vectorstore = get_vectorstore(settings)
    search_kwargs: dict[str, Any] = {"k": max(top_k * 3, top_k)}

    metadata_filter: dict[str, Any] = {}
    if gender:
        metadata_filter["gender"] = gender
    if category:
        metadata_filter["category"] = category
    if brand:
        metadata_filter["brand"] = brand
    if metadata_filter:
        search_kwargs["filter"] = metadata_filter

    retriever = vectorstore.as_retriever(search_kwargs=search_kwargs)

    llm = get_llm(settings)
    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "You are a fashion retail assistant for StyleStore. Answer in Vietnamese. "
                "Use only the provided product context. If the context is insufficient, ask a short clarifying question. "
                "Prefer practical recommendations based on price, gender, category, brand, material, color, and stock.",
            ),
            (
                "human",
                "Question: {input}\n\nProduct context:\n{context}",
            ),
        ]
    )

    combine_docs_chain = create_stuff_documents_chain(llm, prompt)
    retrieval_chain = create_retrieval_chain(retriever, combine_docs_chain)
    constraints = []
    if gender:
        constraints.append(f"gender={gender}")
    if category:
        constraints.append(f"category={category}")
    if brand:
        constraints.append(f"brand={brand}")
    if max_price is not None:
        constraints.append(f"max_price={max_price}")

    input_text = question
    if constraints:
        input_text = f"{question}\n\nConstraints: {', '.join(constraints)}"

    result = retrieval_chain.invoke({"input": input_text})

    docs = result.get("context", [])
    products = []
    seen_ids: set[int] = set()
    for doc in docs:
        metadata = doc.metadata or {}
        price = metadata.get("price")
        if max_price is not None and isinstance(price, (int, float)) and price > max_price:
            continue
        product_id = metadata.get("product_id")
        if product_id in seen_ids:
            continue
        seen_ids.add(product_id)
        products.append(_product_from_metadata(metadata))

    return result.get("answer", ""), products, len(docs)
