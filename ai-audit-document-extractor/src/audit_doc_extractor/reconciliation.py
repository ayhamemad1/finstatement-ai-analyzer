from __future__ import annotations

from pathlib import Path
from typing import Any
import pandas as pd
import yaml
from .schema import ReconciliationResult
from .validation import parse_money


def filter_frame(df: pd.DataFrame, filters: dict[str, Any] | None) -> pd.DataFrame:
    result = df.copy()
    for column, expected in (filters or {}).items():
        if column not in result.columns:
            return result.iloc[0:0]
        result = result[result[column].astype(str).str.lower() == str(expected).lower()]
    return result


def sum_column(df: pd.DataFrame, column: str) -> float:
    if column not in df.columns:
        return 0.0
    return float(parse_money(df[column]).fillna(0).sum())


def load_mapping(path: str | Path) -> dict[str, Any]:
    with open(path, "r", encoding="utf-8") as handle:
        return yaml.safe_load(handle) or {}


def reconcile(source: pd.DataFrame, target: pd.DataFrame, mapping: dict[str, Any]) -> list[ReconciliationResult]:
    results: list[ReconciliationResult] = []
    for rule in mapping.get("rules", []):
        source_rows = filter_frame(source, rule.get("source_filter"))
        target_rows = filter_frame(target, rule.get("target_filter"))
        source_total = sum_column(source_rows, rule["source_amount_column"])
        target_total = sum_column(target_rows, rule["target_amount_column"])
        tolerance = float(rule.get("tolerance", 0.0))
        difference = round(source_total - target_total, 2)
        status = "pass" if abs(difference) <= tolerance else "fail"
        results.append(ReconciliationResult(rule=rule.get("name", "unnamed_rule"), source_total=source_total, target_total=target_total, difference=difference, tolerance=tolerance, status=status))
    return results
