import os
import time
import asyncio
import google.generativeai as genai
from .base import BaseProvider, ProviderResponse

class GeminiProvider(BaseProvider):
    def __init__(self):
        api_key = os.environ.get("GEMINI_API_KEY")
        if api_key:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel('gemini-1.5-flash')
            self.has_sdk = True
        else:
            self.has_sdk = False

    async def run(self, prompt: str) -> ProviderResponse:
        start_time = time.time()
        
        if not self.has_sdk:
            # Fallback to subprocess if no API key is found
            try:
                proc = await asyncio.create_subprocess_exec(
                    "gemini", prompt,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
                stdout, stderr = await proc.communicate()
                if proc.returncode == 0:
                    text = stdout.decode().strip()
                    success = True
                else:
                    text = f"CLI Error: {stderr.decode().strip()}"
                    success = False
            except Exception as e:
                text = f"CLI Unexpected Error: {str(e)}"
                success = False
        else:
            try:
                # Use SDK (gemini-1.5-flash for speed/latency)
                # Note: genai.GenerativeModel.generate_content is normally synchronous 
                # but we can wrap it in a thread or use the async version if available.
                # The latest SDK supports async: generate_content_async
                response = await self.model.generate_content_async(prompt)
                text = response.text
                success = True
            except Exception as e:
                text = f"SDK Error: {str(e)}"
                success = False

        latency = time.time() - start_time
        
        return ProviderResponse(
            text=text,
            tokens_input=self.estimate_tokens(prompt),
            tokens_output=self.estimate_tokens(text),
            latency=latency,
            success=success
        )
