"""Provider-neutral, SI-valued transport contract. Arrays are separate little-endian f32."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, model_validator


class Vertical(BaseModel):
    kind: Literal["surface", "height_above_ground", "pressure_level", "altitude"]
    value: float | None = None
    unit: str | None = None


class Grid(BaseModel):
    width: int = Field(ge=2, le=1440)
    height: int = Field(ge=2, le=721)
    west: float
    south: float
    dx: float = Field(gt=0)
    dy: float = Field(gt=0)
    periodic: bool
    order: Literal["south_to_north_rows_eastward_columns"] = "south_to_north_rows_eastward_columns"


class Provenance(BaseModel):
    source: str
    synthetic: bool
    retrievedAt: datetime
    sourceResolution: float
    transformations: list[str]
    sourceUrl: str | None = None


class Uncertainty(BaseModel):
    source: str
    metric: str
    units: str
    payload: str
    provenance: Provenance


class FieldDescriptor(BaseModel):
    id: str
    displayName: str
    physicalQuantity: str
    canonicalUnit: str
    sourceProvider: str
    sourceModel: str
    sourceVariable: str
    runTime: datetime
    validTime: datetime
    forecastLead: float
    horizontalGrid: Grid
    verticalCoordinate: Vertical
    missingValuePolicy: Literal["NaN_mask"] = "NaN_mask"
    encoding: Literal["float32-le"] = "float32-le"
    temporalKind: Literal["instant", "interval_mean", "derived"] = "instant"
    intervalStart: datetime | None = None
    intervalEnd: datetime | None = None
    provenance: Provenance
    uncertainty: Uncertainty | None = None
    payload: str

    @model_validator(mode="after")
    def check_times(self):
        if self.runTime.tzinfo is None or self.validTime.tzinfo is None:
            raise ValueError("timestamps require a timezone")
        if abs((self.validTime - self.runTime).total_seconds() / 3600 - self.forecastLead) > 1e-6:
            raise ValueError("forecast lead disagrees with timestamps")
        if self.temporalKind == "interval_mean":
            if not self.intervalStart or not self.intervalEnd:
                raise ValueError("interval mean requires interval bounds")
            if not self.intervalStart < self.intervalEnd == self.validTime:
                raise ValueError("invalid averaging interval")
        return self


class WeatherRun(BaseModel):
    provider: str
    model: str
    runId: str
    initializedAt: datetime
    availableValidTimes: list[datetime]
    availableFields: list[str]
    nativeResolution: float
    provenance: Provenance


class Frame(BaseModel):
    schemaVersion: Literal[1] = 1
    run: WeatherRun
    fields: list[FieldDescriptor]
    unavailableFields: list[str] = []
    sourceState: Literal["live", "cached", "synthetic"]
    lod: int = Field(ge=0, le=2)


FIELD_SPECS = {
    "air_temperature_2m": ("Temperature", "air_temperature", "K", 2),
    "precipitation_rate_surface": ("Precipitation", "precipitation_rate", "kg m^-2 s^-1", 0),
    "eastward_wind_10m": ("Eastward wind", "eastward_wind", "m s^-1", 10),
    "northward_wind_10m": ("Northward wind", "northward_wind", "m s^-1", 10),
    "wind_speed_10m": ("Wind speed", "wind_speed", "m s^-1", 10),
}
