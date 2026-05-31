# Usage Guide

## 1. Extract tables

Use `audit-extract extract` for CSV, Excel, or text-based PDF files. PDF extraction works best when the PDF contains real selectable text instead of scanned images.

## 2. Validate extracted data

Use `audit-extract validate` to check common audit data-quality issues. Customize required and numeric columns:

```bash
audit-extract validate data.csv --required account,balance --numeric balance,debit,credit
```

## 3. Reconcile totals

Create a YAML mapping file where each rule compares a source total to a target total. Failed rules show differences beyond tolerance.

## 4. Review exceptions

Use the JSON reports for systems and the Markdown summary for human review.
