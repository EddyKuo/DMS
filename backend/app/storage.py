from minio import Minio
import os
import io

MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "localhost:9000")
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "admin")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "password")
BUCKET_NAME = os.getenv("BUCKET_NAME", "dms-files")

client = Minio(
    MINIO_ENDPOINT,
    access_key=MINIO_ACCESS_KEY,
    secret_key=MINIO_SECRET_KEY,
    secure=False
)

def init_bucket():
    if not client.bucket_exists(BUCKET_NAME):
        client.make_bucket(BUCKET_NAME)

def upload_file_to_minio(file_data: io.BytesIO, size: int, object_name: str, content_type: str):
    client.put_object(
        BUCKET_NAME,
        object_name,
        file_data,
        length=size,
        content_type=content_type
    )

def delete_file_from_minio(object_name: str):
    client.remove_object(BUCKET_NAME, object_name)

def download_file_from_minio(object_name: str):
    return client.get_object(BUCKET_NAME, object_name)

from datetime import timedelta
def get_presigned_url(object_name: str, expires: timedelta = timedelta(hours=1)):
    return client.presigned_get_object(BUCKET_NAME, object_name, expires=expires)
