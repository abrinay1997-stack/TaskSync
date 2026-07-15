import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import Groq from "groq-sdk";
import type { ChatCompletionMessageParam } from "groq-sdk/resources/chat/completions";
import dotenv from "dotenv";
import { ADVISOR_MODEL, ADVISOR_MAX_TOKENS, buildAdvisorMessages } from "./shared/advisor";
import { TASK_PLANNER_MODEL, TASK_PLANNER_MAX_TOKENS, buildPlannerMessages, parsePlannedTasks } from "./shared/taskPlanner";
import { CAPTION_MODEL, CAPTION_MAX_TOKENS, buildCaptionMessages, parseCaptionResult } from "./shared/captionGenerator";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // AI Advisor Endpoint via Groq
  app.post("/api/advisor", async (req, res) => {
    try {
      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) {
        return res.status(401).json({ error: "GROQ_API_KEY is not configured" });
      }

      const groq = new Groq({ apiKey });
      const { tasks, context } = req.body;

      const completion = await groq.chat.completions.create({
        messages: buildAdvisorMessages(tasks, context) as ChatCompletionMessageParam[],
        model: ADVISOR_MODEL,
        temperature: 0.7,
        max_tokens: ADVISOR_MAX_TOKENS,
      });

      res.json({ message: completion.choices[0]?.message?.content || "Sin respuesta." });
    } catch (error: any) {
      console.error("AI Advisor error:", error);
      res.status(500).json({ error: error.message || "Error al conectar con la IA." });
    }
  });

  // AI Content-Plan generator via Groq (5-stage workflow per client)
  app.post("/api/generate-tasks", async (req, res) => {
    try {
      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) {
        return res.status(401).json({ error: "GROQ_API_KEY is not configured" });
      }

      const groq = new Groq({ apiKey });
      const { clientName, niche, description, notes, instagramUrl } = req.body;

      const completion = await groq.chat.completions.create({
        messages: buildPlannerMessages({ clientName, niche, description, notes, instagramUrl }) as ChatCompletionMessageParam[],
        model: TASK_PLANNER_MODEL,
        temperature: 0.6,
        max_tokens: TASK_PLANNER_MAX_TOKENS,
      });

      const tasks = parsePlannedTasks(completion.choices[0]?.message?.content || "");
      if (tasks.length === 0) {
        return res.status(502).json({ error: "La IA no generó tareas válidas. Intenta de nuevo." });
      }

      res.json({ tasks });
    } catch (error: any) {
      console.error("Task planner error:", error);
      res.status(500).json({ error: error.message || "Error al generar el plan." });
    }
  });

  // AI caption/title/hashtag generator via Groq
  app.post("/api/generate-caption", async (req, res) => {
    try {
      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) {
        return res.status(401).json({ error: "GROQ_API_KEY is not configured" });
      }

      const { topic, platform, clientName, niche, description, tone } = req.body;
      if (!topic || typeof topic !== "string") {
        return res.status(400).json({ error: "Falta el tema del post." });
      }

      const groq = new Groq({ apiKey });
      const completion = await groq.chat.completions.create({
        messages: buildCaptionMessages({ topic, platform, clientName, niche, description, tone }) as ChatCompletionMessageParam[],
        model: CAPTION_MODEL,
        temperature: 0.8,
        max_tokens: CAPTION_MAX_TOKENS,
      });

      const result = parseCaptionResult(completion.choices[0]?.message?.content || "");
      if (!result) {
        return res.status(502).json({ error: "La IA no generó un caption válido. Intenta de nuevo." });
      }

      res.json(result);
    } catch (error: any) {
      console.error("Caption generator error:", error);
      res.status(500).json({ error: error.message || "Error al generar el caption." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
