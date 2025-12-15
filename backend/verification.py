import requests
import time

API_URL = "http://127.0.0.1:8000"

def wait_for_server():
    for _ in range(10):
        try:
            requests.get(f"{API_URL}/docs")
            return True
        except:
            time.sleep(1)
    return False

def test_upload():
    print("Testing Upload...")
    files = {'file': ('test.txt', b'Hello DMS', 'text/plain')}
    response = requests.post(f"{API_URL}/upload", files=files)
    if response.status_code == 200:
        print(f"Upload Success: {response.json()}")
        return response.json()['id']
    else:
        print(f"Upload Failed: {response.text}")
        return None

def test_history():
    print("Testing History...")
    response = requests.get(f"{API_URL}/history")
    if response.status_code == 200:
        print(f"History: {len(response.json())} files found")
        print(response.json())
    else:
        print(f"History Failed: {response.text}")

def test_download(file_id):
    if not file_id:
        return
    print(f"Testing Download for ID {file_id}...")
    response = requests.get(f"{API_URL}/download/{file_id}")
    if response.status_code == 200:
        content = response.content
        print(f"Download Success. Content: {content.decode()}")
        assert content == b'Hello DMS'
    else:
        print(f"Download Failed: {response.text}")

def test_info(file_id):
    print(f"Testing Info for ID {file_id}...")
    response = requests.get(f"{API_URL}/files/{file_id}/info")
    if response.status_code == 200:
        print(f"Info Success: {response.json()}")
    else:
        print(f"Info Failed: {response.text}")

def test_update_and_search(file_id):
    print("Testing Update (Rename) and Search...")
    # Rename
    new_name = "renamed_test.txt"
    response = requests.put(f"{API_URL}/files/{file_id}", json={"filename": new_name})
    if response.status_code == 200:
        print(f"Update Success: {response.json()['filename']}")
        assert response.json()['filename'] == new_name
    else:
        print(f"Update Failed: {response.text}")
        return

    # Search
    print("Testing Search...")
    response = requests.get(f"{API_URL}/search?q=renamed")
    if response.status_code == 200:
        results = response.json()
        print(f"Search found {len(results)} files")
        found = any(f['filename'] == new_name for f in results)
        if found:
            print("Search verified: Found renamed file.")
        else:
            print("Search verified: File NOT found (Unexpected).")
    else:
        print(f"Search Failed: {response.text}")

def test_delete(file_id):
    print(f"Testing Delete for ID {file_id}...")
    response = requests.delete(f"{API_URL}/files/{file_id}")
    if response.status_code == 200:
        print("Delete Success")
    else:
        print(f"Delete Failed: {response.text}")
        return

    # Verify deletion by checking history or info
    response = requests.get(f"{API_URL}/files/{file_id}/info")
    if response.status_code == 404:
        print("Verification Success: File is gone.")
    else:
        print("Verification Failed: File still exists.")

def test_category_search():
    print("Testing Category Search...")
    # NOTE: We are assuming the previous upload was 'test.txt' which is text/plain -> document
    response = requests.get(f"{API_URL}/search?category=document")
    if response.status_code == 200:
        results = response.json()
        print(f"Category Search (document): found {len(results)} files")
        if len(results) > 0:
            print("Category verified: Found document.")
        else:
            print("Category verification warning: No documents found.")
    else:
        print(f"Category Search Failed: {response.text}")

    # Test negative match
    response = requests.get(f"{API_URL}/search?category=video")
    if response.status_code == 200:
        results = response.json()
        print(f"Category Search (video): found {len(results)} files")
        if len(results) == 0:
            print("Category verified: No videos found (correct).")
        else:
            print("Category verification failed: Found unexpected video.")

def test_date_search():
    print("Testing Date Search...")
    import datetime
    now = datetime.datetime.utcnow()
    start = (now - datetime.timedelta(hours=1)).isoformat()
    end = (now + datetime.timedelta(hours=1)).isoformat()
    
    response = requests.get(f"{API_URL}/search?start_date={start}&end_date={end}")
    if response.status_code == 200:
        results = response.json()
        print(f"Date Search verified: found {len(results)} files.")
    else:
        print(f"Date Search Failed: {response.text}")

def test_folders():
    print("Testing Folders...")
    # 1. Create Folder
    folder_data = {"name": "TestFolder"}
    response = requests.post(f"{API_URL}/folders", json=folder_data)
    folder_id = None
    if response.status_code == 200:
        folder = response.json()
        folder_id = folder['id']
        print(f"Created Folder: {folder['name']} (ID: {folder_id})")
    else:
        print(f"Create Folder Failed: {response.text}")
        return

    # 2. Upload file to folder
    print(f"Uploading file to Folder {folder_id}...")
    files = {'file': ('folder_file.txt', b'Content inside folder', 'text/plain')}
    data = {'folder_id': folder_id}
    response = requests.post(f"{API_URL}/upload", files=files, data=data)
    if response.status_code == 200:
        print("Upload to Folder Success")
    else:
        print(f"Upload to Folder Failed: {response.text}")

    # 3. List contents
    print(f"Listing Folder {folder_id} contents...")
    response = requests.get(f"{API_URL}/folders/{folder_id}")
    if response.status_code == 200:
        data = response.json()
        # Verify FolderContentsResponse structure
        if 'sub_folders' in data and 'files' in data and 'id' in data:
            print("Folder Structure Verified: FolderContentsResponse")
        else:
            print(f"Folder Structure Warning: Unexpected keys {data.keys()}")
            
        files = data.get('files', [])
        if any(f['filename'] == 'folder_file.txt' for f in files):
            print("Verified: File found inside folder.")
        else:
            print("Verification Failed: File NOT found inside folder.")
            print("Verification Failed: File NOT found inside folder.")
    else:
        print(f"List Contents Failed: {response.text}")

def test_nested_deletion():
    print("Testing Nested Folder Deletion...")
    # Create Parent
    parent = requests.post(f"{API_URL}/folders", json={"name": "ParentFolder"}).json()
    parent_id = parent['id']
    
    # Create Child
    child = requests.post(f"{API_URL}/folders", json={"name": "ChildFolder", "parent_id": parent_id}).json()
    child_id = child['id']
    
    # Upload file to Child
    files = {'file': ('child_file.txt', b'Child content', 'text/plain')}
    requests.post(f"{API_URL}/upload", files=files, data={"folder_id": child_id})
    
    # 1. Try non-recursive delete (Should Fail)
    print("1. Testing Non-Recursive Delete (Expected Failure)...")
    response = requests.delete(f"{API_URL}/folders/{parent_id}")
    if response.status_code == 400:
         print("Pass: Prevented non-recursive delete.")
    else:
         print(f"Fail: Unexpected status code {response.status_code}")

    # 2. Recursive Delete
    print("2. Testing Recursive Delete...")
    response = requests.delete(f"{API_URL}/folders/{parent_id}?recursive=true")
    if response.status_code == 200:
        print("Pass: Recursive delete success.")
    else:
        print(f"Fail: Recursive delete failed {response.text}")
        
    # Verify Child Gone
    resp = requests.get(f"{API_URL}/folders/{child_id}")
    if resp.status_code == 404:
        print("Pass: Child folder gone.")
    else:
        print("Fail: Child folder still exists.")

def test_bonus_features():
    print("Testing Bonus Features (Tags, Share, Stats)...")
    
    # 1. Add Tag
    tag_data = {"name": "important"}
    response = requests.post(f"{API_URL}/files/1/tags", json=tag_data)
    if response.status_code == 200:
        print(f"Added Tag: {response.json().get('tags', 'No tags in response')}")
    else:
        print(f"Add Tag Failed: {response.text}")

    # 2. Search by Tag
    response = requests.get(f"{API_URL}/search?tag=important")
    if response.status_code == 200:
        results = response.json()
        if len(results) > 0:
            print(f"Search by Tag Verified: Found {len(results)} files.")
        else:
            print("Search by Tag Failed: No files found.")
    else:
        print(f"Search by Tag Error: {response.text}")

    # 3. Share
    response = requests.get(f"{API_URL}/files/1/share?hours=2")
    if response.status_code == 200:
        data = response.json()
        if "expires_at" in data:
            print(f"Presigned URL Generated: {data['url'][:50]}... (Expires at {data['expires_at']})")
        else:
             print(f"Share Response Warning: Missing 'expires_at'. Data: {data}")
    else:
        print(f"Share Link Failed: {response.text}")

    # 4. Stats
    response = requests.get(f"{API_URL}/stats")
    if response.status_code == 200:
        data = response.json()
        if "storage_usage_percent" in data:
             print(f"System Stats Verified: {data}")
        else:
             print(f"Stats Response Warning: Missing usage percent. Data: {data}")
    else:
        print(f"Stats Failed: {response.text}")

def test_root_listing():
    print("Testing Root Listing...")
    # 1. Upload file to root
    files = {'file': ('root_file.txt', b'Root content', 'text/plain')}
    requests.post(f"{API_URL}/upload", files=files) # No folder_id
    
    # 2. Get Root
    response = requests.get(f"{API_URL}/folders/0")
    if response.status_code == 200:
        data = response.json()
        print(f"Root Listing: {len(data['files'])} files, {len(data['sub_folders'])} folders")
        if any(f['filename'] == 'root_file.txt' for f in data['files']):
             print("Pass: Root file found.")
        else:
             print("Fail: Root file not found.")
    else:
        print(f"Root Listing Failed: {response.text}")

if __name__ == "__main__":
    if wait_for_server():
        file_id = test_upload()
        if file_id:
            test_history()
            test_download(file_id)
            test_info(file_id)
            test_update_and_search(file_id)
            test_category_search()
            test_date_search()
            test_folders()
            test_nested_deletion()
            test_root_listing()
            test_bonus_features()
            test_delete(file_id)
    else:
        print("Server not available")
