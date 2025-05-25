import logging
from common import timenow


from azure.functions import HttpRequest, HttpResponse


def main(req: HttpRequest) -> HttpResponse:
    logging.info('Python HTTP trigger function processed a request.')
    logging.info(f"Current time: {timenow.TimeNow()}")

    try:
        import shared.blob_utils as bu
    except ImportError:
        logging.error("Failed to import shared.blob_utils. Ensure the shared directory is in the Python path.")
        return HttpResponse(
            "Error: Unable to import shared.blob_utils. Please check the function configuration.",
            status_code=500
        )


    name = req.params.get('name')
    if not name:
        try:
            req_body = req.get_json()
        except ValueError:
            pass
        else:
            name = req_body.get('name')

    if name:
        return HttpResponse(f"Hello, {name}. This HTTP triggered function executed successfully.")
    else:
        return HttpResponse(
            "This HTTP triggered function executed successfully. Pass a name in the query string or in the request body for a personalized response.",
            status_code=200
        )
