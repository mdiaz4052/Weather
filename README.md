# Weather Visual Lab

An interactive browser-based atmospheric laboratory. Explore temperature, precipitation and wind over a three-dimensional Earth, change their visual mappings, and play a 24-hour timeline.

## Status

Phase 0 implementation is ready for browser acceptance testing. Recovered overlapping implementations have been consolidated into one field contract and one application. Local build, type checking, lint and deterministic tests pass. A live NOAA GFS regional retrieval and ecCodes decoding succeeded. The available cloud browser cannot initialize WebGL, so visual acceptance and the reference-desktop 30 FPS target are **not yet verified**. Do not treat Phase 0 as accepted until the browser suite and desktop scenarios pass.

## Start on macOS

Install Node.js **22.12 or later** and Python **3.12 or later** once if they are not already installed. Then:

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
