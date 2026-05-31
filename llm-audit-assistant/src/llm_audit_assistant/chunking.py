from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path


@dataclass
class Chunk:
    chunk_id: str
    source: str
    text: str


def chunk_text(text: str, source: str | Path, max_words: int = 180, overlap: int = 40) -> list[Chunk]:
    words = text.split()
    chunks: list[Chunk] = []
    if not words:
        return chunks
    step = max(1, max_words - overlap)
    for index, start in enumerate(range(0, len(words), step)):
        part = " ".join(words[start : start + max_words]).strip()
        if part:
            chunks.append(Chunk(chunk_id=f"{Path(source).name}:{index}", source=str(source), text=part))
    return chunks
