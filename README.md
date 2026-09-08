# Weather Visual Lab

An interactive browser-based atmospheric laboratory. Explore temperature, precipitation and wind over a three-dimensional Earth, change their visual mappings, and play a 24-hour timeline.

## Status

The initial Phase 0 application includes the globe, combined weather encodings, a playable forecast timeline, NOAA ingestion and offline fixtures. Build, type checking, lint, unit tests and browser workflows run in CI. A live NOAA GFS regional retrieval and ecCodes decoding have also succeeded. Full live global playback and the reference-desktop 30 FPS target still need a desktop acceptance run; merging the foundation does not claim those checks are complete.

## Start on macOS

Requires **macOS 13 or later** for the bundled weather decoding libraries. Install Node.js **22.12 or later** and Python **3.12 or later** once if they are not already installed. Then:

1. Open **Set Up Weather.command**. It installs the locked dependencies.
2. Open **Start Weather.command**. It starts the API and frontend and opens the browser.
3. Keep the launcher window open while using the laboratory; Control-C stops it.

If macOS will not execute a downloaded launcher, use Terminal with `bash scripts/setup.sh`, then `bash scripts/dev.sh --open`. Both launchers call these same scripts. Open http://localhost:5173 if the browser does not open automatically.

Requires a desktop browser with WebGL2. There is no Cesium ion account or API key. Base imagery is bundled with Cesium, and synthetic fixture mode works without external data access after setup. Mobile optimization and cloud deployment are outside Phase 0.

## Explore

The left panel controls the three independently composable representations. Temperature uses a fixed physical range; changing its palette does not download data again. Wind filaments point along the U/V vector, length represents speed, and the traveling light pulse indicates direction. Pulse speed is a visual parameter.

Click the Earth to inspect numerical values. The bottom bar provides playback, model-frame steps, scrubbing and speed. Times between the three-hour source frames are explicitly labeled visual interpolation. Missing values remain masked. Synthetic timestamps are labeled as fixture data, never observations.

Choose **Recent NOAA GFS** to discover a recent model cycle. The initial live window is 0–24 h at three-hour steps. Fields are verified on retrieval; missing fields are listed under Source / details. Source failures offer a switch back to synthetic fixtures. Previously retrieved normalized grids are cached on disk. Uncached frames still need NOAA access.

Zoom changes data resolution: 1° globally, 0.5° at synoptic scale and 0.25° in bounded regional views. Views near the antimeridian retain global 0.5° coverage. This is rendering detail, not additional meteorological information.

## Validation

```sh
npm run lint
npm run typecheck
npm test
npm run build
.venv/bin/ruff check services scripts
.venv/bin/pytest services/weather-api/tests
.venv/bin/python scripts/export_contracts.py
npx playwright install chromium
npm run test:e2e
```

The browser suite exercises globe rendering, palettes and layer toggles, playback, inspection, scale changes and source failure. GitHub Actions installs Chromium with software WebGL and runs the same suite. It does not contact NOAA. The manual live check is `.venv/bin/python scripts/check_live.py`.

See [architecture](docs/architecture.md), [data contract](docs/data-contract.md), [visual grammar](docs/visual-grammar.md), [source provenance](docs/source-provenance.md), and the [Phase 0 specification](docs/phase-0-spec.md).
