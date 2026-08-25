def test_health_is_available_without_supabase(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["data"]["status"] == "ok"


def test_openapi_contains_mvp_routes(client):
    response = client.get("/openapi.json")
    assert response.status_code == 200
    paths = response.json()["paths"]
    expected = {
        "/api/v1/auth/me",
        "/api/v1/reports",
        "/api/v1/waste-records",
        "/api/v1/guides",
        "/api/v1/locations",
        "/api/v1/users",
        "/api/v1/dashboard/summary",
    }
    assert expected.issubset(paths)
