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
      return findAgents();
    }),
    byId: publicQuery
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const agent = await findAgentById(input.id);
        if (!agent) throw new Error("Agent not found");
        return agent;
      }),
  }),

  metrics: createRouter({
    byAgent: publicQuery
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const [agent, tokenUsage, latencyHistory, runHistory] = await Promise.all([
          findAgentById(input.id),
          getTokenUsage(input.id),
          getLatencyHistory(input.id),
          getRunHistory(input.id),
        ]);
        if (!agent) throw new Error("Agent not found");
        return { agent, tokenUsage, latencyHistory, runHistory };
      }),
  }),

  run: createRouter({
    create: publicQuery
      .input(z.object({ agentId: z.string(), prompt: z.string().min(1) }))
      .mutation(async ({ input }) => {
        const agent = await findAgentById(input.agentId);
        if (!agent) throw new Error("Agent not found");

        const latency = agent.latency + Math.floor(Math.random() * 100 - 50);
        const tokensUsed = Math.floor(Math.random() * 3000 + 200);
        const output = `Result for "${input.prompt}":\n\nGenerated output based on the provided prompt. The agent processed this in ${latency}ms using optimal token allocation.`;

        const runId = await createRun({
          agentId: input.agentId,
          prompt: input.prompt,
          output,
          tokensUsed,
          latency,
        });

        return {
          id: runId,
          agentId: input.agentId,
          output,
          tokensUsed,
          latency,
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
