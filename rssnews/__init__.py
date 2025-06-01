from shared import blob_utils as bu
from shared import utils as u
from azure.functions import TimerRequest



async def main(mytimer: TimerRequest) -> None:
    # get list of urls from urls.json for rssnews
    """
    Azure Function triggered by a timer to process and save RSS news URLs to blob storage.
    
    Loads a list of RSS news URLs, ensures the necessary blob storage containers and paths exist, and saves the content from each URL to Azure Blob Storage using a generated filename.
    """
    url_data: list[dict[str, str | dict[str, str | int]]] | None = await bu.load_urls("rssnews")
    if url_data is not None:
        print(f"Loaded URL data: {url_data}")
        # check output location exists in data container (rssnews)
        await bu.create_container_and_path("rssnews")
        # call urls
        for url in url_data[0]["data"]:
            print(f"Processing URL: {url['url']}")
            save_path: str = f"rssnews/{url['source']}"
            await bu.create_container_and_path(save_path)

            await bu.save_to_blob(
                url=url['url'],
                folder=save_path,
                filename=u.generate_filename()
            )