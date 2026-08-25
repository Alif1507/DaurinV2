from datetime import date

from app.core.exceptions import AppError


def validate_date_range(start_date: date | None, end_date: date | None) -> None:
    if start_date and end_date and start_date > end_date:
        raise AppError("INVALID_DATE_RANGE", "start_date must be before or equal to end_date", 422)
