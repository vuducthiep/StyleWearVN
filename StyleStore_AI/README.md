# StyleStore AI Service

Python microservice for product consultation using RAG and LangChain.

## What it does

- Pulls active products from the existing Spring Boot API
- Builds a persistent vector index for retrieval
- Answers customer questions in Vietnamese
- Returns matched products alongside the answer

## Stack

- FastAPI
- LangChain
- ChromaDB
- Hugging Face embeddings by default
- Gemini, OpenAI, or Ollama as the chat model provider

## Setup

1. Create a virtual environment and install dependencies:

```bash
pip install -r requirements.txt
```

2. Copy `.env.example` to `.env` and adjust values.

3. Make sure the Spring Boot backend is running at the configured `API_BASE_URL`.

4. Start the service:

```bash
uvicorn app.main:app --reload --port 8001
```

## API

### `POST /chat`

Request body:

```json
{
  "question": "Tui nên mua áo nào cho nam, giá dưới 500k?",
  "top_k": 4
}
```

Response:

```json
{
  "answer": "...",
  "products": [
    {
      "id": 12,
      "name": "...",
      "price": 450000,
      "category": "...",
      "brand": "...",
      "thumbnail": "...",
      "score": 0.81
    }
  ]
}
```

### `POST /reindex`

Rebuilds the vector index from the backend catalog.
