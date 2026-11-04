# Scientific semantics and validation

Status: required design behavior; numeric implementation and provider validations belong to M1. Use the [CF conventions](https://cfconventions.org/cf-conventions/cf-conventions.html) for units, coordinates, cell methods/bounds, calendars and missing-data interpretation. Record the exact convention/version reported by each asset; do not assume current documentation describes every legacy file.

## 1. Different quantities stay different

- Air temperature at 2 m, land skin temperature, sea surface temperature, and atmospheric-layer temperature are separate quantities.
- Observations, observation-based gridded analyses, reconstructed fields, reanalyses, satellite retrievals, forecasts and climate scenarios use different methods. Expose the category and method; avoid a simplistic "measured" label for all.
- ERA5 is a model/observation reanalysis. OISST is an observation-based interpolated sea-surface analysis, not a thermometer at each pixel. An instrument upgrade or dataset revision does not automatically make two time series interchangeable.
- Daily mean, daily minimum, daily maximum, monthly mean, rate, accumulation, and instantaneous values are separate statistics with explicit temporal support.
- GISTEMP land/ocean surface-temperature anomalies are not absolute 2 m air temperature. They cannot silently stand in for a failed ERA5 connector.

## 2. Time and aggregation

Retain provider time coordinate, bounds, timezone/offset convention, calendar, and interval meaning. Requests use half-open intervals. A daily mean uses a defined day (initially UTC [00:00,24:00)); a local-day calculation is a different product. True local civil days can contain 23 or 25 hours; fixed UTC-offset products and daylight-saving-aware products must not share a label.

Temperature means are duration weighted where samples represent unequal intervals. For equal hourly instantaneous samples on a complete 24-hour UTC day, an arithmetic mean is an explicitly documented sampled daily mean; match the provider's definition rather than assuming it is an integrated continuous mean. Never use `(daily_min + daily_max)/2` as an unlabeled replacement.

For local computation, proposed completeness policy is at least 90% of expected duration/samples, with coverage reported; choose stricter product-specific rules when required. Preserve provider-produced means and quality metadata as such instead of guessing the underlying sample count. Partial days and months must be flagged, not represented as complete. Month/year summaries weight component intervals by duration for means and sum validated accumulations for totals.

M1 supports Gregorian-compatible historical calendars with correctly decoded CF metadata. Future `360_day`, `noleap` and other model calendars require native-calendar arithmetic and explicit comparison rules; reject unsupported operations rather than casting to ordinary dates. Calendar dates are not interchangeable merely because labels look similar.

## 3. Units and precipitation

Normalize scientific units while preserving originals and conversion provenance. Absolute Kelvin to Celsius: `C = K - 273.15`; Celsius to Fahrenheit: `F = C * 9/5 + 32`. Temperature differences do not use an offset: a 1 K anomaly is 1 degree C and 1.8 degrees F.

Total precipitation includes the dataset's stated water-equivalent components; it is not automatically rainfall. A rate in mm/day multiplied by the actual supported number of days gives an amount only if that rate genuinely represents that full interval. For example, a complete February monthly mean rate of 2 mm/day gives 56 mm in a 28-day February and 58 mm in a leap February. An accumulation already in mm is not multiplied by the interval again.

For ERA5 accumulated variables, inspect step/time bounds and the exact product's accumulation/reset convention before computing totals. One-hour shift, forecast resets, and daily-statistics processing matter. A rate in kg m-2 s-1 converts to water-equivalent mm over the integrated seconds under the appropriate density equivalence; keep the actual support and variable definition. Do not apply one blanket formula to all files named precipitation.

Reject ambiguous units or unknown aggregation methods. Negative precipitation artifacts are flagged according to a source-specific policy, never silently clamped without a recorded rule.

## 4. Missingness and spatial meaning

Decode fill values, valid ranges, scale factors, offsets, masks and quality flags before calculations. Missing numeric values are `null` in JSON, never NaN, a sentinel, or zero. Distinguish `missing`, `outside_coverage`, `not_applicable`, `insufficient_baseline`, and `not_prepared`.

Track grid centers and boundaries, latitude ordering, longitude convention, CRS, vertical reference and land/ocean masks. Normalize longitude consistently to [-180,180) for navigation while retaining source coordinates; handle the dateline and both poles explicitly. Do not introduce duplicate seam columns into spatial averages.

Point queries initially select the nearest eligible native cell and report its center, bounds, distance, grid and selection method. On land for an ocean-only variable, return not applicable instead of snapping invisibly to distant water. If a separate coastal-neighbor option is added later, show the displacement and require explicit selection.

Display resampling is independent of scientific extraction. Bilinear temperature display can be acceptable when identified, but must not bridge missing areas or leak ocean data onto land. Coarsened cell means should use cell overlap/area weighting as appropriate. Accumulations and fluxes need a conservation-aware regridding policy; masks and categorical data use suitable nearest/mask rules. Native uncertainty is not automatically preserved by regridding.

Regional and global means use actual cell areas or a justified grid-specific equivalent, with valid-area coverage reported. Cos(latitude) weighting is only an approximation suited to appropriate regular lon/lat grids; it is not a universal method for Gaussian, curvilinear or irregular cells. Zooming does not create additional observations or local precision.

## 5. Anomalies and seasonal profiles

Proposed default baseline for newly computed climatologies: 1991-2020, where the source supports it. Preserve a source-native baseline for published anomaly fields; do not relabel those as 1991-2020 without a valid recalculation.

Daily anomalies compare each daily statistic against a matching calendar-day climatology, not an annual mean or a monthly mean presented as daily. Initial policy proposal: an unsmoothed day-of-year baseline, at least 24 valid baseline years for each calendar day, and strict matching source/variable/statistic/grid/day convention. For February 29, use the mean of February 28 and March 1 climatologies only when both pass coverage; label that interpolation. Other calendar/leap rules need explicit policy.

Hourly anomalies are deferred until an hour-of-day/day-of-year baseline is validated; do not subtract daily climatology and label the result as an equivalent hourly anomaly. A monthly anomaly can use a calendar-month climatology, separately labeled. If a different baseline cannot be computed, keep absolute mode available and explain why anomaly mode is unavailable.

Build climatologies as their own hashed, versioned products referencing all contributing snapshots and coverage policy. Pin or otherwise track the baseline assets referenced by a saved view. A revised source climatology creates a revised product.

Seasonal charts state the period, calendar, statistic, completeness and spatial selection. Do not invent distributions, confidence bands, daily extremes or comfortable-weather probabilities from a mean-only series. Prefer deterministic explanatory text grounded in displayed values; generated narrative is not a requirement.

## 6. Comparison and change over time

Compare like quantities and compatible time support. Align baseline, units, domain, grid/point-selection method, and overlapping availability, or show the mismatch prominently and disable numeric subtraction. Do not splice providers to extend a chart silently. Historical series can be revised; retain snapshot identity and distinguish provisional recent data from finalized data.

Station moves, sensor changes, assimilation system inputs, algorithm revisions and observation density can affect interpretation. Expose known provider caveats and change notes. An anomaly is not proof that a particular event was caused by climate change; causal attribution and calibrated trend significance are outside initial scope.

## 7. Required scientific checks during implementation

These tests are planned because an attractive globe can hide numerical mistakes. They are not claimed to exist in session zero.

| Case | Expected evidence |
| --- | --- |
| Unit conversion | 273.15 K -> 0 C -> 32 F; +1 K anomaly -> +1 C / +1.8 F |
| Missing and packed values | Fill values excluded before scaling/aggregation; null/status preserved to API |
| Time support | UTC midnight boundaries; leap February; incomplete day; 23/25-hour local day where supported |
| Accumulation | Provider-known hourly-to-daily total and rate-to-monthly conversion; no double integration |
| Spatial indexing | Ascending/descending latitude, 0..360 longitude, seam and polar points, cell edges |
| Masks | SST on land remains not applicable; display interpolation cannot create a false ocean value |
| Regridding | Constant field remains constant; conservation checks for chosen precipitation transforms |
| Baseline | Matching climatology gives zero anomaly; incomplete reference disables affected anomaly; Feb 29 rule |
| Source integrity | Validate representative raw values against authoritative files for fixed dates/cells, within stated conversion tolerance |
| Playback | Rendered field date, sampled numeric date, and visible legend all match during slow/reordered requests |
| Revision | Updated provider payload yields a new snapshot; old retained plan remains unchanged |

Choose comparison cells/dates before viewing results; include both hemispheres, seasons, coastal and mountain sites, ocean, missing cells, poles and dateline. Record fixtures with provider citation/checksum and redistribution suitability. Provider-to-provider differences alone do not prove a software error; compare like semantics first.
