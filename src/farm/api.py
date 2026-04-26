import asyncio
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from .database import SessionLocal, init_db
from .models import Agent, Run, Metrics, Wallet
from .runner import Runner
from .evaluator import Evaluator
from .gacha import GachaEngine

app = FastAPI(title="LLM Farm API")

# Enable CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Pydantic Models ---

class WalletBase(BaseModel):
    cookies: int
    updated_at: datetime

    class Config:
        from_attributes = True

class AgentBase(BaseModel):
    id: str
    name: str
    title: Optional[str] = None
    provider: str
    rarity: int
    trait: Optional[str] = None
    token_limit: int
    cookies: int
    energy: int
    is_dirty: bool
    system_prompt: Optional[str] = None

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
    rating: Optional[int] = None
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

class JudgeRequest(BaseModel):
    judge_agent_id: str = "gemini-1"

# --- Endpoints ---

@app.on_event("startup")
def startup():
    init_db()

@app.get("/wallet", response_model=WalletBase)
def get_wallet(db: Session = Depends(get_db)):
    wallet = db.query(Wallet).first()
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    return wallet

@app.post("/summon", response_model=AgentDetail)
def summon_agent(db: Session = Depends(get_db)):
    engine = GachaEngine(db)
    try:
        new_agent = engine.perform_summon()
        return new_agent
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

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
async def run_prompt(req: RunRequest, db: Session = Depends(get_db)):
    runner = Runner(db)
    try:
        run_data = await runner.run_agent(req.agent_id, req.prompt)
        return run_data
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/compare", response_model=List[RunResponse])
async def compare_prompt(req: CompareRequest, db: Session = Depends(get_db)):
    agents = db.query(Agent).all()
    if not agents:
        return []
    
    runner = Runner(db)
    tasks = [runner.run_agent(agent.id, req.prompt) for agent in agents]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    valid_results = [r for r in results if isinstance(r, Run)]
    return valid_results

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

@app.post("/runs/{run_id}/judge")
async def judge_run(run_id: str, req: JudgeRequest, db: Session = Depends(get_db)):
    evaluator = Evaluator(db)
    try:
        result = await evaluator.evaluate_run(run_id, req.judge_agent_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
