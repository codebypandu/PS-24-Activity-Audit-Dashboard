import os
from pathlib import Path

import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

BASE_DIR = Path(__file__).resolve().parent.parent


def resolve_frontend_dir() -> Path:
    candidates = [
        BASE_DIR / "frontend",
        Path("/frontend"),
        Path(__file__).resolve().parent / "frontend",
    ]

    for candidate in candidates:
        if candidate.exists():
            return candidate

    raise RuntimeError("Frontend directory could not be resolved")


FRONTEND_DIR = resolve_frontend_dir()


def get_backend_urls() -> list[str]:
    configured = os.getenv("BACKEND_URLS", "").strip()
    if configured:
        return [item.strip().rstrip("/") for item in configured.split(",") if item.strip()]

    return [
        "http://backend:8001/api",
        "http://127.0.0.1:8001/api",
        "http://127.0.0.1:8080/api",
    ]


def get_node_backend_urls() -> list[str]:
    configured = os.getenv("NODE_BACKEND_URLS", "").strip()
    if configured:
        return [item.strip().rstrip("/") for item in configured.split(",") if item.strip()]

    return [
        "http://node-backend:7000/api/node",
        "http://127.0.0.1:7000/api/node",
    ]

app = FastAPI(title="AuditLens Gateway")
app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")


async def proxy_request(request: Request, path: str, backend_urls: list[str] | None = None):
    headers = {
        key: value
        for key, value in request.headers.items()
        if key.lower() not in {"host", "content-length"}
    }
    body = await request.body()
    last_error = None
    response = None

    async with httpx.AsyncClient(timeout=20.0) as client:
        for backend_url in backend_urls or get_backend_urls():
            target_url = f"{backend_url}/{path}"
            try:
                response = await client.request(
                    request.method,
                    target_url,
                    headers=headers,
                    content=body,
                    params=request.query_params,
                )
                break
            except httpx.ConnectError as exc:
                last_error = exc
                continue

    if response is None:
        raise HTTPException(status_code=503, detail="Spring Boot backend is not reachable") from last_error

    content_type = response.headers.get("content-type", "")
    if "application/json" in content_type:
        return JSONResponse(status_code=response.status_code, content=response.json())
    return JSONResponse(status_code=response.status_code, content={"message": response.text})


@app.get("/")
async def login_page():
    return FileResponse(FRONTEND_DIR / "index.html")


@app.get("/dashboard")
async def dashboard_page():
    return FileResponse(FRONTEND_DIR / "dashboard.html")


@app.api_route("/api/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def api_proxy(path: str, request: Request):
    try:
        return await proxy_request(request, path)
    except HTTPException:
        raise
    except httpx.ConnectError as exc:
        raise HTTPException(status_code=503, detail="Spring Boot backend is not reachable") from exc
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail="Gateway failed to reach backend service") from exc


@app.api_route("/node-api/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def node_api_proxy(path: str, request: Request):
    try:
        return await proxy_request(request, path, get_node_backend_urls())
    except HTTPException:
        raise
    except httpx.ConnectError as exc:
        raise HTTPException(status_code=503, detail="Node.js backend is not reachable") from exc
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail="Gateway failed to reach Node.js backend") from exc
