import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from .models import Agent, Run, Metrics
from .providers.mock import MockProvider
from .providers.gemini import GeminiProvider
from .providers.codex import CodexProvider

def get_provider(provider_name: str):
    """Factory to get the provider implementation."""
    providers = {
        "mock": MockProvider,
        "gemini": GeminiProvider,
        "codex": CodexProvider,
        # "ollama": OllamaProvider,
    }
    provider_class = providers.get(provider_name, MockProvider)
    return provider_class()

class Runner:
    def __init__(self, db: Session):
        self.db = db

    def run_agent(self, agent_id: str, prompt: str) -> Run:
        agent = self.db.query(Agent).filter(Agent.id == agent_id).first()
        if not agent:
            raise ValueError(f"Agent {agent_id} not found")

        provider = get_provider(agent.provider)
        response = provider.run(prompt)

        # Create the Run record
        run = Run(
            id=str(uuid.uuid4()),
            agent_id=agent.id,
            prompt=prompt,
            response=response.text,
            tokens_input=response.tokens_input,
            tokens_output=response.tokens_output,
            latency=response.latency,
            success=response.success,
            timestamp=datetime.utcnow()
        )
        
        # Update Agent state (Gamification)
        if response.success:
            agent.cookies += 1
            # Simple energy consumption: 1% per 1000 tokens
            total_tokens = response.tokens_input + response.tokens_output
            agent.energy = max(0, agent.energy - (total_tokens // 1000))
        else:
            agent.is_dirty = True
            agent.cookies = max(0, agent.cookies - 1)

        # Update Metrics
        self.update_metrics(agent, run)

        self.db.add(run)
        self.db.commit()
        self.db.refresh(run)
        return run

    def update_metrics(self, agent: Agent, run: Run):
        metrics = agent.metrics
        if not metrics:
            metrics = Metrics(
                agent_id=agent.id,
                total_tokens=0,
                avg_latency=0.0,
                success_rate=0.0,
                performance_score=0.0
            )
            self.db.add(metrics)
            agent.metrics = metrics
        
        # Ensure values are not None (in case they were partially initialized)
        if metrics.total_tokens is None: metrics.total_tokens = 0
        if metrics.avg_latency is None: metrics.avg_latency = 0.0
        
        # Incremental average for latency
        all_runs = agent.runs + [run]
        total_runs = len(all_runs)
        
        metrics.total_tokens += (run.tokens_input + run.tokens_output)
        metrics.avg_latency = sum(r.latency for r in all_runs) / total_runs
        metrics.success_rate = sum(1 for r in all_runs if r.success) / total_runs
        
        # Basic performance score (quality - latency penalty)
        # Higher is better
        metrics.performance_score = 10.0 - (metrics.avg_latency * 2)
