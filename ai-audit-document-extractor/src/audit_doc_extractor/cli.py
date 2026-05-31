from __future__ import annotations

from pathlib import Path
import pandas as pd
import typer
from rich.console import Console
from .extractors import extract_tables, normalize_dataframe, write_tables
from .reconciliation import load_mapping, reconcile
from .reports import write_json_report, write_summary
from .validation import validate_table

app = typer.Typer(help="Extract, validate, and reconcile audit document tables.")
console = Console()


@app.command()
def extract(input_file: Path, out_dir: Path = Path("outputs")) -> None:
    tables = extract_tables(input_file)
    written = write_tables(tables, out_dir)
    console.print(f"[green]Extracted {len(written)} table(s).[/green]")


@app.command()
def validate(
    input_file: Path,
    table_name: str = "table",
    out_dir: Path = Path("outputs"),
    required: str = "account,balance",
    numeric: str = "balance,debit,credit,amount",
) -> None:
    df = normalize_dataframe(pd.read_csv(input_file))
    findings = validate_table(
        df,
        table_name=table_name,
        required_columns=[x.strip() for x in required.split(",") if x.strip()],
        numeric_columns=[x.strip() for x in numeric.split(",") if x.strip()],
    )
    data = [f.to_dict() for f in findings]
    write_json_report(data, out_dir / "validation_report.json")
    write_summary("Validation Summary", data, out_dir / "audit_summary.md")
    console.print(f"[green]Validation completed with {len(findings)} finding(s).[/green]")


@app.command()
def reconcile_command(
    source: Path = typer.Option(..., "--source"),
    target: Path = typer.Option(..., "--target"),
    mapping: Path = typer.Option(..., "--mapping"),
    out_dir: Path = Path("outputs"),
) -> None:
    source_df = normalize_dataframe(pd.read_csv(source))
    target_df = normalize_dataframe(pd.read_csv(target))
    results = reconcile(source_df, target_df, load_mapping(mapping))
    data = [r.to_dict() for r in results]
    write_json_report(data, out_dir / "reconciliation_report.json")
    write_summary("Reconciliation Summary", data, out_dir / "audit_summary.md")
    failed = sum(1 for r in results if r.status == "fail")
    console.print(f"[green]Reconciliation completed.[/green] Failed rules: {failed}")


app.command(name="reconcile")(reconcile_command)


if __name__ == "__main__":
    app()
