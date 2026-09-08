# Source provenance and transformations

Live source: NOAA/NCEP GFS 0.25° GRIB2 through NOMADS GRIB Filter.
https://nomads.ncep.noaa.gov/gribfilter.php?ds=gfs_0p25

Select TMP at 2 m, UGRD/VGRD at 10 m, and PRATE at surface. The decoder checks ecCodes short name, level type/value, units, initialization, valid time and temporal statistic. Unsupported messages are ignored; an empty supported response fails. Fields missing from a partial response are explicitly listed. Wind speed is derived only when both component grids agree.

Normalize longitude into [-180,180), sort rows south-to-north, preserve missing values as NaN, and point-decimate by 4/2/1 for LOD 0/1/2. This is **not area averaging**. Provenance includes the source URL, original 0.25° resolution, actual retrieval timestamp and transformation list. No smoothing or resampling creates additional observations. Cached frames retain original retrieval metadata.

The raw-download key includes provider/model, run, forecast lead, all selected variables/levels and extent. It is shared across LODs. Normalized keys additionally include LOD. Requests have timeouts, one bounded retry, a 48 MiB body cap and a fixed provider endpoint. The run catalog probes a recent completed 24-hour window; individual fields are verified when loaded.

Synthetic fixtures use deterministic analytic temperature, precipitation and wind formulas, plus a missing rectangle. Available scenarios include mixed, cardinal, rotational and temperature gradient. Scenario time starts at 2026-01-01 UTC. Grid evaluation is 1° / 0.5° / 0.25°; finer analytic samples are not real weather. No external network or clock is used for fixture values.

A manual regional live check during implementation discovered run 2026090812 and decoded lead +3 h at native spacing over 90–80 W / 30–45 N, yielding all four source fields and derived wind speed. This demonstrates the adapter path, not full global/timeline or visual acceptance. Re-run `scripts/check_live.py` to check current availability.
