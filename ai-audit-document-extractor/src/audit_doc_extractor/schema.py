from __future__ import annotations

from dataclasses import dataclass, asdict
from typing import Any


@dataclass
class Finding:
    severity: str
    check: str
    message: str
    row_count: int = 0
    details: dict[str, Any] | None = None

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class ReconciliationResult:
    rule: str
    source_total: float
    target_total: float
    difference: float
    tolerance: float
    status: str

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)
