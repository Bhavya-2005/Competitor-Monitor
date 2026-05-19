import { Router } from "express";
import { db, digestsTable, checksTable, competitorsTable, settingsTable } from "@workspace/db";
import { eq, desc, gte, sql } from "drizzle-orm";
import { GetDigestParams } from "@workspace/api-zod";
import { sendSlackDigest } from "../lib/slack";

const router = Router();

function formatDigest(d: any) {
  return {
    ...d,
    sentAt: d.sentAt instanceof Date ? d.sentAt.toISOString() : d.sentAt,
  };
}

router.get("/digests", async (req, res) => {
  try {
    const digests = await db
      .select()
      .from(digestsTable)
      .orderBy(desc(digestsTable.sentAt))
      .limit(30);

    res.json(digests.map(formatDigest));
  } catch (err) {
    req.log.error({ err }, "Failed to list digests");
    res.status(500).json({ error: "Failed to list digests" });
  }
});

router.post("/digests", async (req, res) => {
  try {
    const [settings] = await db.select().from(settingsTable).limit(1);

    // Get recent checks with changes
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentChecks = await db
      .select({
        check: checksTable,
        competitorName: competitorsTable.name,
        competitorUrl: competitorsTable.url,
      })
      .from(checksTable)
      .leftJoin(competitorsTable, eq(checksTable.competitorId, competitorsTable.id))
      .where(gte(checksTable.checkedAt, oneDayAgo));

    const withChanges = recentChecks.filter((r) => r.check.hasChanges);
    const competitors = await db.select().from(competitorsTable).where(eq(competitorsTable.isActive, true));

    // Build content
    const content = buildDigestContent(withChanges, competitors.length);

    let status = "sent";
    let slackMessageId: string | null = null;

    if (settings?.slackWebhookUrl && settings?.isDigestEnabled) {
      try {
        slackMessageId = await sendSlackDigest(settings.slackWebhookUrl, content);
      } catch {
        status = "failed";
      }
    } else {
      status = "skipped";
    }

    const [digest] = await db
      .insert(digestsTable)
      .values({
        status,
        competitorsChecked: competitors.length,
        changesFound: withChanges.length,
        slackMessageId,
        content,
      })
      .returning();

    res.status(202).json(formatDigest(digest));
  } catch (err) {
    req.log.error({ err }, "Failed to send digest");
    res.status(500).json({ error: "Failed to send digest" });
  }
});

router.get("/digests/:id", async (req, res) => {
  const parsed = GetDigestParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }

  try {
    const [digest] = await db
      .select()
      .from(digestsTable)
      .where(eq(digestsTable.id, parsed.data.id));

    if (!digest) { res.status(404).json({ error: "Not found" }); return; }
    res.json(formatDigest(digest));
  } catch (err) {
    req.log.error({ err }, "Failed to get digest");
    res.status(500).json({ error: "Failed to get digest" });
  }
});

function buildDigestContent(checks: any[], competitorCount: number): string {
  const lines = [
    `*Competitor Monitor Daily Digest*`,
    `Monitored ${competitorCount} competitors. Found ${checks.length} change(s).`,
    ``,
  ];

  if (checks.length === 0) {
    lines.push("No significant changes detected in the last 24 hours.");
  } else {
    for (const { check, competitorName, competitorUrl } of checks) {
      lines.push(`*${competitorName}* (${competitorUrl})`);
      lines.push(`  Type: ${check.changeType ?? "general"}`);
      if (check.summary) lines.push(`  ${check.summary}`);
      lines.push("");
    }
  }

  return lines.join("\n");
}

export default router;
