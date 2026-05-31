from __future__ import annotations

import json
from pathlib import Path
from typing import Any


def write_json_report(data: Any, path: str | Path) -> Path:
    destination = Path(path)
    destination.parent.mkdir(parents=True, exist_ok=True)
    with open(destination, "w", encoding="utf-8") as handle:
        json.dump(data, handle, indent=2)
    return destination


def write_summary(title: str, items: list[dict[str, Any]], path: str | Path) -> Path:
    destination = Path(path)
    destination.parent.mkdir(parents=True, exist_ok=True)
    lines = [f"# {title}", ""]
    for item in items:
        label = item.get("check") or item.get("rule") or "item"
        status = item.get("severity") or item.get("status") or "unknown"
        lines.append(f"- **{label}**: {status}")
    destination.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return destination
