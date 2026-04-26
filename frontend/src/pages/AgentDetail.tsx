import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Activity, Clock, Cookie, Play, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { TokenBar } from "@/components/TokenBar";
import { PerformanceBadge } from "@/components/PerformanceBadge";
import { LogsViewer } from "@/components/LogsViewer";
import { trpc } from "@/providers/trpc";
import type { Agent, RunResult } from "@/types";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

export default function AgentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [lastRun, setLastRun] = useState<RunResult | null>(null);

  const { data: metrics, isLoading } = trpc.llm.metrics.byAgent.useQuery(
    { id: id! },
    { enabled: !!id }
  );

  const runMutation = trpc.llm.run.create.useMutation({
    onSuccess: (data) => {
      setLastRun({
        id: data.id,
        agentId: data.agentId,
        output: data.output,
        tokensUsed: data.tokensUsed,
        latency: data.latency,
        timestamp: data.timestamp,
      });
      utils.llm.metrics.byAgent.invalidate({ id: id! });
    },
  });

  const rateMutation = trpc.llm.rate.create.useMutation();
  const utils = trpc.useUtils();

  const handleRun = () => {
    if (!id || !prompt.trim()) return;
    runMutation.mutate({ agentId: id, prompt: prompt.trim() });
  };

  if (isLoading || !metrics) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  const agent = metrics.agent as unknown as Agent;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/agents")}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
            {agent.name}
            {agent.status === "online" && (
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" />
            )}
            {agent.status === "degraded" && (
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500" />
            )}
            {agent.status === "offline" && (
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500" />
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {agent.provider} · {agent.description}
          </p>
        </div>
        <PerformanceBadge score={agent.performanceScore} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" /> Latency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agent.latency}ms</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="w-3.5 h-3.5" /> Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agent.performanceScore}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <Cookie className="w-3.5 h-3.5" /> Cookies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agent.cookies}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Token Usage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <TokenBar used={agent.tokensUsed} limit={agent.tokensLimit} />
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.tokenUsage}>
                <defs>
                  <linearGradient id="tokenGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="timestamp" tick={{ fontSize: 11 }} stroke="#888" />
                <YAxis tick={{ fontSize: 11 }} stroke="#888" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1a1a",
                    border: "1px solid #333",
                    borderRadius: "6px",
                    fontSize: "12px",
                  }}
                />
                <Area type="monotone" dataKey="tokens" stroke="#10b981" fill="url(#tokenGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Latency History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.latencyHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="timestamp" tick={{ fontSize: 11 }} stroke="#888" />
                <YAxis tick={{ fontSize: 11 }} stroke="#888" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1a1a",
                    border: "1px solid #333",
                    borderRadius: "6px",
                    fontSize: "12px",
                  }}
                />
                <Line type="monotone" dataKey="latency" stroke="#3b82f6" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Run Agent</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Enter prompt..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRun()}
            />
            <Button onClick={handleRun} disabled={runMutation.isPending || !prompt.trim()}>
              {runMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1" />
              ) : (
                <Play className="w-4 h-4 mr-1" />
              )}
              Run
            </Button>
          </div>
          {lastRun && (
            <div className="rounded-md border bg-muted/40 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {new Date(lastRun.timestamp).toLocaleString()}
                </span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className="w-3.5 h-3.5 text-muted-foreground hover:text-amber-400 cursor-pointer"
                      onClick={() => {
                        if (lastRun.id) {
                          rateMutation.mutate({
                            agentId: lastRun.agentId,
                            runId: lastRun.id,
                            score: s,
                          });
                        }
                      }}
                    />
                  ))}
                </div>
              </div>
              <p className="text-sm whitespace-pre-wrap">{lastRun.output}</p>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>{lastRun.tokensUsed} tokens</span>
                <span>{lastRun.latency}ms</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Run History</CardTitle>
        </CardHeader>
        <CardContent>
          {metrics.runHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No runs yet</p>
          ) : (
            <div className="space-y-2">
              {metrics.runHistory.slice(0, 6).map((run, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-muted-foreground text-xs shrink-0">
                      {run.timestamp ? new Date(run.timestamp).toLocaleTimeString() : "N/A"}
                    </span>
                    <span className="truncate">{run.output ?? run.prompt ?? "Run"}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0 ml-4">
                    <span>{run.tokensUsed} tokens</span>
                    <span>{run.latency}ms</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <LogsViewer logs={[
        `[${new Date().toISOString()}] [INFO] Agent initialized successfully`,
        `[${new Date().toISOString()}] [INFO] Token budget refreshed`,
        `[${new Date().toISOString()}] [DEBUG] Cache hit ratio: 0.87`,
        `[${new Date().toISOString()}] [INFO] Processing request #48291`,
        `[${new Date().toISOString()}] [WARN] High latency detected (650ms)`,
        `[${new Date().toISOString()}] [INFO] Retrying with exponential backoff`,
        `[${new Date().toISOString()}] [DEBUG] Context window: 14200 / 128000 tokens`,
        `[${new Date().toISOString()}] [INFO] Request completed in 420ms`,
        `[${new Date().toISOString()}] [INFO] Garbage collection triggered`,
        `[${new Date().toISOString()}] [DEBUG] Memory usage: 2.4GB / 8GB`,
        `[${new Date().toISOString()}] [INFO] New model weights loaded`,
        `[${new Date().toISOString()}] [WARN] Token usage approaching limit (81%)`,
        `[${new Date().toISOString()}] [INFO] Health check passed`,
        `[${new Date().toISOString()}] [DEBUG] API latency p99: 320ms`,
        `[${new Date().toISOString()}] [INFO] Scheduled maintenance in 24h`,
      ]} />
    </div>
  );
}
