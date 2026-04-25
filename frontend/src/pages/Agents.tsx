import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TokenBar } from "@/components/TokenBar";
import { PerformanceBadge } from "@/components/PerformanceBadge";
import { trpc } from "@/providers/trpc";
import type { Agent } from "@/types";

type SortKey = keyof Agent;
type SortDir = "asc" | "desc";

export default function Agents() {
  const { data: agents, isLoading } = trpc.llm.agents.list.useQuery();
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("performanceScore");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const navigate = useNavigate();

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const agentList = agents ?? [];
  const filtered = agentList.filter(
    (a) =>
      a.name.toLowerCase().includes(query.toLowerCase()) ||
      a.provider.toLowerCase().includes(query.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    if (typeof av === "number" && typeof bv === "number") {
      return sortDir === "asc" ? av - bv : bv - av;
    }
    return sortDir === "asc"
      ? String(av).localeCompare(String(bv))
      : String(bv).localeCompare(String(av));
  });

  const statusDot = (status: string) => {
    if (status === "online") return <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-2" />;
    if (status === "degraded") return <span className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-2" />;
    return <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-2" />;
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Agents</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage and inspect all LLM agents</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search agents..."
          className="pl-9"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer" onClick={() => toggleSort("name")}>
                <div className="flex items-center gap-1">
                  Name <ArrowUpDown className="w-3 h-3" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => toggleSort("provider")}>
                <div className="flex items-center gap-1">
                  Provider <ArrowUpDown className="w-3 h-3" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => toggleSort("status")}>
                <div className="flex items-center gap-1">
                  Status <ArrowUpDown className="w-3 h-3" />
                </div>
              </TableHead>
              <TableHead>Tokens</TableHead>
              <TableHead className="cursor-pointer" onClick={() => toggleSort("latency")}>
                <div className="flex items-center gap-1">
                  Latency <ArrowUpDown className="w-3 h-3" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => toggleSort("performanceScore")}>
                <div className="flex items-center gap-1">
                  Score <ArrowUpDown className="w-3 h-3" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => toggleSort("cookies")}>
                <div className="flex items-center gap-1">
                  Cookies <ArrowUpDown className="w-3 h-3" />
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7}>
                    <Skeleton className="h-10" />
                  </TableCell>
                </TableRow>
              ))
            ) : sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                  No agents found
                </TableCell>
              </TableRow>
            ) : (
              sorted.map((agent) => (
                <TableRow
                  key={agent.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/agents/${agent.id}`)}
                >
                  <TableCell className="font-medium text-sm">{agent.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{agent.provider}</TableCell>
                  <TableCell className="text-sm">
                    {statusDot(agent.status)}
                    <span className="capitalize">{agent.status}</span>
                  </TableCell>
                  <TableCell className="w-48">
                    <TokenBar used={agent.tokensUsed} limit={agent.tokensLimit} />
                  </TableCell>
                  <TableCell className="text-sm">{agent.latency}ms</TableCell>
                  <TableCell>
                    <PerformanceBadge score={agent.performanceScore} />
                  </TableCell>
                  <TableCell className="text-sm">{agent.cookies}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
