import hashlib
from collections import OrderedDict
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Literal

from fastapi import FastAPI, HTTPException, Query, Response
from fastapi.middleware.gzip import GZipMiddleware

from . import fixtures
from .models import Frame
from .provider import GFSProvider, SourceError

provider = GFSProvider(Path(".cache"))
payloads: OrderedDict[str, bytes] = OrderedDict()


@asynccontextmanager
async def lifespan(app):
    yield
    await provider.client.aclose()


app = FastAPI(title="Weather Visual Lab", lifespan=lifespan)
app.add_middleware(GZipMiddleware, minimum_size=1024)


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/runs")
async def runs(source: Literal["fixture", "gfs"] = "fixture"):
    try:
        result = [fixtures.run()] if source == "fixture" else await provider.list_runs()
        return {"runs": result}
    except SourceError as exc:
        raise HTTPException(503, str(exc)) from exc


def parse_bbox(value, lod):
    if value is None:
        if lod == 2:
            raise ValueError("native LOD requires a bounded region")
        return None
    bounds = tuple(float(x) for x in value.split(","))
    if len(bounds) != 4:
        raise ValueError("bbox must be west,south,east,north")
    w, s, e, n = bounds
    if not (-180 <= w < e <= 180 and -90 <= s < n <= 90):
        raise ValueError("invalid bounds; split antimeridian queries into non-crossing extents")
    if e - w > 90 or n - s > 90 or e - w < 2 or n - s < 2:
        raise ValueError("regional extent must be 2–90 degrees per axis")
    return bounds


@app.get("/api/frame", response_model=Frame)
async def frame(
    source: Literal["fixture", "gfs"] = "fixture",
    run: str = "fixture",
    lead: int = Query(0, ge=0, le=24),
    lod: int = Query(0, ge=0, le=2),
    bbox: str | None = None,
    scenario: Literal["mixed", "cardinal", "rotational", "gradient"] = "mixed",
):
    try:
        bounds = parse_bbox(bbox, lod)
        if lead % 3:
            raise ValueError("request actual 3-hour model steps")
        if source == "fixture":
            if run != "fixture":
                raise ValueError("invalid fixture run")
            manifest, arrays = fixtures.generate(lead, lod, bounds, scenario)
        else:
            manifest, arrays = await provider.fetch_frame(run, lead, bounds, lod)
        manifest = manifest.model_copy(deep=True)
        for descriptor in manifest.fields:
            data = arrays[descriptor.id].astype("<f4").tobytes(order="C")
            key = hashlib.sha256(data).hexdigest()
            payloads[key] = data
            payloads.move_to_end(key)
            descriptor.payload = f"/api/payload/{key}"
        while sum(map(len, payloads.values())) > 96 * 1024 * 1024:
            payloads.popitem(last=False)
        return manifest
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc
    except SourceError as exc:
        raise HTTPException(503, str(exc)) from exc


@app.get("/api/payload/{key}")
def payload(key: str):
    data = payloads.get(key)
    if data is None:
        raise HTTPException(404, "payload evicted; reload frame manifest")
    payloads.move_to_end(key)
    return Response(
        data,
        media_type="application/octet-stream",
        headers={"Cache-Control": "public,max-age=86400,immutable", "ETag": f'"{key}"'},
    )
