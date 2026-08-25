import math

from app.schemas.common import PaginationMeta


def pagination_range(page: int, limit: int) -> tuple[int, int]:
    start = (page - 1) * limit
    return start, start + limit - 1


def pagination_meta(page: int, limit: int, total: int) -> PaginationMeta:
    return PaginationMeta(
        page=page,
        limit=limit,
        total=total,
        total_pages=math.ceil(total / limit) if total else 0,
    )
