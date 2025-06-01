import azure.functions as func
from shared import blob_utils as bu
from shared import utils as u



async def main(req: func.HttpRequest) -> func.HttpResponse:
    # get list of urls from urls.json for rssnews
    url_data: dict[str, list[dict[str, str]] | str] | None = await bu.load_urls("rssnews")
    # check output location exists in data container (rssnews)
    await bu.create_container_and_path("rssnews")
    # call urls
    for url in url_data[0]["data"]:
        print(f"Processing URL: {url['url']}")
        save_path: str = f"rssnews/{url['source']}"
        await bu.create_container_and_path(save_path)

        await bu.save_to_blob(
            url="https://example.com/data.json",
            folder=save_path,
            filename=u.generate_filename()
        )    

    return func.HttpResponse("Testing timer logic manually", status_code=200)
