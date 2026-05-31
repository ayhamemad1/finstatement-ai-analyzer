from __future__ import annotations

from .index import SearchResult


def make_grounded_answer(question: str, results: list[SearchResult], min_score: float = 0.05) -> dict:
    strong = [r for r in results if r.score >= min_score]
    if not strong:
        return {
            "question": question,
            "answer": "I could not find enough support in the indexed audit documents to answer this confidently.",
            "supported": False,
            "citations": [],
        }

    top = strong[0]
    evidence_lines = []
    for result in strong[:3]:
        snippet = result.text[:500].replace("\n", " ")
        evidence_lines.append(f"[{result.chunk_id}] {snippet}")

    return {
        "question": question,
        "answer": f"Based on the retrieved audit evidence, the most relevant source is {top.chunk_id}. Review the cited snippets below before using the answer in audit documentation.",
        "supported": True,
        "citations": [{"chunk_id": r.chunk_id, "source": r.source, "score": round(r.score, 4)} for r in strong[:5]],
        "evidence": evidence_lines,
    }
