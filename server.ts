import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import Groq from "groq-sdk";
import type { ChatCompletionMessageParam } from "groq-sdk/resources/chat/completions";
import dotenv from "dotenv";
import { ADVISOR_MODEL, ADVISOR_MAX_TOKENS, buildAdvisorMessages } from "./shared/advisor";

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
