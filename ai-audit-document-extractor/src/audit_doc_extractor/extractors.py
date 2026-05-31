from __future__ import annotations

from pathlib import Path
import re
import pandas as pd


def normalize_column_name(name: object) -> str:
    text = str(name).strip().lower()
    text = re.sub(r"[^a-z0-9]+", "_", text)
    return text.strip("_") or "unnamed"


def normalize_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    cleaned = df.copy()
    cleaned.columns = [normalize_column_name(c) for c in cleaned.columns]
    cleaned = cleaned.dropna(how="all")
    cleaned = cleaned.loc[:, ~cleaned.columns.duplicated()]
    for col in cleaned.columns:
        if cleaned[col].dtype == "object":
            cleaned[col] = cleaned[col].astype(str).str.strip().replace({"nan": None, "": None})
    return cleaned


def read_csv(path: Path) -> dict[str, pd.DataFrame]:
    return {path.stem: normalize_dataframe(pd.read_csv(path))}


def read_excel(path: Path) -> dict[str, pd.DataFrame]:
    sheets = pd.read_excel(path, sheet_name=None)
    return {normalize_column_name(name): normalize_dataframe(df) for name, df in sheets.items()}


def read_pdf(path: Path) -> dict[str, pd.DataFrame]:
    import pdfplumber

    tables: dict[str, pd.DataFrame] = {}
    with pdfplumber.open(path) as pdf:
        for page_index, page in enumerate(pdf.pages, start=1):
            for table_index, table in enumerate(page.extract_tables() or [], start=1):
                if not table or len(table) < 2:
                    continue
                header, rows = table[0], table[1:]
                df = pd.DataFrame(rows, columns=header)
                tables[f"page_{page_index}_table_{table_index}"] = normalize_dataframe(df)
    return tables


def extract_tables(input_path: str | Path) -> dict[str, pd.DataFrame]:
    path = Path(input_path)
    suffix = path.suffix.lower()
    if suffix == ".csv":
        return read_csv(path)
    if suffix in {".xlsx", ".xls"}:
        return read_excel(path)
    if suffix == ".pdf":
        return read_pdf(path)
    raise ValueError(f"Unsupported file type: {suffix}")


def write_tables(tables: dict[str, pd.DataFrame], out_dir: str | Path) -> list[Path]:
    output = Path(out_dir) / "tables"
    output.mkdir(parents=True, exist_ok=True)
    written: list[Path] = []
    for name, df in tables.items():
        destination = output / f"{normalize_column_name(name)}.csv"
        df.to_csv(destination, index=False)
        written.append(destination)
    return written
