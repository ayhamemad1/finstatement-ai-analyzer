from __future__ import annotations

from pathlib import Path
import json
import pandas as pd


def load_document(path: Path) -> str:
    suffix = path.suffix.lower()
    if suffix in {".txt", ".md"}:
        return path.read_text(encoding="utf-8")
    if suffix == ".csv":
        df = pd.read_csv(path)
        return df.to_markdown(index=False)
    if suffix == ".json":
        return json.dumps(json.loads(path.read_text(encoding="utf-8")), indent=2)
    raise ValueError(f"Unsupported file type: {suffix}")


def discover_documents(folder: str | Path) -> list[Path]:
    root = Path(folder)
    supported = {".txt", ".md", ".csv", ".json"}
    return sorted(p for p in root.rglob("*") if p.is_file() and p.suffix.lower() in supported)
