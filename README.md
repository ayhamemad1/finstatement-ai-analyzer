# FinStatement AI Analyzer

A financial and audit intelligence toolkit for turning statements, extracted tables, and audit documents into structured insights.

The repository now includes a polished bank-statement analytics dashboard plus Python audit tools for document extraction, validation, reconciliation, and grounded audit Q&A. It is designed as a portfolio-grade workflow for finance and audit teams that need to move from messy files to decision-ready evidence.

## Included Projects

| Project | Purpose | Stack |
|---|---|---|
| **Statement Analyzer Dashboard** | Import bank activity, categorize transactions, detect anomalies, and generate analyst memos. | JavaScript, Node.js, OpenAI optional |
| **AI Audit Document Extractor** | Extract tables from CSV, Excel, and text-based PDFs, then validate and reconcile totals. | Python, Pandas, pdfplumber, PyYAML |
| **LLM Audit Assistant** | Build a local retrieval index over policies, reports, and exception logs for citation-backed answers. | Python, scikit-learn, Pandas |

## Portfolio Value

- Shows end-to-end thinking across data ingestion, analytics, validation, reconciliation, and AI-assisted review.
- Connects frontend product design with backend automation and Python audit workflows.
- Uses local-first defaults with optional OpenAI features, which keeps demos safe and easy to run.
- Includes sample data, tests, CLI workflows, and GitHub Actions CI for the Python subprojects.

## Features

- CSV, TSV, JSON, and pasted statement import
- Automatic column detection for common bank-statement headers
- Debit, credit, amount, balance, date, and description normalization
- Merchant inference from messy transaction descriptions
- Rule-based transaction categorization
- Income, expense, net cashflow, and risk-score KPIs
- Cashflow timeline chart
- Category spending chart
- Top merchant concentration analysis
- Large transaction anomaly detection
- Recurring payment detection
- Searchable and filterable transaction ledger
- Local rule-based financial memo
- Optional OpenAI-powered analyst memo through a server-side proxy
- JSON export for reports or downstream processing
- No frontend build step and no required npm dependencies

## Screens

- Dashboard: KPIs, cashflow, spending mix, top merchants
- Transactions: searchable ledger with categories and flags
- Insights: smart findings, anomalies, and AI memo
- Import: upload/paste statements and configure optional AI settings

## Quick Start

Requires Node.js 18 or newer.

```bash
npm start
```

Open:

```text
http://localhost:5180
```

The app works without an API key. Click `Load sample` to see the full dashboard immediately.

## Optional OpenAI Analysis

Set your API key on the server:

```powershell
$env:OPENAI_API_KEY="your_api_key_here"
npm start
```

Then click `AI analysis` in the app.

The backend uses OpenAI through a small server-side proxy. Check the OpenAI developer documentation for current API and model details.

## Expected Import Format

The parser accepts flexible headers. These examples work:

```csv
Date,Description,Debit,Credit,Balance
2026-01-03,SALARY COMPANY PAYROLL,,9800,22300
2026-01-04,RENT PAYMENT,3200,,19100
```

or:

```csv
Posting Date,Narration,Amount,Running Balance
2026-01-05,CARREFOUR GROCERY,-418.25,18681.75
```

## Project Structure

```text
finstatement-ai-analyzer/
  public/
    index.html
    styles.css
    app.js
    sample-statement.csv
  server.js
  package.json
  README.md
  LICENSE
```

## Security Notes

- Keep `OPENAI_API_KEY` on the server for real deployments.
- The temporary key field is for local demos only.
- Statement data is processed locally in the browser unless you explicitly click AI analysis.
- Do not upload sensitive real bank data to any hosted deployment without proper security controls.

## Roadmap

- PDF statement ingestion
- OCR handoff from scanned statements
- Multi-account support
- Budget goals and alerting
- SQLite persistence
- Docker deployment
- Embedding-based merchant cleanup
- Arabic and bilingual statement header expansion

## License

MIT
