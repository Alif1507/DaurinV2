from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator


Weight = Decimal


class WasteRecordCreate(BaseModel):
    location_id: UUID
    record_date: date
    organic_weight: Weight = Field(default=Decimal("0"), ge=0, max_digits=10, decimal_places=2)
    inorganic_weight: Weight = Field(default=Decimal("0"), ge=0, max_digits=10, decimal_places=2)
    residual_weight: Weight = Field(default=Decimal("0"), ge=0, max_digits=10, decimal_places=2)
    notes: str | None = Field(default=None, max_length=500)

    @model_validator(mode="after")
    def validate_non_zero_weight(self) -> "WasteRecordCreate":
        if self.organic_weight <= 0 and self.inorganic_weight <= 0 and self.residual_weight <= 0:
            raise ValueError("At least one waste weight must be greater than zero")
        return self


class WasteRecordUpdate(BaseModel):
    location_id: UUID | None = None
    record_date: date | None = None
    organic_weight: Weight | None = Field(default=None, ge=0, max_digits=10, decimal_places=2)
    inorganic_weight: Weight | None = Field(default=None, ge=0, max_digits=10, decimal_places=2)
    residual_weight: Weight | None = Field(default=None, ge=0, max_digits=10, decimal_places=2)
    notes: str | None = Field(default=None, max_length=500)


class WasteRecordOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    location_id: UUID
    recorded_by: UUID
    record_date: date
    organic_weight: float
    inorganic_weight: float
    residual_weight: float
    notes: str | None = None
    created_at: datetime
    updated_at: datetime
