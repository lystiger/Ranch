import typer
from rich.console import Console
from rich.table import Table
from .database import init_db, SessionLocal
from .models import Agent
from .runner import Runner

app = typer.Typer(help="LLM Farm CLI: Observability and Management for AI Agents")
console = Console()

@app.callback()
def callback():
    """
    LLM Farm CLI: Track, Compare, and Manage your AI Herd.
    """
    init_db()

@app.command()
def run(
    agent_id: str = typer.Argument(..., help="ID of the agent to run"),
    prompt: str = typer.Argument(..., help="The prompt to send to the agent")
):
    """Run a prompt through a specific agent."""
    with SessionLocal() as db:
        runner = Runner(db)
        try:
            with console.status(f"[bold green]Agent {agent_id} is thinking..."):
                run_data = runner.run_agent(agent_id, prompt)
            
            console.print(f"\n[bold cyan]Response from {agent_id}:[/bold cyan]")
            console.print(run_data.response)
            console.print(f"\n[dim]Tokens: {run_data.tokens_input + run_data.tokens_output} | Latency: {run_data.latency:.2f}s[/dim]")
        except ValueError as e:
            console.print(f"[red]Error:[/red] {e}")
            raise typer.Exit(code=1)

@app.command()
def compare(
    prompt: str = typer.Argument(..., help="The prompt to compare across all agents")
):
    """Compare the output of all agents for a single prompt."""
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

        for agent in agents:
            with console.status(f"[bold green]Consulting {agent.name}..."):
                try:
                    run_data = runner.run_agent(agent.id, prompt)
                    table.add_row(
                        agent.name,
                        run_data.response,
                        f"{run_data.latency:.2f}s",
                        str(run_data.tokens_input + run_data.tokens_output)
                    )
                except Exception as e:
                    table.add_row(agent.name, f"[red]Error: {e}[/red]", "N/A", "N/A")
        
        console.print(table)

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
            latency = f"{metrics.avg_latency:.2f}s" if metrics and metrics.avg_latency else "N/A"
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

if __name__ == "__main__":
    app()
