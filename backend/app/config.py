from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    mongodb_uri: str
    database_name: str
    frontend_url: str
    environment: str = "development"
    jwt_access_secret: str = "supersecret_access"
    jwt_refresh_secret: str = "supersecret_refresh"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7
    
    # Cloudinary
    cloudinary_cloud_name: str = ""
    cloudinary_api_key: str = ""
    cloudinary_api_secret: str = ""
    max_upload_size_mb: int = 10

    @property
    def get_jwt_access_secret(self) -> str:
        return self.jwt_access_secret if self.jwt_access_secret else "supersecret_access"
        
    @property
    def get_jwt_refresh_secret(self) -> str:
        return self.jwt_refresh_secret if self.jwt_refresh_secret else "supersecret_refresh"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
