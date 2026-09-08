import numpy as np
from fastapi.testclient import TestClient
from jsonschema import Draft202012Validator

from weather_api.app import app
from weather_api.fixtures import generate
from weather_api.models import Frame

client = TestClient(app)


def test_manifest_and_binary_contract():
    response = client.get("/api/frame")
    assert response.status_code == 200
    m = response.json()
    Draft202012Validator(Frame.model_json_schema()).validate(m)
    assert len(m["run"]["availableValidTimes"]) == 9
    f = m["fields"][0]
    data = np.frombuffer(client.get(f["payload"]).content, dtype="<f4")
    assert data.size == f["horizontalGrid"]["width"] * f["horizontalGrid"]["height"]
    assert np.isnan(data).any()
    assert np.nanmin(data) > 200


def test_directional_fixtures_and_temporal_evolution():
    _, a = generate(scenario="cardinal")
    assert a["eastward_wind_10m"][0, 0] == 12
    assert a["eastward_wind_10m"][0, 100] == -12
    assert a["northward_wind_10m"][0, 200] == 12
    assert a["northward_wind_10m"][0, 300] == -12
    _, b = generate(6)
    _, c = generate(0)
    assert not np.array_equal(c["air_temperature_2m"], b["air_temperature_2m"])
    assert np.isnan(c["eastward_wind_10m"]).any()


def test_query_bounds_and_unavailable_fields():
    assert client.get("/api/frame?lod=2").status_code == 422
    assert client.get("/api/frame?bbox=nan,0,30,40").status_code == 422
    assert client.get("/api/frame?lod=2&bbox=-90,0,-60,30").status_code == 200
    assert client.get("/api/frame?lead=1").status_code == 422
    assert client.get("/api/payload/wrong").status_code == 404
