import { Router } from "express";
import { db, competitorsTable, checksTable, digestsTable } from "@workspace/db";
import { eq, gte, count, sql, and, desc } from "drizzle-orm";

const router = Router();

router.get("/dashboard/summary", async (req, res) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [competitorStats] = await db
      .select({
        total: count(),
        active: sql<number>`sum(case when ${competitorsTable.isActive} then 1 else 0 end)`,
      })
      .from(competitorsTable);

    const [checkStats] = await db
      .select({
        total: count(),
      })
      .from(checksTable);

    const [checksTodayResult] = await db
      .select({ count: count() })
      .from(checksTable)
      .where(gte(checksTable.checkedAt, startOfDay));

    const [changesWeekResult] = await db
      .select({ count: count() })
      .from(checksTable)
      .where(and(gte(checksTable.checkedAt, oneWeekAgo), eq(checksTable.hasChanges, true)));

    const [totalChanges] = await db
      .select({ count: count() })
      .from(checksTable)
      .where(eq(checksTable.hasChanges, true));

    const changesByTypeResult = await db
      .select({
        changeType: checksTable.changeType,
        count: count(),
      })
      .from(checksTable)
      .where(eq(checksTable.hasChanges, true))
      .groupBy(checksTable.changeType);

    const changesByType = { pricing: 0, features: 0, blog: 0, jobs: 0 };
    for (const row of changesByTypeResult) {
      const t = row.changeType as keyof typeof changesByType;
      if (t && t in changesByType) {
        changesByType[t] = Number(row.count);
      }
    }

    const [lastDigest] = await db
      .select({ sentAt: digestsTable.sentAt })
      .from(digestsTable)
      .where(eq(digestsTable.status, "sent"))
      .orderBy(desc(digestsTable.sentAt))
      .limit(1);

    const [digestsMonthResult] = await db
      .select({ count: count() })
      .from(digestsTable)
      .where(gte(digestsTable.sentAt, startOfMonth));

    res.json({
      totalCompetitors: Number(competitorStats?.total ?? 0),
      activeCompetitors: Number(competitorStats?.active ?? 0),
      totalChecks: Number(checkStats?.total ?? 0),
      checksToday: Number(checksTodayResult?.count ?? 0),
      totalChanges: Number(totalChanges?.count ?? 0),
      changesThisWeek: Number(changesWeekResult?.count ?? 0),
      lastDigestSentAt: lastDigest?.sentAt?.toISOString() ?? null,
      digestsThisMonth: Number(digestsMonthResult?.count ?? 0),
      changesByType,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get dashboard summary");
    res.status(500).json({ error: "Failed to get dashboard summary" });
  }
});

router.get("/activity", async (req, res) => {
  const limit = req.query.limit ? Number(req.query.limit) : 20;

  try {
    const results = await db
      .select({
        check: checksTable,
        competitorName: competitorsTable.name,
        competitorUrl: competitorsTable.url,
      })
      .from(checksTable)
      .leftJoin(competitorsTable, eq(checksTable.competitorId, competitorsTable.id))
      .where(eq(checksTable.hasChanges, true))
      .orderBy(desc(checksTable.checkedAt))
      .limit(limit);

    res.json(
      results.map(({ check, competitorName, competitorUrl }) => ({
        id: check.id,
        competitorId: check.competitorId,
        competitorName: competitorName ?? "Unknown",
        competitorUrl: competitorUrl ?? "",
        changeType: check.changeType ?? "features",
        summary: check.summary ?? "Change detected",
        details: check.details ?? null,
        detectedAt: check.checkedAt instanceof Date ? check.checkedAt.toISOString() : check.checkedAt,
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Failed to get activity feed");
    res.status(500).json({ error: "Failed to get activity" });
  }
});

export default router;
