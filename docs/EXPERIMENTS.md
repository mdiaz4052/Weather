# Experiments and lessons

Record the question, bounded method, actual result, limitations, decision and revisit trigger. Distinguish executed experiments, documentary findings and planned tests.

## E-001 — Capacity model for daily and hourly exploration

- Date: 2026-11-03. Task: T-000. State: executed, deterministic calculation.
- Question: can the approximate 100 GB allocation support useful daily/hourly exploration without keeping every global field locally?
- Method: `python tools/estimate_storage.py --write`; exact arithmetic for illustrative grids, uncompressed float32 values plus a one-byte mask per cell. Full history is [1940-01-01,2026-01-01). No provider downloads, GPU work or installed scientific libraries.
- Reproducible result: `experiments/storage-estimates.json`.

| Scenario | Float32 plus byte mask, decimal GB |
| --- | ---: |
| Quarter-degree global, 31 daily frames, one variable | 0.160927 |
| Quarter-degree global, 48 hourly frames, one variable | 0.249178 |
| Quarter-degree global, 365 daily frames, three variables | 5.684364 |
| Quarter-degree global, 86 years daily, one variable | 163.065974 |
| Quarter-degree global, 86 years hourly, one variable | 3913.583386 |
| One-degree global, 86 years daily, one variable | 10.234030 |
| Quarter-degree, 20-degree regional box, 31 days hourly | 0.024407 |
| Quarter-degree global, all daily inputs for 1991-2020 baseline | 56.885170 |
| Quarter-degree global, 366-day climatology output | 1.899979 |

- Additional result: five 1440x720 decoded RGBA overview frames occupy 20.736 MB before map-engine/browser/GPU copies.
- Interpretation: selected daily/hourly windows are plausible within the allocation; a complete high-resolution global hourly archive is not. A daily baseline can be streamed in chunks instead of retaining all contributing input arrays simultaneously.
- Limitations: grids are illustrative, not assertions of every provider's exact layout. Excludes coordinates, quality/error fields, packed values, compression, network transfer, scratch/copies, disk filesystem overhead and display pyramids. Coarse examples trade spatial resolution for storage. No inference about actual retrieval speed, graphics performance or application quality is justified.
- Decision: use windowed fetching, explicit resolution, reservations, bounded cache and optional pins. See D-003/D-006.
- Revisit: measure real assets and peak processing footprint in T-001/T-003.

## E-002 — Product lifecycle and source-fit review

- Date: 2026-11-03. Task: T-000. State: documentary research executed; integration not run.
- Question: which current products fit daily/hourly air temperature, SST, precipitation and longer history?
- Method: primary provider documentation and access pages linked in `SOURCES.md`.
- Results: daily ERA5 statistics and hourly ERA5 are plausible air-temperature paths; OISST is a daily SST path; GPCP Daily is distinct from its monthly companion. NOAA now lists ERSST v6. NOAA PSL says NCEP/NCAR Reanalysis 1 production ended March 17, 2026.
- Lesson: an old source description ending in "present" is insufficient evidence for live availability. A monthly anomaly product cannot serve as a silent daily absolute-temperature fallback.
- Limitation: no provider API request, payload decoding, latest-date discovery or numerical validation was performed.
- Decision: candidate catalog with empty implemented/tested capabilities; pin products and check lifecycle at integration.
- Revisit: any provider migration or retrieval failure; before promoting a source to operational.

## E-003 — Git metadata write restriction

- Date: 2026-11-03. Task: T-000. State: encountered and resolved.
- Method/result: repository initialization succeeded; ordinary `git add`/commit could not create `.git/index.lock` because Git metadata is read-restricted by the workspace sandbox. An approved escalated Git command created the initial commit.
- Lesson: a writable project directory does not imply writable Git metadata in this environment. Request the scoped Git permission when needed; do not delete lock files or change filesystem permissions to work around the boundary.
- Existing user identity was retained. Ordinary attribution labels were added; no signing keys were created.

## Planned experiments (not executed)

- T-001: one real daily field then a 31-day window; record provider wait, bytes, current request schema, exact metadata and independent raw samples.
- T-002/T-003: dependency decoding and token-free globe, poles/dateline, actual daily overview vs tiles, cold/warm memory/latency.
- T-008: 48-hour regional hourly slice and a bounded global hourly estimate.
- M2: evaluate which seasonal chart and explanation best answer the user's own questions; add a specific hypothesis to `FEEDBACK.md` before testing.
