# Tests the in-progress request limit: queueing, the busy answer, and permits freed once a response starts.
import asyncio
import json

from app.concurrency import ConcurrencyLimitMiddleware

HTTP_SCOPE = {"type": "http"}


def run(coroutine):
    return asyncio.run(coroutine)


async def _noop_receive():
    return {"type": "http.request"}


def collector():
    messages = []

    async def send(message):
        messages.append(message)

    return messages, send


def test_should_answer_busy_when_no_slot_frees_up_in_time():
    async def scenario():
        release = asyncio.Event()

        async def slow_app(scope, receive, send):
            await release.wait()
            await send({"type": "http.response.start", "status": 200, "headers": []})
            await send({"type": "http.response.body", "body": b""})

        limited = ConcurrencyLimitMiddleware(slow_app, limit=1, wait_timeout_s=0.05)
        first_messages, first_send = collector()
        second_messages, second_send = collector()
        first = asyncio.create_task(limited(HTTP_SCOPE, _noop_receive, first_send))
        await asyncio.sleep(0)
        await limited(HTTP_SCOPE, _noop_receive, second_send)
        release.set()
        await first
        return first_messages, second_messages

    first_messages, second_messages = run(scenario())
    assert first_messages[0]["status"] == 200
    assert second_messages[0]["status"] == 503
    assert json.loads(second_messages[1]["body"])["error"]["code"] == "SERVER_BUSY"


def test_should_free_the_slot_once_a_long_stream_has_started():
    async def scenario():
        stream_open = asyncio.Event()
        end_stream = asyncio.Event()

        async def streaming_app(scope, receive, send):
            await send({"type": "http.response.start", "status": 200, "headers": []})
            if scope.get("path") == "/stream":
                stream_open.set()
                await end_stream.wait()
            await send({"type": "http.response.body", "body": b""})

        limited = ConcurrencyLimitMiddleware(streaming_app, limit=1, wait_timeout_s=0.5)
        _, stream_send = collector()
        other_messages, other_send = collector()
        stream = asyncio.create_task(limited({**HTTP_SCOPE, "path": "/stream"}, _noop_receive, stream_send))
        await stream_open.wait()
        await limited({**HTTP_SCOPE, "path": "/other"}, _noop_receive, other_send)
        end_stream.set()
        await stream
        return other_messages

    assert run(scenario())[0]["status"] == 200


def test_should_let_websockets_through_without_a_slot():
    async def scenario():
        seen = []

        async def app(scope, receive, send):
            seen.append(scope["type"])

        limited = ConcurrencyLimitMiddleware(app, limit=0, wait_timeout_s=0.01)
        await limited({"type": "websocket"}, _noop_receive, collector()[1])
        return seen

    assert run(scenario()) == ["websocket"]
