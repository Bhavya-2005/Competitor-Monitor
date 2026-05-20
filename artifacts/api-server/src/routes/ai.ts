import { Router } from "express";
import { db, competitorsTable, checksTable } from "@workspace/db";
import { desc, eq, and, gte } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { logger } from "../lib/logger";

const router = Router();

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

// FREE MODEL
const MODEL = "deepseek/deepseek-chat";

async function callAI(
  prompt: string,
  maxTokens = 800
): Promise<string | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) return null;

  try {
    const res = await fetch(
      `${OPENROUTER_BASE}/chat/completions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          max_tokens: maxTokens,
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();

      logger.error({
        err,
      });

      return null;
    }

    const data = (await res.json()) as any;

    return (
      data?.choices?.[0]?.message?.content ??
      null
    );
  } catch (err) {
    logger.warn(
      { err },
      "AI call failed"
    );

    return null;
  }
}

async function callAIFreeform(
  messages: {
    role: string;
    content: string;
  }[],
  maxTokens = 600
): Promise<string | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) return null;

  try {
    const res = await fetch(
      `${OPENROUTER_BASE}/chat/completions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,
          messages,
          max_tokens: maxTokens,
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();

      logger.error({
        err,
      });

      return null;
    }

    const data = (await res.json()) as any;

    return (
      data?.choices?.[0]?.message?.content ??
      null
    );
  } catch (err) {
    logger.warn(
      { err },
      "AI freeform call failed"
    );

    return null;
  }
}

// AI INSIGHTS
router.post(
  "/ai/insights",
  requireAuth,
  async (req, res) => {
    try {
      const competitors = await db
        .select()
        .from(competitorsTable)
        .where(
          eq(
            competitorsTable.isActive,
            true
          )
        );

      const sevenDaysAgo = new Date(
        Date.now() -
          7 * 24 * 60 * 60 * 1000
      );

      const recentChecks = await db
        .select()
        .from(checksTable)
        .where(
          and(
            eq(
              checksTable.status,
              "completed"
            ),
            gte(
              checksTable.checkedAt,
              sevenDaysAgo
            )
          )
        )
        .orderBy(
          desc(checksTable.checkedAt)
        )
        .limit(50);

      const changesWithSummary =
        recentChecks
          .filter((c) => c.hasChanges)
          .map((c) => {
            const comp =
              competitors.find(
                (x) =>
                  x.id === c.competitorId
              );

            return `${
              comp?.name ?? "Unknown"
            } [${
              c.changeType
            }]: ${c.summary}`;
          });

      const prompt = `
Analyze competitor activity and generate:
- threat level
- market opportunity
- SWOT analysis
- recommendations
- competitor activity summary

Competitors:
${competitors
  .map((c) => c.name)
  .join(", ")}

Recent Changes:
${changesWithSummary.join("\n")}
`;

      const reply = await callAI(
        prompt,
        1000
      );

      res.json({
        insights:
          reply ??
          "No AI insights available.",
      });
    } catch (err) {
      req.log.error(
        { err },
        "AI insights error"
      );

      res.status(500).json({
        error:
          "Failed to generate insights",
      });
    }
  }
);

// AI CHAT
router.post(
  "/ai/chat",
  requireAuth,
  async (req, res) => {
    try {
      const {
        message,
        history = [],
      } = req.body as {
        message: string;
        history?: {
          role: string;
          content: string;
        }[];
      };

      if (!message?.trim()) {
        res.status(400).json({
          error: "Message required",
        });

        return;
      }

      const competitors = await db
        .select()
        .from(competitorsTable);

      const context = `
You are an AI competitor intelligence assistant.

Competitors:
${competitors
  .map(
    (c) =>
      `${c.name} (${c.url})`
  )
  .join(", ")}

Answer strategically and concisely.
`;

      const messages = [
        {
          role: "system",
          content: context,
        },
        ...history.slice(-6),
        {
          role: "user",
          content: message,
        },
      ];

      const reply =
        await callAIFreeform(
          messages,
          600
        );

      res.json({
        reply:
          reply ??
          "No AI response generated.",
      });
    } catch (err) {
      req.log.error(
        { err },
        "AI chat error"
      );

      res.status(500).json({
        error: "Chat failed",
      });
    }
  }
);

// AI COMPARE
router.post(
  "/ai/compare",
  requireAuth,
  async (req, res) => {
    try {
      const { services } = req.body as {
        services: string[];
      };

      if (
        !services ||
        services.length < 2
      ) {
        res.status(400).json({
          error:
            "At least 2 services required",
        });

        return;
      }

      const prompt = `
Compare these services:
${services.join(", ")}

Include:
- pricing
- pros
- cons
- features
- best value
- recommendation
`;

      const reply = await callAI(
        prompt,
        1200
      );

      res.json({
        comparison:
          reply ??
          "No comparison available.",
      });
    } catch (err) {
      req.log.error(
        { err },
        "AI compare error"
      );

      res.status(500).json({
        error: "Comparison failed",
      });
    }
  }
);

export default router;