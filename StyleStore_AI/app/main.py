from __future__ import annotations

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .catalog import fetch_all_products
from .config import settings
from .schemas import ChatRequest, ChatResponse, ReindexResponse
from .service import answer_question
from .vectorstore import rebuild_vectorstore


app = FastAPI(title="StyleStore AI Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/reindex", response_model=ReindexResponse)
async def reindex_catalog() -> ReindexResponse:
    try:
        catalog = await fetch_all_products(settings)
        indexed = rebuild_vectorstore(settings, catalog)
        return ReindexResponse(indexed_products=indexed, vector_store_dir=settings.vector_store_dir)
    except Exception as exc:  # pragma: no cover - surfaced to API caller
        raise HTTPException(status_code=500, detail=f"Reindex failed: {exc}") from exc


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    top_k = request.top_k or settings.top_k

    try:
        answer, products, source_count = answer_question(
            settings=settings,
            question=request.question,
            top_k=top_k,
            gender=request.gender,
            category=request.category,
            brand=request.brand,
            max_price=request.max_price,
        )

        # Auto-rebuild index once if retrieval has no sources.
        if source_count == 0:
            catalog = await fetch_all_products(settings)
            if catalog:
                rebuild_vectorstore(settings, catalog)
                answer, products, source_count = answer_question(
                    settings=settings,
                    question=request.question,
                    top_k=top_k,
                    gender=request.gender,
                    category=request.category,
                    brand=request.brand,
                    max_price=request.max_price,
                )
    except Exception as exc:  # pragma: no cover - surfaced to API caller
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return ChatResponse(answer=answer, products=products, source_count=source_count)


@app.on_event("startup")
async def warm_index() -> None:
    try:
        catalog = await fetch_all_products(settings)
        rebuild_vectorstore(settings, catalog)
    except Exception:
        # The service can still start even if the backend is temporarily unavailable.
        pass
