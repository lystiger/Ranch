import { Activity, Cookie, Wifi, WifiOff, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TokenBar } from "./TokenBar";
import { PerformanceBadge } from "./PerformanceBadge";
import type { Agent } from "@/types";

interface AgentCardProps {
  agent: Agent;
  onClick?: (agent: Agent) => void;
}

export function AgentCard({ agent, onClick }: AgentCardProps) {
  const statusIcon =
    agent.status === "online" ? (
      <Wifi className="w-4 h-4 text-emerald-400" />
    ) : agent.status === "degraded" ? (
      <AlertTriangle className="w-4 h-4 text-amber-400" />
    ) : (
      <WifiOff className="w-4 h-4 text-red-400" />
    );

  return (
    <Card
      className="cursor-pointer hover:border-primary/50 transition-colors"
      onClick={() => onClick?.(agent)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base font-semibold">{agent.name}</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">{agent.provider}</p>
          </div>
          <div className="flex items-center gap-2">
            {agent.cookies > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Cookie className="w-3.5 h-3.5" />
                <span>{agent.cookies}</span>
              </div>
            )}
            {statusIcon}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <TokenBar used={agent.tokensUsed} limit={agent.tokensLimit} />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Activity className="w-3.5 h-3.5" />
            <span>{agent.latency}ms</span>
          </div>
          <PerformanceBadge score={agent.performanceScore} />
        </div>
      </CardContent>
    </Card>
  );
}
