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

export const llmFarmRouter = createRouter({
  agents: createRouter({
    list: publicQuery.query(async () => {
      const response = await fetch("http://localhost:8000/agents");
      if (!response.ok) throw new Error("Failed to fetch agents from backend");
      const agents = await response.json();
      // Map backend fields to frontend expected fields
      return agents.map((a: any) => ({
        id: a.id,
        name: a.name,
        provider: a.provider,
        status: a.is_dirty ? "degraded" : "online",
        tokensUsed: a.metrics?.total_tokens || 0,
        tokensLimit: a.token_limit,
        latency: Number((a.metrics?.avg_latency || 0).toFixed(3)),
        performanceScore: Number((a.metrics?.performance_score || 0).toFixed(3)),
        cookies: a.cookies,
        description: a.provider + " model instance",
        createdAt: a.created_at,
      }));
    }),
    byId: publicQuery
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const response = await fetch(`http://localhost:8000/agents/${input.id}`);
        if (!response.ok) throw new Error("Agent not found in backend");
        const a = await response.json();
        return {
          id: a.id,
          name: a.name,
          provider: a.provider,
          status: a.is_dirty ? "degraded" : "online",
          tokensUsed: a.metrics?.total_tokens || 0,
          tokensLimit: a.token_limit,
          latency: Number((a.metrics?.avg_latency || 0).toFixed(3)),
          performanceScore: Number((a.metrics?.performance_score || 0).toFixed(3)),
          cookies: a.cookies,
          description: a.provider + " model instance",
          createdAt: a.created_at,
        };
      }),
  }),

  metrics: createRouter({
    byAgent: publicQuery
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const response = await fetch(`http://localhost:8000/agents/${input.id}`);
        if (!response.ok) throw new Error("Agent not found in backend");
        const a = await response.json();

        // Transform data to frontend format
        const agent = {
          id: a.id,
          name: a.name,
          provider: a.provider,
          status: a.is_dirty ? "degraded" : "online",
          tokensUsed: a.metrics?.total_tokens || 0,
          tokensLimit: a.token_limit,
          latency: Number((a.metrics?.avg_latency || 0).toFixed(3)),
          performanceScore: Number((a.metrics?.performance_score || 0).toFixed(3)),
          cookies: a.cookies,
          description: a.provider + " model instance",
          createdAt: a.created_at,
        };

        const runHistory = a.runs.map((r: any) => ({
          id: r.id,
          agentId: r.agent_id,
          prompt: r.prompt,
          output: r.response,
          tokensUsed: r.tokens_input + r.tokens_output,
          latency: r.latency,
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
          latency: data.latency,
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

        // The backend returns results for ALL agents. We filter to match the requested agentIds.
        const filteredData = data.filter((run: any) => input.agentIds.includes(run.agent_id));

        // In a real app, we might want to fetch agent names from the backend too
        const agentsResponse = await fetch("http://localhost:8000/agents");
        const agents = await agentsResponse.json();
        const agentMap = Object.fromEntries(agents.map((a: any) => [a.id, a.name]));

        const results = filteredData.map((run: any) => ({
          agentId: run.agent_id,
          agentName: agentMap[run.agent_id] || run.agent_id,
          output: run.response,
          tokensUsed: run.tokens_input + run.tokens_output,
          latency: run.latency,
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
