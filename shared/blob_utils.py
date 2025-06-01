import os
import json
import aiohttp
from azure.storage.blob.aio import BlobServiceClient
from azure.storage.blob.aio._blob_client_async import BlobClient
from azure.storage.blob.aio._download_async import StorageStreamDownloader
from azure.core.exceptions import ResourceNotFoundError, ResourceExistsError

BLOB_CONN_STR: str | None = os.getenv("AzureWebJobsStorage")
BLOB_CONTAINER: str = "data"
BLOB_NAME: str | None = "urls.json"

async def load_urls(key: str | None = None) -> list[dict[str, str]] | None:
    """
    Asynchronously loads and parses JSON data from a specific Azure Blob Storage blob.
    Optionally filters the returned list by the provided key.

    Args:
        key: Optional; if provided, only entries with this key will be returned.

    Returns:
        A list of dictionaries containing the parsed JSON data if successful, or None if an error occurs during download or parsing.

    Raises:
        ValueError: If the Azure Blob Storage connection string or blob name is not set.
    """
    if BLOB_CONN_STR is None:
        raise ValueError("AzureWebJobsStorage connection string is not set.")
    if BLOB_NAME is None:
        raise ValueError("BLOB_NAME string is not set.")

    service: BlobServiceClient = BlobServiceClient.from_connection_string(BLOB_CONN_STR)
    blob: BlobClient = service.get_blob_client(container=BLOB_CONTAINER, blob=BLOB_NAME)
    try:
        stream: StorageStreamDownloader[bytes] = await blob.download_blob()
        data: bytes = await stream.readall()
        items: list[dict[str, str]] = json.loads(data)
        if key is not None:
            filtered = [item for item in items if item.get("key") == key]
            return filtered
        return items
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


async def create_container_and_path(
    BLOB_PATH: str | None = None
) -> None:
    """
    Ensures the specified container and optional path exist in the given Azure Blob Storage account.

    Args:
        connection_string (str): Azure Storage account connection string.
        container_name (str): Name of the container to check/create.
        path (str | None): Optional path (prefix) inside the container to check/create.
                           Treated as a virtual folder (by uploading a zero-byte blob).
    """
    blob_service_client = BlobServiceClient.from_connection_string(BLOB_CONN_STR)

    # Check/create container
    try:
        container_client = blob_service_client.get_container_client(BLOB_CONTAINER)
        await container_client.get_container_properties()
    except ResourceNotFoundError:
        print(f"Container '{BLOB_CONTAINER}' not found. Creating it.")
        try:
            await blob_service_client.create_container(BLOB_CONTAINER)
        except ResourceExistsError:
            pass  # Possible race condition where it was created just after check
        container_client = blob_service_client.get_container_client(BLOB_CONTAINER)

    # If path is provided, check/create a virtual folder
    if BLOB_PATH:
        if not BLOB_PATH.endswith('/'):
            BLOB_PATH += '/'
        dummy_blob_path = BLOB_PATH + ".keep"  # Use a placeholder file to simulate folder
        blob_client = container_client.get_blob_client(dummy_blob_path)
        try:
            await blob_client.get_blob_properties()
        except ResourceNotFoundError:
            print(f"Path '{BLOB_PATH}' not found. Creating a placeholder blob at '{dummy_blob_path}'.")
            await blob_client.upload_blob(b"", overwrite=True)


async def save_to_blob(
    url: str,
    folder: str,
    filename: str
) -> None:
    """
    Fetches content from a URL and stores it as a blob in the specified container and folder.

    Args:
        url (str): The URL to fetch content from.
        connection_string (str): Azure Storage account connection string.
        container_name (str): Name of the target blob container.
        folder (str): Virtual folder path inside the container (e.g., 'data/2025').
        filename (str): Name of the blob file to create (e.g., 'example.json').
    """
    blob_service_client = BlobServiceClient.from_connection_string(BLOB_CONN_STR)
    container_client = blob_service_client.get_container_client(BLOB_CONTAINER)

    # Ensure container exists
    try:
        await container_client.get_container_properties()
    except ResourceNotFoundError:
        await blob_service_client.create_container(BLOB_CONTAINER)

    # Full path to blob
    blob_path = f"{folder.strip('/')}/{filename}"
    blob_client = container_client.get_blob_client(blob_path)

    # Fetch content
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            response.raise_for_status()
            content = await response.read()

    # Upload to blob
    await blob_client.upload_blob(content, overwrite=True)


