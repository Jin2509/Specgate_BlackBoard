"""Engine of the chat page (POST /api/run, /api/run/followup): spec LLM writes a spec, code LLM writes code,
then the two are checked against each other.

ADOM (spec-gate, branch cleanup-scripts) only has the batch commands `setup`, `admit` and `run`; it has no
command that takes one task and returns a verdict plus at most one question. Until it does, `available()` is
False and the routes answer 501 ENGINE_NOT_CONFIGURED without touching the database.

An engine yields the SSE events of api.md section 0 as dicts, in order:
    {"event": "step", "data": {"step": "spec" | "code" | "check", "status": "running"}}
    {"event": "step", "data": {"step": ..., "status": "done", "output": str, "durationMs": float}}
    {"event": "verdict", "data": {"verdict": "consistent" | "spec_fault" | "code_fault" | "unknown",
                                  "reason": str, "question"?: str}}       # last event
It raises on failure; the route turns that into an `error` event. API keys arrive as plain strings only
here, are passed to the LLM client (or the ADOM child process env) and are never stored or logged.
"""

from collections.abc import Iterator
from dataclasses import dataclass, field
from typing import Any

ChatEvent = dict[str, Any]


@dataclass(frozen=True)
class Llm:
    provider: str
    model: str
    api_key: str = field(repr=False)


def available() -> bool:
    """True once a chat engine is wired in; the routes return 501 while this is False."""
    return False


def run_first(task: dict[str, Any], spec_llm: Llm, code_llm: Llm) -> Iterator[ChatEvent]:
    """First round: steps spec, code, check, then the verdict (with `question` only when it is unknown)."""
    raise NotImplementedError("Chưa có engine Hỏi đáp.")


def run_followup(task: dict[str, Any], spec_llm: Llm, spec: str, code: str, answer: str) -> Iterator[ChatEvent]:
    """The single follow-up: step check, then the final verdict (never with `question`)."""
    raise NotImplementedError("Chưa có engine Hỏi đáp.")
