from pathlib import Path
from llm_audit_assistant.index import AuditIndex


def test_index_retrieves_policy_answer():
    index = AuditIndex.build(Path(__file__).parents[1] / "samples")
    results = index.search("manual journal approval threshold", top_k=3)
    assert results
    assert "journal" in results[0].text.lower()
