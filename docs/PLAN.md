# Rolling plan

Updated: 2026-11-03. Plan by outcomes, not calendar promises. Stable IDs survive reprioritization; completed or superseded work remains traceable. Keep one active milestone and at most two active implementation tasks unless the user chooses otherwise.

## Organization protocol

**Vision** describes enduring purpose. **Phases** group capabilities with different readiness needs. **Milestones** are demonstrable outcomes with exit evidence. **Goals** explain the user's benefit within a milestone. **Tasks** are small verifiable actions that advance a goal. Keep the hierarchy visible in this file rather than maintaining five separate management systems.

Use three horizons: **Now** (detailed tasks and acceptance), **Next** (outcomes and dependencies), **Later** (options and hypotheses). Replan at a milestone exit, after meaningful user feedback, after a failed technical gate, or when source availability changes. No recurring ceremony is required while nobody is working on the project.

Task states: `ready`, `in_progress`, `blocked`, `done`, `deferred`, `superseded`. Milestone closure records evidence, unresolved limitations, the user-facing result, and the next smallest useful outcome. A failed spike can be done when it produced a useful documented conclusion; the feature it investigated is not thereby complete.

Every task needs an ID, goal, expected artifact, acceptance evidence, and dependency where relevant. Add an owner/tool while active; do not preassign all future work to agents. Estimates remain ranges after measurement, not fictional deadlines.

## Vision

An intuitive personal globe with broad, trustworthy climate data, genuine historical playback, place explanations, and eventually comparisons and educational/public use.

## Phase P0: foundation — Complete

### M0: session-zero specification

Goal G0: another person or tool can understand the project and implement the next slice without the chat transcript.

| Task | State | Artifact / acceptance |
| --- | --- | --- |
| T-000 | done | Local Git, specification, source research, skeleton/contracts, decisions/worklog, bounded capacity experiment, and passing skeleton checks. See W-20261103-01. Proposed architecture and integration gates remain explicit. |

M0 is a foundation deliverable, not a declaration that the user approved every proposed stack choice or that any climate connector works.

## Phase P1: credible exploration — Now (implementation not started)

### M1a: first real daily-temperature globe

Goal G1: explore a genuine global air-temperature field one day at a time, with trustworthy values and provenance.

| Task | State | Depends on | Artifact / acceptance evidence |
| --- | --- | --- | --- |
| T-001 | ready | User CDS setup for live retrieval | Bounded ERA5 source spike: one daily field first, then a proposed 31-day window. Confirm current API shape, licensing, source time/grid metadata, account requirements, queue latency, actual latest availability, global retrieval size, and numerical samples. Evaluate provider daily stats vs hourly acquisition/local aggregation. Stop/replan if the approach cannot meet bounded acquisition. |
| T-002 | ready | None | Windows environment and dependency spike: record CPU/RAM/browser/free disk; verify Python decoding backends and a Cesium ellipsoid with local context; choose and lock package versions. No paid or token-required basemap request in default boot. |
| T-003 | ready | T-001, T-002 | Vertical slice: source -> immutable snapshot -> frame plan -> global overview -> daily timeline -> native point value. Prove seam/poles, masks, unit conversion, coherent seeking and 31-day real playback. Compare overview vs lazy tiles only if needed. |
| T-004 | ready | T-003 | Durability and budget: worker restart/cancel/retry, atomic ready publication, reservations/eviction, loopback origin restrictions, clear credential/missing/loading states; no large startup fetch. |
| T-005 | ready | T-003, T-004 | User walkthrough plus acceptance report: test F-01..04/F-10 and N-01..06 as applicable. Document cold/warm metrics and what confused the user; revise the next scope. |

M1a exit: a runnable documented Windows-first local app, genuine daily data and fixed-date validation, complete basic provenance, bounded storage/jobs, and a tested 31-day playback. A mock globe, monthly-only animation, synthetic temperatures, or a working provider download alone cannot close it.

### M1b: three variables plus hourly access

Goal G2: explore daily air temperature, daily SST and daily precipitation; inspect genuine hourly air temperature within a bounded historical window.

| Task | State | Dependency / acceptance |
| --- | --- | --- |
| T-006 | ready | M1a: NOAA OISST daily adapter, validated land/ocean masks, error/provisional fields and dates; cannot silently switch to ERSST monthly. |
| T-007 | ready | M1a: GPCP Daily connector, verified units/interval totals and actual dates. ERA5 precipitation is an explicit alternate if justified by source spike; no substitution without a decision entry. |
| T-008 | ready | M1a: hourly regional-temperature slice, proposed 48 hours, with real hourly frames/point chart, timezone labels, finite budget, and valid source provenance. Evaluate short global hourly window after measurement. |
| T-009 | ready | M1a: expand daily windows toward user-selected year; chunking, cache status, persisted views and explicit pin/eviction behavior. |
| T-010 | ready | Source baseline availability: create validated daily climatology and anomaly mode with coverage policy. Record full baseline size/cost; absolute mode still works without baseline. |

M1b exit: all three daily variables, hourly slice, saved views/resource status, and either validated anomaly mode or a user-approved scope revision recorded in decisions. Actual source coverage stays distinct.

## Phase P2: place understanding — Later, near horizon

### M2: "What is this place like?"

Goal G3: connect the moving globe to understandable local historical and seasonal charts.

Prospective tasks T-011..T-014: policy-compliant place search; same-source point history and seasonal charts; explanation/coverage panels and export sidecars; user review of chart usefulness and English/Spanish priorities. Define detailed acceptance after M1 use. A point-series provider such as Open-Meteo is optional and labeled separately.

## Phase P3: comparisons and breadth — Later options

### M3: compare places and periods

Goal G4: explain differences without mixing incompatible quantities, baselines or resolution. Candidates: linked side-by-side views; common-period charts; difference maps on an explicit comparison grid; long historical monthly context via ERSST/GISTEMP/GPCP; additional humidity, snow/ice, ocean and station sources. Prioritize from real use, not catalog counts.

## Phase P4: access and distribution — Later options

- **M4 offline packs:** choose place/area, variable, dates and detail; estimate footprint and rights; export versioned manifests and assets; verify without network. Ordinary caches are not an offline product promise.
- **M5 educational/public release:** source/code-license choices, privacy/accessibility review, hosting/cost/abuse controls, redistribution review, public documentation, and realistic support expectations. Public browser delivery needs a different deployment/access design from the local service.
- **M6 forecasts and scenarios:** separate time semantics, issue/valid times, ensembles, scenarios and uncertainty. Do not merge them into observational history without explicit visual and scientific distinctions.

These milestone labels are placeholders; reorder, split or discard them when evidence warrants. Offline packaging and public distribution are independent choices.

## Optional task roles

Use these as temporary perspectives, not seats that must be filled: product/UX (simplicity and usefulness), data/science (semantics and validation), implementation (code and integration), verification (checks and reproducibility). One person or agent may cover all. Add a role-specific checklist only after a repeated workflow proves useful. Do not require handoffs or multiple agents for routine work.

## Milestone review questions

What can the user do now? What evidence supports correctness? What did usage reveal? What failed or changed upstream? What is the smallest next improvement? Which earlier assumptions should be kept, revised or retired? Record conclusions once, link them from the plan, and avoid duplicating entire logs.
