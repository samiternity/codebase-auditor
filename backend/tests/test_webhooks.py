from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_webhook_missing_signature():
    """
    Test that the webhook route rejects requests that do not
    contain the x-hub-signature-256 header.
    """
    response = client.post("/api/webhooks/github", json={"pull_request": {}})
    
    assert response.status_code == 403
    assert response.json()["detail"] == "missing signature"
