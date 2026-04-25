from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from .database import SessionLocal, init_db
from .models import Agent, Run, Metrics
from .runner import Runner

app = FastAPI(title="LLM Farm API")

# Enable CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the actual origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Pydantic Models ---

class AgentBase(BaseModel):
    id: str
    name: str
    provider: str
    token_limit: int
    cookies: int
    energy: int
    is_dirty: bool

class MetricsBase(BaseModel):
    avg_latency: float
    total_tokens: int
    success_rate: float
    performance_score: float

class RunResponse(BaseModel):
    id: str
    agent_id: str
    prompt: str
    response: str
    tokens_input: int
    tokens_output: int
    latency: float
    success: bool
    timestamp: datetime

    class Config:
        from_attributes = True

class AgentDetail(AgentBase):
    metrics: Optional[MetricsBase]
    runs: List[RunResponse] = []

    class Config:
        from_attributes = True

class RunRequest(BaseModel):
    agent_id: str
    prompt: str

class CompareRequest(BaseModel):
    prompt: str

class RateRequest(BaseModel):
    run_id: str
    rating: int

# --- Endpoints ---

@app.on_event("startup")
def startup():
    init_db()

@app.get("/agents", response_model=List[AgentDetail])
def get_agents(db: Session = Depends(get_db)):
    agents = db.query(Agent).all()
    runner = Runner(db)
    for agent in agents:
        runner.recover_energy(agent)
    db.commit()
    return agents

@app.get("/agents/{agent_id}", response_model=AgentDetail)
def get_agent(agent_id: str, db: Session = Depends(get_db)):
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    runner = Runner(db)
    runner.recover_energy(agent)
    db.commit()
    return agent

@app.post("/run", response_model=RunResponse)
def run_prompt(req: RunRequest, db: Session = Depends(get_db)):
    runner = Runner(db)
    try:
        run_data = runner.run_agent(req.agent_id, req.prompt)
        return run_data
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/compare", response_model=List[RunResponse])
def compare_prompt(req: CompareRequest, db: Session = Depends(get_db)):
    agents = db.query(Agent).all()
    if not agents:
        return []
    
    runner = Runner(db)
    results = []
    for agent in agents:
        try:
            run_data = runner.run_agent(agent.id, req.prompt)
            results.append(run_data)
        except Exception:
            # Continue with other agents if one fails
            continue
    return results

@app.post("/rate")
def rate_run(req: RateRequest, db: Session = Depends(get_db)):
    run = db.query(Run).filter(Run.id == req.run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    
    if not (1 <= req.rating <= 10):
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 10")
    
    run.rating = req.rating
    db.commit()
    return {"status": "success", "rating": req.rating}
