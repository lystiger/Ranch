import asyncio
import time
from .base import ProviderResponse, BaseProvider

class MockProvider(BaseProvider):
    async def run(self, prompt: str) -> ProviderResponse:
        start_time = time.time()
        # Simulate some processing time
        await asyncio.sleep(0.1)
        response_text = f"Mock response to: {prompt}"
        latency = time.time() - start_time
        
        return ProviderResponse(
            text=response_text,
            tokens_input=self.estimate_tokens(prompt),
            tokens_output=self.estimate_tokens(response_text),
            latency=latency,
            success=True
        )
