# 🎨 LLM Farm Frontend (Web UI Spec)

## 1. Overview

This frontend is a dashboard for the LLM Farm system.

Purpose:
- Visualize multiple LLM agents (Kimi, Gemini, Codex, Ollama)
- Display token usage, performance, and latency
- Allow interaction with agents (run, compare, rate)

This is NOT a toy UI. It must feel like a modern developer tool.

---

## 2. Tech Stack

- React (TypeScript)
- Vite
- TailwindCSS
- shadcn/ui (component library)
- Recharts (charts)
- Axios (API calls)

---

## 3. Design Principles

- Clean, minimal, developer-focused
- Dark mode by default
- No excessive animations
- Gamification is subtle (badges, icons only)

---

## 4. Layout

### Main Structure

- Sidebar (left)
- Main dashboard (center)
- Optional detail panel (right)

---

### Sidebar

Sections:
- Dashboard
- Agents
- Compare
- Settings

---

## 5. Core Pages

---

### 5.1 Dashboard Page

Displays overview of all agents.

#### Components:
- Agent cards (grid)
- Token usage summary
- Performance chart

---

### 5.2 Agents Page

Table view of all agents.

Columns:
- Name
- Provider
- Status
- Tokens used / limit
- Latency
- Performance score
- Cookies

---

### 5.3 Agent Detail Page

Shows detailed metrics for one agent.

Sections:
- Token usage chart
- Latency over time
- Run history
- Logs preview

---

### 5.4 Compare Page

Compare multiple agents on same prompt.

Features:
- Input prompt box
- Run comparison
- Show results side-by-side

Metrics:
- Output quality (manual rating)
- Token usage
- Latency

---

## 6. Components

---

### 6.1 Agent Card

Displays:
- Name
- Status (🟢 🟡 🔴)
- Cookies (🍪)
- Token bar
- Latency

---

### 6.2 Token Bar

Progress bar:
- current tokens / limit

Color:
- Green < 60%
- Yellow < 80%
- Red ≥ 80%

---

### 6.3 Performance Badge

- High → green
- Medium → yellow
- Low → red

---

### 6.4 Logs Viewer

- Scrollable panel
- Monospace font
- Copy button

---

## 7. API Integration

Base URL:localhost:8000/


Endpoints:

- GET /agents
- GET /agents/{id}
- POST /run
- POST /compare
- POST /rate

---

## 8. State Management

- React hooks (useState, useEffect)
- Optional: Zustand (if needed)

---

## 9. Styling

- TailwindCSS
- Consistent spacing
- Rounded cards
- Soft shadows

---

## 10. UX Behavior

- Loading spinner for API calls
- Error toast messages
- Optimistic UI updates (optional)

---

## 11. Constraints

- Must be responsive
- Must handle empty states
- Must not block UI during API calls

---

## 12. Non-Goals

- No heavy animations
- No game-like visuals
- No unnecessary complexity

---

## 13. Future Enhancements

- Real-time updates (WebSocket)
- Notifications
- Multi-user support

---

## 14. Deliverables

- Full React project
- Clean folder structure
- Reusable components
- Ready to connect to backend

---

## 15. Instructions for Implementation

- Generate full React + Vite project
- Use TypeScript
- Create all pages and components
- Use mock data if API not available
- Keep code clean and modular

Do NOT overcomplicate.
Do NOT add unnecessary libraries.
Focus on clarity and usability.