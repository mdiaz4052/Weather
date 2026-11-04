# Current state

Updated: 2026-11-03 (America/New_York). M0 session-zero specification is complete; implementation has not started. Next milestone: M1a.

Repository: [mdiaz4052/Weather, branch CliMaps](https://github.com/mdiaz4052/Weather/tree/CliMaps). Local `CliMaps` tracks `origin/CliMaps`; the original local commit history was preserved when publishing this branch.

## Confirmed by the user

- Personal exploration first; public and educational use remain possibilities.
- Browser application running locally; online data access first. Offline packs and desktop packaging can wait.
- Globe from the beginning, navigable to any location. Playback first, place profiles next, comparisons later.
- Temperature, ocean, precipitation first; sea surface temperature is the first ocean variable.
- Daily temperatures preferred over monthly; hourly is desirable. Preserve this when scoping the first implementation.
- Historical observations and reanalyses first; current conditions, forecasts, and scenarios later as distinct categories.
- Free sources first, paid connectors optional. No purchases authorized.
- Approximately 100 GB SSD budget; user reports NVIDIA RTX 5080 with 16 GB graphics memory. System RAM, CPU, and network throughput are unmeasured.
- Agent/tool and model labels in metadata; cryptographic signing was not requested.
- Session zero should deliver a comprehensive specification and repository skeleton, with bounded experiments where useful.

## Session-zero result

The specification is in `docs/SPECIFICATION.md`; engineering detail is in `docs/ARCHITECTURE.md` and `docs/SCIENCE.md`. `docs/SOURCES.md` records checked primary sources and explicitly distinguishes documentary verification from working integrations. `docs/PLAN.md` contains the next tasks and later horizons.

The repository contains illustrative contracts, source descriptors, pseudocode, and a reproducible storage model. It does not contain a running browser app, data service, credential setup, live connector, downloaded climate archive, or benchmarked globe.

## Proposed implementation choices, subject to M1 evidence

- React + TypeScript + Vite; CesiumJS behind a small map interface.
- Python + FastAPI service with xarray-based adapters; SQLite metadata and one bounded worker.
- ERA5 daily statistics for air temperature, with ERA5 hourly as the hourly path.
- NOAA OISST v2.1 for daily sea surface temperature; NOAA GPCP daily for initial daily precipitation.
- Begin with selected daily windows; maintain a broad catalog without downloading complete archives.
- Local coordinate entry/click is sufficient before place-name search. Public geocoding requires a separately checked provider policy.

## Open questions and gates

| Item | Consequence | When to resolve |
| --- | --- | --- |
| Free CDS account, dataset terms acceptance, and token | Needed for the preferred ERA5 acquisition path; no credentials needed for session zero | T-001, before that integration |
| Daily-statistics request grid options and queue latency | Determines whether to request coarser data or coarsen after retrieval | T-001 |
| CPU, RAM, browser, SSD free space, bandwidth | Sets measured performance and worker limits | T-002 |
| Initial demonstration dates and locality | Proposal: 2020-01-01 through 2020-01-31, with equatorial, coastal, mountain, and polar test points | T-001/T-003 |
| First hourly experience: point/region or global window | Design supports both; proposal is a 48-hour regional globe overlay plus a point chart after daily playback works | End of M1a |
| Units and language | Proposal: Celsius and mm, Fahrenheit toggle; English first with translation-ready text and Spanish later | First UX review |
| Project name and code license | CliMaps is a working name; no open-source license selected or public distribution planned | Before publication |

No uncertainty above prevents completing the session-zero specification. Do not silently convert these proposals into user-approved facts.
