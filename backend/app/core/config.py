from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "OncoVision AI"
    environment: str = "development"
    database_url: str = "sqlite:///./oncovision.db"
    jwt_secret: str = Field(default="dev-secret-change-me")
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440
    storage_root: str = "storage"
    cors_origins: list[str] = ["http://localhost:3000"]
    google_client_id: str | None = None
    openai_api_key: str | None = None
    openai_model: str = "gpt-5.5"
    openai_timeout_seconds: float = 30.0

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
