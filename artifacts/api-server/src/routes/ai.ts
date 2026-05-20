import { Router } from "express";
import { db, competitorsTable, checksTable } from "@workspace/db";
import { desc, eq, and, gte } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { logger } from "../lib/logger";

const router = Router();

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";
const MODEL = "deepseek/deepseek-chat";

async function callAI(
  prompt: string,
  maxTokens = 800
): Promise<string | null> {
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        max_tokens: maxTokens,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      const errText = await res.text();
      logger.warn({ status: res.status, errText }, "AI call failed");
      return null;
    }

    const data = (await res.json()) as any;
    return data?.choices?.[0]?.message?.content ?? null;
  } catch (err) {
    logger.warn({ err }, "AI call error");
    return null;
  }
}

async function callAIMessages(
  messages: { role: string; content: string }[],
  maxTokens = 600
): Promise<string | null> {
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: MODEL, messages, max_tokens: maxTokens }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      const errText = await res.text();
      logger.warn({ status: res.status, errText }, "AI messages call failed");
      return null;
    }

    const data = (await res.json()) as any;
    return data?.choices?.[0]?.message?.content ?? null;
  } catch (err) {
    logger.warn({ err }, "AI messages call error");
    return null;
  }
}

// Status — lets frontend know if AI is configured server-side
router.get("/ai/status", requireAuth, (_req, res) => {
  const configured = !!(process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY);
  res.json({ configured });
});

// AI Insights — returns structured JSON for SWOT, threat level, etc.
router.post("/ai/insights", requireAuth, async (req, res) => {
  try {
    const competitors = await db
      .select()
      .from(competitorsTable)
      .where(eq(competitorsTable.isActive, true));

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentChecks = await db
      .select()
      .from(checksTable)
      .where(and(eq(checksTable.status, "completed"), gte(checksTable.checkedAt, sevenDaysAgo)))
      .orderBy(desc(checksTable.checkedAt))
      .limit(50);

    const changesWithSummary = recentChecks
      .filter((c) => c.hasChanges)
      .map((c) => {
        const comp = competitors.find((x) => x.id === c.competitorId);
        return `${comp?.name ?? "Unknown"} [${c.changeType}]: ${c.summary}`;
      });

    const competitorNames = competitors.map((c) => c.name).join(", ");
    const totalChanges = recentChecks.filter((c) => c.hasChanges).length;
    const pricingChanges = recentChecks.filter((c) => c.changeType === "pricing").length;
    const featureChanges = recentChecks.filter((c) => c.changeType === "features").length;
    const jobChanges = recentChecks.filter((c) => c.changeType === "jobs").length;

    const prompt = `You are a senior competitive intelligence analyst.

IMPORTANT: Respond with raw JSON only. No markdown, no code fences, no explanation. Start your response with { and end with }.

Data to analyze:
- Monitored competitors: ${competitorNames || "None yet"}
- Total checks this week: ${recentChecks.length}
- Changes detected: ${totalChanges} (Pricing: ${pricingChanges}, Features: ${featureChanges}, Jobs: ${jobChanges})
- Recent changes: ${changesWithSummary.slice(0, 15).join(" | ") || "No changes detected yet"}

Required JSON structure (fill with real analysis):
{"threatLevel":5,"threatLabel":"Medium","marketOpportunity":"...","swot":{"strengths":["...","...","..."],"weaknesses":["...","...","..."],"opportunities":["...","...","..."],"threats":["...","...","..."]},"trendSummary":"...","predictedMoves":["...","..."],"recommendations":["...","...","..."],"competitorScores":[{"name":"...","activityScore":7,"threatScore":6}]}`;

    const raw = await callAI(prompt, 1000);

    if (!raw) {
      // Fallback mock when no API key or AI fails
      res.json({
        threatLevel: 4,
        threatLabel: "Medium",
        marketOpportunity:
          "Competitors are primarily focused on enterprise features, leaving a gap in the mid-market segment that could be captured with better onboarding and pricing transparency.",
        swot: {
          strengths: [
            "AI-powered real-time monitoring",
            "Automated digest reports",
            "Easy competitor setup",
          ],
          weaknesses: [
            "Limited historical data for new installs",
            "No mobile app yet",
            "Single Slack integration",
          ],
          opportunities: [
            "Mid-market SaaS tools underserved",
            "Pricing intelligence gap in market",
            "Job listing signals underutilized",
          ],
          threats: [
            "Incumbents adding similar monitoring features",
            "Manual monitoring by analysts",
            "API rate limiting on scraping",
          ],
        },
        trendSummary:
          "Add competitors and run checks to generate real AI insights. Current data is a demo placeholder showing what the panel looks like.",
        predictedMoves: [
          "Competitors may launch pricing changes Q3",
          "Job listing spikes predict feature launches in 60-90 days",
          "Blog activity suggests marketing pushes incoming",
        ],
        recommendations: [
          "Add at least 3 competitor URLs to start monitoring",
          "Enable Slack webhook to receive daily digests",
          "Run manual checks to seed your intelligence feed",
        ],
        competitorScores: competitors.slice(0, 5).map((c) => ({
          name: c.name,
          activityScore: Math.floor(Math.random() * 5) + 3,
          threatScore: Math.floor(Math.random() * 4) + 2,
        })),
      });
      return;
    }

    // Extract JSON — deepseek sometimes wraps in ```json blocks
    let jsonStr = raw.trim();
    const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) jsonStr = fenceMatch[1].trim();

    const parsed = JSON.parse(jsonStr);
    res.json(parsed);
  } catch (err) {
    req.log.error({ err }, "AI insights error");
    res.status(500).json({ error: "Failed to generate insights" });
  }
});

// AI Chat
router.post("/ai/chat", requireAuth, async (req, res) => {
  try {
    const { message, history = [] } = req.body as {
      message: string;
      history?: { role: string; content: string }[];
    };

    if (!message?.trim()) {
      res.status(400).json({ error: "Message required" });
      return;
    }

    const competitors = await db.select().from(competitorsTable);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentChecks = await db
      .select()
      .from(checksTable)
      .where(and(eq(checksTable.status, "completed"), gte(checksTable.checkedAt, sevenDaysAgo)))
      .orderBy(desc(checksTable.checkedAt))
      .limit(30);

    const context = `You are a competitive intelligence AI assistant for the Competitor Watcher platform.

Monitored competitors: ${competitors.map((c) => `${c.name} (${c.url})`).join(", ") || "None added yet"}

Recent activity (last 7 days):
${
  recentChecks
    .filter((c) => c.hasChanges)
    .slice(0, 15)
    .map((c) => {
      const comp = competitors.find((x) => x.id === c.competitorId);
      return `- ${comp?.name}: [${c.changeType}] ${c.summary}`;
    })
    .join("\n") || "No changes detected yet"
}

Total checks this week: ${recentChecks.length}
Changes detected: ${recentChecks.filter((c) => c.hasChanges).length}

Answer questions about competitors, market trends, pricing, and strategic recommendations. Be concise and actionable.`;

    const messages = [
      { role: "system", content: context },
      ...history.slice(-6),
      { role: "user", content: message },
    ];

    const reply = await callAIMessages(messages, 500);

    res.json({
      reply:
        reply ??
        "AI is configured on the server. Unable to generate a response right now — please try again.",
    });
  } catch (err) {
    req.log.error({ err }, "AI chat error");
    res.status(500).json({ error: "Chat failed" });
  }
});

// AI Service Compare — returns structured JSON
router.post("/ai/compare", requireAuth, async (req, res) => {
  try {
    const { services } = req.body as { services: string[] };

    if (!services || services.length < 2) {
      res.status(400).json({ error: "At least 2 services required" });
      return;
    }

    const serviceList = services.join(", ");
    const prompt = `You are a SaaS product analyst. Compare these services: ${serviceList}.

IMPORTANT: Respond with raw JSON only. No markdown, no code fences, no explanation. Start your response with { and end with }.

Required JSON structure:
{"services":[{"name":"...","category":"...","tagline":"...","pricingModel":"...","freeTier":true,"keyFeatures":["...","...","...","...","..."],"proscons":{"pros":["...","...","..."],"cons":["...","...","..."]},"targetAudience":"...","aiSentiment":"Positive","reliabilityScore":8,"valueScore":7,"easeOfUse":9,"supportQuality":7,"marketPosition":"Leader"}],"winner":{"overall":"...","bestValue":"...","easiest":"...","mostFeatures":"..."},"recommendation":"...","comparisonTable":[{"feature":"...","values":{"ServiceName":"..."}}]}

Fill in real data for: ${serviceList}. Include all ${services.length} services. Include at least 5 rows in comparisonTable.`;

    const raw = await callAI(prompt, 1600);

    if (!raw) {
      res.status(503).json({
        error: "AI comparison failed. Please try again in a moment.",
      });
      return;
    }

    let jsonStr = raw.trim();
    const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) jsonStr = fenceMatch[1].trim();

    const parsed = JSON.parse(jsonStr);
    res.json(parsed);
  } catch (err) {
    req.log.error({ err }, "AI compare error");
    res.status(500).json({ error: "Comparison failed" });
  }
});

export default router;
