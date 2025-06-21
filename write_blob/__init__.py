import azure.functions as func

from shared.blob_utils import save_json_to_blob


async def main(req: func.HttpRequest) -> func.HttpResponse:
    """
    Handles HTTP requests to overwrite a blob in Azure Blob Storage with JSON data.
    
    Validates the presence of 'container' and 'blob' query parameters and parses the request body as JSON. If validation succeeds, saves the JSON data to the specified blob and returns a success response. Returns a 400 response if required parameters are missing or the JSON body is invalid.
    """
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
