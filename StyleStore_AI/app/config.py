from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    api_base_url: str = "http://localhost:8080"
    api_products_path: str = "/api/user/products"
    api_page_size: int = 100

    vector_store_dir: str = "data/chroma"
    top_k: int = 4
    max_products: int = 5000

    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"

    llm_provider: str = "openai"
    llm_model: str = "gpt-4o-mini"
    openai_api_key: str | None = None
    openai_base_url: str | None = None
    gemini_api_key: str | None = None
    ollama_base_url: str = "http://localhost:11434"


settings = Settings()
