interface TokenBarProps {
  used: number;
  limit: number;
  showLabel?: boolean;
}

export function TokenBar({ used, limit, showLabel = true }: TokenBarProps) {
  const pct = Math.min(100, Math.round((used / limit) * 100));

  let color = "bg-emerald-500";
  if (pct >= 80) color = "bg-red-500";
  else if (pct >= 60) color = "bg-amber-500";

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>{pct}% used</span>
          <span>
            {(used / 1_000_000).toFixed(1)}M / {(limit / 1_000_000).toFixed(1)}M
          </span>
        </div>
      )}
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
