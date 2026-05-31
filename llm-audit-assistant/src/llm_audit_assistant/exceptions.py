from __future__ import annotations

import pandas as pd


def summarize_exceptions(df: pd.DataFrame) -> dict:
    normalized = df.copy()
    normalized.columns = [str(c).strip().lower().replace(" ", "_") for c in normalized.columns]
    summary = {"total_exceptions": int(len(normalized))}
    if "severity" in normalized.columns:
        summary["by_severity"] = normalized["severity"].fillna("unknown").value_counts().to_dict()
    if "status" in normalized.columns:
        summary["by_status"] = normalized["status"].fillna("unknown").value_counts().to_dict()
    if "owner" in normalized.columns:
        summary["by_owner"] = normalized["owner"].fillna("unassigned").value_counts().head(10).to_dict()
    return summary
