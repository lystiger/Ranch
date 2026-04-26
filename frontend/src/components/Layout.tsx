import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";

export function Layout() {
  const location = useLocation();
  const isGameRoute = location.pathname === "/game";

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {!isGameRoute && <Sidebar />}
      <main className={isGameRoute ? "flex-1 overflow-hidden" : "flex-1 overflow-y-auto p-6"}>
        <Outlet />
      </main>
    </div>
  );
}
