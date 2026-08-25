from enum import StrEnum


class Role(StrEnum):
    STUDENT = "student"
    TEACHER = "teacher"
    STAFF = "staff"
    ADMIN = "admin"


class ProblemType(StrEnum):
    FULL_BIN = "full_bin"
    SCATTERED_WASTE = "scattered_waste"
    MIXED_WASTE = "mixed_waste"
    DIRTY_AREA = "dirty_area"
    DAMAGED_BIN = "damaged_bin"
    OTHER = "other"


class ReportStatus(StrEnum):
    REPORTED = "reported"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"


class WasteCategory(StrEnum):
    ORGANIC = "organic"
    INORGANIC = "inorganic"
    RESIDUAL = "residual"


class TrendPeriod(StrEnum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
