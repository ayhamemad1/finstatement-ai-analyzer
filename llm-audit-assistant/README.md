# LLM Audit Assistant

A retrieval-based audit assistant that answers questions from audit policies, financial reports, and exception logs using grounded evidence and citations.

## Features

- Ingests `.txt`, `.md`, `.csv`, and `.json` audit documents.
- Splits documents into searchable chunks.
- Builds a local TF-IDF retrieval index.
- Answers audit questions with cited source snippets.
- Includes controls for grounded answers, exception-log triage, and policy lookup.
- Runs fully local by default. Optional LLM integration can be added later.
- Includes CLI, samples, tests, and CI workflow.

## Why this project matters

Audit teams often need to search across policies, reports, and exception logs quickly. This assistant creates a reliable retrieval layer so users can ask questions such as:

- Which policy explains approval limits?
- What exceptions were found in revenue testing?
- Which financial report mentions liquidity risk?
- What evidence supports this answer?

## Install

```bash
cd llm-audit-assistant
python -m venv .venv
source .venv/bin/activate
pip install -e .[dev]
```

## Quick start

Build an index:

```bash
llm-audit ingest samples --index-path outputs/audit_index.pkl
```

Ask a question:

```bash
llm-audit ask "What is the approval threshold for manual journal entries?" --index-path outputs/audit_index.pkl
```

Triage exception logs:

```bash
llm-audit exceptions samples/exception_logs.csv --out outputs/exceptions_summary.json
```

## Architecture

```text
Documents → Loaders → Chunking → TF-IDF Index → Retriever → Grounded Answer → Citations
```

## Output style

The assistant returns:

- A direct answer.
- Supporting citations with file names and chunk IDs.
- Retrieved evidence snippets.
- A warning when the answer is not supported by the indexed documents.

## Production upgrade ideas

- Replace TF-IDF with embeddings and a vector database.
- Add OpenAI, Azure OpenAI, or local LLM generation.
- Add document permissions and audit logs.
- Add a web UI for audit teams.
- Add source highlighting in PDFs and reports.

## Important note

This assistant supports audit research and documentation review. It should not be treated as final audit evidence without reviewer approval.

## License

MIT
