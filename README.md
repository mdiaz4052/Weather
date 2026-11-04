# CliMaps

A personal climate exploration workspace: a browser-based globe, historical playback, and progressively richer explanations of places and climate.

Session zero delivers the implementation specification and repository skeleton. There is no runnable application yet.

## Agreed direction

- Run locally in a browser, with online data access first. Offline use and desktop packaging remain optional future milestones.
- Begin with global exploration and time playback; add place profiles and comparisons progressively.
- Prefer daily temperature exploration, with a genuine hourly path; monthly remains useful for overviews.
- Prioritize air temperature, sea surface temperature (confirmed first ocean layer), and precipitation.
- Prefer free sources. Optional accounts, connectors, and paid sources must disclose their requirements.
- Preserve scientific meaning, provenance, resolution, missingness, and uncertainty.
- Plan near-term work concretely while keeping longer-term possibilities adaptable.
- Record decisions, outcomes, and tool/model attribution in ordinary text and Git metadata.

## Read the project

| Start here | Purpose |
| --- | --- |
| [Current state](docs/STATUS.md) | Confirmed choices, implementation status and open questions |
| [Product specification](docs/SPECIFICATION.md) | Principles, UX, scope and acceptance criteria |
| [Architecture](docs/ARCHITECTURE.md) | Modules, API, persistence, playback and resource management |
| [Scientific rules](docs/SCIENCE.md) | Time support, units, masks, baselines and validation |
| [Source register](docs/SOURCES.md) | Researched sources and unproven integration gates |
| [Rolling plan](docs/PLAN.md) | Phases, milestones, goals, tasks and review triggers |
| [Workflow pseudocode](docs/PSEUDOCODE.md) | Planning, acquisition, sampling and playback sketches |
| [Decisions](docs/DECISIONS.md) / [experiments](docs/EXPERIMENTS.md) / [feedback](docs/FEEDBACK.md) | Durable lessons and reasons for changes |
| [Worklog](docs/WORKLOG.md) / [contributor guide](AGENTS.md) | Agent-agnostic handoffs and attribution |

## Skeleton

```text
apps/web/                 Browser boundary and map interface sketch
services/api/             Local service boundary
packages/contracts/       Source schema, API examples, provider interface sketch
packages/science/         Scientific operations boundary
catalog/                  Four source candidates; no working integrations implied
docs/                     Specification, plan, decisions and development records
experiments/              Small reproducible capacity report
tools/                    Dependency-free specification checks and capacity model
tests/                    Planned validation approach
data/                     Ignored runtime data; no archive downloaded
```

## Verify session-zero artifacts

From the repository root, with Python 3.11 or newer:

```powershell
python tools/check_specs.py
python tools/estimate_storage.py
```

The checks do not validate a running application, live climate values, browser rendering, full JSON Schema compliance or TypeScript compilation. The capacity model uses illustrative uncompressed arrays; it is not a download-size or performance benchmark.

## Next milestone

Prove one real daily-temperature field, then a 31-day globe/playback slice, with source provenance and native-cell point values. Proposed stack: TypeScript/React/CesiumJS plus a local Python service. Verify the source path and Windows dependencies before locking versions. The preferred ERA5 path needs a free CDS account, token and dataset terms acceptance; no credentials are needed to review this repository.

Local Git was initialized on 2026-11-03. Attribution uses ordinary tool/model labels. No remote, public deployment, code license, paid service, or account registration is configured. Git protects tracked source/specifications; it does not back up ignored runtime data.
