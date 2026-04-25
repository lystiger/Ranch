// This file is kept for reference but the frontend now uses tRPC directly via @/providers/trpc
// All API calls are made using trpc.llm.* hooks in the respective page components.

import type { Agent, RunResult, CompareResult } from "@/types";

export const api = {
  async getAgents(): Promise<Agent[]> {
    return [];
  },

  async getAgent(_id: string) {
    return {
      agent: {} as Agent,
      tokenUsage: [],
      latencyHistory: [],
      runHistory: [],
      logs: [],
    };
  },

  async runAgent(agentId: string, _prompt: string): Promise<RunResult> {
    return {
      agentId,
      output: "",
      tokensUsed: 0,
      latency: 0,
      timestamp: new Date().toISOString(),
    };
  },

  async compareAgents(_agentIds: string[], _prompt: string): Promise<CompareResult[]> {
    return [];
  },

  async rateAgent(_agentId: string, _runId: string, _score: number): Promise<void> {
    // no-op
  },
};
