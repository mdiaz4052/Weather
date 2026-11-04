# Decision register

Append new decisions; supersede old entries explicitly. Date, status, rationale, consequences and revisit trigger are sufficient. "Confirmed" refers to user choices; "proposed" technical choices remain revisable.

## D-001 — Local browser application

- Date: 2026-11-03. Status: confirmed.
- Decision: run on the user's computer in a browser; fetch online data first. Full offline use and desktop packaging are optional later capabilities.
- Reason: fits personal exploration without requiring an installer or complete local archive immediately.
- Consequence: a local service may manage credentials, scientific formats and cache. A browser UI alone does not require every operation to run inside the browser.
- Revisit: distribution needs or demonstrated offline use.

## D-002 — Globe, then place understanding, then comparison

- Date: 2026-11-03. Status: confirmed.
- Decision: global globe and playback first; preserve a direct path to place profiles and comparisons. First variables: air temperature, SST, precipitation.
- Consequence: navigate globally while accurately reporting each source's true resolution/coverage. A coarse global grid is not street-scale climatology.
- Revisit: user walkthroughs can change which feature comes next.

## D-003 — Daily temperature preference supersedes monthly-first proposal

- Date: 2026-11-03. Status: confirmed.
- Decision: daily exploration is preferred; hourly temperatures are desirable. Monthly views remain useful overview tools.
- Reason: the user's clarification changed the earlier proposed monthly default before implementation.
- Consequence: M1a requires real daily data; M1b includes a concrete hourly slice. Use bounded windows and resource-aware fetching instead of preloading global hourly history.
- Revisit: refine hourly regional/global priorities through M1 use; do not downgrade to monthly silently.

## D-004 — Source adapters with scientific contracts

- Date: 2026-11-03. Status: proposed technical design, consistent with broad-source goal.
- Decision: use capability-aware adapters and an explicit catalog; preserve provider semantics, quality, citations and versioned snapshots.
- Reason: source formats and scientific products are not interchangeable. Broad support can grow without rewriting the UI.
- Consequence: unsupported sources remain candidates; no automatic silent substitution or mixing. Separate scientific arrays from visualization assets.
- Revisit: an adapter spike reveals a simpler contract that preserves the same guarantees.

## D-005 — Preferred initial products

- Date: 2026-11-03. Status: proposed; documentary research only.
- Decision: evaluate ERA5 daily stats / hourly for air temperature; OISST v2.1 for daily SST; GPCP Daily for daily precipitation.
- Reason: matches daily/hourly intent and global fields. ERSST v6, GISTEMP and GPCP Monthly have distinct longer-term roles.
- Consequence: ERA5's free account/token and terms are a setup gate. Source latency, request grid options, actual endpoints and numerical values remain untested. NCEP/NCAR Reanalysis 1 is unsuitable as an updating default after its provider's production-stop notice.
- Revisit: T-001 results, provider access/lifecycle change, or user account preferences.

## D-006 — Resource budget is bounded working storage

- Date: 2026-11-03. Status: confirmed approximate 100 GB allocation; proposed internal limits.
- Decision: design around online access plus bounded local working data; propose 90 GB managed occupancy and 10 GB headroom.
- Reason: a GPU and 100 GB do not guarantee global high-resolution hourly archives, provider throughput, or application quality.
- Consequence: estimate peak bytes, reserve before jobs, evict only eligible cache, offer explicit pins, and keep queries small. Capacity-model results are estimates, not measurements.
- Revisit: real cache reuse, machine measurements, and user storage preferences.

## D-007 — Simple, honest agent attribution

- Date: 2026-11-03. Status: confirmed.
- Decision: ordinary tool/model labels in commit trailers and work records; no cryptographic signing requirement. Keep the existing human Git identity.
- Reason: enables cross-tool recordkeeping and handoffs without key management or invented authorship.
- Consequence: use exact model IDs only when actually available. This runtime reports a GPT-6 family label but does not expose an exact model version; record that limitation.
- Revisit: richer metadata is useful in practice, without imposing unnecessary steps.

## D-008 — Lightweight rolling records and optional roles

- Date: 2026-11-03. Status: confirmed direction; proposed document layout.
- Decision: maintain plain-text plan, decisions, experiments, feedback and worklog, with stable IDs and three planning horizons. Roles are optional task perspectives.
- Reason: retain useful development history without transcripts or bureaucracy.
- Consequence: small work gets a concise record; consequential choices get a decision entry; failed experiments remain discoverable. No standing committee or mandatory agent delegation.
- Revisit: eliminate redundant records or add a tool only when repeated use demonstrates value.

## D-009 — Initial implementation stack

- Date: 2026-11-03. Status: proposed, subject to T-002/T-003.
- Decision: React/TypeScript/Vite, CesiumJS behind an interface, Python/FastAPI/xarray, SQLite, one bounded worker.
- Reason: separates scientific processing from a globally navigable browser interface while keeping deployment small.
- Consequence: verify Windows dependencies and polar/daily playback behavior before committing to package versions or a complex tiling stack. No running app is implied by the skeleton.
- Revisit: spike failure or a materially simpler architecture satisfying the same requirements.
