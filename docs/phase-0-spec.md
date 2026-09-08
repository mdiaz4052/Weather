# Weather Visual Lab — Phase 0 Foundation Implementation Specification

**Project:** Weather Visual Lab
**Repository:** `mdiaz4052/Weather`
**Phase:** 0 — Foundation
**Specification date:** September 8, 2026
**Status:** Implementation-ready

---

# 1. Mission

Implement the first functional foundation of an interactive planetary atmospheric visualization laboratory.

The project shall not initially attempt to reproduce a conventional meteorological weather map. Its purpose is to investigate whether atmospheric state and motion can be represented through a flexible visual language that makes weather intuitively understandable as a physical fluid and thermodynamic system.

The foundational conceptual pipeline is:

```math
Weather Data→Normalized Physical Fields→Visual Transformations→Scale-Aware Representations→Interactive Atmosphere
```

Phase 0 shall prove this architecture using real NOAA Global Forecast System data and an interactive three-dimensional Earth.

The initial user-visible variables are:

- near-surface temperature;
- precipitation;
- near-surface wind.

The implementation must nevertheless be structured so that humidity, pressure, air density, upper-atmospheric levels, thermodynamic derived quantities, ensemble uncertainty, vertical columns, transects, and alternative international data providers can be added later without replacing the core architecture.

---

# 2. Governing Design Principle

The project shall implement a **visual-encoding engine**, not a collection of hard-coded weather layers.

The software architecture must therefore distinguish:

```math
physical quantity
```

from

```math
visual representation.
```

For example, temperature must not internally mean “red color.” It shall mean a numerical atmospheric field that can be assigned to one or more visual transformations.

Likewise:

```math
T→Hue
```

must be an encoding decision rather than a property of the temperature data model.

The eventual engine should be capable of relationships such as:

```math
T→Hue
```

```math
RH→Brightness
```

```math
ρ→Particle Density
```

```math
∣v⃗∣→Filament Length
```

```math
v⃗→Pulse Direction
```

```math
σ→Visual Diffusion
```

without requiring the underlying atmospheric data classes to change.

Phase 0 exposes only a restricted subset of this freedom to the user, but the implementation must preserve this general internal model.

---

# 3. Core Architectural Principles

## 3.1 Provider independence

NOAA GFS is the first provider, not the application's internal atmospheric model.

NOAA abbreviations such as `TMP`, `UGRD`, `VGRD`, and `PRATE` shall terminate at the provider-adapter boundary.

The renderer shall receive canonical fields such as:

- `air_temperature_2m`
- `precipitation_rate_surface`
- `eastward_wind_10m`
- `northward_wind_10m`
- `wind_speed_10m`

Future ECMWF, ERA5, GEFS, HRRR, or other sources must be capable of producing the same canonical representations.

## 3.2 Physical data shall remain separate from visual state

Changing a color gradient, opacity, particle count, filament length, or animation speed shall never mutate the atmospheric data itself.

## 3.3 Simple interface, general engine

Phase 0 shall expose only temperature, precipitation, and wind controls.

The internal system shall nevertheless support a registry-based architecture capable of accepting additional fields and mappings.

## 3.4 Continuous atmosphere

The default visualization shall avoid exposing raw model grid cells.

The atmosphere should appear spatially continuous through interpolation and graphical rendering.

A diagnostic mode may later reveal native grids.

## 3.5 Semantic coarse-graining as a future-first-class concept

The intended long-term hierarchy is:

```math
continuous field↔coherent structure↔filament↔particle.
```

Phase 0 does not need to implement the complete semantic transition system.

It must, however, establish interfaces that permit rendering strategy to depend upon geographic scale.

## 3.6 Time is fundamental

The atmosphere is not a static dataset.

All principal data structures shall support sequences of valid atmospheric times from the beginning.

## 3.7 Vertical structure is fundamental even when deferred

Phase 0 uses surface and near-surface fields, but every canonical field descriptor must explicitly contain vertical-coordinate metadata.

This prevents the later addition of pressure levels and atmospheric columns from requiring replacement of the field model.

## 3.8 Uncertainty shall never be fabricated

The long-term visual language may use blur, diffusion, fading, reduced contrast, loss of structural coherence, or related transformations to represent forecast uncertainty.

Phase 0 shall not infer uncertainty merely from forecast age.

Real uncertainty visualization shall wait for a defensible uncertainty source such as ensemble spread.

---

# 4. Phase 0 Success Definition

Phase 0 is complete when a user can open the Weather Visual Lab and:

1. view an interactive three-dimensional Earth;
2. load a real recent NOAA GFS model run;
3. display temperature as a configurable continuous visual field;
4. display precipitation as a configurable field or texture;
5. display wind using animated directional filaments;
6. see wind direction through a traveling brightness pulse along each filament;
7. see wind magnitude affect filament length;
8. combine temperature, precipitation, and wind simultaneously;
9. toggle each representation independently;
10. modify a bounded set of visual parameters without reloading data;
11. scrub across forecast time;
12. play and pause the atmospheric timeline;
13. change playback speed;
14. inspect the model run time and valid forecast time;
15. click or inspect a geographic position and retrieve the underlying field values;
16. zoom and rotate the globe smoothly;
17. use different data/rendering resolutions according to geographic scale;
18. distinguish actual model timestamps from visually interpolated states;
19. continue to function with deterministic local fixture data when NOAA is unavailable;
20. pass automated frontend, backend, integration, and build validation.

The success criterion is **not** whether the initial visual design is aesthetically final.

Phase 0 succeeds if changing and experimenting with visual mappings is inexpensive.

---

# 5. Explicit Phase 0 Non-Goals

The following shall not block Phase 0 completion:

- atmospheric Column View;
- vertical transects;
- pressure-level navigation;
- humidity;
- pressure visualization;
- air-density visualization;
- dew point;
- wet-bulb temperature;
- potential temperature;
- equivalent potential temperature;
- CAPE or stability visualization;
- vorticity;
- divergence;
- moisture transport;
- upper-air winds;
- cloud-volume rendering;
- hurricane tracking;
- ensemble uncertainty;
- historical reanalysis;
- HRRR integration;
- ECMWF integration;
- semantic cyclone/front detection;
- full particle-fluid simulation;
- WebGPU dependency;
- mobile optimization;
- production cloud deployment;
- meteorological forecast alerts;
- user accounts;
- saved cloud configurations;
- scientific data export.

Interfaces may reserve these capabilities, but Phase 0 shall not expand merely to implement them.

---

# 6. Technology Baseline

The project shall use a browser-first architecture.

## 6.1 Frontend

Preferred baseline:

- React 19.x;
- TypeScript;
- Vite 8.x;
- CesiumJS 1.145 or compatible later patch;
- WebGL2 rendering;
- standard CSS or a lightweight component styling system;
- Vitest;
- Playwright.

React's current documented major is 19.2.

Vite 8 is the current generation, and the presently supported line is Vite 8.2; Vite also requires a modern Node runtime.

CesiumJS 1.145 was released September 1, 2026 and provides the current open-source 3-D globe foundation.

## 6.2 GPU strategy

Phase 0 shall target WebGL2.

WebGPU must not become a Phase 0 requirement.

deck.gl may later become a complementary renderer or GPU abstraction, but it shall not be required unless a concrete rendering need justifies it. deck.gl 9.4 substantially extends WebGPU support, but the project itself still describes its WebGPU path as experimental/not production-ready.

The rendering architecture shall therefore allow future adoption of deck.gl, luma.gl, raw WebGPU, or another renderer without making them Phase 0 dependencies.

## 6.3 Atmospheric-data service

Preferred baseline:

- Python 3.12+;
- FastAPI;
- NumPy;
- ECMWF ecCodes Python interface;
- HTTP client with timeout/retry support;
- pytest;
- Ruff.

FastAPI's current release family is 0.141.x.

ecCodes is maintained specifically for GRIB/GRIB2 and related WMO formats, and version 2.48.0 was released in July 2026.

`cfgrib` may be evaluated but shall not be architecturally required. Direct ecCodes decoding is preferred for the bounded initial field set.

## 6.4 Version policy

Resolved production dependencies shall be pinned through lockfiles.

Do not hard-code this specification's September 2026 patch versions if newer compatible patch releases are available when implementation begins.

Major-version changes require explicit compatibility review.

---

# 7. Repository Structure

Use a monorepo.

Recommended structure:

```text
Weather/
├── apps/
│   └── web/
│       ├── src/
│       ├── public/
│       ├── tests/
│       └── package.json
│
├── services/
│   └── weather-api/
│       ├── weather_api/
│       ├── tests/
│       └── pyproject.toml
│
├── contracts/
│   ├── weather-manifest.schema.json
│   ├── field-descriptor.schema.json
│   └── README.md
│
├── fixtures/
│   └── phase0/
│
├── docs/
│   ├── architecture.md
│   ├── data-contract.md
│   ├── visual-grammar.md
│   ├── source-provenance.md
│   └── phase-0-spec.md
│
├── scripts/
├── .github/
│   └── workflows/
├── README.md
└── .gitignore

```

Large weather datasets shall not be committed.

Only compact deterministic fixtures needed for tests and demonstrations may live in the repository.

---

# 8. NOAA GFS Provider

Phase 0 shall use NOAA/NCEP's Global Forecast System.

GFS provides global 0.25° GRIB2 products extending through forecast hour 384.

NOMADS currently provides a GRIB Filter capable of selecting fields, levels, forecast times, and geographic subsets. NOAA is explicitly migrating major-model workflows away from OpenDAP toward the GRIB Filter service.

Therefore:

**NOMADS GRIB Filter shall be the preferred initial live-data pathway.**

The provider adapter must nevertheless isolate this URL structure from the rest of the application.

---

# 9. Initial Atmospheric Variables

## 9.1 Temperature

Source concept:

- GFS `TMP`
- 2 m above ground

Canonical field:

```text
air_temperature_2m

```

Canonical unit:

```text
K

```

Display conversions:

```text
°C
°F

```

Conversions occur only in presentation code.

## 9.2 Wind

Source concepts:

- `UGRD` at 10 m above ground
- `VGRD` at 10 m above ground

Canonical fields:

```text
eastward_wind_10m
northward_wind_10m

```

Canonical unit:

```text
m s^-1

```

Derived canonical field:

```math
v=u2+v2
```

```text
wind_speed_10m

```

Direction shall be calculated from the U/V components.

Interpolation through time shall interpolate U and V separately rather than interpolating angular direction.

## 9.3 Precipitation

Prefer a precipitation-rate field where available:

```text
precipitation_rate_surface

```

Canonical unit:

```text
kg m^-2 s^-1

```

A display conversion may use:

```text
mm h^-1

```

where appropriate for liquid-water-equivalent precipitation.

If the selected GFS product makes rate unavailable for a requested time, accumulated precipitation may be used only through an explicitly documented differencing operation.

Accumulated precipitation must never silently be presented as instantaneous precipitation rate.

---

# 10. Canonical Field Contract

Each atmospheric field shall carry metadata equivalent to:

```text
FieldDescriptor
    id
    displayName
    physicalQuantity
    canonicalUnit
    sourceProvider
    sourceModel
    sourceVariable
    runTime
    validTime
    forecastLead
    horizontalGrid
    verticalCoordinate
    missingValuePolicy
    provenance

```

Vertical coordinates must support at least the following conceptual forms:

```text
surface
height_above_ground
pressure_level
altitude

```

Phase 0 will initially populate:

```text
surface
height_above_ground(2 m)
height_above_ground(10 m)

```

Pressure-level support need not be implemented in the UI yet.

---

# 11. Atmospheric Run Model

The system shall distinguish:

```math
model initialization time
```

from

```math
forecast valid time.
```

A run structure shall conceptually contain:

```text
WeatherRun
    provider
    model
    runId
    initializedAt
    availableValidTimes[]
    availableFields[]
    nativeResolution
    provenance

```

Every rendered frame must remain traceable to its model initialization and forecast lead.

The interface shall never imply that forecast fields are direct observations.

---

# 12. Data-Service Responsibilities

The atmospheric-data service shall perform:

```text
NOAA discovery
      ↓
GRIB subset request
      ↓
GRIB2 retrieval
      ↓
GRIB2 decoding
      ↓
canonical naming
      ↓
unit normalization
      ↓
missing-value handling
      ↓
optional render-resolution resampling
      ↓
cache
      ↓
provider-neutral API response

```

The browser shall not parse NOAA GRIB2.

---

# 13. Provider Adapter Interface

Define an internal provider abstraction comparable to:

```text
WeatherProvider

list_runs()
describe_run(run_id)
fetch_field(run_id, field_id, valid_time, bbox, lod)

```

`GFSProvider` shall be the only Phase 0 implementation.

Nothing outside the provider package may construct NOMADS-specific variable names or URLs.

---

# 14. Data Caching

NOAA shall not be repeatedly queried for identical data.

Cache two levels separately:

```text
raw/
    original downloaded GRIB2 subsets

normalized/
    decoded canonical field arrays

```

Cache keys must include:

- provider;
- model;
- run initialization;
- valid time;
- variable;
- vertical level;
- geographic extent;
- requested LOD/resolution.

Cached data must retain provenance metadata.

Failure to reach NOAA should permit previously cached runs to remain usable.

---

# 15. Client Field Transport

Do not send million-element arrays as ordinary JSON.

Canonical numerical grids should be transmitted as typed binary field payloads, preferably 32-bit floating point for Phase 0.

Metadata shall be supplied through the run/field manifest.

HTTP compression should be enabled.

The client shall reconstruct data using `Float32Array`.

Quantized 16-bit representations may be evaluated later if bandwidth becomes a material limitation.

---

# 16. Level of Detail

Raw GFS 0.25° resolution does not need to be transmitted globally at every camera scale.

Phase 0 should establish at least three logical rendering-resolution bands:

```text
LOD 0 — planetary
approximately 1.0°

LOD 1 — continental/regional
approximately 0.5°

LOD 2 — bounded regional/native
up to approximately 0.25°

```

These are rendering products, not new meteorological observations.

Resampling must be documented.

The native source resolution must remain available in metadata.

Zooming shall be allowed to trigger LOD changes.

LOD switching should avoid abrupt visible flashing wherever practical.

---

# 17. Scale Context

Create an explicit scale classification independent of individual visual layers:

```text
planetary
synoptic
regional
local

```

Phase 0 may initially use camera height to determine the category.

The renderer must receive the current scale context.

Initially it may use that context only for:

- data resolution;
- filament density;
- filament length;
- sampling density;
- opacity/detail adjustments.

Future phases may replace entire representation strategies according to scale.

---

# 18. Visual-Encoding Engine

The core abstraction shall resemble:

```math
Field→Normalization→Transformation→Visual Channel→Representation
```

## Field

Numerical atmospheric quantity.

## Normalization

Maps physical values into a controlled visual domain.

Examples:

```text
fixed physical range
user-selected range
run-wide range
percentile-clipped range

```

Per-frame automatic renormalization shall not be the default because it can make identical physical values change appearance during playback.

## Transformation

Optional nonlinear operation.

Examples:

```text
linear
logarithmic
square root
clamped
smoothstep

```

## Visual Channel

Examples include:

```text
hue
brightness
saturation
opacity
particle density
particle size
filament length
filament width
pulse speed
pulse brightness
texture intensity
blur

```

Only a subset is exposed during Phase 0.

## Representation

Examples:

```text
continuous scalar field
textured scalar field
filament field
particle field

```

---

# 19. Visual Mapping Registry

Implement visual mappings through registered configuration rather than conditionals scattered throughout render code.

Conceptually:

```text
VisualMapping {
    id
    sourceField
    normalization
    transform
    targetChannel
    representation
    parameters
}

```

Phase 0 shall supply predefined mappings for temperature, precipitation, and wind.

This registry is the architectural seed of the eventual user-configurable visual language.

---

# 20. Temperature Representation

Baseline Phase 0 representation:

**continuous scalar field projected over the globe.**

Required controls:

- enabled/disabled;
- palette preset;
- low/high color;
- opacity;
- numerical normalization range;
- unit display.

At least one initial experimental palette should correspond to the conceptual cold→hot relationship discussed during design, but no particular palette is architecturally privileged.

A palette change must occur without refetching atmospheric data.

Color interpolation should preferably occur in a perceptually reasonable color space where practical.

---

# 21. Precipitation Representation

Baseline Phase 0 representation:

**semi-transparent scalar field with optional procedural texture.**

Required controls:

- enabled/disabled;
- intensity;
- opacity;
- palette/preset;
- texture amount.

Zero or negligible precipitation should remain visually unobtrusive.

Heavier precipitation may progressively increase texture density, brightness, opacity, or related properties.

The mapping is experimental.

Phase 0 need not decide whether the eventual preferred representation is droplets, streaks, particles, texture, color, or another mechanism.

---

# 22. Wind Representation

Phase 0 shall implement a distinctive baseline wind representation using **directional luminous filaments**.

Each sampled wind vector shall create a short oriented filament.

Let:

```math
v⃗=(u,v).
```

Then:

**orientation** derives from `v⃗`;

**filament length** derives from `∣v⃗∣`;

**travel direction of the luminous pulse** follows `v⃗`.

Thus a filament provides:

```math
axis+direction+magnitude.
```

The filament length mapping must be clamped/nonlinear so extreme winds do not create unusably long geometry.

The pulse is an animation effect and need not move at the actual physical wind velocity.

Pulse speed and brightness should remain visual parameters.

Required controls:

- wind enabled/disabled;
- filament density;
- length sensitivity;
- opacity;
- brightness;
- pulse brightness;
- playback/animation intensity.

Phase 0 does not require full physically advected particles or true streamlines.

Those are later experiments.

---

# 23. Wind Correctness Tests

Synthetic vector fixtures shall verify the renderer independently of NOAA.

Required test cases include:

```text
u > 0, v = 0    → eastward
u < 0, v = 0    → westward
u = 0, v > 0    → northward
u = 0, v < 0    → southward
u > 0, v > 0    → northeastward
u = 0, v = 0    → no directional filament

```

Pulse motion must agree with vector direction.

The implementation must correctly handle longitude wrapping.

---

# 24. Multi-Layer Composition

Temperature, precipitation, and wind shall be independently composable.

Initial render order:

```text
Earth/base
    ↓
temperature
    ↓
precipitation
    ↓
wind
    ↓
interaction/highlight layer

```

Each representation must expose opacity sufficient to prevent one active variable from necessarily obscuring all others.

No variable shall automatically disable another.

---

# 25. Globe

CesiumJS shall provide the geographic/camera foundation.

Required interactions:

- rotate;
- pan;
- zoom;
- reset global view;
- click/select geographic point.

Phase 0 shall not require Cesium ion or a proprietary imagery service.

The base Earth should remain visually subdued so atmospheric information dominates.

Use only data sources whose licensing permits inclusion, and document their provenance.

---

# 26. Geographic Inspection

Selecting a location shall expose a compact inspector showing:

```text
latitude
longitude
valid time
temperature
precipitation
wind speed
wind direction

```

Values shall derive from the same canonical data fields being rendered.

The inspector shall also show whether the displayed visual state lies exactly on a model timestep or is temporally interpolated.

---

# 27. Timeline

Implement a persistent atmospheric timeline.

Minimum controls:

```text
previous model frame
play/pause
next model frame
scrubber
playback speed
current valid time
forecast lead
model initialization

```

Phase 0 shall initially load a bounded forecast window such as:

```math
0 h→+24 h
```

with a manageable set of model frames.

A reasonable first target is approximately 3-hour visible model steps while retaining the ability to ingest finer source resolution later.

The data model must allow negative offsets and historical timestamps even if Phase 0 does not yet populate them.

---

# 28. Temporal Interpolation

Visual animation may interpolate between model timestamps.

Interpolation shall be clearly distinguished from additional forecast output.

For example:

```text
12:00 — genuine model frame
12:30 — visual interpolation
13:00 — genuine model frame

```

Temperature may use linear interpolation.

Wind shall interpolate U/V components.

Precipitation-rate interpolation may initially be linear but must remain documented as a visual interpolation.

Do not interpolate across missing-data gaps beyond a defined safe threshold.

---

# 29. Playback Speed

Playback speed is independent from meteorological time resolution.

Support several simple speed options such as:

```text
0.25×
0.5×
1×
2×
4×

```

Exact values may be adjusted during implementation.

The user should be able to pause at any point and scrub manually.

---

# 30. Initial Control Surface

Keep the primary UI intentionally small.

Recommended primary controls:

```text
TEMPERATURE
[✓] Visible
Palette
Range
Opacity

PRECIPITATION
[ ] Visible
Style
Intensity
Opacity

WIND
[✓] Visible
Density
Length
Pulse
Opacity

```

A collapsible Experimental panel may expose a few additional parameters.

Do not expose the complete generic mapping registry in Phase 0.

---

# 31. Experimental Visual Philosophy

All initial mappings shall be labeled internally as experiments, not canonical atmospheric encodings.

The software should make it cheap to answer questions such as:

- Is temperature more intuitive as hue or brightness?
- Does precipitation read better as texture or particles?
- Does filament length meaningfully convey wind speed?
- Does pulse direction improve comprehension?
- At what scale do filaments become cluttered?
- Should some visual channels disappear at planetary scale?

The system shall optimize for iteration rather than finality.

---

# 32. Future Atmospheric Column Architecture

Do not implement Column View in Phase 0.

Do preserve the navigation abstraction necessary for eventual modes:

```text
plan
column
transect

```

The current implementation may support only:

```text
plan

```

Field descriptors must already support vertical coordinates.

Camera/navigation code should not assume that the atmosphere will always be represented as a two-dimensional surface draped over Earth.

---

# 33. Future Scale-to-Altitude Behavior

The eventual intended default behavior is approximately:

```math
planetary scale→upper/global structures
```

```math
regional scale→lower/regional atmosphere
```

```math
local scale→near-surface detail.
```

However, scale and altitude must remain independent variables.

Future users must be able to inspect a small geographic region at high atmospheric altitude.

Phase 0 shall preserve this distinction in the application state even though altitude controls are not yet active.

---

# 34. Future Uncertainty Contract

Reserve optional metadata for uncertainty without rendering fabricated values.

Conceptually:

```text
UncertaintyDescriptor
    source
    metric
    units
    value/grid
    provenance

```

Future transformations may include:

```text
blur
diffusion
reduced opacity
reduced contrast
loss of fine structure
structural dispersion

```

Missing data and uncertainty shall never share the same visual semantics.

---

# 35. Application State

Keep atmospheric state independent from presentation state.

Recommended conceptual split:

```text
DataState
    selectedRun
    validTime
    loadedFields
    fieldCache

NavigationState
    camera
    scaleClass
    selectedLocation
    altitudeContext
    viewMode

VisualizationState
    activeMappings
    palettes
    opacity
    windSettings
    precipitationSettings

TimelineState
    playing
    playbackSpeed
    interpolationPosition

```

Avoid one global unstructured settings object.

---

# 36. Missing Data

Missing atmospheric samples must be represented explicitly.

Never convert missing values to zero.

A missing wind sample is not calm air.

A missing precipitation sample is not zero precipitation.

A missing temperature sample is not 0 K or 0 °C.

Renderers shall mask unavailable samples.

---

# 37. Loading and Error States

The UI shall distinguish:

```text
loading
source unavailable
field unavailable
cached data
missing data
rendering failure

```

When live NOAA access fails but cached or fixture data remain usable, the application should continue operating while displaying the source state.

---

# 38. Provenance

Every displayed live field must be traceable to:

- NOAA/NCEP;
- GFS;
- model initialization time;
- forecast valid time;
- forecast lead;
- requested variable;
- vertical level;
- source horizontal resolution;
- retrieval timestamp;
- transformation/resampling applied by the service.

Provide a Source/Details panel.

Scientific provenance must survive visual experimentation.

---

# 39. Deterministic Fixtures

Commit a small synthetic fixture set.

Required fixtures:

1. uniform temperature gradient;
2. deterministic precipitation cells;
3. cardinal-direction wind field;
4. rotational wind field;
5. missing-data region;
6. at least two temporal frames.

These fixtures permit:

- offline development;
- CI;
- visual debugging;
- renderer correctness tests;
- demonstration without NOAA.

Fixture data must be clearly labeled synthetic.

---

# 40. NOAA Integration Tests

Automated CI shall not depend upon live NOAA availability.

Live NOAA tests shall be isolated from deterministic tests.

If implemented, a live network check may run manually or on a non-blocking scheduled workflow.

A NOAA outage shall not make ordinary pull requests fail.

---

# 41. Backend Tests

At minimum test:

- GFS request construction;
- GRIB message selection;
- variable mapping;
- vertical-level mapping;
- unit normalization;
- valid-time extraction;
- run-time extraction;
- U/V wind handling;
- precipitation handling;
- missing values;
- longitude normalization;
- cache keys;
- manifest generation;
- binary field serialization;
- schema validation;
- malformed/partial upstream response handling.

---

# 42. Frontend Tests

At minimum test:

- manifest parsing;
- field loading;
- typed-array reconstruction;
- normalization;
- fixed color-domain behavior;
- color-map interpolation;
- wind magnitude;
- wind direction;
- U/V temporal interpolation;
- time scrubbing;
- layer toggles;
- playback state;
- scale classification;
- missing-value masking;
- source-information display.

---

# 43. Browser Integration Tests

Use Playwright for high-level workflows.

Minimum smoke workflow:

```text
open fixture mode
→ globe appears
→ enable temperature
→ change palette
→ enable precipitation
→ enable wind
→ press play
→ timeline advances
→ pause
→ click globe
→ inspector displays values
→ zoom
→ LOD/scale state changes

```

GPU rendering should not rely solely on exact pixel-equality screenshots because driver differences can produce irrelevant failures.

Use behavioral assertions and tolerant visual checks.

---

# 44. Performance Targets

After fields are loaded, target interactive rendering on a modern desktop browser.

Minimum Phase 0 goal:

- globe interaction remains responsive;
- normal playback does not create persistent UI stalls;
- target approximately 30 FPS or better in the default combined visualization on reference desktop hardware;
- rendering density automatically reduces at planetary scale when necessary;
- field loading occurs incrementally rather than loading the complete forecast archive into memory;
- prefetch only nearby timeline frames.

Do not sacrifice architecture merely to claim 60 FPS during Phase 0.

Instrument performance so bottlenecks can be identified.

---

# 45. Frame Loading Strategy

The client should maintain approximately:

```text
previous frame
current frame
next frame

```

and optionally prefetch one or two additional neighboring frames.

Do not immediately download every field at every forecast time.

When playback moves forward, evict older arrays according to a bounded cache policy.

---

# 46. Security and Network Discipline

The backend shall only fetch from explicit supported provider endpoints.

Do not expose an arbitrary URL-fetch endpoint.

This prevents the weather service from becoming a general network proxy.

Set:

- request timeouts;
- maximum response sizes;
- bounded geographic queries;
- bounded forecast windows;
- controlled retries.

No API keys should be required for the initial NOAA pathway.

---

# 47. Accessibility

Visual experimentation must not assume color alone is sufficient.

Phase 0 need not solve all accessibility questions, but:

- controls must be keyboard reachable;
- text controls require adequate contrast;
- color palettes shall be replaceable;
- numerical readouts must remain available;
- layer meaning shall not rely entirely upon one hue distinction.

This complements rather than restricts experimental visual design.

---

# 48. Development Convenience

Provide a standard developer startup path and, where practical, a simple macOS launcher that can start the local service and frontend without requiring repeated manual shell commands.

The ordinary technical startup path should also remain documented and reproducible.

The launcher must call the same underlying development commands rather than create a separate execution path.

---

# 49. Documentation

Phase 0 shall produce:

## README

Explain:

- project purpose;
- current status;
- supported data;
- startup;
- fixture mode;
- live NOAA mode.

## `architecture.md`

Describe:

```text
provider
→ canonical field
→ encoding engine
→ renderer

```

## `data-contract.md`

Describe field, run, time, grid, and vertical metadata.

## `visual-grammar.md`

Document:

- visual channels;
- mappings;
- experimental status;
- scale-aware representation philosophy.

## `source-provenance.md`

Document NOAA/GFS/NOMADS sourcing and transformations.

---

# 50. Continuous Integration

GitHub Actions shall run on pull requests and `main`.

Frontend validation:

```text
install
lint
typecheck
unit tests
production build
Playwright fixture smoke test

```

Backend validation:

```text
install
ruff
pytest
schema validation

```

CI must use deterministic fixture data.

No Phase 0 merge shall require NOAA network availability.

---

# 51. Recommended Implementation Sequence

## Milestone 0A — Repository Foundation

Create:

- monorepo structure;
- frontend scaffold;
- backend scaffold;
- CI;
- contracts;
- deterministic synthetic manifest;
- initial documentation.

Exit condition:

Both applications start and CI passes.

## Milestone 0B — Canonical Atmospheric Data

Implement:

- field descriptors;
- binary payload format;
- fixture loader;
- normalization;
- interpolation;
- field registry.

Exit condition:

The browser can load and interrogate deterministic temperature, precipitation, and wind fields.

## Milestone 0C — NOAA GFS Adapter

Implement:

- model-run discovery;
- NOMADS request construction;
- GRIB2 retrieval;
- ecCodes decode;
- canonical mapping;
- unit normalization;
- cache;
- provenance.

Exit condition:

A real GFS run produces the same canonical contract as the fixture provider.

## Milestone 0D — Globe and Temperature

Implement:

- Cesium globe;
- scale classification;
- scalar rendering;
- temperature palette;
- opacity/range controls;
- location inspector.

Exit condition:

Real GFS temperature can be navigated interactively.

## Milestone 0E — Precipitation

Implement:

- precipitation scalar field;
- texture experiment;
- composition controls.

Exit condition:

Temperature and precipitation can coexist without either representation owning the renderer.

## Milestone 0F — Wind Filaments

Implement:

- tangent-plane wind orientation;
- speed-dependent filament length;
- animated directional brightness pulse;
- density controls;
- synthetic directional validation.

Exit condition:

A user can visually determine wind direction and relative speed from the rendered filament behavior.

## Milestone 0G — Time

Implement:

- timeline;
- valid times;
- play/pause;
- stepping;
- playback speeds;
- temporal interpolation;
- neighboring-frame cache.

Exit condition:

Temperature, precipitation, and wind evolve coherently through a 24-hour forecast sequence.

## Milestone 0H — Integration and Laboratory Controls

Implement:

- combined default scene;
- source panel;
- experimental visual controls;
- loading/error states;
- cache fallback;
- performance instrumentation;
- browser smoke suite.

Exit condition:

The complete Phase 0 success criteria are satisfied.

---

# 52. Pull Request Strategy

Phase 0 should preferably be implemented through several bounded PRs corresponding approximately to the milestone groups above rather than one enormous initial commit.

A practical grouping is:

```text
PR 1 — Foundation + contracts + fixtures
PR 2 — GFS ingestion service
PR 3 — Globe + scalar representations
PR 4 — Wind + time + laboratory controls
PR 5 — Phase 0 integration/closure if required

```

The exact grouping may change if implementation reveals a cleaner boundary.

This project does not require scientific preregistration-style ceremony for visualization experiments.

The priorities are:

- understandable changes;
- functioning tests;
- clean architectural boundaries;
- fast iteration.

---

# 53. Phase 0 Acceptance Scenarios

Before declaring Phase 0 complete, demonstrate all of the following.

### Scenario A — Global atmosphere

Open the application in global view.

Load a recent GFS run.

Temperature visibly covers the Earth.

Rotate and zoom without losing responsiveness.

### Scenario B — Palette experiment

Modify the temperature palette.

Atmospheric data remain loaded.

The visualization changes immediately.

### Scenario C — Combined thermodynamic scene

Enable temperature and precipitation.

Adjust their opacity independently.

Both remain intelligible.

### Scenario D — Wind direction

Enable wind.

Observe filament orientation.

Observe brightness pulses traveling in the flow direction.

Increase/decrease filament density.

### Scenario E — Wind magnitude

Compare low-speed and high-speed synthetic regions.

High-speed vectors visibly produce longer filaments under the configured mapping.

### Scenario F — Timeline

Press Play.

The valid atmospheric time advances.

Temperature, precipitation, and wind interpolate between source frames.

Pause and scrub manually.

### Scenario G — Provenance

Select a location.

Display:

- coordinate;
- physical values;
- model initialization;
- valid time;
- forecast lead;
- source;
- interpolation state.

### Scenario H — Offline laboratory

Disable live NOAA access.

Start in fixture mode.

All principal visualization experiments remain functional.

### Scenario I — Scale

Move between planetary and regional camera heights.

The application changes field/render LOD without changing the physical meaning of the fields.

---

# 54. Scientific Integrity Rules

Even though this is primarily a visualization project, the following shall remain invariant.

1. Visual interpolation is not labeled as new meteorological data.
2. Missing data are not represented as zero.
3. Forecasts are not labeled as observations.
4. Unit conversions are explicit and tested.
5. U/V wind components remain the authoritative wind representation internally.
6. Resampled rendering grids retain source-resolution provenance.
7. Visual mappings do not alter source fields.
8. Uncertainty is not invented.
9. Derived quantities shall identify their derivation when introduced later.
10. Provider-specific terminology shall not leak into the renderer.

---

# 55. Architectural Extension Points

Phase 0 shall leave obvious extension points for:

```text
New Providers
    ECMWF
    ERA5
    HRRR
    GEFS

New Fields
    humidity
    pressure
    air density
    cloud water
    CAPE
    potential temperature

New Derived Physics
    divergence
    vorticity
    moisture flux
    equivalent potential temperature

New Representations
    particles
    streamlines
    coherent structures
    volume rendering

New Navigation
    altitude
    column
    transect

New Epistemic Channels
    ensemble spread
    uncertainty veil
    model disagreement

```

None shall require replacement of the canonical field contract.

---

# 56. Phase 1 Boundary

Phase 0 shall end before attempting to solve the entire Weather project.

A successful Phase 0 should make Phase 1 primarily a question of **what visual experiments to conduct next**, not **how to rebuild the software**.

The strongest Phase 1 candidates are expected to be:

```math
semantic coarse-graining
```

and

```math
vertical atmospheric navigation.
```

This would allow the representation to evolve approximately as:

```math
global field→large atmospheric structures→filaments→particles
```

while separately allowing the user to move through:

```math
surface→850 hPa→700 hPa→500 hPa→300 hPa→⋯
```

and ultimately rotate a selected geographic location into an atmospheric Column View.

---

# 57. Final Phase 0 Product Statement

At completion, Weather Visual Lab Phase 0 shall be:

> An interactive browser-based planetary laboratory that consumes real NOAA GFS atmospheric data through a provider-neutral field model and lets a user simultaneously explore temperature, precipitation, and wind over a three-dimensional Earth through configurable visual transformations and a playable forecast timeline.

Its principal technical accomplishment shall not merely be displaying those three variables.

It shall establish the generalized chain:

```math
Atmospheric Field→Normalization→Transformation→Visual Channel→Scale-Aware Representation
```

upon which the broader project can progressively experiment with how weather and atmospheric thermodynamics can be made visually intuitive.

The initial representations are hypotheses.

The visual-encoding architecture is the foundation.