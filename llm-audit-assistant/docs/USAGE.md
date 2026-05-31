# Usage Guide

## 1. Add audit documents

Place audit policies, financial reports, and exception logs into a folder. Supported formats are `.txt`, `.md`, `.csv`, and `.json`.

## 2. Build the index

```bash
llm-audit ingest samples --index-path outputs/audit_index.pkl
```

## 3. Ask grounded questions

```bash
llm-audit ask "Which exceptions are high risk?" --index-path outputs/audit_index.pkl
```

## 4. Review citations

Every answer includes retrieved chunks and scores. If the answer is unsupported, the assistant clearly says it could not find enough evidence.
