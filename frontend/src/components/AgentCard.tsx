import { Activity, Cookie, Wifi, WifiOff, AlertTriangle, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TokenBar } from "./TokenBar";
import { PerformanceBadge } from "./PerformanceBadge";
import type { Agent } from "@/types";
import { cn } from "@/lib/utils";

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

  const rarityColor = agent.rarity === 5 ? "border-amber-500/50 shadow-[0_0_15px_rgba(251,191,36,0.1)]" : 
                      agent.rarity === 4 ? "border-purple-500/50" : "";

  return (
    <Card
      className={cn("cursor-pointer hover:border-primary/50 transition-colors relative overflow-hidden", rarityColor)}
      onClick={() => onClick?.(agent)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <CardTitle className="text-base font-bold truncate">
              {agent.name}
            </CardTitle>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-bold text-primary uppercase tracking-tighter bg-primary/10 px-1.5 rounded">
                {agent.title || agent.provider}
              </span>
              <div className="flex items-center">
                {Array.from({ length: agent.rarity }).map((_, i) => (
                  <Star key={i} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-2">
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
