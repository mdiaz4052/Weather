import asyncio
from datetime import UTC, datetime
from urllib.parse import parse_qs, urlparse

import eccodes as ec
import httpx
import numpy as np
import pytest

from weather_api.provider import (
    GFSProvider,
    SourceError,
    cache_key,
    decode,
    normalize_grid,
    request_url,
    run_time,
)


def make_grib(path, *, unit_error=False, bitmap=False):
    # Real ecCodes round-trip, without depending on NOAA availability.
    with path.open("wb") as output:
        for name, value, level in [
            ("2t", 280.0, 2),
            ("10u", 10.0, 10),
            ("10v", -4.0, 10),
            ("prate", 0.001, 0),
        ]:
            gid = ec.codes_grib_new_from_samples("regular_ll_sfc_grib2")
            try:
                for key, item in {
                    "Ni": 8,
                    "Nj": 5,
                    "latitudeOfFirstGridPointInDegrees": 1.0,
                    "longitudeOfFirstGridPointInDegrees": 0.0,
                    "latitudeOfLastGridPointInDegrees": 0.0,
                    "longitudeOfLastGridPointInDegrees": 1.75,
                    "iDirectionIncrementInDegrees": 0.25,
                    "jDirectionIncrementInDegrees": 0.25,
                    "dataDate": 20260101,
                    "dataTime": 0,
                    "forecastTime": 3,
                    "typeOfLevel": "heightAboveGround" if level else "surface",
                    "level": level,
                    "shortName": name,
                }.items():
                    ec.codes_set(gid, key, item)
                values = np.full(40, value)
                if bitmap:
                    ec.codes_set(gid, "bitmapPresent", 1)
                    values[10] = ec.codes_get(gid, "missingValue")
                ec.codes_set_values(gid, values)
                ec.codes_write(gid, output)
            finally:
                ec.codes_release(gid)


def test_request_and_cache_identity():
    q = parse_qs(urlparse(request_url("2026010100", 3, (-90, 10, -60, 30))).query)
    assert q["var_TMP"] == ["on"] and q["lev_10_m_above_ground"] == ["on"]
    assert q["leftlon"] == ["270"]
    assert q["file"] == ["gfs.t00z.pgrb2.0p25.f003"]
    assert cache_key("2026010100", 0, None, 0) != cache_key("2026010100", 3, None, 0)
    assert cache_key("2026010100", 0, None, 0) != cache_key("2026010100", 0, None, 1)
    with pytest.raises(ValueError):
        run_time("../../bad")
    with pytest.raises(ValueError):
        request_url("2026010101", 0)


def test_decode_real_grib_and_missing_bitmap(tmp_path):
    path = tmp_path / "sample.grib2"
    make_grib(path, bitmap=True)
    m, arrays = decode(
        path, "2026010100", 3, 2, (0, 0, 2, 2), "fixture://grib", datetime(2026, 1, 1, tzinfo=UTC)
    )
    assert len(m.fields) == 5
    assert m.fields[0].verticalCoordinate.value == 2
    assert m.fields[0].validTime.hour == 3
    assert np.nanmean(arrays["air_temperature_2m"]) == 280
    assert np.isnan(arrays["air_temperature_2m"]).any()
    assert np.nanmean(arrays["wind_speed_10m"]) == pytest.approx(np.hypot(10, -4))
    assert np.nanmean(arrays["precipitation_rate_surface"]) == pytest.approx(0.001)
    with pytest.raises(SourceError, match="time"):
        decode(path, "2026010100", 6, 2, None, "", datetime.now(UTC))
    path.write_bytes(b"<html>source unavailable</html>")
    with pytest.raises(SourceError):
        decode(path, "2026010100", 3, 2, None, "", datetime.now(UTC))


def test_grid_order_longitude_and_duplicate_rejection():
    lon, lat = np.meshgrid([359.5, 359.75, 0, 0.25], [1, 0.75])
    values = np.arange(8)
    a, g = normalize_grid(values, lat.flatten(), lon.flatten(), 2, (-1, 0, 1, 2))
    assert g.west == -0.5 and g.south == 0.75
    assert a[0, 0] == 4
    with pytest.raises(SourceError):
        normalize_grid([1, 2, 3], [0, 1, 0], [0, 1, 1], 2)


def test_network_failure_cache_fallback_and_partial_response(tmp_path):
    async def run():
        def fail(request):
            return httpx.Response(503)

        p = GFSProvider(tmp_path, httpx.MockTransport(fail))
        with pytest.raises(SourceError):
            await p.list_runs()
        from weather_api.models import Provenance
        from weather_api.provider import describe

        catalog = describe(
            "2026010100",
            Provenance(
                source="test",
                synthetic=False,
                retrievedAt=datetime.now(UTC),
                sourceResolution=0.25,
                transformations=[],
            ),
        )
        (tmp_path / "runs" / "2026010100.json").write_text(catalog.model_dump_json())
        assert (await p.list_runs())[0].runId == "2026010100"
        await p.client.aclose()
        p = GFSProvider(
            tmp_path, httpx.MockTransport(lambda r: httpx.Response(200, content=b"GRIBshort"))
        )
        with pytest.raises(SourceError, match="complete"):
            await p.download("https://nomads.ncep.noaa.gov/test", tmp_path / "bad")
        assert not (tmp_path / "bad").exists()
        await p.client.aclose()

    asyncio.run(run())
