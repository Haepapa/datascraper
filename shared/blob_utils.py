import os
import json
import requests
import asyncio
# import aiohttp
from azure.storage.blob.aio import BlobServiceClient
from azure.storage.blob.aio._blob_client_async import BlobClient
from azure.storage.blob.aio._container_client_async import ContainerClient
from azure.storage.blob.aio._download_async import StorageStreamDownloader
from azure.core.exceptions import ResourceNotFoundError, ResourceExistsError
from aiohttp import ClientSession, ClientResponseError, ClientTimeout

BLOB_CONN_STR: str | None = os.getenv("AzureWebJobsStorage")
BLOB_CONTAINER: str = "data"
BLOB_NAME: str | None = "urls.json"


async def load_urls(key: str | None = None) -> list[dict[str, str | dict[str, str | int]]] | None:
    """
    Asynchronously loads and parses JSON data from a designated Azure Blob Storage blob.
    
    If a key is provided, returns a list of items where the "key" field matches the given value. Returns all items if no key is specified. Returns None if an error occurs during download or parsing.
    
    Raises:
        ValueError: If the Azure Blob Storage connection string or blob name is not set.
    
    Returns:
        A list of dictionaries containing the JSON data, optionally filtered by key, or None on error.
    """
    if BLOB_CONN_STR is None:
        raise ValueError("AzureWebJobsStorage connection string is not set.")
    if BLOB_NAME is None:
        raise ValueError("BLOB_NAME string is not set.")

    async with BlobServiceClient.from_connection_string(BLOB_CONN_STR) as service:
        blob: BlobClient = service.get_blob_client(
            container=BLOB_CONTAINER, blob=BLOB_NAME)
        try:
            stream: StorageStreamDownloader[bytes] = await blob.download_blob()
            data: bytes = await stream.readall()
            items: list[dict[str, str | dict[str, str | int]]
                        ] | None = json.loads(data)
            if key is not None and items is not None:
                filtered: list[dict[str, str | dict[str, str | int]]] = [
                    item for item in items if item.get("key") == key]
                return filtered
            return items
        except Exception as e:
            print(f"Error loading URLs from blob: {e}")
            return None


async def save_json_to_blob(data: list[dict[str, str | dict[str, str | int]]], container: str, blob: str) -> None:
    """
    Serialize a list of dictionaries to JSON and upload it to a specified blob in Azure Blob Storage.
    
    Parameters:
        data (list[dict[str, str | dict[str, str | int]]]): The data to serialize and upload.
        container (str): The target Azure Blob Storage container name.
        blob (str): The target blob name within the container.
    
    Raises:
        ValueError: If the Azure Blob Storage connection string or blob name is not set.
    """
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
    Ensures the Azure Blob Storage container exists and optionally creates a virtual folder path.

    If the container does not exist, it is created. If a blob path is provided, a zero-byte placeholder blob named `.keep` is uploaded to simulate the existence of a folder at that path.
    """
    async with BlobServiceClient.from_connection_string(BLOB_CONN_STR) as service:
        # Check/create container
        try:
            container_client: ContainerClient = service.get_container_client(
                BLOB_CONTAINER)
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
            # Use a placeholder file to simulate folder
            dummy_blob_path: str = blob_path + ".keep"
            blob_client: BlobClient = container_client.get_blob_client(
                dummy_blob_path)
            try:
                await blob_client.get_blob_properties()
            except ResourceNotFoundError:
                print(
                    f"Path '{blob_path}' not found. Creating a placeholder blob at '{dummy_blob_path}'.")
                await blob_client.upload_blob(b"", overwrite=True)


async def save_to_blob(
    url: str,
    folder: str,
    filename: str
) -> None:
    """
    Fetches content from a URL and uploads it as a blob to a specified folder and filename in Azure Blob Storage.
    
    If the content cannot be fetched using asynchronous HTTP requests, falls back to a synchronous request in a separate thread. If both attempts fail, increments an error counter for the URL in the associated metadata JSON blob.
    """
    async with BlobServiceClient.from_connection_string(BLOB_CONN_STR) as service:
        container_client: ContainerClient = service.get_container_client(
            BLOB_CONTAINER)

        # Ensure container exists
        try:
            await container_client.get_container_properties()
        except ResourceNotFoundError:
            await service.create_container(BLOB_CONTAINER)

        # Full path to blob
        blob_path: str = f"{folder.strip('/')}/{filename}"
        blob_client: BlobClient = container_client.get_blob_client(blob_path)
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/114.0.0.0 Safari/537.36"
            ),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Connection": "keep-alive"
        }

        try:
            # Fetch content using aiohttp
            timeout = ClientTimeout(total=30)

            content: bytes | None = None

            async with ClientSession(timeout=timeout, headers=headers) as session:
                async with session.get(url, allow_redirects=True) as response:
                    response.raise_for_status()
                    content_type = response.headers.get("Content-Type", "")
                    print(f"[aiohttp] Content-Type: {content_type}")
                    content = await response.read()

        except ClientResponseError as ex:
            print(
                f"[aiohttp] ClientResponseError for URL '{url}': {ex.status} - {ex.message}")
            print(f"Falling back to requests for URL: {url}")

            def fetch_with_requests():
                """
                Fetches the content of a URL synchronously using the `requests` library with custom headers and a 30-second timeout.
                
                Returns:
                    bytes | None: The response content as bytes if the request is successful; otherwise, None if an error occurs.
                """
                try:
                    r = requests.get(url, headers=headers, timeout=30)
                    r.raise_for_status()
                    print(
                        f"[requests] Content-Type: {r.headers.get('Content-Type')}")
                    return r.content
                except Exception as ex2:
                    print(f"[requests] Failed to fetch URL '{url}': {ex2}")
                    return None

            loop = asyncio.get_running_loop()
            content = await loop.run_in_executor(None, fetch_with_requests)

        except Exception as ex:
            print(f"Unexpected error while downloading '{url}': {ex}")
            content = None  # store the exception for use in error file

        if content:
            await blob_client.upload_blob(content, overwrite=True)
        else:
            url_data: list[dict[str, str | dict[str, str | int]]] | None = await load_urls()

            if url_data is not None:
                for section in url_data:
                    for entry in section.get('data', []):
                        if entry.get('url') == url:
                            entry['errors'] = entry.get('errors', 0) + 1

            if url_data is not None and len(url_data) > 0:
                await save_json_to_blob(
                    url_data, container=BLOB_CONTAINER, blob=BLOB_NAME)
