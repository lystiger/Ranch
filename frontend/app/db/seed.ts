import { getRawDb } from "../api/queries/rawSql";

async function seed() {
  const db = getRawDb();

  // Clear existing data
  await db.execute("DELETE FROM comparison_results");
  await db.execute("DELETE FROM comparisons");
  await db.execute("DELETE FROM ratings");
  await db.execute("DELETE FROM runs");
  await db.execute("DELETE FROM agents");

  // Seed agents
  const agents = [
    {
      id: "kimi-1",
      name: "Kimi",
      provider: "Moonshot AI",
      status: "online",
      tokens_used: 4200000,
      tokens_limit: 10000000,
      latency: 320,
      performance_score: 92,
      cookies: 3,
      description: "Long-context reasoning agent with 200K token support",
    },
    {
      id: "gemini-1",
      name: "Gemini",
      provider: "Google",
      status: "online",
      tokens_used: 6800000,
      tokens_limit: 10000000,
      latency: 280,
      performance_score: 88,
      cookies: 5,
      description: "Multimodal agent with native tool use",
    },
    {
      id: "codex-1",
      name: "Codex",
      provider: "OpenAI",
      status: "degraded",
      tokens_used: 8100000,
      tokens_limit: 10000000,
      latency: 650,
      performance_score: 76,
      cookies: 2,
      description: "Code generation and review specialist",
    },
    {
      id: "ollama-1",
      name: "Ollama",
      provider: "Local",
      status: "online",
      tokens_used: 1200000,
      tokens_limit: 5000000,
      latency: 150,
      performance_score: 72,
      cookies: 0,
      description: "Local Llama 3.1 70B inference",
    },
  ];

  for (const agent of agents) {
    await db.execute(
      `INSERT INTO agents (id, name, provider, status, tokens_used, tokens_limit, latency, performance_score, cookies, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        agent.id,
        agent.name,
        agent.provider,
        agent.status,
        agent.tokens_used,
        agent.tokens_limit,
        agent.latency,
        agent.performance_score,
        agent.cookies,
        agent.description,
      ]
    );
  }

  // Seed some runs for history
  const prompts = [
    "Summarize the quarterly report",
    "Generate React component for data table",
    "Debug Python asyncio issue",
    "Translate technical docs to Chinese",
    "Optimize SQL query performance",
  ];

  for (let i = 0; i < 20; i++) {
    const agent = agents[i % agents.length];
    await db.execute(
      `INSERT INTO runs (agent_id, prompt, output, tokens_used, latency, created_at)
       VALUES (?, ?, ?, ?, ?, DATE_SUB(NOW(), INTERVAL ? HOUR))`,
      [
        agent.id,
        prompts[i % prompts.length],
        `Completed: ${prompts[i % prompts.length]}`,
        Math.floor(Math.random() * 5000 + 500),
        Math.max(50, agent.latency + Math.floor(Math.random() * 200 - 100)),
        i * 2,
      ]
    );
  }

  console.log("Seed complete: 4 agents, 20 runs");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
