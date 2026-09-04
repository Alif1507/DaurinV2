from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.schemas.enums import Role


def assignable_role(role: Role | None) -> Role | None:
    if role == Role.ADMIN:
        raise ValueError("Admin cannot be selected as a new role")
    return role


class Profile(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    full_name: str
    email: EmailStr
    role: Role
    is_active: bool
    created_at: datetime | None = None
    updated_at: datetime | None = None


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=2, max_length=150)
    role: Role

    _role_must_be_assignable = field_validator("role")(assignable_role)


class UserUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=150)
    role: Role | None = None
    is_active: bool | None = None

    _role_must_be_assignable = field_validator("role")(assignable_role)


class AuthPublicConfig(BaseModel):
    supabase_url: str
    supabase_anon_key: str
