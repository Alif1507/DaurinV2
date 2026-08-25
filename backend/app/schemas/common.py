from typing import Generic, TypeVar

from pydantic import BaseModel, Field


T = TypeVar("T")


class SingleResponse(BaseModel, Generic[T]):
    data: T
    message: str = "Success"


class PaginationMeta(BaseModel):
    page: int = Field(ge=1)
    limit: int = Field(ge=1, le=100)
    total: int = Field(ge=0)
    total_pages: int = Field(ge=0)


class CollectionResponse(BaseModel, Generic[T]):
    data: list[T]
    meta: PaginationMeta


class ListResponse(BaseModel, Generic[T]):
    data: list[T]
    message: str = "Success"
