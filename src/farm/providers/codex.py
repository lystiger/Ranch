import asyncio
import time
from .base import BaseProvider, ProviderResponse

class CodexProvider(BaseProvider):
    async def run(self, prompt: str) -> ProviderResponse:
        start_time = time.time()
        
        try:
            # Using asyncio subprocess for async execution
            proc = await asyncio.create_subprocess_exec(
                "codex", prompt,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await proc.communicate()
            
            if proc.returncode == 0:
                text = stdout.decode().strip()
                success = True
            else:
                text = f"Error: {stderr.decode().strip()}"
                success = False
        except Exception as e:
            text = f"Unexpected Error: {str(e)}"
            success = False

        latency = time.time() - start_time
        
        return ProviderResponse(
            text=text,
            tokens_input=self.estimate_tokens(prompt),
            tokens_output=self.estimate_tokens(text),
            latency=latency,
            success=success
        )
