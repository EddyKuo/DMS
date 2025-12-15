
import requests
import os

API_URL = "http://127.0.0.1:8000"

def reproduce():
    print("reproducing bug...")

    # 1. Upload File (Will be File ID 1 or next available)
    print("Uploading file...")
    files = {'file': ('collision_file.txt', b'collision content', 'text/plain')}
    resp = requests.post(f"{API_URL}/upload", files=files)
    file_data = resp.json()
    print(f"File Uploaded: ID={file_data.get('id')} Name={file_data.get('filename')}")

    # 2. Create Folder (Will be Folder ID 1 or next available)
    print("Creating folder...")
    resp = requests.post(f"{API_URL}/folders", json={"name": "CollisionFolder"})
    folder_data = resp.json()
    print(f"Folder Created: ID={folder_data.get('id')} Name={folder_data.get('name')}")

    # 3. List Root
    print("Fetching Root...")
    resp = requests.get(f"{API_URL}/folders/0")
    data = resp.json()
    
    print("\n--- Root Contents ---")
    print("Folders:", data['sub_folders'])
    print("Files:", data['files'])
    
    # Check for name leakage
    found_folder = next((f for f in data['sub_folders'] if f['name'] == "CollisionFolder"), None)
    if found_folder:
        print(f"PASS: Found folder with correct name: {found_folder['name']}")
    else:
        print("FAIL: Could not find 'CollisionFolder'.")
        
    # Check if a folder exists with the file's name?
    bad_folder = next((f for f in data['sub_folders'] if f['name'] == file_data.get('filename')), None)
    if bad_folder:
        print(f"CRITICAL FAIL: Found folder with FILE name: {bad_folder['name']}")
    else:
        print("PASS: No folder found with file name.")

if __name__ == "__main__":
    reproduce()
