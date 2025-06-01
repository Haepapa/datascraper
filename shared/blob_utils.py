import os
import json
import aiohttp
from azure.storage.blob.aio import BlobServiceClient
from azure.storage.blob.aio._blob_client_async import BlobClient
from azure.storage.blob.aio._container_client_async import ContainerClient
from azure.storage.blob.aio._download_async import StorageStreamDownloader
from azure.core.exceptions import ResourceNotFoundError, ResourceExistsError

BLOB_CONN_STR: str | None = os.getenv("AzureWebJobsStorage")
BLOB_CONTAINER: str = "data"
BLOB_NAME: str | None = "urls.json"

async def load_urls(key: str | None = None) -> list[dict[str, str | dict[str, str | int]]] | None:
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

    async with BlobServiceClient.from_connection_string(BLOB_CONN_STR) as service:
        blob: BlobClient = service.get_blob_client(container=BLOB_CONTAINER, blob=BLOB_NAME)
        try:
            stream: StorageStreamDownloader[bytes] = await blob.download_blob()
            data: bytes = await stream.readall()
            items: list[dict[str, str | dict[str, str | int]]] | None = json.loads(data)
            if key is not None and items is not None:
                filtered: list[dict[str, str | dict[str, str | int]]] = [item for item in items if item.get("key") == key]
                return filtered
            return None
        except Exception as e:
            print(f"Error loading URLs from blob: {e}")
            return None


async def save_json_to_blob(data: list[dict[str, str]], container: str, blob: str) -> None:
    if BLOB_CONN_STR is None:
        raise ValueError("AzureWebJobsStorage connection string is not set.")
    if BLOB_NAME is None:
        raise ValueError("BLOB_NAME string is not set.")
    
    async with BlobClient.from_connection_string(
        conn_str=BLOB_CONN_STR,
        container_name=container,
        blob_name=blob
    ) as blob_client:
        json_str: str = json.dumps(data, indent=2)
        await blob_client.upload_blob(json_str, overwrite=True)


async def create_container_and_path(
    blob_path: str | None = None
) -> None:
    """
    Ensures the specified container and optional path exist in the given Azure Blob Storage account.

    Args:
        connection_string (str): Azure Storage account connection string.
        container_name (str): Name of the container to check/create.
        path (str | None): Optional path (prefix) inside the container to check/create.
                           Treated as a virtual folder (by uploading a zero-byte blob).
    """
    async with BlobServiceClient.from_connection_string(BLOB_CONN_STR) as service:
        # Check/create container
        try:
            container_client: ContainerClient = service.get_container_client(BLOB_CONTAINER)
            await container_client.get_container_properties()
        except ResourceNotFoundError:
            print(f"Container '{BLOB_CONTAINER}' not found. Creating it.")
            try:
                await service.create_container(BLOB_CONTAINER)
            except ResourceExistsError:
                pass  # Possible race condition where it was created just after check
            container_client = service.get_container_client(BLOB_CONTAINER)

        # If path is provided, check/create a virtual folder
        if blob_path:
            if not blob_path.endswith('/'):
                blob_path += '/'
            dummy_blob_path: str = blob_path + ".keep"  # Use a placeholder file to simulate folder
            blob_client: BlobClient = container_client.get_blob_client(dummy_blob_path)
            try:
                await blob_client.get_blob_properties()
            except ResourceNotFoundError:
                print(f"Path '{blob_path}' not found. Creating a placeholder blob at '{dummy_blob_path}'.")
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
    async with BlobServiceClient.from_connection_string(BLOB_CONN_STR) as service:
        container_client: ContainerClient = service.get_container_client(BLOB_CONTAINER)

        # Ensure container exists
        try:
            await container_client.get_container_properties()
        except ResourceNotFoundError:
            await service.create_container(BLOB_CONTAINER)

        # Full path to blob
        blob_path: str = f"{folder.strip('/')}/{filename}"
        blob_client: BlobClient = container_client.get_blob_client(blob_path)

        # Fetch content
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                response.raise_for_status()
                content: bytes = await response.read()

        # Upload to blob
        await blob_client.upload_blob(content, overwrite=True)


