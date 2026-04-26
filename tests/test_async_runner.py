import pytest
import asyncio
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from farm.models import Base, Agent, Run, Metrics
from farm.runner import Runner

# Setup in-memory sqlite for testing
engine = create_engine("sqlite:///:memory:")
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture
def db():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)

@pytest.mark.asyncio
async def test_parallel_runs_integrity(db):
    # 1. Setup Agents
    agent1 = Agent(id="a1", name="Agent 1", provider="mock")
    agent2 = Agent(id="a2", name="Agent 2", provider="mock")
    db.add_all([agent1, agent2])
    db.commit()

    runner = Runner(db)

    # 2. Run in parallel
    # This tests if the asyncio.Lock and session handling works
    tasks = [
        runner.run_agent("a1", "Prompt A"),
        runner.run_agent("a2", "Prompt B"),
        runner.run_agent("a1", "Prompt C")
    ]
    
    results = await asyncio.gather(*tasks)

    # 3. Assertions
    assert len(results) == 3
    assert all(isinstance(r, Run) for r in results)
    
    # Check Metrics updated correctly
    db.refresh(agent1)
    db.refresh(agent2)
    
    assert agent1.cookies == 2
    assert agent2.cookies == 1
    assert agent1.metrics.total_tokens > 0
    assert agent2.metrics.total_tokens > 0
    
    # Check number of runs in DB
    runs_count = db.query(Run).count()
    assert runs_count == 3

@pytest.mark.asyncio
async def test_energy_consumption(db):
    # Prompt long enough to consume energy (1% per 1000 tokens)
    # Mock provider estimate is len/4. 4000 chars = 1000 tokens
    long_prompt = "A" * 4000 
    agent = Agent(id="energy-test", name="Energy Test", provider="mock", energy=100)
    db.add(agent)
    db.commit()

    runner = Runner(db)
    await runner.run_agent("energy-test", long_prompt)
    
    db.refresh(agent)
    # 1000 input tokens + ~1000 output tokens = ~2% energy drop
    assert agent.energy < 100
