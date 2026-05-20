import { Router } from "express";
import { db, competitorsTable, checksTable } from "@workspace/db";
import { desc, eq, and, gte } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { logger } from "../lib/logger";

const router = Router();

const OPENAI_BASE = "https://openrouter.ai/api/v1";

async function callAI(prompt: string, maxTokens = 800): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(`${OPENAI_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: maxTokens,
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as any;
    return data.choices?.[0]?.message?.content ?? null;
  } catch (err) {
    logger.warn({ err }, "AI call failed");
    return null;
  }
}

async function callAIFreeform(messages: { role: string; content: string }[], maxTokens = 600): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(`${OPENAI_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages,
        max_tokens: maxTokens,
      }),
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as any;
    return data.choices?.[0]?.message?.content ?? null;
  } catch (err) {
    logger.warn({ err }, "AI freeform call failed");
    return null;
  }
}

router.post("/ai/insights", requireAuth, async (req, res) => {
  try {
    const competitors = await db.select().from(competitorsTable).where(eq(competitorsTable.isActive, true));
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

    const prompt = `You are a senior competitive intelligence analyst. Analyze the following competitor monitoring data and generate strategic insights.

Monitored competitors: ${competitorNames || "None yet"}
Total checks this week: ${recentChecks.length}
Changes detected: ${totalChanges} (Pricing: ${pricingChanges}, Features: ${featureChanges}, Jobs: ${jobChanges})
Recent change summaries:
${changesWithSummary.slice(0, 15).join("\n") || "No changes detected yet"}

Generate a JSON response with:
{
  "threatLevel": number (1-10, overall competitive threat level),
  "threatLabel": "Low" | "Medium" | "High" | "Critical",
  "marketOpportunity": string (2-3 sentence opportunity based on competitor gaps),
  "swot": {
    "strengths": [list of 3 strengths your company likely has based on competitor weaknesses],
    "weaknesses": [list of 3 potential weaknesses to watch],
    "opportunities": [list of 3 market opportunities spotted],
    "threats": [list of 3 competitive threats]
  },
  "trendSummary": string (2-3 sentences on what competitors are doing this week),
  "predictedMoves": [list of 2-3 predicted competitor moves in next 30 days],
  "recommendations": [list of 3 concrete action items],
  "competitorScores": [{ "name": competitor name, "activityScore": 1-10, "threatScore": 1-10 }]
}

If no competitor data exists yet, generate plausible placeholder insights for a SaaS company.`;

    const raw = await callAI(prompt, 1000);

    if (!raw) {
      const mock = {
        threatLevel: 4,
        threatLabel: "Medium",
        marketOpportunity: "Competitors are primarily focused on enterprise features, leaving a gap in the mid-market segment that could be captured with better onboarding and pricing transparency.",
        swot: {
          strengths: ["AI-powered real-time monitoring", "Automated digest reports", "Easy competitor setup"],
          weaknesses: ["Limited historical data for new installs", "No mobile app yet", "Single Slack integration"],
          opportunities: ["Mid-market SaaS tools underserved", "Pricing intelligence gap", "Job listing signals underutilized"],
          threats: ["Incumbents adding similar monitoring features", "Manual monitoring by analysts", "API rate limiting on scraping"],
        },
        trendSummary: "Monitor your competitors to generate real insights. Add competitor URLs and run checks to see actual trend data.",
        predictedMoves: ["Competitors may launch pricing changes Q3", "Job listing spikes predict feature launches in 60-90 days", "Blog activity suggests marketing pushes incoming"],
        recommendations: ["Add at least 3 competitor URLs to start monitoring", "Enable Slack webhooks to receive daily digests", "Run manual checks to seed your intelligence feed"],
        competitorScores: competitors.slice(0, 5).map((c) => ({ name: c.name, activityScore: Math.floor(Math.random() * 5) + 3, threatScore: Math.floor(Math.random() * 4) + 2 })),
      };
      res.json(mock);
      return;
    }

    const parsed = JSON.parse(raw);
    res.json(parsed);
  } catch (err) {
    req.log.error({ err }, "AI insights error");
    res.status(500).json({ error: "Failed to generate insights" });
  }
});

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

    const context = `You are a competitive intelligence AI assistant for the Competitor Watcher platform. You have access to the following data:

Monitored competitors: ${competitors.map((c) => `${c.name} (${c.url})`).join(", ") || "None added yet"}

Recent activity (last 7 days):
${recentChecks
  .filter((c) => c.hasChanges)
  .slice(0, 15)
  .map((c) => {
    const comp = competitors.find((x) => x.id === c.competitorId);
    return `- ${comp?.name}: [${c.changeType}] ${c.summary}`;
  })
  .join("\n") || "No changes detected yet"}

Total checks this week: ${recentChecks.length}
Changes detected: ${recentChecks.filter((c) => c.hasChanges).length}

Answer questions about competitors, market trends, pricing, features, and strategic recommendations. Be concise and actionable. If data is limited, provide general best-practice advice for SaaS competitive intelligence.`;

    const messages = [
      { role: "system", content: context },
      ...history.slice(-6),
      { role: "user", content: message },
    ];

    const apiKey = process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      const mockResponses: Record<string, string> = {
        default: "I'm your competitive intelligence assistant. Add an OpenRouter or OpenAI API key to enable AI-powered answers. In the meantime, I can tell you that monitoring competitor pricing, feature announcements, blog posts, and job listings gives you a 360° view of their strategy.",
        pricing: "Based on job listing patterns and feature announcements, competitors typically adjust pricing 30-60 days after hiring new sales/marketing leadership. Watch their jobs page closely.",
        fastest: "Activity score is calculated from check frequency and change detection rate. Check the AI Insights panel for a ranked view of competitor activity this week.",
      };

      const lowerMsg = message.toLowerCase();
      let reply = mockResponses.default;
      if (lowerMsg.includes("pric")) reply = mockResponses.pricing;
      if (lowerMsg.includes("fast") || lowerMsg.includes("grow")) reply = mockResponses.fastest;

      res.json({ reply });
      return;
    }

    const reply = await callAIFreeform(messages, 500);
    res.json({ reply: reply ?? "I couldn't generate a response. Please try again." });
  } catch (err) {
    req.log.error({ err }, "AI chat error");
    res.status(500).json({ error: "Chat failed" });
  }
});

router.post("/ai/compare", requireAuth, async (req, res) => {
  try {
    const { services } = req.body as { services: string[] };

    if (!services || services.length < 2) {
      res.status(400).json({ error: "At least 2 services required" });
      return;
    }

    const prompt = `You are a SaaS product analyst. Compare the following services/tools in detail:
${services.join(", ")}

Respond in JSON format:
{
  "services": [
    {
      "name": string,
      "category": string,
      "tagline": string,
      "pricingModel": string (e.g. "Free / Pro $29/mo / Enterprise custom"),
      "freeTier": boolean,
      "keyFeatures": [list of 5 key features],
      "proscons": { "pros": [3 pros], "cons": [3 cons] },
      "targetAudience": string,
      "aiSentiment": "Positive" | "Mixed" | "Negative",
      "reliabilityScore": number (1-10),
      "valueScore": number (1-10),
      "easeOfUse": number (1-10),
      "supportQuality": number (1-10),
      "marketPosition": "Leader" | "Challenger" | "Niche" | "Emerging"
    }
  ],
  "winner": { "overall": string, "bestValue": string, "easiest": string, "mostFeatures": string },
  "recommendation": string (2-3 sentence AI recommendation on which to choose and why),
  "comparisonTable": [{ "feature": string, "values": { [serviceName]: string } }]
}`;

    const raw = await callAI(prompt, 1200);

    if (!raw) {
      res.status(503).json({ error: "AI service unavailable. Add OPENROUTER_API_KEY to enable comparisons." });
      return;
    }

    const parsed = JSON.parse(raw);
    res.json(parsed);
  } catch (err) {
    req.log.error({ err }, "AI compare error");
    res.status(500).json({ error: "Comparison failed" });
  }
});

export default router;
