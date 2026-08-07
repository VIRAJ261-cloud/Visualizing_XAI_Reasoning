from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    AI_API_KEY: str

    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str

    JWT_SECRET: str

    model_config = SettingsConfigDict(
        env_file="../../../.env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()