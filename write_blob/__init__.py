import azure.functions as func
import json
from shared.blob_utils import save_json_to_blob

async def main(req: func.HttpRequest) -> func.HttpResponse:
    try:
        # Parse query parameters
        container = req.params.get("container")
        blob = req.params.get("blob")

        if not container or not blob:
            return func.HttpResponse(
                "Missing 'container' or 'blob' query parameters",
                status_code=400
            )

        # Parse JSON body
        data = req.get_json()
    except ValueError:
        return func.HttpResponse("Invalid JSON body", status_code=400)

    # Save to blob
    await save_json_to_blob(data, container=container, blob=blob)

    return func.HttpResponse("Blob overwritten successfully", status_code=200)
