# Source register and research evidence

Reviewed: 2026-11-03. These are primary-provider/documentation checks, not live connector or numerical validation. No credentials were supplied and no climate archive was downloaded in session zero. Provider links, licenses, endpoints, revisions and availability must be checked again when integrating. "Present" in a provider description never establishes the latest available frame.

## Initial sequence

| Source/product | Documentary facts and fit | Access / unresolved integration work |
| --- | --- | --- |
| [ERA5 daily statistics](https://cds.climate.copernicus.eu/datasets/derived-era5-single-levels-daily-statistics?tab=overview) | Daily aggregates of hourly reanalysis, 1940 onward, 0.25-degree atmosphere grid. Proposed first daily mean 2 m air-temperature source. Daily statistic, input sampling frequency, and UTC-offset choices matter. Aggregates are calculated at retrieval time. | CDS account/token and dataset terms. Prove request shape, subsetting/coarsening options, queue time, decoding and bounded cost. Retain request and source revision details. |
| [ERA5 hourly single levels](https://cds.climate.copernicus.eu/datasets/reanalysis-era5-single-levels?tab=overview) | Hourly global reanalysis from 1940 onward, atmosphere served on 0.25-degree grid. Proposed genuine hourly-temperature path; broader atmospheric variables later. | First prove regional/time-window retrieval and Windows decoding. Use provider's current request form; do not copy legacy API examples blindly. |
| [NOAA OISST v2.1](https://www.ncei.noaa.gov/products/optimum-interpolation-sst) | Daily 0.25-degree sea surface analysis from 1981-09-01 onward; combines satellite and in situ observations with interpolation. Product provides anomaly/error-related fields in addition to SST. Proposed first ocean connector. | Anonymous HTTPS NetCDF access is linked from provider page. Verify bytes, fields, masks, preliminary/final handling, latest dates and error-field meaning on actual assets. [Published directory](https://www.ncei.noaa.gov/data/sea-surface-temperature-optimum-interpolation/v2.1/access/avhrr/) was viewable. |
| [NOAA GPCP Daily CDR](https://www.ncei.noaa.gov/products/climate-data-records/precipitation-gpcp-daily) and [v1.3 metadata](https://www.ncei.noaa.gov/access/metadata/landing-page/bin/iso?id=gov.noaa.ncdc%3AC00999) | Daily global precipitation on a 1-degree grid from October 1996 onward. Proposed daily precipitation path. The specific CDR and version are deliberate; other GPCP families must be separate catalog entries. | Verify download endpoint, actual units/time support, current coverage, final/interim state, and provider use agreement. No working retrieval is claimed. |

For CDS, [official setup instructions](https://cds.climate.copernicus.eu/how-to-api) require a registered account, personal token, and dataset terms acceptance. Credentials are a user setup step for M1, not part of the Git repository. The catalog labels account requirements before a layer is selected. ERA5 catalog pages currently link a CC-BY license; capture the applicable terms/citation for each chosen product at integration. No purchase is needed for the proposed CDS path.

ERA5's recent preliminary data can be revised. Preserve final/provisional status and asset snapshots; do not encode a fixed number of days behind today as the availability algorithm. The [provider's reanalysis description](https://climate.copernicus.eu/climate-reanalysis) explains reanalysis and the evolving observational inputs.

## Additional candidates and distinct purposes

| Source/product | Role and verified limitations | Priority |
| --- | --- | --- |
| [NOAA ERSST v6](https://www.ncei.noaa.gov/products/extended-reconstructed-sst) | Monthly reconstructed SST on a 2-degree grid back to January 1850; anomalies use 1991-2020. Supports longer historical context, not daily events or local detail. v5 is a different product with different dates/baseline. | Later historical-ocean connector |
| [NASA GISTEMP v4](https://data.giss.nasa.gov/gistemp/) | Monthly land/ocean temperature-index anomalies, including 2-degree gridded NetCDF/Zarr downloads. Native LOTI reference is 1951-1980. Not absolute 2 m temperature and not a daily fallback. Retain NASA citation instructions. | Later climate-change/anomaly view |
| [NOAA GPCP Monthly CDR](https://www.ncei.noaa.gov/products/climate-data-records/precipitation-gpcp-monthly) / [PSL monthly access](https://www.psl.noaa.gov/data/gridded/data.gpcp.html) | Monthly satellite/gauge precipitation analysis at 2.5 degrees from January 1979. Useful longer precipitation context; not daily measurements. PSL's named series and NCEI CDR must be pinned separately rather than treated as identical mirrors without checking. | Later historical precipitation |
| [Open-Meteo Historical Weather API](https://open-meteo.com/en/docs/historical-weather-api) | Coordinate/time-series API. Attractive optional point-profile path; does not provide a global scalar field in one query. Underlying model selection, elevation adjustment and cell selection can change meaning relative to globe arrays. | Evaluate for M2; visibly separate source if used |
| [NASA GIBS](https://nasa-gibs.github.io/gibs-api-docs/) | Time-enabled pre-generated science visualizations; [available visualization documentation](https://nasa-gibs.github.io/gibs-api-docs/available-visualizations/) explains RGB mapping of measurements. Useful satellite overlays and discovery. Do not recover numeric science values from rendered colors. | Later imagery adapter |
| [Natural Earth](https://www.naturalearthdata.com/about/terms-of-use/) | Public-domain geographic context; useful token-free initial globe orientation. Not a climate source or street-level map. Record asset version and optional attribution. | M1a context layer |

Open-Meteo's [current terms](https://open-meteo.com/en/terms) distinguish free noncommercial API access from CC-BY data licensing and paid service access. Limits include daily, hourly, and minute ceilings. Recheck them at integration; use bounded requests and cache rather than hardcoding today's quotas into product behavior. A future public/commercial release needs a new access review. Do not fan out point requests to manufacture a global archive.

## Known lifecycle hazard

[NOAA PSL's NCEP/NCAR Reanalysis page](https://www.psl.noaa.gov/data/reanalysis/) says Reanalysis 1 stopped production with a last date of March 17, 2026. Exclude it as the default updating dataset. Its historical archive may remain useful if clearly labeled. Older references that say "1948-present" do not override this provider notice.

NOAA NCEI product pages also display a cloud-migration notice. Build endpoint migration and transient failure handling into adapters; an accessible landing page does not establish uninterrupted download service.

## Visualization reference

[WeatherSpark's New York profile](https://weatherspark.com/y/23912/Average-Weather-in-New-York-City-New-York-United-States-Year-Round) was reviewed as a reference for coordinated seasonal variables, readable summaries and progressive exploration. Product inference: combine that clarity with globe-linked time exploration and more visible source/resolution context. This is inspiration, not authorization to copy charts, text, assets, data, or an undocumented API.

## Admission checklist for a new connector

1. Identify provider, product, exact version, variable definitions and original documentation/citation.
2. Separate documented coverage from actually discovered dates, gaps, masks and revision status.
3. Record access method, credentials, rate limits, cost class, license/redistribution/retention rules, attribution, and terms-check date. Unknown rights remain unknown; do not label them unrestricted.
4. Fetch a bounded representative sample and check its format, CF metadata, calendar, coordinates, units, fill values and quality fields. Include unusual cells/dates.
5. Estimate peak download/processing/cache bytes and wall time. Test cancellation, retries, corruption handling, provider errors and immutable snapshot creation.
6. Validate scientific values and aggregation against the source; attach evidence and tests.
7. Advertise only implemented capabilities. Mark the connector operational only after these gates pass; keep candidates out of the working-layer selector.

For future humidity, ice, currents, subsurface ocean and scenario layers, first use this admission process to build a source shortlist. These categories are in the vision; no unresearched promise of universal daily/hourly coverage is made.
