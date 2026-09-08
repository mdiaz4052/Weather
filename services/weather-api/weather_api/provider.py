"""NOMADS-specific symbols and URLs end in this module."""

import asyncio
import hashlib
import json
import re
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Protocol
from urllib.parse import urlencode

import httpx
import numpy as np

from .models import FIELD_SPECS, FieldDescriptor, Frame, Grid, Provenance, Vertical, WeatherRun

HOST = "https://nomads.ncep.noaa.gov"
SOURCES = {
    "air_temperature_2m": ("TMP", "2t", "heightAboveGround", 2, "K"),
    "precipitation_rate_surface": ("PRATE", "prate", "surface", 0, "kg m**-2 s**-1"),
    "eastward_wind_10m": ("UGRD", "10u", "heightAboveGround", 10, "m s**-1"),
    "northward_wind_10m": ("VGRD", "10v", "heightAboveGround", 10, "m s**-1"),
}


class SourceError(Exception):
    pass


class WeatherProvider(Protocol):
    async def list_runs(self) -> list[WeatherRun]: ...
    async def describe_run(self, run_id: str) -> WeatherRun: ...
    async def fetch_field(self, run_id, field_id, valid_time, bbox, lod): ...


def run_time(run_id):
    if not re.fullmatch(r"\d{10}", run_id):
        raise ValueError("run must be YYYYMMDDHH")
    result = datetime.strptime(run_id, "%Y%m%d%H").replace(tzinfo=UTC)
    if result.hour not in (0, 6, 12, 18):
        raise ValueError("GFS runs initialize at 00, 06, 12, or 18 UTC")
    return result


def request_url(run_id, lead, bbox=None):
    dt = run_time(run_id)
    if lead not in range(0, 25, 3):
        raise ValueError("supported leads: 0..24 hours in 3-hour steps")
    query = {
        "file": f"gfs.t{dt:%H}z.pgrb2.0p25.f{lead:03}",
        "dir": f"/gfs.{dt:%Y%m%d}/{dt:%H}/atmos",
    }
    query.update({f"var_{item[0]}": "on" for item in SOURCES.values()})
    query.update({"lev_2_m_above_ground": "on", "lev_10_m_above_ground": "on", "lev_surface": "on"})
    if bbox:
        west, south, east, north = bbox
        query.update(
            subregion="", leftlon=west % 360, rightlon=east % 360, toplat=north, bottomlat=south
        )
    return f"{HOST}/cgi-bin/filter_gfs_0p25.pl?{urlencode(query)}"


def cache_key(run_id, lead, bbox, lod, kind="normalized"):
    request = {
        "provider": "NOAA",
        "model": "GFS",
        "run": run_id,
        "lead": lead,
        "variables": SOURCES,
        "bbox": bbox,
        "lod": lod,
        "version": 1,
        "kind": kind,
    }
    return hashlib.sha256(json.dumps(request, sort_keys=True).encode()).hexdigest()


def normalize_grid(values, latitudes, longitudes, lod, bbox=None):
    """Sort scan order, normalize longitude; decimate to rendering grid without smoothing."""
    xs = (np.asarray(longitudes) + 180) % 360 - 180
    ys = np.asarray(latitudes)
    unique_x, xi = np.unique(xs, return_inverse=True)
    unique_y, yi = np.unique(ys, return_inverse=True)
    if len(unique_x) * len(unique_y) != len(values) or len(
        np.unique(yi * len(unique_x) + xi)
    ) != len(values):
        raise SourceError("non-rectangular or duplicate GRIB grid")
    grid = np.full((len(unique_y), len(unique_x)), np.nan, dtype="<f4")
    grid[yi, xi] = values
    if bbox:
        w, s, e, n = bbox
        columns = (unique_x >= w) & (unique_x <= e)
        rows = (unique_y >= s) & (unique_y <= n)
        grid = grid[np.ix_(rows, columns)]
        unique_x, unique_y = unique_x[columns], unique_y[rows]
    stride = [4, 2, 1][lod]
    grid, unique_x, unique_y = grid[::stride, ::stride], unique_x[::stride], unique_y[::stride]
    if len(unique_x) < 2 or len(unique_y) < 2:
        raise SourceError("empty or undersized grid")
    if not np.allclose(np.diff(unique_x), unique_x[1] - unique_x[0]):
        raise SourceError("nonuniform longitude grid")
    if not np.allclose(np.diff(unique_y), unique_y[1] - unique_y[0]):
        raise SourceError("nonuniform latitude grid")
    return grid, Grid(
        width=len(unique_x),
        height=len(unique_y),
        west=float(unique_x[0]),
        south=float(unique_y[0]),
        dx=float(unique_x[1] - unique_x[0]),
        dy=float(unique_y[1] - unique_y[0]),
        periodic=bbox is None,
    )


def decode(path, run_id, lead, lod, bbox, url, retrieved_at):
    import eccodes as ec

    arrays, descriptors = {}, {}
    dt = run_time(run_id)
    provenance = Provenance(
        source="NOAA/NCEP GFS",
        synthetic=False,
        retrievedAt=retrieved_at,
        sourceResolution=0.25,
        sourceUrl=url,
        transformations=[
            "Longitude normalized to [-180,180)",
            "Rows sorted south to north; missing samples masked with NaN",
            f"Native-grid point decimation by {[4, 2, 1][lod]} (not area averaging)",
        ],
    )
    try:
        with open(path, "rb") as file:
            while (gid := ec.codes_grib_new_from_file(file)) is not None:
                try:
                    get = lambda key: ec.codes_get(gid, key)
                    matches = [
                        key
                        for key, (_, short, kind, height, _) in SOURCES.items()
                        if get("shortName") == short
                        and get("typeOfLevel") == kind
                        and get("level") == height
                    ]
                    if not matches:
                        continue
                    key = matches[0]
                    runtime = datetime.strptime(
                        f"{get('dataDate')}{int(get('dataTime')):04}", "%Y%m%d%H%M"
                    ).replace(tzinfo=UTC)
                    valid = datetime.strptime(
                        f"{get('validityDate')}{int(get('validityTime')):04}", "%Y%m%d%H%M"
                    ).replace(tzinfo=UTC)
                    if runtime != dt or valid != dt + timedelta(hours=lead):
                        raise SourceError("upstream run/valid-time mismatch")
                    if get("units") != SOURCES[key][4]:
                        raise SourceError(f"unexpected units for {key}: {get('units')}")
                    step_type = get("stepType")
                    if step_type not in ("instant", "avg") or (
                        key != "precipitation_rate_surface" and step_type != "instant"
                    ):
                        raise SourceError("unsupported temporal statistic")
                    # Prefer instantaneous rate if both instant and interval-average exist.
                    if key in descriptors and (
                        descriptors[key].temporalKind == "instant" or step_type != "instant"
                    ):
                        continue
                    values = ec.codes_get_array(gid, "values")
                    values = np.where(values == get("missingValue"), np.nan, values)
                    arr, grid = normalize_grid(
                        values,
                        ec.codes_get_array(gid, "latitudes"),
                        ec.codes_get_array(gid, "longitudes"),
                        lod,
                        bbox,
                    )
                    name, quantity, unit, height = FIELD_SPECS[key]
                    start = end = None
                    if step_type == "avg":
                        if str(get("stepUnits")) not in ("1", "h"):
                            raise SourceError("unsupported averaging interval units")
                        start = dt + timedelta(hours=float(get("startStep")))
                        end = dt + timedelta(hours=float(get("endStep")))
                    descriptors[key] = FieldDescriptor(
                        id=key,
                        displayName=name,
                        physicalQuantity=quantity,
                        canonicalUnit=unit,
                        sourceProvider="NOAA/NCEP",
                        sourceModel="GFS",
                        sourceVariable=SOURCES[key][0],
                        runTime=runtime,
                        validTime=valid,
                        forecastLead=lead,
                        horizontalGrid=grid,
                        verticalCoordinate=Vertical(
                            kind="height_above_ground" if height else "surface",
                            value=height or None,
                            unit="m" if height else None,
                        ),
                        provenance=provenance,
                        payload="",
                        temporalKind="interval_mean" if step_type == "avg" else "instant",
                        intervalStart=start,
                        intervalEnd=end,
                    )
                    arrays[key] = arr
                finally:
                    ec.codes_release(gid)
    except SourceError:
        raise
    except Exception as exc:
        raise SourceError(f"Invalid GRIB2 response: {type(exc).__name__}") from exc
    if not arrays:
        raise SourceError("response contains no supported fields")
    if "eastward_wind_10m" in arrays and "northward_wind_10m" in arrays:
        u, v = descriptors["eastward_wind_10m"], descriptors["northward_wind_10m"]
        if u.horizontalGrid != v.horizontalGrid:
            raise SourceError("U/V grid mismatch")
        arrays["wind_speed_10m"] = np.hypot(arrays[u.id], arrays[v.id])
        descriptors["wind_speed_10m"] = u.model_copy(
            update={
                "id": "wind_speed_10m",
                "displayName": "Wind speed",
                "physicalQuantity": "wind_speed",
                "sourceVariable": "hypot(eastward_wind_10m,northward_wind_10m)",
                "temporalKind": "derived",
                "provenance": provenance.model_copy(
                    update={
                        "transformations": provenance.transformations + ["speed = sqrt(u² + v²)"]
                    }
                ),
            }
        )
    weather_run = describe(run_id, provenance)
    return Frame(
        run=weather_run,
        fields=list(descriptors.values()),
        sourceState="live",
        lod=lod,
        unavailableFields=[key for key in FIELD_SPECS if key not in arrays],
    ), arrays


def describe(run_id, provenance):
    dt = run_time(run_id)
    return WeatherRun(
        provider="NOAA/NCEP",
        model="GFS",
        runId=run_id,
        initializedAt=dt,
        availableValidTimes=[dt + timedelta(hours=h) for h in range(0, 25, 3)],
        availableFields=list(FIELD_SPECS),
        nativeResolution=0.25,
        provenance=provenance,
    )


class GFSProvider:
    def __init__(self, cache: Path, transport=None):
        self.cache = cache
        self.client = httpx.AsyncClient(
            timeout=httpx.Timeout(60, connect=10), transport=transport, follow_redirects=False
        )
        self.lock = asyncio.Lock()
        for directory in ("raw", "normalized", "runs"):
            (cache / directory).mkdir(parents=True, exist_ok=True)

    async def list_runs(self):
        # Probe model files rather than assuming that today's newest cycle is complete.
        now = datetime.now(UTC) - timedelta(hours=5)
        start = now.replace(hour=now.hour // 6 * 6, minute=0, second=0, microsecond=0)
        results = []
        for offset in range(4):
            dt = start - timedelta(hours=offset * 6)
            run_id = dt.strftime("%Y%m%d%H")
            url = f"{HOST}/pub/data/nccf/com/gfs/prod/gfs.{dt:%Y%m%d}/{dt:%H}/atmos/gfs.t{dt:%H}z.pgrb2.0p25.f024"
            try:
                response = await self.client.head(url)
                if response.status_code == 200:
                    provenance = Provenance(
                        source="NOAA/NCEP GFS",
                        synthetic=False,
                        retrievedAt=datetime.now(UTC),
                        sourceResolution=0.25,
                        sourceUrl=url,
                        transformations=[
                            "Bounded 0–24h forecast window; fields verified on retrieval"
                        ],
                    )
                    result = describe(run_id, provenance)
                    (self.cache / "runs" / f"{run_id}.json").write_text(result.model_dump_json())
                    results.append(result)
                    break
            except httpx.HTTPError:
                break
        cached = sorted((self.cache / "runs").glob("*.json"), reverse=True)
        for path in cached[:4]:
            result = WeatherRun.model_validate_json(path.read_text())
            if result.runId not in [r.runId for r in results]:
                results.append(result)
        if not results:
            raise SourceError(
                "NOAA is unavailable and no cached run exists. Choose synthetic fixtures."
            )
        return results[:4]

    async def describe_run(self, run_id):
        run_time(run_id)
        path = self.cache / "runs" / f"{run_id}.json"
        if not path.exists():
            raise SourceError("run is not in the discovered or cached run catalog")
        return WeatherRun.model_validate_json(path.read_text())

    async def fetch_field(self, run_id, field_id, valid_time, bbox, lod):
        lead = (valid_time - run_time(run_id)).total_seconds() / 3600
        if lead != int(lead):
            raise ValueError("field request must be a model timestamp")
        frame, arrays = await self.fetch_frame(run_id, int(lead), bbox, lod)
        return next(d for d in frame.fields if d.id == field_id), arrays[field_id]

    async def fetch_frame(self, run_id, lead, bbox, lod):
        await self.describe_run(run_id)
        key = cache_key(run_id, lead, bbox, lod)
        folder = self.cache / "normalized"
        manifest, payload = folder / f"{key}.json", folder / f"{key}.npz"
        async with self.lock:
            if manifest.exists() and payload.exists():
                try:
                    frame = Frame.model_validate_json(manifest.read_text())
                    with np.load(payload, allow_pickle=False) as archive:
                        arrays = {k: archive[k] for k in archive.files}
                    frame.sourceState = "cached"
                    return frame, arrays
                except (ValueError, OSError):
                    manifest.unlink(missing_ok=True)
            # Raw retrieval is shared across LODs for identical native subsets.
            raw_key = cache_key(run_id, lead, bbox, "native", "raw")
            raw = self.cache / "raw" / f"{raw_key}.grib2"
            stamp = raw.with_suffix(".json")
            url = request_url(run_id, lead, bbox)
            if not raw.exists() or not stamp.exists():
                await self.download(url, raw)
                stamp.write_text(json.dumps({"retrievedAt": datetime.now(UTC).isoformat()}))
            retrieved = datetime.fromisoformat(json.loads(stamp.read_text())["retrievedAt"])
            try:
                frame, arrays = await asyncio.to_thread(
                    decode, raw, run_id, lead, lod, bbox, url, retrieved
                )
            except SourceError:
                raw.unlink(missing_ok=True)
                stamp.unlink(missing_ok=True)
                raise
            tmp = payload.with_suffix(".tmp")
            with tmp.open("wb") as file:
                np.savez_compressed(file, **arrays)
            tmp.replace(payload)
            temp_manifest = manifest.with_suffix(".tmp")
            temp_manifest.write_text(frame.model_dump_json())
            temp_manifest.replace(manifest)
            return frame, arrays

    async def download(self, url, destination):
        for attempt in range(2):
            try:
                data = bytearray()
                async with self.client.stream("GET", url) as response:
                    response.raise_for_status()
                    async for chunk in response.aiter_bytes():
                        data.extend(chunk)
                        if len(data) > 48 * 1024 * 1024:
                            raise SourceError("upstream response exceeds 48 MiB limit")
                if len(data) < 20 or not data.startswith(b"GRIB") or not data.endswith(b"7777"):
                    raise SourceError("upstream response is not a complete GRIB message stream")
                tmp = destination.with_suffix(".tmp")
                tmp.write_bytes(data)
                tmp.replace(destination)
                return
            except httpx.HTTPError as exc:
                if attempt == 1:
                    raise SourceError("NOAA request failed or timed out") from exc
                await asyncio.sleep(0.5)
