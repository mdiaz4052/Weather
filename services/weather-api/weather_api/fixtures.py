"""Compact deterministic fixture recipe; no external data, clocks, or random seed."""

from datetime import UTC, datetime, timedelta

import numpy as np

from .models import FIELD_SPECS, FieldDescriptor, Frame, Grid, Provenance, Vertical, WeatherRun

EPOCH = datetime(2026, 1, 1, tzinfo=UTC)
PROVENANCE = Provenance(
    source="Synthetic laboratory fixtures",
    synthetic=True,
    retrievedAt=EPOCH,
    sourceResolution=1,
    transformations=["Analytic fixture sampled at requested grid; not a forecast"],
)


def run():
    return WeatherRun(
        provider="fixture",
        model="synthetic",
        runId="fixture",
        initializedAt=EPOCH,
        availableValidTimes=[EPOCH + timedelta(hours=h) for h in range(0, 25, 3)],
        availableFields=list(FIELD_SPECS),
        nativeResolution=1,
        provenance=PROVENANCE,
    )


def generate(lead=0, lod=0, bbox=None, scenario="mixed"):
    step = [1, 0.5, 0.25][lod]
    west, south, east, north = bbox or (-180, -90, 180, 90)
    lon = np.arange(west, east + (step / 2 if bbox else 0), step)
    lat = np.arange(south, north + step / 2, step)
    x, y = np.meshgrid(lon, lat)
    grid = Grid(
        width=len(lon),
        height=len(lat),
        west=west,
        south=south,
        dx=step,
        dy=step,
        periodic=bbox is None,
    )
    phase = lead / 24 * np.pi
    temp = 303 - 0.7 * np.abs(y) + 6 * np.cos(np.deg2rad(x) + phase)
    rain = 0.001 * np.exp(-(((x - 20 - lead) / 25) ** 2) - ((y - 10) / 15) ** 2) + 0.002 * np.exp(
        -(((x + 90 - lead / 2) / 15) ** 2) - ((y - 40) / 10) ** 2
    )
    u = 18 * np.cos(np.deg2rad(y * 3)) + 5 * np.sin(np.deg2rad(x) + phase)
    v = 8 * np.sin(np.deg2rad(x * 2) + phase) * np.cos(np.deg2rad(y))
    if scenario == "cardinal":
        u = np.where(x < -90, 12, np.where(x < 0, -12, 0)).astype(float)
        v = np.where(x < 0, 0, np.where(x < 90, 12, -12)).astype(float)
    elif scenario == "rotational":
        u, v = -y / 4, x / 12
    elif scenario == "gradient":
        temp = 240 + (x + 180) / 6
    arrays = dict(zip(list(FIELD_SPECS)[:4], [temp, rain, u, v]))
    mask = (x > 70) & (x < 100) & (y > 10) & (y < 35)
    arrays = {k: np.where(mask, np.nan, a).astype("<f4") for k, a in arrays.items()}
    arrays["wind_speed_10m"] = np.hypot(arrays["eastward_wind_10m"], arrays["northward_wind_10m"])
    descriptors = []
    for key, (name, quantity, unit, height) in FIELD_SPECS.items():
        descriptors.append(
            FieldDescriptor(
                id=key,
                displayName=name,
                physicalQuantity=quantity,
                canonicalUnit=unit,
                sourceProvider="fixture",
                sourceModel="synthetic",
                sourceVariable=f"analytic:{scenario}:{key}",
                runTime=EPOCH,
                validTime=EPOCH + timedelta(hours=lead),
                forecastLead=lead,
                horizontalGrid=grid,
                verticalCoordinate=Vertical(
                    kind="height_above_ground" if height else "surface",
                    value=height or None,
                    unit="m" if height else None,
                ),
                provenance=PROVENANCE,
                payload="",
                temporalKind="derived" if key == "wind_speed_10m" else "instant",
            )
        )
    return Frame(run=run(), fields=descriptors, sourceState="synthetic", lod=lod), arrays
