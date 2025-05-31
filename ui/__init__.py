import azure.functions as func
from pathlib import Path
import aiofiles
import shared.blob_utils as bu
import json

async def serve_static(file_path: Path, mime: str) -> func.HttpResponse:
    print(f"Serving static file: {file_path.resolve()}")
    print(f"Mime type: {mime}")
    try:
        async with aiofiles.open(file_path, mode="r") as f:
            content = await f.read()
        return func.HttpResponse(content, mimetype=mime)
    except FileNotFoundError:
        return func.HttpResponse("Not found", status_code=404)
    
async def main(req: func.HttpRequest)  -> func.HttpResponse:
    static_path: str | None = req.route_params.get("static_file")
    print(f"Static path: {static_path}")
    print(f"Request method: {req.method}")

    # Handle static files
    if static_path:
        ext: str = Path(static_path).suffix
        mime: str = {
            ".css": "text/css",
            ".js": "application/javascript"
        }.get(ext, "text/plain")
        file_path: Path = Path(__file__).parent / "static" / static_path
        return await serve_static(file_path, mime)
    
    if req.method == "GET":
        # get urls from blob storage
        url_data: dict[str, list[dict[str, str]]] | None = await bu.load_urls()

        # get html template and add url data 
        async with aiofiles.open(Path(__file__).parent / "templates" / "index.html", mode="r") as f:
            template: str = await f.read()
        html: str = template.replace("{{ url_data }}", json.dumps(url_data, indent=2))

        # return html response
        return func.HttpResponse(html, mimetype="text/html")

    # must return http response
    return func.HttpResponse(
        "Method not allowed",
        status_code=405,
        mimetype="text/plain"
    )