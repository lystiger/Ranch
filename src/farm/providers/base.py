from abc import ABC, abstractmethod
from pydantic import BaseModel

class ProviderResponse(BaseModel):
    text: str
    tokens_input: int
    tokens_output: int
    latency: float
    success: bool = True

class BaseProvider(ABC):
    @abstractmethod
    def run(self, prompt: str) -> ProviderResponse:
        """Run the prompt through the model and return metrics."""
        pass

    def estimate_tokens(self, text: str) -> int:
        """Default token estimation logic (chars / 4)."""
        return len(text) // 4
