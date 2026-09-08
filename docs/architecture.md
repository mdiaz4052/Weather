# Architecture

Provider → canonical physical fields → normalization / mapping registry → scale-aware representations.

`weather_api.models` defines the canonical contract. `weather_api.provider` is the only module constructing NOAA variable names or URLs. Its provider protocol offers discovery, run description and field fetching; the concrete GFS implementation batches the four source quantities for efficient retrieval. `weather_api.fixtures` is a development source with deterministic analytic fields, separate from live provider provenance.

`fields.ts` validates manifests, reconstructs little-endian Float32Arrays, samples grids, interpolates physical values, converts display units and maintains a four-frame LRU. `encoding.ts` registers physical domains, transforms, visual channels and experimental representations. `Globe.tsx` supplies Cesium geometry, scalar textures and wind filaments. `main.tsx` separately manages data source and loaded frames, timeline, navigation and presentation settings.

The scalar texture follows the selected grid extent and resolution. Bilinear sampling provides continuity. Filaments use geodesic endpoints following local east/north vectors. Each owns its material, because Cesium destroys a polyline's material when removing that polyline. A shared animation clock advances their brightness pulses independently of atmospheric time.

Scale determines requested resolution and filament density/length. Native regional requests are bounded to 60° views; dateline-centered views use global LOD 1. Scale and altitude remain separate state. Plan navigation is implemented; column and transect modes remain future work.

The browser loads current/next frames and prefetches one adjacent frame, with a four-frame completed cache. Failed transitions stop playback. Loading notices distinguish previously drawn imagery from requested data. Physics buffers are never changed by palette or opacity controls.

The backend separates raw GRIB and normalized cached arrays, preserves retrieval metadata and serializes retrievals with a lock. Browser payloads use a 96 MiB in-memory LRU; an evicted URL returns 404 and requires a fresh manifest. No arbitrary URL-fetch endpoint exists. Caches are local and can be removed while the application is stopped.
