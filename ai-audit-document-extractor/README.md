# AI Audit Document Extractor

Convert financial statements, PDF reports, Excel workbooks, and CSV files into structured tables, then run audit-style validation and reconciliation checks.

## Features

- Extract tables from Excel, CSV, and text-based PDFs.
- Normalize headers and financial amounts.
- Validate required columns, missing values, duplicates, numeric fields, debit/credit equality, and accounting equations.
- Reconcile extracted financial statement totals against control files or trial balances.
- Export clean CSV tables, JSON audit reports, and Markdown summaries.
- Includes CLI, sample data, tests, and CI workflow.

## Install

```bash
cd ai-audit-document-extractor
python -m venv .venv
source .venv/bin/activate
pip install -e .[dev]
```

Windows PowerShell:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -e .[dev]
```

## Quick start

```bash
audit-extract extract samples/trial_balance.csv --out-dir outputs
audit-extract validate samples/trial_balance.csv --table-name trial_balance --out-dir outputs
audit-extract reconcile --source samples/statement_totals.csv --target samples/trial_balance.csv --mapping samples/reconciliation_mapping.yaml --out-dir outputs
```

## Output

- `outputs/tables/*.csv`: extracted or normalized tables.
- `outputs/validation_report.json`: validation findings.
- `outputs/reconciliation_report.json`: reconciliation results.
- `outputs/audit_summary.md`: readable audit summary.

## Use cases

- Financial statement extraction.
- Audit evidence preparation.
- Trial balance validation.
- Statement-to-ledger reconciliation.
- Data cleaning before BI dashboards or RAG systems.

## Important note

This tool supports audit work but does not replace professional judgment. Always review extracted data, source documents, mappings, and exceptions before relying on results.

## License

MIT
