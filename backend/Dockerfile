# syntax=docker/dockerfile:1
# SpecGate backend + the ADOM pipeline in one image.
# ADOM is copied from a local checkout of spec-gate (branch cleanup-scripts), passed by compose.yaml as the
# named build context "spec_gate". The repo is private, so the image does not git-clone it.
# The pipeline executes LLM-written code without a sandbox; this container is the isolation boundary.

FROM python:3.14-slim

# Only what the pipeline reads at run time. Nothing else from the checkout (.env, .llm_cache/, runs/) enters
# the image, so a stray adom/.env with API keys can never be baked in.
COPY --from=spec_gate adom/pyproject.toml /opt/spec-gate/adom/pyproject.toml
COPY --from=spec_gate adom/src /opt/spec-gate/adom/src
COPY --from=spec_gate adom/config /opt/spec-gate/adom/config
COPY --from=spec_gate adom/tests/fixtures /opt/spec-gate/adom/tests/fixtures
# Editable install: ADOM_DIR is that adom/ folder (config/ and tests/fixtures/ live there).
RUN --mount=type=cache,target=/root/.cache/pip pip install --default-timeout=300 --retries=10 -e "/opt/spec-gate/adom[llm]"

WORKDIR /app
COPY pyproject.toml README.md ./
COPY app ./app
RUN --mount=type=cache,target=/root/.cache/pip pip install --default-timeout=300 --retries=10 .

# The pipeline writes .llm_cache/ into its working directory (ADOM_DIR), so app owns that folder too.
RUN useradd --create-home --uid 10001 app \
    && mkdir -p /data/runs \
    && chown -R app:app /data /opt/spec-gate
USER app

ENV PYTHONUTF8=1 \
    PYTHONUNBUFFERED=1 \
    ADOM_DIR=/opt/spec-gate/adom \
    RUNS_DIR=/data/runs \
    DATABASE_URL=sqlite:////data/specgate.db

# Run directories, the SQLite file and the HumanEval+ download cache (~/.cache/adom-datasets).
VOLUME ["/data", "/home/app/.cache"]
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
