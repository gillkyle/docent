"""Frontend integrity tests for the React UI and legacy fallback."""

from __future__ import annotations

import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).parent.parent
WEB_SRC = ROOT / "web" / "src"
APP_TSX = WEB_SRC / "App.tsx"
LEGACY_INDEX_HTML = ROOT / "index.html"


def test_react_app_is_split_into_views_hooks_and_shared_components():
    """The React UI should not regress into another single-file frontend."""

    expected_files = [
        WEB_SRC / "api" / "client.ts",
        WEB_SRC / "api" / "types.ts",
        WEB_SRC / "hooks" / "use-app-data.ts",
        WEB_SRC / "hooks" / "use-docent-actions.ts",
        WEB_SRC / "hooks" / "use-thumbnails.ts",
        WEB_SRC / "components" / "artwork" / "artwork-tile.tsx",
        WEB_SRC / "components" / "shared" / "playback-controls.tsx",
        WEB_SRC / "views" / "library-view.tsx",
        WEB_SRC / "views" / "collections-view.tsx",
        WEB_SRC / "views" / "settings-view.tsx",
        WEB_SRC / "views" / "schedules-view.tsx",
    ]

    missing = [path.relative_to(ROOT).as_posix() for path in expected_files if not path.exists()]
    assert missing == []
    assert len(APP_TSX.read_text().splitlines()) < 450


def test_artwork_tile_is_shared_by_library_and_collections():
    library = (WEB_SRC / "views" / "library-view.tsx").read_text()
    collections = (WEB_SRC / "views" / "collections-view.tsx").read_text()
    grid = (WEB_SRC / "components" / "artwork" / "artwork-grid.tsx").read_text()

    assert "ArtworkGrid" in library
    assert "ArtworkGrid" in collections
    assert "ArtworkTile" in grid
    assert "function ArtworkCard" not in APP_TSX.read_text()


def test_placeholder_auto_recovery_control_is_not_rendered():
    app_source = APP_TSX.read_text()

    assert "Find TV if IP changes" not in app_source
    assert "Planned for Pi hosting" not in app_source


def test_legacy_frontend_still_has_error_guardrails():
    """Keep XSS/signal checks while the old index.html remains as fallback."""

    html_source = LEGACY_INDEX_HTML.read_text()
    match = re.search(r"<script>(.*?)</script>", html_source, re.DOTALL)
    assert match, "No <script> block found in index.html"
    js_source = match.group(1)

    assert not re.findall(r"catch\s*(?:\([^)]*\))?\s*\{\s*\}", js_source)
    assert "opts.signal" in js_source
    assert re.search(r"atmosphereTitle.*?innerHTML\s*=", js_source, re.MULTILINE)
    assert re.search(r'replace\(.*/.*&quot;', js_source)
    assert re.search(r"atmosphereWeather.*?innerHTML\s*=", js_source)
    assert "clearTimeout(_observeBatchTimer)" in js_source


def test_react_frontend_builds():
    result = subprocess.run(
        ["npm", "run", "build"],
        cwd=ROOT / "web",
        text=True,
        capture_output=True,
        check=False,
        timeout=60,
    )

    assert result.returncode == 0, result.stdout + result.stderr
