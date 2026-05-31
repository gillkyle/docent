"""Source-level checks for React helper behavior that should stay pure."""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).parent.parent
ARTWORK_HELPERS = ROOT / "web" / "src" / "lib" / "artwork.ts"
TV_HELPERS = ROOT / "web" / "src" / "lib" / "tv-ui.ts"


def test_artwork_helpers_own_sort_filter_and_interval_rules():
    source = ARTWORK_HELPERS.read_text()

    assert "export const visibleArtwork" in source
    assert "activeCollection" in source
    assert "sortMode === 'title'" in source
    assert "sortMode === 'newest'" in source
    assert "export const clampIntervalSeconds" in source
    assert "Math.max(10" in source


def test_tv_status_mapping_is_outside_app_component():
    source = TV_HELPERS.read_text()
    app_source = (ROOT / "web" / "src" / "App.tsx").read_text()

    assert "export function deriveTvUiState" in source
    assert "TV status unknown" in source
    assert "function deriveTvUiState" not in app_source
