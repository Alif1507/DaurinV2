from enum import StrEnum
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class CamideCategory(StrEnum):
    ORGANIC = "organic"
    INORGANIC = "inorganic"
    B3 = "b3"
    RESIDUAL = "residual"


class CamidePrediction(BaseModel):
    category: CamideCategory
    label: str
    object_key: str
    object_label: str
    object_confidence: float = Field(ge=0, le=1)
    object_is_confident: bool
    examples: list[str]
    disposal_guidance: str
    confidence: float = Field(ge=0, le=1)
    is_confident: bool
    identification_id: UUID


class CamideIdentificationOut(BaseModel):
    id: UUID
    user_id: UUID
    category: CamideCategory
    object_key: str | None = None
    object_label: str | None = None
    confidence: float = Field(ge=0, le=1)
    is_confident: bool
    model_version: str | None = None
    created_at: datetime
