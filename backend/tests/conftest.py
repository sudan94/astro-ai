import os
import sys
import types
from pathlib import Path


BACKEND_ROOT = Path(__file__).resolve().parents[1]

# Keep imports local to the backend package and avoid a PostgreSQL dependency in tests.
os.chdir(BACKEND_ROOT)
os.environ.setdefault("DATABASE_URL", "sqlite:///./test.db")
os.environ.setdefault("ENV", "development")

if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))


import json

# A schema-valid analysis, so the stubbed model exercises the success path of
# `ainvoke_structured` rather than burning through its repair rounds.
STUB_ANALYSIS = {
    "summary": {
        "core_identity": "Stubbed identity.",
        "life_focus": "Stubbed focus.",
        "overall_tone": "Stubbed tone.",
    },
    "personality": ["Stubbed personality trait."],
    "career": ["Stubbed career note."],
    "relationships": ["Stubbed relationship note."],
    "strengths": ["Stubbed strength."],
    "challenges": ["Stubbed challenge."],
    "health_tendencies": [],
    "spiritual_path": [],
    "key_yogas": [],
    "key_doshas": [],
}


def _install_langchain_stubs() -> None:
    if "langchain_openai" not in sys.modules:
        langchain_openai = types.ModuleType("langchain_openai")

        class ChatOpenAI:
            def __init__(self, *args, **kwargs):
                self.args = args
                self.kwargs = kwargs

            async def ainvoke(self, messages):
                return types.SimpleNamespace(
                    content=json.dumps(STUB_ANALYSIS),
                    usage_metadata={"input_tokens": 100, "output_tokens": 50},
                )

        langchain_openai.ChatOpenAI = ChatOpenAI
        sys.modules["langchain_openai"] = langchain_openai

    if "langchain_core.messages" not in sys.modules:
        langchain_core = sys.modules.setdefault(
            "langchain_core", types.ModuleType("langchain_core")
        )
        messages_module = types.ModuleType("langchain_core.messages")

        class _BaseMessage:
            def __init__(self, content):
                self.content = content

        class SystemMessage(_BaseMessage):
            pass

        class HumanMessage(_BaseMessage):
            pass

        class AIMessage(_BaseMessage):
            pass

        messages_module.SystemMessage = SystemMessage
        messages_module.HumanMessage = HumanMessage
        messages_module.AIMessage = AIMessage
        langchain_core.messages = messages_module
        sys.modules["langchain_core.messages"] = messages_module


_install_langchain_stubs()
