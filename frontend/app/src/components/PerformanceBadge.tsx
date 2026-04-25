import { Badge } from "@/components/ui/badge";

interface PerformanceBadgeProps {
  score: number;
}

export function PerformanceBadge({ score }: PerformanceBadgeProps) {
  let variant: "default" | "secondary" | "destructive" | "outline" = "default";
  let label = "Low";

  if (score >= 85) {
    variant = "default";
    label = "High";
  } else if (score >= 60) {
    variant = "secondary";
    label = "Medium";
  } else {
    variant = "destructive";
    label = "Low";
  }

  return (
    <Badge variant={variant} className="text-xs">
      {label} ({score})
    </Badge>
  );
}
