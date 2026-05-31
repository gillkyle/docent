"""Integration tests for API endpoints — async TestClient + respx for HTTP mocking."""
from __future__ import annotations

import json

import httpx
import pytest
import respx

import server


# ---------------------------------------------------------------------------
# Config endpoints
# ---------------------------------------------------------------------------

class TestConfigGet:
    async def test_no_file_returns_defaults(self, client):
        resp = await client.get("/api/ai/config")
        assert resp.status_code == 200
        data = resp.json()
        assert data["provider"] == "claude"
        assert data["use_google_vision"] is True
        assert data["claude"]["api_key"] == ""
        assert data["openai"]["model"] == "gpt-4.1"

    async def test_masks_all_api_keys(self, client, seed_ai_config):
        seed_ai_config(
            claude={"api_key": "sk-ant-test-key-1234ABCD"},
            openai={"api_key": "sk-openai-test-key-9999"},
            google_vision={"api_key": "AIzaSyABCDEFGHIJKLMNOP"},
        )
        resp = await client.get("/api/ai/config")
        data = resp.json()
        assert data["claude"]["api_key"] == "...ABCD"
        assert data["openai"]["api_key"] == "...9999"
        assert data["google_vision"]["api_key"] == "...MNOP"

    async def test_short_key_fully_masked(self, client, seed_ai_config):
        seed_ai_config(claude={"api_key": "abc"})
        resp = await client.get("/api/ai/config")
        assert resp.json()["claude"]["api_key"] == "****"


class TestConfigPut:
    async def test_updates_fields(self, client, seed_ai_config):
        seed_ai_config()
        resp = await client.put("/api/ai/config", json={
            "provider": "openai",
            "auto_analyze": True,
        })
        assert resp.status_code == 200
        assert resp.json()["ok"] is True

        resp = await client.get("/api/ai/config")
        assert resp.json()["provider"] == "openai"
        assert resp.json()["auto_analyze"] is True

    async def test_masked_key_not_overwritten(self, client, seed_ai_config):
        seed_ai_config(claude={"api_key": "sk-ant-real-key-XYZW"})
        await client.put("/api/ai/config", json={
            "claude": {"api_key": "...XYZW"},
        })
        config = server._load_ai_config()
        assert config["claude"]["api_key"] == "sk-ant-real-key-XYZW"

    async def test_real_key_updates(self, client, seed_ai_config):
        seed_ai_config()
        await client.put("/api/ai/config", json={
            "openai": {"api_key": "sk-new-openai-key"},
        })
        config = server._load_ai_config()
        assert config["openai"]["api_key"] == "sk-new-openai-key"


# ---------------------------------------------------------------------------
# Collections CRUD
# ---------------------------------------------------------------------------

class TestCollections:
    async def test_create_collection(self, client):
        resp = await client.post("/api/collections", json={"name": "Favorites"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["name"] == "Favorites"
        assert data["content_ids"] == []
        assert "id" in data
        assert "created" in data

    async def test_list_collections(self, client):
        await client.post("/api/collections", json={"name": "A"})
        await client.post("/api/collections", json={"name": "B"})
        resp = await client.get("/api/collections")
        names = [c["name"] for c in resp.json()["collections"]]
        assert "A" in names
        assert "B" in names

    async def test_add_items_deduplicates(self, client):
        col = (await client.post("/api/collections", json={"name": "Test"})).json()
        cid = col["id"]
        await client.post(f"/api/collections/{cid}/items", json={"content_ids": ["X", "Y"]})
        resp = await client.post(f"/api/collections/{cid}/items", json={"content_ids": ["Y", "Z"]})
        assert resp.json()["content_ids"] == ["X", "Y", "Z"]

    async def test_add_items_deduplicates_same_request(self, client):
        col = (await client.post("/api/collections", json={"name": "Test"})).json()
        cid = col["id"]
        resp = await client.post(f"/api/collections/{cid}/items", json={"content_ids": ["X", "X", "Y"]})
        assert resp.json()["content_ids"] == ["X", "Y"]

    async def test_remove_items(self, client):
        col = (await client.post("/api/collections", json={"name": "Test"})).json()
        cid = col["id"]
        await client.post(f"/api/collections/{cid}/items", json={"content_ids": ["A", "B", "C"]})
        resp = await client.request("DELETE", f"/api/collections/{cid}/items", json={"content_ids": ["B"]})
        assert resp.json()["content_ids"] == ["A", "C"]

    async def test_rename_collection(self, client):
        col = (await client.post("/api/collections", json={"name": "Old"})).json()
        resp = await client.put(f"/api/collections/{col['id']}", json={"name": "New"})
        assert resp.json()["name"] == "New"

    async def test_delete_collection_and_404(self, client):
        col = (await client.post("/api/collections", json={"name": "Gone"})).json()
        resp = await client.delete(f"/api/collections/{col['id']}")
        assert resp.json()["ok"] is True
        resp = await client.delete(f"/api/collections/{col['id']}")
        assert resp.status_code == 404


class TestPlayback:
    async def test_start_playback_from_content_ids(self, client, mock_tv):
        resp = await client.post("/api/playback", json={
            "content_ids": ["A", "B"],
            "duration": 10,
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["active"] is True
        assert data["content_ids"] == ["A", "B"]
        assert data["matte_id"] == "none"
        mock_tv.change_matte.assert_called_with("A", "none")

        await client.delete("/api/playback")

    async def test_start_playback_does_not_immediately_advance(self, client, mock_tv):
        resp = await client.post("/api/playback", json={
            "content_ids": ["A", "B"],
            "duration": 10,
        })

        assert resp.status_code == 200
        mock_tv.select_image.assert_called_once_with("A", show=True)

        await client.delete("/api/playback")

    async def test_start_playback_from_collection(self, client, mock_tv):
        col = (await client.post("/api/collections", json={"name": "Morning"})).json()
        await client.post(f"/api/collections/{col['id']}/items", json={"content_ids": ["A", "B"]})

        resp = await client.post("/api/playback", json={
            "collection_id": col["id"],
            "duration": 10,
        })
        assert resp.status_code == 200
        assert resp.json()["content_ids"] == ["A", "B"]

        await client.delete("/api/playback")

    async def test_playback_rejects_short_duration(self, client):
        resp = await client.post("/api/playback", json={
            "content_ids": ["A"],
            "duration": 5,
        })
        assert resp.status_code == 400

    async def test_stop_playback(self, client, mock_tv):
        await client.post("/api/playback", json={
            "content_ids": ["A"],
            "duration": 10,
        })
        resp = await client.delete("/api/playback")
        assert resp.json() == {"ok": True, "active": False}

    async def test_start_playback_with_matte(self, client, mock_tv):
        resp = await client.post("/api/playback", json={
            "content_ids": ["A"],
            "duration": 10,
            "matte_id": "shadowbox_polar",
        })
        assert resp.status_code == 200
        assert resp.json()["matte_id"] == "shadowbox_polar"
        mock_tv.change_matte.assert_called_with("A", "shadowbox_polar")

        await client.delete("/api/playback")

    async def test_start_playback_continues_when_matte_rejected(self, client, mock_tv):
        mock_tv.change_matte.side_effect = Exception("error number -7")

        resp = await client.post("/api/playback", json={
            "content_ids": ["A"],
            "duration": 10,
            "matte_id": "none",
        })

        assert resp.status_code == 200
        assert resp.json()["warning"]
        mock_tv.select_image.assert_called_with("A", show=True)

        await client.delete("/api/playback")

    async def test_playback_stops_when_tv_leaves_art_mode(self, mock_tv):
        mock_tv.get_artmode.return_value = "off"

        await server._run_playback(["B"], duration=10, shuffle=False, matte_id="none")

        mock_tv.select_image.assert_not_called()
        assert server._playback_state["active"] is False
        assert server._playback_state["paused_reason"] == "tv_left_art_mode"
        assert server._playback_state["error"] is None


class TestAppSettings:
    async def test_defaults_to_no_matte(self, client):
        resp = await client.get("/api/settings")
        assert resp.status_code == 200
        assert resp.json()["default_matte_id"] == "none"

    async def test_updates_default_matte(self, client):
        resp = await client.put("/api/settings", json={"default_matte_id": "shadowbox_polar"})
        assert resp.status_code == 200
        assert resp.json()["default_matte_id"] == "shadowbox_polar"


class TestMatte:
    async def test_change_matte_returns_content_and_matte(self, client, mock_tv):
        resp = await client.post("/api/matte", json={
            "content_id": "A",
            "matte_id": "shadowbox_polar",
        })

        assert resp.status_code == 200
        assert resp.json() == {"ok": True, "content_id": "A", "matte_id": "shadowbox_polar"}
        mock_tv.change_matte.assert_called_with("A", "shadowbox_polar")

    async def test_change_matte_defaults_to_none(self, client, mock_tv):
        resp = await client.post("/api/matte", json={"content_id": "A", "matte_id": ""})

        assert resp.status_code == 200
        assert resp.json()["matte_id"] == "none"
        mock_tv.change_matte.assert_called_with("A", "none")

    async def test_change_matte_batch_best_effort(self, client, mock_tv):
        def change_matte(content_id, matte_id):
            if content_id == "B":
                raise Exception("error number -7")

        mock_tv.change_matte.side_effect = change_matte

        resp = await client.post("/api/matte/batch", json={
            "content_ids": ["A", "B", "C"],
            "matte_id": "none",
        })

        assert resp.status_code == 200
        data = resp.json()
        assert data["ok"] is False
        assert data["changed"] == ["A", "C"]
        assert data["failed"][0]["content_id"] == "B"


class TestSelect:
    async def test_select_continues_when_matte_rejected(self, client, mock_tv):
        mock_tv.change_matte.side_effect = Exception("error number -7")

        resp = await client.post("/api/select", json={"content_id": "A", "matte_id": "none"})

        assert resp.status_code == 200
        assert resp.json()["warning"]
        mock_tv.select_image.assert_called_with("A", show=True)


class TestArtworkList:
    async def test_art_list_deduplicates_tv_rows(self, client, mock_tv):
        mock_tv.available.return_value = [
            {"content_id": "A", "image_date": "2026:01:01 00:00:00"},
            {"content_id": "A", "image_date": "2026:01:01 00:00:00"},
            {"content_id": "B", "image_date": "2026:01:02 00:00:00"},
        ]
        mock_tv.get_current.return_value = {"content_id": "A"}

        resp = await client.get("/api/art")

        assert resp.status_code == 200
        assert [item["content_id"] for item in resp.json()["items"]] == ["A", "B"]


# ---------------------------------------------------------------------------
# Artwork metadata
# ---------------------------------------------------------------------------

class TestArtworkMeta:
    async def test_get_returns_stored(self, client, tmp_data_dir):
        meta = {"artwork": {"ID1": {"title": "Starry Night"}}}
        (tmp_data_dir / "artwork_meta.json").write_text(json.dumps(meta))
        resp = await client.get("/api/artwork-meta")
        assert resp.json()["artwork"]["ID1"]["title"] == "Starry Night"

    async def test_put_creates_entry(self, client):
        resp = await client.put("/api/artwork-meta/NEW1", json={"title": "Test Art", "width": 1920})
        assert resp.status_code == 200
        assert resp.json()["meta"]["title"] == "Test Art"
        assert resp.json()["meta"]["width"] == 1920

    async def test_put_empty_title_skipped(self, client, tmp_data_dir):
        meta = {"artwork": {"ID1": {"title": "Keep This"}}}
        (tmp_data_dir / "artwork_meta.json").write_text(json.dumps(meta))
        await client.put("/api/artwork-meta/ID1", json={"title": "  ", "width": 100})
        loaded = server._load_artwork_meta()
        assert loaded["artwork"]["ID1"]["title"] == "Keep This"
        assert loaded["artwork"]["ID1"]["width"] == 100


# ---------------------------------------------------------------------------
# AI analysis (with respx)
# ---------------------------------------------------------------------------

CLAUDE_RESPONSE = {
    "content": [{"type": "text", "text": json.dumps({
        "title": "The Starry Night",
        "artist": "Vincent van Gogh",
        "year": "1889",
        "medium": "Oil on canvas",
        "school": "Post-Impressionism",
        "vibes": ["dreamy", "swirling", "nocturnal", "luminous", "contemplative"],
        "description": "A post-impressionist masterpiece.",
        "confidence": "high",
    })}],
    "usage": {"input_tokens": 500, "output_tokens": 100},
}


class TestAnalyze:
    async def test_no_image_404(self, client, seed_ai_config):
        seed_ai_config(claude={"api_key": "sk-ant-test-key-1234ZgAA"})
        resp = await client.post("/api/ai/analyze/MISSING")
        assert resp.status_code == 404

    @respx.mock
    async def test_claude_analysis(self, client, seed_ai_config, tmp_data_dir):
        seed_ai_config(claude={"api_key": "sk-ant-test-key-1234ZgAA"})
        thumb = tmp_data_dir / ".cache" / "thumbnails" / "ART001.jpg"
        thumb.write_bytes(b"\xff\xd8\xff\xe0fake-jpeg")

        respx.post("https://api.anthropic.com/v1/messages").mock(
            return_value=httpx.Response(200, json=CLAUDE_RESPONSE)
        )

        resp = await client.post("/api/ai/analyze/ART001")
        assert resp.status_code == 200
        data = resp.json()
        assert data["ok"] is True
        assert data["ai_meta"]["title"] == "The Starry Night"
        assert data["ai_meta"]["artist"] == "Vincent van Gogh"
        assert data["ai_meta"]["provider"] == "claude"
        assert data["ai_meta"]["vision_identified"] is False

    @respx.mock
    async def test_vision_plus_claude(self, client, seed_ai_config, tmp_data_dir):
        seed_ai_config(
            use_google_vision=True,
            claude={"api_key": "sk-ant-test-key-1234ZgAA"},
            google_vision={"api_key": "AIza-test-gv-key"},
        )
        thumb = tmp_data_dir / ".cache" / "thumbnails" / "ART002.jpg"
        thumb.write_bytes(b"\xff\xd8\xff\xe0fake-jpeg")

        respx.post("https://vision.googleapis.com/v1/images:annotate").mock(
            return_value=httpx.Response(200, json={
                "responses": [{"webDetection": {
                    "bestGuessLabels": [{"label": "The Starry Night"}],
                    "webEntities": [{"description": "Vincent van Gogh", "score": 1.5}],
                }}],
            })
        )
        respx.post("https://api.anthropic.com/v1/messages").mock(
            return_value=httpx.Response(200, json=CLAUDE_RESPONSE)
        )

        resp = await client.post("/api/ai/analyze/ART002")
        assert resp.status_code == 200
        assert resp.json()["ai_meta"]["vision_identified"] is True


# ---------------------------------------------------------------------------
# Atmosphere (with respx)
# ---------------------------------------------------------------------------

class TestAtmosphere:
    @respx.mock
    async def test_full_pipeline(self, client, seed_ai_config, tmp_data_dir):
        seed_ai_config(claude={"api_key": "sk-ant-test-key-1234ZgAA"})
        meta = {"artwork": {"ART001": {
            "title": "Starry Night",
            "ai_meta": {
                "description": "A swirling night sky.",
                "vibes": ["dreamy", "nocturnal", "serene"],
            },
        }}}
        (tmp_data_dir / "artwork_meta.json").write_text(json.dumps(meta))

        respx.get("https://api.open-meteo.com/v1/forecast").mock(
            return_value=httpx.Response(200, json={
                "current": {
                    "temperature_2m": 18.5,
                    "relative_humidity_2m": 65,
                    "weather_code": 0,
                    "is_day": 0,
                    "wind_speed_10m": 5.2,
                },
                "current_units": {
                    "temperature_2m": "°C",
                    "wind_speed_10m": "km/h",
                },
            })
        )
        respx.get(url__startswith="https://api.weather.gov/").mock(
            return_value=httpx.Response(500)
        )

        ai_resp = json.dumps({
            "content_id": "ART001",
            "curator_note": "A perfect match for this evening.",
            "vibes_matched": ["dreamy", "nocturnal"],
        })
        respx.post("https://api.anthropic.com/v1/messages").mock(
            return_value=httpx.Response(200, json={
                "content": [{"text": ai_resp}],
                "usage": {"input_tokens": 200, "output_tokens": 50},
            })
        )

        resp = await client.post("/api/atmosphere", json={"lat": 40.7, "lng": -74.0})
        assert resp.status_code == 200
        data = resp.json()
        assert data["content_id"] == "ART001"
        assert "curator_note" in data
        assert "weather" in data

    async def test_no_analyzed_artwork_400(self, client, seed_ai_config):
        seed_ai_config(claude={"api_key": "sk-ant-test-key-1234ZgAA"})
        resp = await client.post("/api/atmosphere", json={"lat": 40.7, "lng": -74.0})
        assert resp.status_code == 400


# ---------------------------------------------------------------------------
# Usage endpoint
# ---------------------------------------------------------------------------

class TestUsage:
    async def test_returns_cost(self, client, tmp_data_dir):
        from datetime import datetime, timezone
        month = datetime.now(timezone.utc).strftime("%Y-%m")
        usage = {"monthly": {month: {
            "input_tokens": 1_000_000,
            "output_tokens": 1_000_000,
            "calls": 10,
            "by_model": {"claude-sonnet-4-20250514": {
                "input_tokens": 1_000_000,
                "output_tokens": 1_000_000,
                "calls": 10,
            }},
        }}}
        (tmp_data_dir / "api_usage.json").write_text(json.dumps(usage))
        resp = await client.get("/api/ai/usage")
        assert resp.status_code == 200
        data = resp.json()
        assert data["estimated_cost_usd"] == 18.0
        assert data["calls"] == 10


# ---------------------------------------------------------------------------
# Error handling
# ---------------------------------------------------------------------------

class TestErrors:
    async def test_missing_collection_name_400(self, client):
        resp = await client.post("/api/collections", json={"name": ""})
        assert resp.status_code == 400

    async def test_nonexistent_collection_404(self, client):
        resp = await client.delete("/api/collections/nonexistent-id")
        assert resp.status_code == 404

    async def test_missing_lat_lng_400(self, client, seed_ai_config):
        seed_ai_config(claude={"api_key": "sk-ant-test-key-1234ZgAA"})
        resp = await client.post("/api/atmosphere", json={})
        assert resp.status_code == 400

    async def test_no_api_key_400(self, client, tmp_data_dir):
        thumb = tmp_data_dir / ".cache" / "thumbnails" / "ART099.jpg"
        thumb.write_bytes(b"\xff\xd8\xff\xe0fake-jpeg")
        resp = await client.post("/api/ai/analyze/ART099")
        assert resp.status_code == 400
