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
        };

        const runHistory = a.runs.map((r: any) => ({
          id: r.id,
          agentId: r.agent_id,
          prompt: r.prompt,
          output: r.response,
          tokensUsed: r.tokens_input + r.tokens_output,
          latency: r.latency,
          timestamp: r.timestamp,
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
        const agents = await findAgents();
        const selected = agents.filter((a) => input.agentIds.includes(a.id));
        const comparisonId = await createComparison(input.prompt);

        const results = await Promise.all(
          selected.map(async (agent) => {
            const latency = agent.latency + Math.floor(Math.random() * 100 - 50);
            const tokensUsed = Math.floor(Math.random() * 4000 + 300);
            const output = `**${agent.name}** response to "${input.prompt}":\n\nThis is a simulated response from ${agent.provider}'s ${agent.name} model. It provides a coherent, well-structured answer based on the input prompt with typical latency characteristics.`;

            await createComparisonResult({
              comparisonId,
              agentId: agent.id,
              output,
              tokensUsed,
              latency,
            });

            return {
              agentId: agent.id,
              agentName: agent.name,
              output,
              tokensUsed,
              latency,
            };
          })
        );

        return { comparisonId, results };
      }),
  }),

  rate: createRouter({
    create: publicQuery
      .input(z.object({ agentId: z.string(), runId: z.number(), score: z.number().min(1).max(5) }))
      .mutation(async ({ input }) => {
        await createRating({
          agentId: input.agentId,
          runId: input.runId,
          score: input.score,
        });
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
