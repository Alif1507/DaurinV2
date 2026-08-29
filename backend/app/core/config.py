from functools import lru_cache
from typing import Literal

from pydantic import Field, SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "Daurin API"
    app_env: Literal["development", "test", "production"] = "development"
    api_v1_prefix: str = "/api/v1"
    frontend_origin: str = "http://localhost:5173"

    supabase_url: str = ""
    supabase_anon_key: SecretStr = SecretStr("")
    supabase_service_role_key: SecretStr = SecretStr("")

    report_image_bucket: str = "report-images"
    max_upload_mb: int = Field(default=5, ge=1, le=25)
    signed_url_ttl_seconds: int = Field(default=3600, ge=60, le=86400)

    dashboard_default_days: int = Field(default=30, ge=1, le=365)
    dashboard_max_range_days: int = Field(default=365, ge=1, le=1095)

    camide_model_path: str = "app/ml/models/waste_classifier.onnx"
    camide_model_profile: Literal["camide_4class", "recylo_10class"] = "camide_4class"
    camide_model_labels: str = "organic,inorganic,b3,residual"
    camide_confidence_threshold: float = Field(default=0.55, ge=0, le=1)
    camide_model_version: str = "camide-v1"
    camide_mock_classifier: bool = False
    camide_store_images: bool = False
    camide_image_bucket: str = "waste-identification-images"
    camide_max_dimension: int = Field(default=6000, ge=224, le=12000)

    @field_validator("api_v1_prefix")
    @classmethod
    def validate_api_prefix(cls, value: str) -> str:
        value = value.rstrip("/")
        if not value.startswith("/"):
            raise ValueError("API_V1_PREFIX must start with '/'")
        return value

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.frontend_origin.split(",") if origin.strip()]

    @property
    def max_upload_bytes(self) -> int:
        return self.max_upload_mb * 1024 * 1024

    @property
    def supabase_configured(self) -> bool:
        return bool(
            self.supabase_url
            and self.supabase_anon_key.get_secret_value()
            and self.supabase_service_role_key.get_secret_value()
        )

    @property
    def camide_labels(self) -> list[str]:
        labels = [label.strip() for label in self.camide_model_labels.split(",") if label.strip()]
        expected = ["organic", "inorganic", "b3", "residual"]
        if sorted(labels) != sorted(expected) or len(labels) != len(expected):
            raise ValueError("CAMIDE_MODEL_LABELS must contain organic,inorganic,b3,residual exactly once")
        return labels


@lru_cache
def get_settings() -> Settings:
    return Settings()
