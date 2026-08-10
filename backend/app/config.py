from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    mongodb_uri: str
    database_name: str
    frontend_url: str
    environment: str = "development"
    jwt_access_secret: str = "supersecret_access" # Default for local dev if missing, but should be set in .env
    jwt_refresh_secret: str = "supersecret_refresh"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
