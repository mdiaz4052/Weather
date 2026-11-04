"""Design interfaces only: no implemented network or scientific operations.

Python 3.11+; standard library only. Runtime API models and generated browser
contracts will be added during M1. Strings for CF dates preserve calendar
information rather than forcing all future calendars into datetime.datetime.
"""

from dataclasses import dataclass
from pathlib import Path
from typing import Any, Literal, Mapping, Protocol, Sequence


@dataclass(frozen=True)
class Selection:
    dataset_id: str
    variable_id: str
    statistic: str
    support: Literal["hourly", "daily", "monthly"]
    start_inclusive: str
    end_exclusive: str
    calendar: str
    day_convention: str
    # API bbox order is west, south, east, north; dateline crossing is explicit.
    bbox_wsen: tuple[float, float, float, float] | None
    crosses_antimeridian: bool
    requested_grid: Mapping[str, Any]


@dataclass(frozen=True)
class CostEstimate:
    download_bytes: int | None
    peak_managed_bytes: int
    normalized_bytes: int
    provider_requests: int
    confidence: Literal["measured", "estimated", "unknown"]
    assumptions: tuple[str, ...]


@dataclass(frozen=True)
class Asset:
    source_id: str
    relative_path: str
    sha256: str
    retrieved_at_utc: str
    metadata: Mapping[str, Any]


@dataclass(frozen=True)
class FieldManifest:
    snapshot_id: str
    relative_path: str
    quantity: str
    units: str
    statistic: str
    calendar: str
    grid: Mapping[str, Any]
    temporal_kind: Literal["instant", "interval"]
    time_points: Sequence[str]
    time_bounds: Sequence[tuple[str, str]] | None
    quality: Mapping[str, Any]
    provenance: Mapping[str, Any]


class ProviderAdapter(Protocol):
    """A reviewed plugin; methods perform no implicit provider substitution."""

    def discover(self, selection: Selection) -> Mapping[str, Any]: ...

    def estimate(self, selection: Selection) -> CostEstimate: ...

    def acquire(self, selection: Selection, workspace: Path) -> Sequence[Asset]: ...

    def normalize(
        self, assets: Sequence[Asset], selection: Selection, workspace: Path
    ) -> FieldManifest: ...

    def health(self) -> Mapping[str, Any]: ...
