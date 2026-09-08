# Phase 0 implementation checkpoint

The original attempts overlapped in one empty checkout, leaving two incompatible implementations. Consolidation retained the complete globe/timeline application and GFS provider, removed the unused alternative data contract, regenerated schemas and replaced tests targeting the superseded API.

Implemented: React/TypeScript/Cesium application; independent temperature, precipitation and luminous wind mappings; fixture scenarios; location readouts; playback/scrubbing/speed; scale-dependent grids; provider-neutral metadata and binary payloads; live GFS discovery/decode; raw and normalized caches; source/error states; tests, CI and macOS setup/start launchers.

Verified locally: production build, TypeScript, frontend lint, Ruff, 16 frontend unit tests and 7 backend tests. Backend tests include real ecCodes-generated GRIB decoding, missing bitmaps, U/V derivation, unit/time selection, grid order, request construction, cache-key identity, catalog fallback and malformed upstream responses. A real regional NOAA GFS run also decoded successfully.

Not yet accepted: the cloud browser cannot initialize WebGL, so no visual or 30 FPS claim is made. The Playwright workflows are authored but not yet run to completion. CI and desktop acceptance remain required. This checkpoint is not a claim that all Phase 0 success criteria are satisfied.

Publication: a local specification baseline commit exists; no changes have been pushed. Automatic approval review rejected the attempted push to public main because public publication was not explicitly authorized. The proposed next action is to push the specification-only baseline to main, push phase-0-foundation and open a draft implementation PR. This does not merge the application into main. After authorization, run CI, resolve failures, and report the remaining desktop acceptance work.

The work is consolidated into one initial implementation PR because the recovered files already span the milestone boundaries. Subsequent changes can be bounded by feature. No scientific preregistration or external audit is required by this specification.
