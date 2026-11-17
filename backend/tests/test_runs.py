def test_create_and_get_run(client):
    r = client.post("/api/v1/runs", json={"seed": "s42", "heldOutRatio": 0.25})
    assert r.status_code == 201
    body = r.json()
    assert body["seed"] == "s42" and body["heldOutRatio"] == 0.25
    assert client.get(f"/api/v1/runs/{body['id']}/manifest").json()["id"] == body["id"]


def test_rejects_bad_ratio(client):
    assert client.post("/api/v1/runs", json={"heldOutRatio": 1.5}).status_code == 400


def test_events_resume_after_last_event_id(client):
    run_id = client.post("/api/v1/runs", json={}).json()["id"]
    text = client.get(f"/api/v1/runs/{run_id}/events?follow=false").text
    assert "id: 1\nevent: run_created" in text
    resumed = client.get(f"/api/v1/runs/{run_id}/events?follow=false", headers={"Last-Event-ID": "1"}).text
    assert "run_created" not in resumed


def test_unknown_run_404(client):
    assert client.get("/api/v1/runs/nope/manifest").status_code == 404
