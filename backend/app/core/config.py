from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    AI_API_KEY: str = "placeholder-ai-key"

    SUPABASE_URL: str = "https://vdunwgvunhffpdotqjlt.supabase.co"
    SUPABASE_ANON_KEY: str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkdW53Z3Z1bmhmZnBkb3Rxamx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxMjIwMTIsImV4cCI6MjEwMTY5ODAxMn0.pmfIzPk-aRQu3GK9XK4RgQq1vpxOl0QMwqZAxEF4hYI"
    SUPABASE_SERVICE_ROLE_KEY: str = "placeholder-service-role-key"

    JWT_SECRET: str = "super-secret-jwt-key-for-backend-xai-auth"

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env", "../../.env", "backend/.env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()