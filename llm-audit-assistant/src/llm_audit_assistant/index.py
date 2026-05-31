from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import pickle
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from .chunking import Chunk, chunk_text
from .loaders import discover_documents, load_document


@dataclass
class SearchResult:
    chunk_id: str
    source: str
    score: float
    text: str


class AuditIndex:
    def __init__(self, chunks: list[Chunk], vectorizer: TfidfVectorizer, matrix):
        self.chunks = chunks
        self.vectorizer = vectorizer
        self.matrix = matrix

    @classmethod
    def build(cls, folder: str | Path) -> "AuditIndex":
        chunks: list[Chunk] = []
        for path in discover_documents(folder):
            chunks.extend(chunk_text(load_document(path), source=path))
        if not chunks:
            raise ValueError("No supported documents found.")
        vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2))
        matrix = vectorizer.fit_transform([c.text for c in chunks])
        return cls(chunks, vectorizer, matrix)

    def search(self, query: str, top_k: int = 5) -> list[SearchResult]:
        query_vector = self.vectorizer.transform([query])
        scores = cosine_similarity(query_vector, self.matrix).flatten()
        ranked = scores.argsort()[::-1][:top_k]
        return [SearchResult(self.chunks[i].chunk_id, self.chunks[i].source, float(scores[i]), self.chunks[i].text) for i in ranked if scores[i] > 0]


def save_index(index: AuditIndex, path: str | Path) -> Path:
    destination = Path(path)
    destination.parent.mkdir(parents=True, exist_ok=True)
    with open(destination, "wb") as handle:
        pickle.dump(index, handle)
    return destination


def load_index(path: str | Path) -> AuditIndex:
    with open(path, "rb") as handle:
        return pickle.load(handle)
