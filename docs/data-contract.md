# Field transport v1

`weather_api.models` is authoritative; regenerate JSON Schema with `.venv/bin/python scripts/export_contracts.py`. `contracts/weather-manifest.schema.json` describes one frame and its run. Client validation lives in `fields.ts`.

`GET /api/runs?source=fixture|gfs` returns discovered/cached run metadata. `GET /api/frame?source=fixture&run=fixture&lead=0&lod=0&scenario=mixed` returns field descriptors and payload URLs. Native LOD 2 requires `bbox=west,south,east,north`. Extents cannot cross the antimeridian and must span 2–90° per axis. Only 0–24 h / three-hour source steps are accepted in this phase. The contract uses timestamps and signed forecast leads, allowing future historical sequences.

Payloads are headerless float32 little-endian bytes, exactly width × height × 4 bytes, ordered **south-to-north rows, eastward columns**. NaN means missing. Periodic global grids omit a duplicate longitude column. Regional grids do not wrap. Bilinear interpolation masks a result if any contributing corner is missing; a zero-weight missing corner does not contaminate an exact sample.

Temperature stays in kelvin; U/V stays in m/s. Speed is sqrt(u²+v²). Meteorological direction describes where wind comes FROM; filaments travel TO the vector direction. Temporal interpolation operates on U and V separately and recomputes speed; it never interpolates angles. Gaps over three hours are masked.

Precipitation stays in kg m^-2 s^-1, liquid-water equivalent, displayed as mm/h ×3600. The provider accepts instantaneous or interval-mean PRATE, preserving averaging bounds. It rejects accumulation or unsupported temporal statistics; no accumulation differencing is implemented. Linear interpolation of rates is visual, not a new model output.

Descriptors include run/valid time, lead, source variable, physical quantity, canonical unit, grid, vertical coordinate, missing policy, encoding, temporal support and provenance. Optional uncertainty metadata is reserved but not populated or rendered. Source resolution survives decimation. Missing data and uncertainty have distinct meanings.
