import pandas as pd
from audit_doc_extractor.validation import validate_table


def test_validation_detects_debit_credit_difference():
    df = pd.DataFrame({"account": ["Cash"], "balance": [100], "debit": [100], "credit": [50]})
    findings = validate_table(df, required_columns=["account", "balance"], numeric_columns=["balance"])
    assert any(f.check == "debit_credit_balance" for f in findings)
