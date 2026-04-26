# Gacha Summoning System Plan (v2)

## 1. Objective
Implement a "Gacha/Summoning" system for LLM Farm where users spend a global currency ("Cookies") to unlock new, randomized AI Agents. Agents are modeled as unique "Anime Girl Personas" with varying rarities, traits, and performance-based stats.

## 2. Technical Strategy Updates

### 2.1 Schema Evolution (Migration Guard)
Since the project uses `create_all()` without a dedicated migration tool (Alembic), I will implement a **Migration Guard** in `database.py`. 
- On startup, the system will inspect the `agents` table.
- If columns like `rarity`, `trait`, or `system_prompt` are missing, it will execute raw `ALTER TABLE` commands to update the existing `farm.db` without data loss.

### 2.2 Atomic Transactions
The `/summon` endpoint will be strictly atomic. Cost deduction from the global `Wallet` and the creation of the new `Agent` will occur within a single database transaction. If any part fails, the entire operation rolls back.

### 2.3 Persona Engine (Derived Content)
Summoned agents will feature a **Derived Description Strategy**. Instead of raw model names, the backend will generate:
- **Title:** A thematic name (e.g., *"The Sapphire Scribe"*).
- **Presentation:** A combined string of the provider and trait to help the frontend display unique characters.

## 3. Implementation Steps

### Phase 1: Backend Database & Economy
1. **Wallet Table:** Add a `Wallet` table for global `cookies` balance (starts with a starter pack of 500).
2. **Agent Model Updates:** 
   - `rarity`: Integer (3, 4, or 5 stars).
   - `trait`: String (e.g., "Scholar", "Glutton", "Swift").
   - `system_prompt`: Text (The personality instructions).
   - `title`: String (The character's unique name).
3. **Migration Logic:** Implement the `ALTER TABLE` guard in `database.py`.

### Phase 2: The Gacha Engine Logic
1. **Drop Rates:** 3-Star (75%), 4-Star (20%), 5-Star (5%).
2. **Persona Pools:** Map rarities to specific token limits and complexity of system prompts.
3. **API Endpoints:**
   - `GET /wallet`: Fetch global cookies.
   - `POST /summon`: Atomic pull (Cost: 50 🍪). Returns the full Agent object.

### Phase 3: Frontend Integration
1. **Type Expansion:** Update `frontend/src/types/index.ts` to include `rarity`, `trait`, `title`, and `systemPrompt`.
2. **Summon Page UI:** 
   - Display global wallet balance.
   - **The Reveal Animation:**
     - 1. Pull result → Show card back.
     - 2. Color Glow → Blue (3⭐), Purple (4⭐), or Gold (5⭐) based on result.
     - 3. Click to Flip → Reveal anime portrait and stats.
3. **Dashboard Updates:** Show total cookies in the top navigation or sidebar.

## 4. Verification
- Verify `farm.db` upgrades correctly on restart.
- Test atomic rollback by simulating a crash during a pull.
- Verify that successful AI prompts now deposit cookies into the global wallet.
