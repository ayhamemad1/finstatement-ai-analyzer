from __future__ import annotations

import pandas as pd
from .schema import Finding


def parse_money(series: pd.Series) -> pd.Series:
    return pd.to_numeric(
        series.astype(str)
        .str.replace(",", "", regex=False)
        .str.replace("$", "", regex=False)
        .str.replace("(", "-", regex=False)
        .str.replace(")", "", regex=False),
        errors="coerce",
    )


def validate_table(
    df: pd.DataFrame,
    table_name: str = "table",
    required_columns: list[str] | None = None,
    numeric_columns: list[str] | None = None,
) -> list[Finding]:
    findings: list[Finding] = []
    required_columns = required_columns or []
    numeric_columns = numeric_columns or []

    missing_columns = [c for c in required_columns if c not in df.columns]
    if missing_columns:
        findings.append(Finding("high", "required_columns", f"Missing required columns in {table_name}.", details={"columns": missing_columns}))

    duplicates = int(df.duplicated().sum())
    if duplicates:
        findings.append(Finding("medium", "duplicate_rows", f"Duplicate rows found in {table_name}.", row_count=duplicates))

    for column in required_columns:
        if column in df.columns:
            count = int(df[column].isna().sum())
            if count:
                findings.append(Finding("medium", "missing_values", f"Missing values in required column '{column}'.", row_count=count))

    for column in numeric_columns:
        if column in df.columns:
            parsed = parse_money(df[column])
            invalid = int(parsed.isna().sum() - df[column].isna().sum())
            if invalid > 0:
                findings.append(Finding("high", "numeric_parse", f"Non-numeric values found in '{column}'.", row_count=invalid))

    if {"debit", "credit"}.issubset(df.columns):
        debit = parse_money(df["debit"]).fillna(0).sum()
        credit = parse_money(df["credit"]).fillna(0).sum()
        diff = round(float(debit - credit), 2)
        if abs(diff) > 0.01:
            findings.append(Finding("high", "debit_credit_balance", "Debit and credit totals do not balance.", details={"debit": float(debit), "credit": float(credit), "difference": diff}))

    if {"assets", "liabilities", "equity"}.issubset(df.columns):
        assets = parse_money(df["assets"]).fillna(0).sum()
        liabilities = parse_money(df["liabilities"]).fillna(0).sum()
        equity = parse_money(df["equity"]).fillna(0).sum()
        diff = round(float(assets - liabilities - equity), 2)
        if abs(diff) > 0.01:
            findings.append(Finding("high", "accounting_equation", "Accounting equation does not balance.", details={"assets": float(assets), "liabilities": float(liabilities), "equity": float(equity), "difference": diff}))

    if not findings:
        findings.append(Finding("info", "validation", f"No validation issues found in {table_name}."))
    return findings
