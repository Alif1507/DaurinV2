from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.enums import WasteCategory


class GuideCreate(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    category: WasteCategory
    description: str | None = Field(default=None, max_length=2000)
    instruction: str = Field(min_length=2, max_length=5000)


class GuideUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=150)
    category: WasteCategory | None = None
    description: str | None = Field(default=None, max_length=2000)
    instruction: str | None = Field(default=None, min_length=2, max_length=5000)
    is_active: bool | None = None


class GuideOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    category: WasteCategory
    description: str | None = None
    instruction: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
