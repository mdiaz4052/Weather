# CliMaps implementation specification

Version: 0.1, session-zero working specification. Date: 2026-11-03.

Status labels: **confirmed** = user direction; **proposed** = concrete default that can change after a spike or UX review; **deferred** = supported by the vision but outside the active milestone. Engineering details below are design requirements unless explicitly marked otherwise; they are not claims of existing implementation.

## 1. Product purpose

Help one curious person explore how Earth's climate and historical weather vary over space and time, then understand what those views mean for a selected place. The main experience is a navigable globe with real historical fields, playback, and understandable context. Expand the same workspace to more variables and source types over time.

Success means a user can answer questions such as: What happened during this period? How does this place vary through the year? How unusual was this day relative to an explicitly chosen baseline? Which measurements or models support this picture?

"Any source" means an extensible connector architecture and visible source catalog. It cannot mean every provider works automatically: protocols, authentication, scientific semantics, formats, and rights differ. An unsupported source remains discoverable as a candidate until its connector and validation exist.

## 2. Core principles

1. **One clear exploration surface.** Prioritize place, variable, time, playback, and legend. Reveal expert controls progressively.
2. **Truth before smoothness.** Animation and interpolation must not imply observations or precision that the source lacks. Label daily mean, daily maximum, and instantaneous hourly values distinctly.
3. **Broad availability through federation.** Query or fetch bounded subsets; preserve source-specific capabilities. Catalog breadth is independent of local archive size.
4. **Inspectability.** Every displayed layer exposes its provider, dataset/version, variable definition, time support, grid, method, quality status, retrieval time, and citation.
5. **Source stability during exploration.** Zooming or scrubbing must not silently switch sources or statistical definitions. Offer an explicit alternative when coverage ends.
6. **Local ownership and bounded resources.** Store metadata and reusable working data locally. Network access is expected initially; full offline operation is deferred.
7. **Education through context.** Explain a selected quantity in plain language; distinguish weather events, seasonal climate, anomalies, and projections.
8. **Rolling planning.** Commit to the next demonstrable outcome, collect usage evidence, and revise the path without rewriting history.
9. **Portable stewardship.** Plain files, Git, stable IDs, source citations, and honest tool attribution let another person or agent resume work.

## 3. Scope and delivery boundaries

### M1a: smallest real daily-temperature globe

- A locally served browser app with a global globe and token-free geographic context layer.
- One authentic air-temperature dataset, selected daily window, play/pause/step/scrub, date and units.
- Initial proposal: a 31-day window in 2020; dates are configurable, not hardcoded product coverage.
- Global camera navigation and numeric coordinate navigation; selecting a point shows the representative source cell, daily value, and source details.
- Absolute daily mean air temperature at 2 m is the initial mode; daily minimum/maximum and anomalies require their own supported calculations.
- Recent dates use the provider's actual published availability, not today's date.
- Missing cells, unavailable frames, authentication errors, and preparation jobs have explicit states.
- A pinned data snapshot can be revisited while its retained assets exist.

### M1b: preferred exploration baseline

- Extend daily playback to a user-selected year using chunked acquisition rather than an all-at-once requirement.
- Add daily sea surface temperature and daily precipitation, each with its actual coverage and definitions.
- Add an hourly-temperature vertical slice for a selected region and short window, retaining globe context and a point chart. Initial proposal: 48 hours. Global hourly windows are a later performance gate, not prohibited by the architecture.
- Add reusable saved views, a data/cache status panel, and baseline-aware anomaly mode once a validated climatology is available.

Daily time resolution is a user priority. A monthly-only globe cannot close M1a. M1b is not complete without its hourly slice or an explicit, documented user scope revision.

### M2: place understanding

- Place-name search through a policy-compliant geocoder.
- Historical series, seasonal profiles, missing-data coverage, and source explanations for a selected place.
- WeatherSpark-inspired clarity: coordinated seasonal charts, concise explanations, and visible units. Create original chart designs and wording; do not scrape or reuse its proprietary content.
- Show a mean temperature curve without inventing daily highs, lows, humidity, or distributions from a monthly mean.
- Start with the same underlying dataset as the globe. Additional providers are optional, visibly separate series.

### Later horizons

Comparisons; more atmospheric/ocean/ice variables; station and satellite overlays; regional higher-resolution sources; downloads and offline packs; public/educational distribution; forecasts and future scenarios. These remain adaptable prospects, with separate readiness gates in `PLAN.md`.

## 4. Primary user journeys

### Explore a field through time

Open globe -> choose Temperature -> choose Daily mean -> choose date range -> see estimated preparation/storage requirements if data are not ready -> prepare a bounded window -> play, pause, or step -> select a place -> inspect the representative cell and provenance.

Keep the dataset, statistic, unit, palette range, and baseline fixed during playback. The screen date advances only when the corresponding field is displayed. Show buffering rather than relabeling an old field with a new date.

### Understand a selected place

Click or navigate to coordinates -> show a marker and compact value card -> expand the place drawer -> show history and seasonal profile when available -> inspect coverage and methods. A location on a coarse grid is a representative area, not an exact thermometer at the marker.

### Discover a new variable or source

Search the catalog -> filter by variable, coverage, source category, resolution, access requirement, and readiness -> inspect source card -> select an available connector or see why a candidate is not yet usable. Unsupported options cannot look like working layers.

### Revisit an exploration

Save a named view -> retain camera, dataset snapshot ID, variable/statistic, dates, units, baseline, palette, selected point -> reopen -> resolve retained assets or explain what must be fetched again. Saving the view alone does not promise offline data retention.

## 5. Interface contract

```text
 CliMaps   [Place / coordinates]       [Temperature v]  [Daily mean v]
 +---------------------------------------------------------------+
 |                                                               |
 |                         GLOBE                                 |
 |                                            [Selected place]   |
 |                                            Value + unit       |
 |                                            Source cell size   |
 |                                            [Explore place]    |
 |                                                               |
 | [Home] [2D optional later]           Legend: fixed range + unit |
 +---------------------------------------------------------------+
 [Play] [Previous] [Next]  Date |------------o------------| Range
 Daily / Hourly / Monthly     [Source and method] [Data status]
```

- Primary choices are user concepts, not provider file names. "Temperature" expands to air vs sea surface and statistic; the exact active quantity remains visible.
- One main scalar overlay at a time initially. Avoid a stack of opaque rasters whose meaning is unclear.
- Ocean selection exposes sea surface temperature explicitly. Land in that field is "not applicable," not zero.
- Timeline supports direct date entry as well as dragging. Daily defaults to a UTC day; hourly labels include UTC. Local-day summaries are explicit separate requests.
- Changing Daily to Hourly does not interpolate a daily mean into 24 invented measurements. Unsupported options explain coverage or trigger a genuine hourly request.
- Default daily playback target is two data frames per second; users can change speed. Camera animation frame rate is a separate measure.
- Keep color limits fixed for the selected view. Anomalies use a zero-centered diverging palette; precipitation uses an appropriate sequential palette. Offer accessible alternatives and show clipping in the legend.
- Explain uncertainty accessibly. If unavailable, say so; do not manufacture a confidence score.
- Place panel stays collapsible so the globe remains central. Preserve selected point while scrubbing.
- Avoid automatic globe spin or autoplay; respect reduced-motion preferences.
- Keyboard operation, visible focus, labeled controls, readable contrast, a numeric value alternative to colors, and an accessible series table are required as their views are introduced.
- Initial text is English (proposal), with user-visible strings separated from scientific identifiers to allow Spanish and other languages later.

## 6. Functional requirements and acceptance

| ID | Requirement | Verification / delivery |
| --- | --- | --- |
| F-01 | Global globe from first app milestone | Navigate equator, dateline, and both poles; no Mercator-only gaps presented as data gaps; M1a |
| F-02 | Real daily temperature playback | Play a 31-day real-data window; date, field, legend, and point sample remain coherent; M1a |
| F-03 | Navigate any coordinates | Accept latitude [-90,90], longitude [-180,180]; normalize dateline consistently; show unavailable coverage honestly; M1a |
| F-04 | Provenance on demand | Source card identifies quantity, version/snapshot, calendar, units, grid, quality, retrieval and citation; M1a |
| F-05 | Extensible source catalog | Distinguish candidates, implemented adapters, tested connectors, and operational layers; register a second source without changing timeline logic; M1b |
| F-06 | SST and precipitation | One validated daily dataset for each; preserve different coverage and resolution; M1b |
| F-07 | Hourly temperature | Genuine hourly regional frames and point series for a 48-hour test; UTC times, missing-hour states; M1b |
| F-08 | Place profiles | History and seasonal chart with coverage and defined reference period; M2 |
| F-09 | Anomaly mode | Baseline and method visible; unavailable where baseline fails coverage policy; M1b or explicit replan |
| F-10 | Bounded acquisition | Estimate, queue, cancel, retry and inspect progress; do not download an entire archive on startup; M1a |
| F-11 | Saved views | Restore parameters and immutable snapshot references; say when assets were evicted; M1b |
| F-12 | Resource status | Show managed bytes, pinned data, reclaimable cache, in-flight reservations, and source health; M1b |
| F-13 | Reproducible export | Export data with method/provenance sidecar and view metadata; M2; image export only after CORS/attribution checks |

## 7. Nonfunctional requirements

These are proposed acceptance targets to measure, not benchmark claims. Reference hardware is the user's Windows machine; record CPU, RAM, graphics/browser versions, viewport, source, resolution, cache state, and date window before comparing results.

- **N-01 responsiveness:** after app assets are local, interactive shell within 5 seconds; normal controls respond within 100 ms excluding data retrieval. Target at least 30 camera frames/sec at 1920x1080 on the reference system.
- **N-02 playback:** a fully prepared 31-day window plays at two data frames/sec without date/field mismatch. Measure p50/p95 frame-ready latency and missing/buffered frames. Cold provider retrieval has no fixed completion guarantee; it must show progress and allow cancellation.
- **N-03 memory:** start with a 128 MB decoded climate-frame buffer and roughly 1 GB total browser-memory target; measure separately from GPU memory. One heavy backend worker, with a proposed 2 GB working-set target; tune after system RAM is known.
- **N-04 disk:** managed data cap 90 decimal GB plus 10 GB headroom inside the user's approximate 100 GB allocation; stop new writes when reservations or free-disk policy fail. See `ARCHITECTURE.md`.
- **N-05 reliability:** bounded retries with jitter, provider rate-limit handling, atomic publication, durable job state, and explicit stale data. A canceled or corrupt acquisition cannot appear as a ready snapshot.
- **N-06 privacy:** local metadata and preferences; no telemetry by default. Provider requests expose requested coordinates or areas to that provider. Do not add browser geolocation without an explicit user action.
- **N-07 portability:** document Windows setup first; keep core code and records usable by other tools. No GPU compute or proprietary cloud account required for the core rendering design.
- **N-08 accessibility:** semantic controls and accessible textual/chart alternatives. Full accessibility review is a public-release gate.
- **N-09 reproducibility:** pin code dependencies during implementation, snapshot data inputs and transforms, distinguish evicted content from retained records, and include citations in exports.

## 8. Source and scientific policy

Detailed rules are in `SCIENCE.md` and `SOURCES.md`. At minimum, preserve source-native time bounds/calendar, units, masks, scientific quantity, and provenance. No automatic provider blending; no unrestricted download proxy; no inferred street-scale accuracy from zooming. Historical, provisional, current, forecast, and scenario states remain visibly distinct.

The catalog can include station series, gridded fields, imagery, vectors, and polygons, but each uses declared capabilities and a suitable rendering/query contract. M1 implements gridded scalar fields only. Broad source support grows incrementally through tested adapters.

## 9. Feedback and evolution

After each demonstrable slice, record what the user tried, what they could or could not understand, what was slow, and the next hypothesis. No automated usage tracking is needed initially. Use `FEEDBACK.md`; revise `PLAN.md` and record consequential scope or architecture changes in `DECISIONS.md`.

Session zero is complete when this specification, the researched source register, skeleton/contracts, rolling plan, attribution convention, and reproducible bounded experiment are in Git, with implementation uncertainties stated plainly. User acceptance of every proposed technical choice is not assumed.
