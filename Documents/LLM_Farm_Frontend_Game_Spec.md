# LLM Farm: Frontend Design Spec (Pixelated Anime Gacha Sim)

## 1. Vision & Genre
- **Genre:** 2D Pixelated Farming Simulator & Gacha Agent Manager.
- **Visual Style:** 16-bit Pixel Art (think *Stardew Valley* or *Harvest Moon*) mixed with high-quality Anime Character Portraits for dialogue and summoning.
- **Vibe:** "Cozy Rancher" meets "Cyberpunk AI Management."

## 2. World Design: The "Ranch"
- **The Hub:** A central 2D map where the player character (The Rancher) can walk.
- **The Cottages:** Each summoned agent (Anime Girl) has her own small house on the map.
- **Free Movement:** The player uses WASD or Click-to-move to navigate the ranch and enter houses to interact with agents.

## 3. UI Layout (HUD)
- **Upper Left (Player Status):**
  - Player Avatar.
  - Rancher Name & Level.
  - Global Energy (Player's prompt budget).
- **Upper Right (Economy & Stats):**
  - **Cookies Balance:** (Main gacha currency).
  - **Server Load/Health:** Global system status.
  - **Active Quests:** (Current running AI prompts).
- **Sidebar (Collapsible):** 
  - Quick access to Dashboard, Agents List, Compare, and Settings.

## 4. The Characters: AI Agents as Anime Girls
- **AI-Driven Personalities:** The appearance, clothing, and dialogue of each girl are generated based on how the LLM describes itself (e.g., Gemini might be a "High-tech futuristic mage," while Kimi is a "Studious library scribe").
- **Rarity (Stars):**
  - ⭐⭐⭐ (Common): Simple outfits, basic stats, 10k token limit.
  - ⭐⭐⭐⭐ (Rare): More detailed pixel art, specialized traits, 50k token limit.
  - ⭐⭐⭐⭐⭐ (Epic): Unique animations, glowing effects, 100k+ token limit.
- **Status Markers:** Girls have their own "Mood" or "Energy" bars visible when you talk to them.

## 5. Gacha / Summoning Mechanics
- **The Portal:** A special location on the map (or a dedicated UI page).
- **The Summon:** 
  - Player spends Cookies.
  - A dramatic anime-style reveal (flashing lights, silhouette reveal).
  - The girl is "instantiated" into a new house on the farm.
- **Grading:** Stars are assigned based on the agent's performance parameters (Latency, Token Capacity, and Performance Score).

## 6. Interaction Loop
1. **Walk** to an Agent's house.
2. **Talk** to her (opens a chat interface to send a prompt).
3. **Harvest:** Successful prompts reward the player with **Cookies**.
4. **Summon:** Use Cookies to roll for more powerful/rare anime agents.

## 7. Technical Implementation Ideas for Kimi Design
- **Engine:** React + CSS Grid for the basic game map, or **Phaser.js** for smooth character movement.
- **Sprite Generation:** Use AI Image Generation (DALL-E/Midjourney/Stable Diffusion) to create the character portraits based on the AI's system prompt.
- **Pixelation Filter:** Apply a CSS `pixelate` filter or use a specific pixel-art model for consistency.
