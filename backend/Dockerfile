# syntax=docker/dockerfile:1
# Builds the SpecGate Workspace backend image (FastAPI + SQLite on the /data volume).

FROM python:3.14-slim

WORKDIR /app
COPY pyproject.toml README.md ./
COPY app ./app
RUN --mount=type=cache,target=/root/.cache/pip pip install --default-timeout=300 --retries=10 .

RUN useradd --create-home --uid 10001 app \
    && mkdir -p /data \
    && chown -R app:app /data
USER app

ENV PYTHONUTF8=1 \
    PYTHONUNBUFFERED=1 \
    DATABASE_URL=sqlite:////data/specgate.db

# The SQLite file lives here so it survives a rebuild.
VOLUME ["/data"]
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
