import { LayoutDashboard, Bot, GitCompareArrows, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "react-router-dom";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Bot, label: "Agents", path: "/agents" },
  { icon: GitCompareArrows, label: "Compare", path: "/compare" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-56 h-full border-r bg-background flex flex-col shrink-0">
      <div className="flex items-center gap-2 px-4 py-4 border-b">
        <div className="w-7 h-7 rounded bg-primary flex items-center justify-center">
          <Bot className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="font-semibold text-sm tracking-tight">LLM Farm</span>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                active
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t">
        <div className="text-xs text-muted-foreground px-3 py-2">
          <p>v1.0.0</p>
          <p className="mt-0.5">4 agents active</p>
        </div>
      </div>
    </aside>
  );
}
