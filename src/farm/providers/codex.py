import subprocess
import time
from .base import BaseProvider, ProviderResponse

class CodexProvider(BaseProvider):
    def run(self, prompt: str) -> ProviderResponse:
        start_time = time.time()
        
        try:
            # Assuming 'codex' CLI takes the prompt as an argument.
            # Adjust flags based on codex-cli 0.125.0 specific requirements.
            result = subprocess.run(
                ["codex", prompt],
                capture_output=True,
                text=True,
                check=True
            )
            text = result.stdout.strip()
            success = True
        except subprocess.CalledProcessError as e:
            text = f"Error: {e.stderr}"
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
