import typer
from rich.console import Console
from rich.table import Table
from .database import init_db, SessionLocal
from .models import Agent

app = typer.Typer(help="LLM Farm CLI: Observability and Management for AI Agents")
console = Console()

@app.callback()
def callback():
    """
    LLM Farm CLI: Track, Compare, and Manage your AI Herd.
    """
    init_db()

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
            latency = f"{metrics.avg_latency:.2s}s" if metrics and metrics.avg_latency else "N/A"
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
