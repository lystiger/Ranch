export interface Agent {
  id: string;
  name: string;
  title?: string | null;
  provider: string;
  status: "online" | "degraded" | "offline";
  tokensUsed: number;
  tokensLimit: number;
  latency: number;
  performanceScore: number;
  cookies: number;
  rarity: number;
  trait?: string | null;
  description?: string | null;
  createdAt?: Date | string;
  systemPrompt?: string | null;
}

export interface RunResult {
  id?: string | number;
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
  runId: string | number;
  score: number;
}

export interface Wallet {
  cookies: number;
  updatedAt: string;
}
