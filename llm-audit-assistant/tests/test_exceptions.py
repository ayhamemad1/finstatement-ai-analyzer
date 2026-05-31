import pandas as pd
from llm_audit_assistant.exceptions import summarize_exceptions


def test_exception_summary_counts_severity():
    df = pd.DataFrame({"severity": ["high", "high", "medium"], "status": ["open", "closed", "open"]})
    summary = summarize_exceptions(df)
    assert summary["total_exceptions"] == 3
    assert summary["by_severity"]["high"] == 2
