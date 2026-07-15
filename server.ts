import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import Groq from "groq-sdk";
import type { ChatCompletionMessageParam } from "groq-sdk/resources/chat/completions";
import dotenv from "dotenv";
import { ADVISOR_MODEL, ADVISOR_MAX_TOKENS, buildAdvisorMessages } from "./shared/advisor";
import { TASK_PLANNER_MODEL, TASK_PLANNER_MAX_TOKENS, buildPlannerMessages, parsePlannedTasks } from "./shared/taskPlanner";
import { CAPTION_MODEL, CAPTION_MAX_TOKENS, buildCaptionMessages, parseCaptionResult } from "./shared/captionGenerator";
import { SOCIAL_ANALYZER_MODEL, SOCIAL_ANALYZER_MAX_TOKENS, buildSocialSummaryMessages, parseSocialSummary, ScrapedProfile } from "./shared/socialAnalyzer";

const DEFAULT_APIFY_ACTOR = "apify~instagram-profile-scraper";

function extractInstagramUsername(url: string): string | undefined {
  try {
    const withProtocol = url.startsWith("http") ? url : `https://${url}`;
    return new URL(withProtocol).pathname.split("/").filter(Boolean)[0] || undefined;
  } catch {
    return undefined;
  }
}

function extractScrapedProfile(item: any, username: string | undefined): ScrapedProfile {
  const bio = item.biography ?? item.bio ?? item.description ?? "";
  const fullName = item.fullName ?? item.full_name ?? "";
  const followersCount = item.followersCount ?? item.followers ?? undefined;
  const rawPosts = item.latestPosts ?? item.posts ?? item.topPosts ?? [];
  const posts: string[] = Array.isArray(rawPosts)
    ? rawPosts
        .map((p: any) => (typeof p === "string" ? p : p?.caption ?? p?.text ?? ""))
        .filter((c: string) => !!c)
        .slice(0, 12)
    : [];
  return { username: item.username ?? username, fullName, bio, followersCount, posts };
}

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

  // Real-data social profile analyzer: Apify fetches the public profile,
  // Groq synthesizes it into niche + description text.
  app.post("/api/analyze-social", async (req, res) => {
    try {
      const apifyToken = process.env.APIFY_API_TOKEN;
      if (!apifyToken) {
        return res.status(401).json({ error: "APIFY_API_TOKEN is not configured" });
      }
      const groqKey = process.env.GROQ_API_KEY;
      if (!groqKey) {
        return res.status(401).json({ error: "GROQ_API_KEY is not configured" });
      }

      const { instagramUrl } = req.body;
      if (!instagramUrl || typeof instagramUrl !== "string") {
        return res.status(400).json({ error: "Falta el link de Instagram de la cuenta." });
      }

      const username = extractInstagramUsername(instagramUrl);
      const actorId = process.env.APIFY_ACTOR_ID || DEFAULT_APIFY_ACTOR;

      const apifyRes = await fetch(
        `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${encodeURIComponent(apifyToken)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // Different Apify Instagram actors expect different input field
          // names (some want `usernames`, others `directUrls`); sending both
          // maximizes compatibility since actors ignore fields they don't use.
          body: JSON.stringify({
            usernames: username ? [username] : undefined,
            directUrls: [instagramUrl],
            resultsLimit: 12,
          }),
        }
      );

      if (!apifyRes.ok) {
        const text = await apifyRes.text().catch(() => "");
        console.error("Apify error", apifyRes.status, text.slice(0, 500));
        return res.status(502).json({
          error: `No se pudo obtener datos de Instagram (Apify respondió ${apifyRes.status}). Verifica el link o intenta de nuevo.`,
          apifyDetail: text.slice(0, 500) || undefined,
        });
      }

      const items = await apifyRes.json();
      const first = Array.isArray(items) ? items[0] : null;
      if (!first) {
        return res.status(404).json({
          error: "No se encontraron datos públicos para ese perfil. Verifica que sea público y que el link sea correcto.",
        });
      }

      const profile = extractScrapedProfile(first, username);

      const groq = new Groq({ apiKey: groqKey });
      const completion = await groq.chat.completions.create({
        messages: buildSocialSummaryMessages(profile) as ChatCompletionMessageParam[],
        model: SOCIAL_ANALYZER_MODEL,
        temperature: 0.4,
        max_tokens: SOCIAL_ANALYZER_MAX_TOKENS,
      });

      const summary = parseSocialSummary(completion.choices[0]?.message?.content || "");
      if (!summary) {
        return res.status(502).json({ error: "No se pudo sintetizar el perfil analizado. Intenta de nuevo." });
      }

      res.json({ ...summary, postsAnalyzed: profile.posts.length });
    } catch (error: any) {
      console.error("Social analyzer error:", error);
      res.status(500).json({ error: error.message || "Error al analizar el perfil." });
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
