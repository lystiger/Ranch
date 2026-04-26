import { z } from "zod";
import { createRouter, publicQuery, adminQuery } from "./middleware";
import {
  findAgents,
  findAgentById,
  getTokenUsage,
  getLatencyHistory,
  getRunHistory,
  createRun,
  createComparison,
  createComparisonResult,
  createRating,
} from "./queries/llmFarm";
import { runQuery } from "./queries/rawSql";

const mapAgent = (a: any) => ({
  id: a.id,
  name: a.name,
  title: a.title,
  provider: a.provider,
  status: a.is_dirty ? "degraded" : "online",
  tokensUsed: a.metrics?.total_tokens || 0,
  tokensLimit: a.token_limit,
  latency: Number((a.metrics?.avg_latency || 0).toFixed(3)),
  performanceScore: Number((a.metrics?.performance_score || 0).toFixed(3)),
  cookies: a.cookies,
  rarity: a.rarity,
  trait: a.trait,
  description: a.title ? `${a.title} (${a.trait})` : a.provider + " model instance",
  createdAt: a.created_at,
  systemPrompt: a.system_prompt,
});

export const llmFarmRouter = createRouter({
  agents: createRouter({
    list: publicQuery.query(async () => {
      const response = await fetch("http://localhost:8000/agents");
      if (!response.ok) throw new Error("Failed to fetch agents from backend");
      const agents = await response.json();
      return agents.map(mapAgent);
    }),
    byId: publicQuery
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const response = await fetch(`http://localhost:8000/agents/${input.id}`);
        if (!response.ok) throw new Error("Agent not found in backend");
        const a = await response.json();
        return mapAgent(a);
      }),
  }),

  wallet: createRouter({
    get: publicQuery.query(async () => {
      const response = await fetch("http://localhost:8000/wallet");
      if (!response.ok) throw new Error("Failed to fetch wallet");
      const data = await response.json();
      return {
        cookies: data.cookies,
        updatedAt: data.updated_at,
      };
    }),
  }),

  gacha: createRouter({
    summon: publicQuery.mutation(async () => {
      const response = await fetch("http://localhost:8000/summon", {
        method: "POST",
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Summon failed");
      }
      const a = await response.json();
      return mapAgent(a);
    }),
  }),

  metrics: createRouter({
    byAgent: publicQuery
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const response = await fetch(`http://localhost:8000/agents/${input.id}`);
        if (!response.ok) throw new Error("Agent not found in backend");
        const a = await response.json();

        const agent = mapAgent(a);

        const runHistory = a.runs.map((r: any) => ({
          id: r.id,
          agentId: r.agent_id,
          prompt: r.prompt,
          output: r.response,
          tokensUsed: r.tokens_input + r.tokens_output,
          latency: Number(r.latency.toFixed(2)),
          timestamp: new Date(r.timestamp).toISOString(),
        }));

        const tokenUsage = runHistory.map((r: any) => ({
          timestamp: r.timestamp,
          tokens: r.tokensUsed,
        }));

        const latencyHistory = runHistory.map((r: any) => ({
          timestamp: r.timestamp,
          latency: r.latency,
        }));

        return { agent, tokenUsage, latencyHistory, runHistory };
      }),
  }),

  run: createRouter({
    create: publicQuery
      .input(z.object({ agentId: z.string(), prompt: z.string().min(1) }))
      .mutation(async ({ input }) => {
        const response = await fetch("http://localhost:8000/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agent_id: input.agentId, prompt: input.prompt }),
        });

        if (!response.ok) throw new Error("Backend run failed");
        const data = await response.json();

        return {
          id: data.id,
          agentId: data.agent_id,
          output: data.response,
          tokensUsed: data.tokens_input + data.tokens_output,
          latency: Number(data.latency.toFixed(2)),
          timestamp: new Date().toISOString(),
        };
      }),
  }),

  compare: createRouter({
    create: publicQuery
      .input(z.object({ agentIds: z.array(z.string()).min(1), prompt: z.string().min(1) }))
      .mutation(async ({ input }) => {
        const response = await fetch("http://localhost:8000/compare", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: input.prompt }),
        });

        if (!response.ok) throw new Error("Backend comparison failed");
        const data = await response.json();

        const filteredData = data.filter((run: any) => input.agentIds.includes(run.agent_id));

        const agentsResponse = await fetch("http://localhost:8000/agents");
        const agents = await agentsResponse.json();
        const agentMap = Object.fromEntries(agents.map((a: any) => [a.id, a.name]));

        const results = filteredData.map((run: any) => ({
          agentId: run.agent_id,
          agentName: agentMap[run.agent_id] || run.agent_id,
          output: run.response,
          tokensUsed: run.tokens_input + run.tokens_output,
          latency: Number(run.latency.toFixed(2)),
        }));

        return { comparisonId: "cmp_" + Date.now(), results };
      }),
  }),

  rate: createRouter({
    create: publicQuery
      .input(z.object({ agentId: z.string(), runId: z.string(), score: z.number().min(1).max(10) }))
      .mutation(async ({ input }) => {
        const response = await fetch("http://localhost:8000/rate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ run_id: input.runId, rating: input.score }),
        });

        if (!response.ok) throw new Error("Backend rating failed");
        return { success: true };
      }),
  }),

  db: createRouter({
    runSql: adminQuery
      .input(z.object({ sql: z.string().min(1) }))
      .mutation(async ({ input }) => {
        const rows = await runQuery(input.sql, []);
        return { rows, count: rows.length };
      }),
  }),
});
