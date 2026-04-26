import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LogsViewerProps {
  logs: string[];
  maxHeight?: string;
}

export function LogsViewer({ logs, maxHeight = "300px" }: LogsViewerProps) {
  const [copied, setCopied] = useState(false);

  const copyLogs = async () => {
    await navigator.clipboard.writeText(logs.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-md border bg-muted/40">
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <span className="text-xs font-medium text-muted-foreground">Logs</span>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={copyLogs}>
          {copied ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <ScrollArea className="w-full overflow-y-auto" style={{ height: maxHeight }}>
        <div className="p-3 space-y-1">
          {logs.map((log, i) => {
            const isError = log.includes("[ERROR]") || log.includes("[WARN]");
            const isDebug = log.includes("[DEBUG]");
            return (
              <div
                key={i}
                className={`text-xs font-mono leading-relaxed ${
                  isError ? "text-amber-400" : isDebug ? "text-muted-foreground" : "text-foreground/90"
                }`}
              >
                {log}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
