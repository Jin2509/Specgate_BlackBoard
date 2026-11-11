"""Error body of the contract: `{ "error": string, "code"?: string }` for every non-2xx response."""

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException


class ApiError(Exception):
    def __init__(self, status: int, error: str, code: str | None = None):
        self.status, self.error, self.code = status, error, code


def engine_not_configured(reason: str) -> ApiError:
    """501 for features that need an engine (LLM / Z3 / interactive pipeline) the backend does not have."""
    return ApiError(501, reason, "ENGINE_NOT_CONFIGURED")


def _body(error: str, code: str | None) -> dict:
    return {"error": error, "code": code} if code else {"error": error}


def _describe(exc: RequestValidationError) -> str:
    parts = []
    for err in exc.errors():
        loc = ".".join(str(p) for p in err.get("loc", ()) if p not in ("body", "query", "path"))
        parts.append(f"{loc}: {err.get('msg')}" if loc else str(err.get("msg")))
    return "Dữ liệu không hợp lệ: " + "; ".join(parts)


def install(app: FastAPI) -> None:
    @app.exception_handler(ApiError)
    async def _api_error(_: Request, exc: ApiError) -> JSONResponse:
        return JSONResponse(_body(exc.error, exc.code), status_code=exc.status)

    @app.exception_handler(StarletteHTTPException)
    async def _http_error(_: Request, exc: StarletteHTTPException) -> JSONResponse:
        return JSONResponse(_body(str(exc.detail), None), status_code=exc.status_code, headers=exc.headers)

    # The contract uses 400 for malformed bodies and queries.
    @app.exception_handler(RequestValidationError)
    async def _validation_error(_: Request, exc: RequestValidationError) -> JSONResponse:
        return JSONResponse(_body(_describe(exc), "VALIDATION_ERROR"), status_code=400)
