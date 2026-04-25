import { useState } from "react";
import { GitCompareArrows, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/providers/trpc";

export default function Compare() {
  const { data: agents, isLoading } = trpc.llm.agents.list.useQuery();
  const [selected, setSelected] = useState<string[]>([]);
  const [prompt, setPrompt] = useState("");
  const [results, setResults] = useState<{ comparisonId: number; results: { agentId: string; agentName: string; output: string; tokensUsed: number; latency: number }[] } | null>(null);
  const [ratings, setRatings] = useState<Record<string, number>>({});

  const compareMutation = trpc.llm.compare.create.useMutation({
    onSuccess: (data) => {
      setResults(data);
    },
  });

  const toggleAgent = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleCompare = () => {
    if (selected.length === 0 || !prompt.trim()) return;
    compareMutation.mutate({ agentIds: selected, prompt: prompt.trim() });
  };

  const rate = (agentId: string, score: number) => {
    setRatings((prev) => ({ ...prev, [agentId]: score }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Compare</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Run the same prompt across multiple agents
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Select Agents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10" />
              ))
            ) : (
              (agents ?? []).map((agent) => (
                <div
                  key={agent.id}
                  className={`flex items-center gap-3 rounded-md border px-3 py-2 cursor-pointer transition-colors ${
                    selected.includes(agent.id)
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => toggleAgent(agent.id)}
                >
                  <Checkbox
                    checked={selected.includes(agent.id)}
                    onCheckedChange={() => toggleAgent(agent.id)}
                    id={agent.id}
                  />
                  <label htmlFor={agent.id} className="text-sm cursor-pointer flex-1">
                    {agent.name}
                  </label>
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      agent.status === "online"
                        ? "bg-emerald-500"
                        : agent.status === "degraded"
                        ? "bg-amber-500"
                        : "bg-red-500"
                    }`}
                  />
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Prompt</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="Enter a prompt to compare across agents..."
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <div className="flex justify-end">
            <Button
              onClick={handleCompare}
              disabled={compareMutation.isPending || selected.length === 0 || !prompt.trim()}
            >
              {compareMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <GitCompareArrows className="w-4 h-4 mr-2" />
              )}
              Compare ({selected.length})
            </Button>
          </div>
        </CardContent>
      </Card>

      {results && results.results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold">Results</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {results.results.map((res) => (
              <Card key={res.agentId}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{res.agentName}</CardTitle>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => {
                        const isRated = (ratings[res.agentId] ?? 0) >= s;
                        return (
                          <button
                            key={s}
                            onClick={() => rate(res.agentId, s)}
                            className="p-0.5"
                          >
                            {isRated ? (
                              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                            ) : (
                              <Star className="w-4 h-4 text-muted-foreground hover:text-amber-400" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm whitespace-pre-wrap bg-muted/40 rounded-md p-3">
                    {res.output}
                  </p>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>{res.tokensUsed} tokens</span>
                    <span>{res.latency}ms latency</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Metrics Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {results.results.map((res) => (
                  <div
                    key={res.agentId}
                    className="rounded-md border px-3 py-2 space-y-1"
                  >
                    <div className="text-sm font-medium">{res.agentName}</div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Tokens</span>
                      <span>{res.tokensUsed}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Latency</span>
                      <span>{res.latency}ms</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Rating</span>
                      <span>{ratings[res.agentId] ? `${ratings[res.agentId]}/5` : "—"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
