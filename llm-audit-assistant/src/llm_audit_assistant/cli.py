from __future__ import annotations

from pathlib import Path
import json
import pandas as pd
import typer
from rich.console import Console
from .answering import make_grounded_answer
from .exceptions import summarize_exceptions
from .index import AuditIndex, load_index, save_index

app = typer.Typer(help="Retrieval-based assistant for audit documents.")
console = Console()


@app.command()
def ingest(folder: Path, index_path: Path = Path("outputs/audit_index.pkl")) -> None:
    index = AuditIndex.build(folder)
    save_index(index, index_path)
    console.print(f"[green]Indexed {len(index.chunks)} chunks.[/green] Saved to {index_path}")


@app.command()
def ask(question: str, index_path: Path = Path("outputs/audit_index.pkl"), top_k: int = 5) -> None:
    index = load_index(index_path)
    results = index.search(question, top_k=top_k)
    answer = make_grounded_answer(question, results)
    console.print_json(json.dumps(answer))


@app.command(name="exceptions")
def exception_summary(input_file: Path, out: Path = Path("outputs/exceptions_summary.json")) -> None:
    df = pd.read_csv(input_file)
    summary = summarize_exceptions(df)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    console.print_json(json.dumps(summary))


if __name__ == "__main__":
    app()
