from unittest.mock import patch, MagicMock

def test_register(client):
    response = client.post(
        "/register",
        json={"username": "newuser", "password": "newpassword"}
    )
    assert response.status_code == 200
    assert response.json()["username"] == "newuser"
    assert "id" in response.json()

def test_login(client, test_user):
    response = client.post(
        "/token",
        data={"username": "testuser", "password": "password123"}
    )
    assert response.status_code == 200
    assert "access_token" in response.json()
    assert response.json()["token_type"] == "bearer"

def test_login_wrong_password(client, test_user):
    response = client.post(
        "/token",
        data={"username": "testuser", "password": "wrongpassword"}
    )
    assert response.status_code == 401

def test_read_users_me(client, auth_headers):
    response = client.get("/users/me", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["username"] == "testuser"

def test_unauthorized_access(client):
    response = client.get("/stats") # Stats is now protected
    assert response.status_code == 401

@patch("backend.app.routers.files.upload_file_to_minio")
def test_upload_file(mock_upload, client, auth_headers):
    mock_upload.return_value = None
    files = {"file": ("test.txt", b"content", "text/plain")}
    response = client.post("/upload", files=files, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["filename"] == "test.txt"
    assert data["version_count"] == 1

def test_create_folder(client, auth_headers):
    response = client.post(
        "/folders",
        json={"name": "New Folder"},
        headers=auth_headers
    )
    assert response.status_code == 200
    assert response.json()["name"] == "New Folder"

def test_search(client, auth_headers):
    # Need to verify case insensitive
    pass
