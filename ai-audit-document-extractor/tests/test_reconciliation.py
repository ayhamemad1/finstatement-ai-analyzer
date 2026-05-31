import pandas as pd
from audit_doc_extractor.reconciliation import reconcile


def test_reconciliation_passes_within_tolerance():
    source = pd.DataFrame({"line_item": ["Cash"], "amount": [100.0]})
    target = pd.DataFrame({"account": ["Cash"], "balance": [100.5]})
    mapping = {"rules": [{"name": "cash", "source_filter": {"line_item": "Cash"}, "source_amount_column": "amount", "target_filter": {"account": "Cash"}, "target_amount_column": "balance", "tolerance": 1.0}]}
    result = reconcile(source, target, mapping)[0]
    assert result.status == "pass"
