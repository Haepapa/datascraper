import os
import json
from azure.storage.blob.aio import BlobServiceClient
from azure.storage.blob.aio._blob_client_async import BlobClient
from azure.storage.blob.aio._download_async import StorageStreamDownloader

BLOB_CONN_STR: str | None = os.getenv("AzureWebJobsStorage")
BLOB_CONTAINER: str = "rssdata"
BLOB_NAME: str | None = "urls.json"

async def load_urls() -> list[dict[str, str]] | None:
    
    if BLOB_CONN_STR is None:
        raise ValueError("AzureWebJobsStorage connection string is not set.")
    if BLOB_NAME is None:
        raise ValueError("BLOB_NAME string is not set.")
    
    service: BlobServiceClient = BlobServiceClient.from_connection_string(BLOB_CONN_STR)
    blob: BlobClient = service.get_blob_client(container=BLOB_CONTAINER, blob=BLOB_NAME)
    try:
        stream: StorageStreamDownloader[bytes] = await blob.download_blob()
        data: bytes = await stream.readall()
        return json.loads(data)
    except Exception:
        return None


async def save_json_to_blob(data: list[dict[str, str]], container: str, blob: str):
    if BLOB_CONN_STR is None:
        raise ValueError("AzureWebJobsStorage connection string is not set.")
    if BLOB_NAME is None:
        raise ValueError("BLOB_NAME string is not set.")
    
    blob_client: BlobClient = BlobClient.from_connection_string(
        conn_str=BLOB_CONN_STR,
        container_name=container,
        blob_name=blob
    )

    json_str: str = json.dumps(data, indent=2)
    await blob_client.upload_blob(json_str, overwrite=True)
