import { runQuery, runInsert } from "./rawSql";
import type { Agent, Run } from "@db/schema";

export async function findAgents(): Promise<Agent[]> {
  const rows = await runQuery(
    `SELECT id, name, provider, status, tokens_used as tokensUsed, tokens_limit as tokensLimit,
     latency, performance_score as performanceScore, cookies, description, created_at as createdAt
     FROM agents ORDER BY created_at ASC`
  );
  return rows as unknown as Agent[];
}

export async function findAgentById(id: string): Promise<Agent | null> {
  const rows = await runQuery(
    `SELECT id, name, provider, status, tokens_used as tokensUsed, tokens_limit as tokensLimit,
     latency, performance_score as performanceScore, cookies, description, created_at as createdAt
     FROM agents WHERE id = ?`,
    [id]
  );
  return (rows[0] as unknown as Agent) ?? null;
}

export async function getTokenUsage(agentId: string) {
  const rows = await runQuery(
    `SELECT DATE(created_at) as timestamp, SUM(tokens_used) as tokens
     FROM runs WHERE agent_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
     GROUP BY DATE(created_at) ORDER BY timestamp ASC`,
    [agentId]
  );
  return rows.map((r: any) => ({ timestamp: r.timestamp, tokens: Number(r.tokens) || 0 }));
}

export async function getLatencyHistory(agentId: string) {
  const rows = await runQuery(
    `SELECT created_at as timestamp, latency
     FROM runs WHERE agent_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)
     ORDER BY created_at ASC`,
    [agentId]
  );
  return rows.map((r: any) => ({ timestamp: r.timestamp, latency: Number(r.latency) || 0 }));
}

export async function getRunHistory(agentId: string): Promise<Run[]> {
  const rows = await runQuery(
    `SELECT id, agent_id as agentId, prompt, output, tokens_used as tokensUsed, latency, created_at as createdAt
     FROM runs WHERE agent_id = ? ORDER BY created_at DESC LIMIT 20`,
    [agentId]
  );
  return rows as unknown as Run[];
}

export async function createRun(data: { agentId: string; prompt: string; output: string; tokensUsed: number; latency: number }): Promise<number> {
  const result = await runInsert(
    `INSERT INTO runs (agent_id, prompt, output, tokens_used, latency) VALUES (?, ?, ?, ?, ?)`,
    [data.agentId, data.prompt, data.output, data.tokensUsed, data.latency]
  );
  return result.insertId;
}

export async function createComparison(prompt: string): Promise<number> {
  const result = await runInsert(
    `INSERT INTO comparisons (prompt) VALUES (?)`,
    [prompt]
  );
  return result.insertId;
}

export async function createComparisonResult(data: { comparisonId: number; agentId: string; output: string; tokensUsed: number; latency: number }) {
  await runInsert(
    `INSERT INTO comparison_results (comparison_id, agent_id, output, tokens_used, latency) VALUES (?, ?, ?, ?, ?)`,
    [data.comparisonId, data.agentId, data.output, data.tokensUsed, data.latency]
  );
}

export async function createRating(data: { agentId: string; runId: number; score: number }) {
  await runInsert(
    `INSERT INTO ratings (agent_id, run_id, score) VALUES (?, ?, ?)`,
    [data.agentId, data.runId, data.score]
  );
}
