from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_get_recent_audits():
    response = client.get("/api/dashboard/audits")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_get_compliance_trend():
    response = client.get("/api/dashboard/analytics/compliance-trend")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_get_top_violations():
    response = client.get("/api/dashboard/analytics/top-violations")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
