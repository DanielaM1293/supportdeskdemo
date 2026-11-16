"""Small helpers shared across modules (no model imports to avoid cycles)."""

from datetime import UTC, datetime

from flask import request


def utcnow() -> datetime:
    return datetime.now(UTC)


def iso(value: datetime | None) -> str | None:
    """Serialize a datetime as ISO 8601 in UTC with a trailing Z."""
    if value is None:
        return None
    if value.tzinfo is None:
        value = value.replace(tzinfo=UTC)
    return value.astimezone(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")


class ApiError(Exception):
    """Raised by route code; turned into a JSON {"error": ...} response."""

    def __init__(self, message: str, status: int = 400):
        super().__init__(message)
        self.message = message
        self.status = status


def json_body() -> dict:
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        raise ApiError("Invalid JSON body", 400)
    return data
