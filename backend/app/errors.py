"""Defines the error body of every non-2xx response: `{"error": {"code", "message", "details"}}`."""

from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

VALIDATION_STATUS = 400


class ApiError(Exception):
    """An error with an HTTP status, a stable machine code and a human message."""

    def __init__(self, status: int, error: str, code: str | None = None, details: list[Any] | None = None):
        super().__init__(error)
        self.status, self.error, self.code, self.details = status, error, code, details or []


def to_error_body(message: str, code: str | None, details: list[Any] | None = None) -> dict[str, Any]:
    return {"error": {"code": code or "ERROR", "message": message, "details": details or []}}


def _to_http_code(status: int) -> str:
    return f"HTTP_{status}"


def _to_validation_details(exc: RequestValidationError) -> list[dict[str, str]]:
    details = []
    for err in exc.errors():
        field = ".".join(str(part) for part in err.get("loc", ()) if part not in ("body", "query", "path"))
        details.append({"field": field, "message": str(err.get("msg"))})
    return details


def install(app: FastAPI) -> None:
    """Register the handlers that turn every error into the shared error body."""

    @app.exception_handler(ApiError)
    async def _api_error(_: Request, exc: ApiError) -> JSONResponse:
        return JSONResponse(to_error_body(exc.error, exc.code, exc.details), status_code=exc.status)

    @app.exception_handler(StarletteHTTPException)
    async def _http_error(_: Request, exc: StarletteHTTPException) -> JSONResponse:
        body = to_error_body(str(exc.detail), _to_http_code(exc.status_code))
        return JSONResponse(body, status_code=exc.status_code, headers=exc.headers)

    # Malformed bodies and queries answer 400, not FastAPI's default 422.
    @app.exception_handler(RequestValidationError)
    async def _validation_error(_: Request, exc: RequestValidationError) -> JSONResponse:
        details = _to_validation_details(exc)
        message = "; ".join(f"{d['field']}: {d['message']}" if d["field"] else d["message"] for d in details)
        body = to_error_body(f"Invalid request: {message}", "VALIDATION_ERROR", details)
        return JSONResponse(body, status_code=VALIDATION_STATUS)
