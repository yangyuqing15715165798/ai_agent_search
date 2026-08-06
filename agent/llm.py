from dotenv import load_dotenv,find_dotenv
import os
from langchain.chat_models import init_chat_model

# 加载配置文件
# find_dotenv() 确保找到 .env文件 递归查询当前项目文件夹
load_dotenv(find_dotenv())

AVAILABLE_MODELS = [
    "sensenova-6.7-flash-lite",
    "deepseek-v4-flash",
    "glm-5.2",
    "sensenova-u1-fast",
]

DEFAULT_MODEL = os.getenv("LLM_QWEN_MAX")

if DEFAULT_MODEL not in AVAILABLE_MODELS:
    raise ValueError(
        f"模型 {DEFAULT_MODEL!r} 不在可用列表中，请检查 LLM_QWEN_MAX 配置。"
    )


def get_model(model_name: str | None = None):
    selected = model_name or DEFAULT_MODEL
    if selected not in AVAILABLE_MODELS:
        raise ValueError(f"不支持的模型: {selected}")
    return init_chat_model(model=selected, model_provider="openai")

model = get_model()
