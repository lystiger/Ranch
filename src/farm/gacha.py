import random
from typing import Dict, Any
from sqlalchemy.orm import Session
from .models import Agent, Wallet

# --- Gacha Configuration ---

SUMMON_COST = 50

RARITY_RATES = {
    5: 0.05,  # 5%
    4: 0.20,  # 20%
    3: 0.75,  # 75%
}

TITLES = {
    5: ["Grandmaster", "Prime", "Starlight Weaver", "Omniscient", "Void Walker"],
    4: ["Senior", "Creative", "Tactician", "Scholar", "Scribe"],
    3: ["Junior", "Intern", "Novice", "Wanderer", "Scout"]
}

TRAITS = {
    "Scholar": "Uses 20% less tokens for the same task.",
    "Energetic": "Passive energy recovery is 2x faster.",
    "Glutton": "Earns +5 bonus cookies but uses 1.5x energy.",
    "Swift": "Optimized for minimum latency.",
    "Stoic": "Never becomes 'dirty' on single errors."
}

PERSONALITIES = {
    "Gemini": [
        "A futuristic tech-wizard who speaks in sleek, clinical terms.",
        "A bubbly holographic girl obsessed with data efficiency.",
        "A serious sentinel guarding the digital frontier."
    ],
    "Kimi": [
        "A quiet librarian girl who values deep context and wisdom.",
        "A diligent assistant who always provides structured reports.",
        "A creative storyteller who weaves long, intricate answers."
    ],
    "Codex": [
        "A strict teacher who focus purely on logic and syntax.",
        "A fast-talking hacker girl who gets straight to the point.",
        "A logical automaton who breaks everything down into steps."
    ]
}

PROVIDERS = ["gemini", "kimi", "codex"]

class GachaEngine:
    def __init__(self, db: Session):
        self.db = db

    def perform_summon(self) -> Agent:
        """Atomic summon operation."""
        wallet = self.db.query(Wallet).first()
        if not wallet or wallet.cookies < SUMMON_COST:
            raise ValueError(f"Not enough cookies. Need {SUMMON_COST}, have {wallet.cookies if wallet else 0}")

        # 1. Roll Rarity
        roll = random.random()
        cumulative = 0
        rarity = 3
        for r, rate in sorted(RARITY_RATES.items(), reverse=True):
            cumulative += rate
            if roll <= cumulative:
                rarity = r
                break
        
        # 2. Pick Provider & Details
        provider = random.choice(PROVIDERS)
        title_prefix = random.choice(TITLES[rarity])
        name = f"{title_prefix} {provider.capitalize()}"
        trait_name = random.choice(list(TRAITS.keys()))
        personality = random.choice(PERSONALITIES.get(provider, ["A versatile AI assistant."]))
        
        # 3. Determine Stats based on Rarity
        token_limit = 10000 * (rarity - 2) * 2 # e.g. 3* -> 20k, 4* -> 40k, 5* -> 60k
        if rarity == 5: token_limit = 128000
        
        # 4. Create the Agent
        agent_id = f"{provider}-{random.randint(1000, 9999)}"
        new_agent = Agent(
            id=agent_id,
            name=name,
            title=title_prefix,
            provider=provider,
            rarity=rarity,
            trait=trait_name,
            system_prompt=f"Your name is {name}. You are a {rarity}-star agent with the trait '{trait_name}'. {personality}",
            token_limit=token_limit,
            energy=100,
            cookies=0
        )

        # 5. Deduct cost & Save
        wallet.cookies -= SUMMON_COST
        self.db.add(new_agent)
        self.db.commit()
        self.db.refresh(new_agent)
        
        return new_agent
