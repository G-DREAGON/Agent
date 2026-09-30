from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from app.models.schemas import ChatRequest
from app.agents.personal_chief import search_recipes, get_messages, clear_messages
import json

router = APIRouter()


@router.post("/chat/stream")
async def chat_endpoint(request: ChatRequest):
    async def generate():
        yield ": connected\n\n"

        try:
            async for chunk in search_recipes(
                prompt=request.message,
                image=request.image_url or "",
                thread_id=request.thread_id,
            ):
                yield f"data: {json.dumps({'content': chunk}, ensure_ascii=False)}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            msg = str(e)
            yield f"data: {json.dumps({'content': f'[错误] {msg}'}, ensure_ascii=False)}\n\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


@router.get("/chat/messages")
async def get_chat_messages_endpoint(thread_id: str):
    return {"messages": get_messages(thread_id)}


@router.delete("/chat/messages")
async def clear_chat_messages_endpoint(thread_id: str):
    clear_messages(thread_id)
    return {"status": "ok"}