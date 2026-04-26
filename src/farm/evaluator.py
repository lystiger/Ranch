import json
import re
from sqlalchemy.orm import Session
from .models import Run, Agent
from .runner import Runner

class Evaluator:
    def __init__(self, db: Session):
        self.db = db
        self.runner = Runner(db)

    async def evaluate_run(self, run_id: str, judge_agent_id: str = "gemini-1"):
        """Evaluate a specific run using another agent as a judge."""
        run = self.db.query(Run).filter(Run.id == run_id).first()
        if not run:
            raise ValueError(f"Run {run_id} not found")

        judge_agent = self.db.query(Agent).filter(Agent.id == judge_agent_id).first()
        if not judge_agent:
            # Fallback to first available agent if specified judge is missing
            judge_agent = self.db.query(Agent).first()
            if not judge_agent:
                raise ValueError("No agents available to act as judge")

        # Construct the evaluation prompt
        eval_prompt = f"""You are the 'Head Rancher' of an LLM Farm. Your job is to judge the quality of a response from one of your agents.

Prompt sent to agent:
"{run.prompt}"

Agent's Response:
"{run.response}"

Please rate the response from 1 to 10 based on accuracy, relevance, and clarity. 
Provide a short feedback explanation.

Return ONLY a JSON object in this format:
{{"score": 8, "feedback": "The response was accurate but slightly too long."}}
"""

        # Run the judge agent
        # We use run_agent but we might want to flag this as an 'eval' run to avoid recursive loops or messing with judge metrics
        # For now, we'll just run it normally
        eval_run = await self.runner.run_agent(judge_agent.id, eval_prompt)
        
        # Parse the JSON from the judge's response
        try:
            # Try to find JSON block if model wrapped it in markdown
            json_match = re.search(r'\{.*\}', eval_run.response, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group())
                run.judge_score = result.get("score")
                run.judge_feedback = result.get("feedback")
                self.db.commit()
                return result
            else:
                raise ValueError("Judge response did not contain valid JSON")
        except (json.JSONDecodeError, ValueError) as e:
            run.judge_feedback = f"Failed to parse judge response: {eval_run.response[:100]}..."
            self.db.commit()
            raise e
