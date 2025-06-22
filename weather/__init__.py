from shared import blob_utils as bu
from shared import utils as u
from azure.functions import TimerRequest
# import azure.functions as func

standard_process: list[str] = ['weatherbroker']


# async def main(req: func.HttpRequest) -> func.HttpResponse:
async def main(mytimer: TimerRequest) -> None:
    # get list of urls from urls.json for weather
    """
    Triggered by a timer, processes a list of RSS news URLs and saves their content to Azure Blob Storage.

    Loads RSS news URLs, ensures the required blob storage containers and paths exist, and saves the content from each URL using a generated filename.
    """
    url_data: list[dict[str, str | dict[str, str | int]]] | None = await bu.load_urls("weather")
    if url_data is not None:
        # check output location exists in data container (weather)
        await bu.create_container_and_path("weather")
        # call urls
        for url in url_data[0]["data"]:
            print(f"Processing URL: {url['url']}")
            if url['source'] in standard_process:
                save_path: str = f"weather/{url['source']}"
                await bu.create_container_and_path(save_path)

                await bu.save_to_blob(
                    url=url['url'],
                    folder=save_path,
                    filename=u.generate_filename()
                )
        # return func.HttpResponse("RETURN", mimetype="text/html")

    # return func.HttpResponse("RETURN", mimetype="text/html")
