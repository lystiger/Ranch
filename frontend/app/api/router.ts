import { authRouter } from "./auth-router";
import { llmFarmRouter } from "./llmFarmRouter";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  llm: llmFarmRouter,
});

export type AppRouter = typeof appRouter;
