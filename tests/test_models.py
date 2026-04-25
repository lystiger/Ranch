import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from farm.models import Base, Agent, Metrics, Run

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

def test_create_agent(db):
    agent = Agent(id="test-agent", name="Test Agent", provider="ollama")
    db.add(agent)
    db.commit()
    
    saved = db.query(Agent).filter(Agent.id == "test-agent").first()
    assert saved.name == "Test Agent"
    assert saved.energy == 100
    assert saved.cookies == 0

def test_agent_metrics_relationship(db):
    agent = Agent(id="test-agent", name="Test Agent", provider="ollama")
    metrics = Metrics(agent_id="test-agent", avg_latency=0.5, total_tokens=100)
    db.add(agent)
    db.add(metrics)
    db.commit()
    
    saved = db.query(Agent).filter(Agent.id == "test-agent").first()
    assert saved.metrics.avg_latency == 0.5
    assert saved.metrics.total_tokens == 100

def test_agent_run_relationship(db):
    agent = Agent(id="test-agent", name="Test Agent", provider="ollama")
    run = Run(id="run-1", agent_id="test-agent", prompt="Hi", response="Hello")
    db.add(agent)
    db.add(run)
    db.commit()
    
    saved = db.query(Agent).filter(Agent.id == "test-agent").first()
    assert len(saved.runs) == 1
    assert saved.runs[0].prompt == "Hi"
