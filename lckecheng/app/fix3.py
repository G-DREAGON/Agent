import pathlib
p = pathlib.Path(r"D:\lckecheng\app\api\v1\oss.py")
c = p.read_text("utf-8")

old = 'credentials_provider = oss.credentials.EnvironmentVariableCredentialsProvider()'
new = 'ak = os.getenv("OSS_ACCESS_KEY_ID") or os.getenv("ALIBABA_CLOUD_ACCESS_KEY_ID"); sk = os.getenv("OSS_ACCESS_KEY_SECRET") or os.getenv("ALIBABA_CLOUD_ACCESS_KEY_SECRET"); credentials_provider = oss.credentials.StaticCredentialsProvider(access_key_id=ak, access_key_secret=sk) if ak and sk else (_ for _ in ()).throw(HTTPException(status_code=500, detail="OSS credentials not configured"))'

c = c.replace(old, new)
p.write_text(c, "utf-8")
print("Done")
