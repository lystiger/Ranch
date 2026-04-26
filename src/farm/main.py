import asyncio
import typer
from rich.console import Console
from rich.table import Table
from .database import init_db, SessionLocal
from .models import Agent
from .runner import Runner
from .evaluator import Evaluator

app = typer.Typer(help="LLM Farm CLI: Observability and Management for AI Agents")
console = Console()

@app.callback()
def callback():
    """
    LLM Farm CLI: Track, Compare, and Manage your AI Herd.
    """
    init_db()

@app.command()
def judge(
    run_id: str = typer.Argument(None, help="ID of the run to evaluate"),
    agent: str = typer.Option("gemini-1", "--agent", "-a", help="Agent to use as judge"),
    last: bool = typer.Option(False, "--last", "-L", help="Judge the most recent run")
):
    """Ask an agent (the Head Rancher) to judge a specific run."""
    async def _judge():
        with SessionLocal() as db:
            evaluator = Evaluator(db)
            
            target_run_id = run_id
            if last:
                from .models import Run
                last_run = db.query(Run).order_by(Run.timestamp.desc()).first()
                if not last_run:
                    console.print("[yellow]No runs found to judge.[/yellow]")
                    return
                target_run_id = last_run.id
                
            if not target_run_id:
                console.print("[red]Error:[/red] Please provide a run_id or use --last")
                return

            try:
                with console.status(f"[bold green]The Head Rancher ({agent}) is reviewing the run..."):
                    result = await evaluator.evaluate_run(target_run_id, agent)
                
                console.print(f"\n[bold green]Evaluation Results for Run {target_run_id[:8]}:[/bold green]")
                console.print(f"Score: [bold]{result['score']}/10[/bold]")
                console.print(f"Feedback: {result['feedback']}")
            except Exception as e:
                console.print(f"[red]Error during evaluation:[/red] {e}")
                raise typer.Exit(code=1)

    asyncio.run(_judge())

@app.command()
def run(
    agent_id: str = typer.Argument(..., help="ID of the agent to run"),
    prompt: str = typer.Argument(..., help="The prompt to send to the agent")
):
    """Run a prompt through a specific agent."""
    async def _run():
        with SessionLocal() as db:
            runner = Runner(db)
            try:
                with console.status(f"[bold green]Agent {agent_id} is thinking..."):
                    run_data = await runner.run_agent(agent_id, prompt)
                
                console.print(f"\n[bold cyan]Response from {agent_id}:[/bold cyan]")
                console.print(run_data.response)
                console.print(f"\n[dim]Tokens: {run_data.tokens_input + run_data.tokens_output} | Latency: {run_data.latency:.2f}s[/dim]")
            except ValueError as e:
                console.print(f"[red]Error:[/red] {e}")
                raise typer.Exit(code=1)

    asyncio.run(_run())

@app.command()
def compare(
    prompt: str = typer.Argument(..., help="The prompt to compare across all agents")
):
    """Compare the output of all agents for a single prompt."""
    async def _compare():
        with SessionLocal() as db:
            agents = db.query(Agent).all()
            if not agents:
                console.print("[yellow]No agents found to compare.[/yellow]")
                return
            
            runner = Runner(db)
            table = Table(title=f"Comparison: {prompt[:50]}...")
            table.add_column("Agent", style="cyan")
            table.add_column("Response", ratio=3)
            table.add_column("Latency", justify="right")
            table.add_column("Tokens", justify="right")

            # Run all agents in parallel
            tasks = [runner.run_agent(agent.id, prompt) for agent in agents]
            
            with console.status("[bold green]Consulting the herd in parallel..."):
                results = await asyncio.gather(*tasks, return_exceptions=True)

            for agent, run_data in zip(agents, results):
                if isinstance(run_data, Exception):
                    table.add_row(agent.name, f"[red]Error: {run_data}[/red]", "N/A", "N/A")
                else:
                    table.add_row(
                        agent.name,
                        run_data.response,
                        f"{run_data.latency:.2f}s",
                        str(run_data.tokens_input + run_data.tokens_output)
                    )
            
            console.print(table)

    asyncio.run(_compare())

@app.command()
def serve(
    host: str = typer.Option("127.0.0.1", help="Host to bind the server to"),
    port: int = typer.Option(8000, help="Port to bind the server to")
):
    """Start the LLM Farm API server."""
    import uvicorn
    console.print(f"[bold green]Starting LLM Farm API on http://{host}:{port}[/bold green]")
    uvicorn.run("farm.api:app", host=host, port=port, reload=True)

@app.command()
def rest():
    """Replenish energy for all agents in the farm (manual rest)."""
    with SessionLocal() as db:
        agents = db.query(Agent).all()
        for agent in agents:
            agent.energy = 100
        db.commit()
        console.print("[bold green]The herd has rested. All agents are at 100% energy![/bold green] 💤")

@app.command()
def add(
    id: str = typer.Argument(..., help="Unique ID for the agent (e.g., 'kimi-1')"),
    name: str = typer.Argument(..., help="Display name for the agent"),
    provider: str = typer.Argument(..., help="Provider type (e.g., 'ollama', 'gemini')"),
    token_limit: int = typer.Option(50000, "--limit", "-l", help="Token limit for this agent")
):
    """Add a new agent to the farm."""
    with SessionLocal() as db:
        existing = db.query(Agent).filter(Agent.id == id).first()
        if existing:
            console.print(f"[red]Error:[/red] Agent with ID '{id}' already exists.")
            raise typer.Exit(code=1)
        
        new_agent = Agent(
            id=id,
            name=name,
            provider=provider,
            token_limit=token_limit,
            energy=100,
            cookies=0
        )
        db.add(new_agent)
        db.commit()
        console.print(f"[green]Success![/green] {name} has joined the farm.")

@app.command()
def remove(id: str = typer.Argument(..., help="ID of the agent to remove")):
    """Remove an agent from the farm."""
    with SessionLocal() as db:
        agent = db.query(Agent).filter(Agent.id == id).first()
        if not agent:
            console.print(f"[red]Error:[/red] Agent with ID '{id}' not found.")
            raise typer.Exit(code=1)
        
        db.delete(agent)
        db.commit()
        console.print(f"[yellow]Removed:[/yellow] Agent '{id}' has left the farm.")

@app.command()
def list():
    """List all registered agents in the farm."""
    with SessionLocal() as db:
        agents = db.query(Agent).all()
        if not agents:
            console.print("[yellow]The farm is empty. Add some agents first![/yellow]")
            return
        
        table = Table(title="LLM Farm: Registered Agents")
        table.add_column("ID", style="cyan")
        table.add_column("Name", style="magenta")
        table.add_column("Provider", style="green")
        table.add_column("Status", justify="center")
        
        for agent in agents:
            status = "🟢" if not agent.is_dirty else "🔴"
            table.add_row(agent.id, agent.name, agent.provider, status)
        
        console.print(table)

@app.command()
def status():
    """Show detailed status of all agents including gamification metrics."""
    with SessionLocal() as db:
        agents = db.query(Agent).all()
        if not agents:
            console.print("[yellow]The farm is empty.[/yellow]")
            return
        
        table = Table(title="LLM Farm: Herd Status")
        table.add_column("Agent", style="cyan")
        table.add_column("Cookies", justify="center")
        table.add_column("Energy", justify="center")
        table.add_column("Latency (avg)", justify="right")
        table.add_column("Tokens", justify="right")
        
        for agent in agents:
            metrics = agent.metrics
            latency = f"{metrics.avg_latency:.3f}s" if metrics and metrics.avg_latency else "N/A"
            tokens = f"{metrics.total_tokens}" if metrics else "0"
            
            # Simplified cookie/energy representation
            cookies = "🍪" * min(agent.cookies, 5) if agent.cookies > 0 else "🥚"
            energy_style = "green" if agent.energy > 50 else "yellow" if agent.energy > 20 else "red"
            energy = f"[{energy_style}]{agent.energy}%[/{energy_style}]"
            
            table.add_row(
                agent.name,
                cookies,
                energy,
                latency,
                tokens
            )
        
        console.print(table)

from .gacha import GachaEngine
...
@app.command()
def summon():
    """Summon a new AI Agent using 50 cookies."""
    with SessionLocal() as db:
        engine = GachaEngine(db)
        try:
            with console.status("[bold gold]Summoning from the digital void..."):
                agent = engine.perform_summon()
            
            console.print(f"\n[bold gold]🌟 SUMMON SUCCESSFUL! 🌟[/bold gold]")
            console.print(f"Name: [bold]{agent.name}[/bold]")
            console.print(f"Title: {agent.title}")
            console.print(f"Rarity: {'⭐' * agent.rarity}")
            console.print(f"Trait: {agent.trait}")
            console.print(f"Provider: {agent.provider}")
            console.print(f"\n[dim]New Agent ID: {agent.id}[/dim]")
        except ValueError as e:
            console.print(f"[red]Error:[/red] {e}")
            raise typer.Exit(code=1)

@app.command()
def wallet():
    """Check your global cookie balance."""
    with SessionLocal() as db:
        from .models import Wallet
        w = db.query(Wallet).first()
        if w:
            console.print(f"[bold]Wallet Balance:[/bold] {w.cookies} 🍪")
        else:
            console.print("[red]Wallet not found.[/red]")

if __name__ == "__main__":
    app()
