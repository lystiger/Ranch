export interface Agent {
  id: string;
  name: string;
  provider: string;
  status: "online" | "degraded" | "offline";
  tokensUsed: number;
  tokensLimit: number;
  latency: number;
  performanceScore: number;
  cookies: number;
  description?: string | null;
  createdAt?: Date | string;
}

export interface RunResult {
  id?: number;
  agentId: string;
  output: string;
  tokensUsed: number;
  latency: number;
  timestamp: string;
  prompt?: string;
}

export interface CompareResult {
  agentId: string;
  agentName: string;
  output: string;
  tokensUsed: number;
  latency: number;
  rating?: number;
}

export interface TokenUsagePoint {
  timestamp: string;
  tokens: number;
}

export interface LatencyPoint {
  timestamp: string;
  latency: number;
}

export interface AgentMetrics {
  agent: Agent;
  tokenUsage: TokenUsagePoint[];
  latencyHistory: LatencyPoint[];
  runHistory: RunResult[];
  logs: string[];
}

export interface RateRequest {
  agentId: string;
  runId: number;
  score: number;
}
