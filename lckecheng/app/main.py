# app/main.py
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from dotenv import load_dotenv
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(env_path, override=True)


from app.common.logger import setup_logging
from app.api.v1 import chat, oss

# 初始化日志配置
setup_logging()

app = FastAPI(
    title="Personal Chief API",
    description="私厨",
    version="0.1.0"
)

# 1. 配置跨域资源共享（CORS）
# 插件开发中，由于请求来自浏览器扩展环境，必须正确配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境建议指定插件的 ID 或具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. 挂载路由
app.include_router(chat.router, prefix="/api/v1", tags=["对话"])
app.include_router(oss.router, prefix="/api/v1", tags=["申请上传签名url"])

# 3. 挂载前端资源
static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_dir):
    app.mount("/", app=StaticFiles(directory=static_dir, html=True), name="static")


if __name__ == "__main__":
    import uvicorn
    # 启动命令: python -m app.main
    uvicorn.run("app.main:app", host="127.0.0.1", port=8001, reload=True)
