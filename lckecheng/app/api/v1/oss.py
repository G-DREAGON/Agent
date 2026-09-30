import alibabacloud_oss_v2 as oss
from fastapi import APIRouter, HTTPException, Request
from datetime import timedelta
import os
import httpx

router = APIRouter()

OSS_ENDPOINT = os.getenv("OSS_ENDPOINT", "oss-cn-beijing.aliyuncs.com")
OSS_BUCKET = os.getenv("OSS_BUCKET")

_client = None

def _get_client():
    global _client
    if _client is None:
        ak = os.getenv("OSS_ACCESS_KEY_ID") or os.getenv("ALIBABA_CLOUD_ACCESS_KEY_ID")
        sk = os.getenv("OSS_ACCESS_KEY_SECRET") or os.getenv("ALIBABA_CLOUD_ACCESS_KEY_SECRET")
        if not ak or not sk:
            raise HTTPException(status_code=500, detail="OSS credentials not configured (need OSS_ACCESS_KEY_ID / OSS_ACCESS_KEY_SECRET)")
        credentials_provider = oss.credentials.StaticCredentialsProvider(access_key_id=ak, access_key_secret=sk)
        cfg = oss.config.load_default()
        cfg.credentials_provider = credentials_provider
        cfg.region = "cn-beijing"
        _client = oss.Client(cfg)
    return _client


@router.get("/oss/presign")
def presign_upload(filename: str):
    content_type_map = {
        "jpg": "image/jpeg", "jpeg": "image/jpeg",
        "png": "image/png", "gif": "image/gif", "webp": "image/webp",
    }
    ext = filename.split(".")[-1].lower() if "." in filename else "jpg"
    content_type = content_type_map.get(ext, "application/octet-stream")

    client = _get_client()
    pre_result = client.presign(oss.PutObjectRequest(
        bucket=OSS_BUCKET,
        key=filename,
        content_type=content_type,
    ), expires=timedelta(seconds=3600))

    return {
        "uploadUrl": pre_result.url.strip('"'),
        "contentType": content_type,
        "accessUrl": f"https://{OSS_BUCKET}.{OSS_ENDPOINT}/{filename}"
    }


@router.post("/oss/upload")
async def upload_file(request: Request):
    content_type = request.headers.get("content-type", "image/jpeg")
    file_bytes = await request.body()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="No file data")

    ext_map = {
        "image/jpeg": "jpg", "image/png": "png",
        "image/gif": "gif", "image/webp": "webp",
    }
    ext = ext_map.get(content_type, "jpg")
    ts = int(__import__("time").time() * 1000)
    filename = f"{ts}_upload.{ext}"

    client = _get_client()
    pre_result = client.presign(oss.PutObjectRequest(
        bucket=OSS_BUCKET,
        key=filename,
        content_type=content_type,
    ), expires=timedelta(seconds=3600))

    upload_url = pre_result.url.strip('"')

    async with httpx.AsyncClient() as http:
        resp = await http.put(upload_url, content=file_bytes, headers={"Content-Type": content_type})
        if resp.status_code not in (200, 204):
            raise HTTPException(status_code=500, detail=f"OSS upload failed: {resp.status_code}")

    access_url = f"https://{OSS_BUCKET}.{OSS_ENDPOINT}/{filename}"
    return {"accessUrl": access_url, "filename": filename}