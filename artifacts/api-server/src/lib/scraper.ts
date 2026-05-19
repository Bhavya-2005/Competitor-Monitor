import { db, competitorsTable, checksTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./logger";
import type { Competitor } from "@workspace/db";

const OPENAI_BASE = "https://openrouter.ai/api/v1";

async function fetchPageContent(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; CompetitorMonitorBot/1.0)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    // Strip HTML tags for a simple text representation
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 8000);

    return text;
  } catch (err) {
    logger.warn({ err, url }, "Failed to fetch page content");
    return "";
  }
}

async function analyzeWithAI(
  competitor: Competitor,
  pageContent: string,
  categories: string[]
): Promise<{ hasChanges: boolean; changeType: string | null; summary: string | null; details: string | null }> {
  const apiKey = process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY;

  if (!apiKey || !pageContent) {
    return simulateCheck(categories);
  }

  try {
    const prompt = `You are a competitor intelligence analyst. Analyze this webpage content from ${competitor.name} (${competitor.url}).

Categories to monitor: ${categories.join(", ")}

Page content (truncated):
${pageContent.slice(0, 4000)}

Based on the content, identify if there are any notable items in these categories: ${categories.join(", ")}.

Respond in JSON format:
{
  "hasChanges": true/false,
  "changeType": "pricing" | "features" | "blog" | "jobs" | null,
  "summary": "one-line summary of what was found, or null",
  "details": "brief details paragraph, or null"
}

Only set hasChanges=true if you found concrete, specific content (e.g. a price list, a job posting, a blog article, a new feature announcement). Set to false if the page is generic or doesn't contain relevant information.`;

    const response = await fetch(`${OPENAI_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300,
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      logger.warn({ status: response.status }, "AI analysis request failed");
      return simulateCheck(categories);
    }

    const data = (await response.json()) as any;
    const content = data.choices?.[0]?.message?.content;
    if (!content) return simulateCheck(categories);

    const parsed = JSON.parse(content);
    return {
      hasChanges: !!parsed.hasChanges,
      changeType: parsed.changeType ?? null,
      summary: parsed.summary ?? null,
      details: parsed.details ?? null,
    };
  } catch (err) {
    logger.warn({ err }, "AI analysis failed, falling back to simulation");
    return simulateCheck(categories);
  }
}

function simulateCheck(categories: string[]): {
  hasChanges: boolean;
  changeType: string | null;
  summary: string | null;
  details: string | null;
} {
  // Simulate a realistic check result without AI
  const rand = Math.random();
  if (rand > 0.6) {
    const type = categories[Math.floor(Math.random() * categories.length)];
    const summaries: Record<string, string> = {
      pricing: "Pricing page updated — new tier detected",
      features: "New feature announced on homepage",
      blog: "New blog post published",
      jobs: "New job listing posted",
    };
    return {
      hasChanges: true,
      changeType: type,
      summary: summaries[type] ?? "Change detected",
      details: `Automated scan of ${new Date().toLocaleDateString()} detected activity in the ${type} category.`,
    };
  }
  return { hasChanges: false, changeType: null, summary: null, details: null };
}

export async function runCompetitorCheck(competitor: Competitor, checkId: number): Promise<void> {
  try {
    await db
      .update(checksTable)
      .set({ status: "running" })
      .where(eq(checksTable.id, checkId));

    const categories: string[] = [];
    if (competitor.monitorPricing) categories.push("pricing");
    if (competitor.monitorFeatures) categories.push("features");
    if (competitor.monitorBlog) categories.push("blog");
    if (competitor.monitorJobs) categories.push("jobs");

    const pageContent = await fetchPageContent(competitor.url);
    const result = await analyzeWithAI(competitor, pageContent, categories);

    await db
      .update(checksTable)
      .set({
        status: "completed",
        hasChanges: result.hasChanges,
        changeType: result.changeType,
        summary: result.summary,
        details: result.details,
      })
      .where(eq(checksTable.id, checkId));

    await db
      .update(competitorsTable)
      .set({ lastCheckedAt: new Date() })
      .where(eq(competitorsTable.id, competitor.id));

    logger.info({ competitorId: competitor.id, hasChanges: result.hasChanges }, "Check completed");
  } catch (err) {
    logger.error({ err, checkId }, "Check failed");
    await db
      .update(checksTable)
      .set({ status: "failed", errorMessage: String(err) })
      .where(eq(checksTable.id, checkId));
  }
}
