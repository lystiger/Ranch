import time
import os
import httpx
import asyncio
from .base import BaseProvider, ProviderResponse

class KimiProvider(BaseProvider):
    def __init__(self):
        self.api_key = os.environ.get("KIMI_API_KEY")
        self.base_url = "https://api.moonshot.cn/v1/chat/completions"

    async def run(self, prompt: str) -> ProviderResponse:
        start_time = time.time()
        
        if not self.api_key:
            # Simulated Mode if no API key is found
            await asyncio.sleep(1.2)  # Simulate Kimi's typical latency
            text = f"[Simulated Kimi Response] I received your prompt: '{prompt}'. As an AI assistant from Moonshot, I'm currently running in observability mode because no KIMI_API_KEY was found."
            success = True
        else:
            try:
                # Real API Call
                headers = {"Authorization": f"Bearer {self.api_key}"}
                payload = {
                    "model": "moonshot-v1-8k",
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.3
                }
                async with httpx.AsyncClient() as client:
                    response = await client.post(self.base_url, json=payload, headers=headers, timeout=30.0)
                    response.raise_for_status()
                    data = response.json()
                    text = data["choices"][0]["message"]["content"]
                    success = True
            except Exception as e:
                text = f"Kimi API Error: {str(e)}"
                success = False

        latency = time.time() - start_time
        
        return ProviderResponse(
            text=text,
            tokens_input=self.estimate_tokens(prompt),
            tokens_output=self.estimate_tokens(text),
            latency=latency,
            success=success
        )
