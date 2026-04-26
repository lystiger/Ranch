import { Routes, Route } from "react-router-dom"
import { Layout } from "./components/Layout"
import Dashboard from "./pages/Dashboard"
import Agents from "./pages/Agents"
import AgentDetail from "./pages/AgentDetail"
import Compare from "./pages/Compare"
import Game from "./pages/Game"
import Settings from "./pages/Settings"
import Summon from "./pages/Summon"
import Login from "./pages/Login"
import NotFound from "./pages/NotFound"

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/agents" element={<Agents />} />
        <Route path="/agents/:id" element={<AgentDetail />} />
        <Route path="/compare" element={<Compare />} />
        <Route path="/game" element={<Game />} />
        <Route path="/summon" element={<Summon />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="/login" element={<Login />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
