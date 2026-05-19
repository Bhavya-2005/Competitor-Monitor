import { Router } from "express";
import { db, competitorsTable, checksTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { ListCompetitorChecksParams, RunCheckParams, ListChecksQueryParams } from "@workspace/api-zod";
import { runCompetitorCheck } from "../lib/scraper";

const router = Router();

function formatCheck(check: any, competitorName: string) {
  return {
    ...check,
    competitorName,
    checkedAt: check.checkedAt instanceof Date ? check.checkedAt.toISOString() : check.checkedAt,
  };
}

router.get("/competitors/:id/checks", async (req, res) => {
  const parsed = ListCompetitorChecksParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }

  try {
    const [competitor] = await db
      .select()
      .from(competitorsTable)
      .where(eq(competitorsTable.id, parsed.data.id));

    if (!competitor) { res.status(404).json({ error: "Competitor not found" }); return; }

    const checks = await db
      .select()
      .from(checksTable)
      .where(eq(checksTable.competitorId, parsed.data.id))
      .orderBy(desc(checksTable.checkedAt))
      .limit(50);

    res.json(checks.map((c) => formatCheck(c, competitor.name)));
  } catch (err) {
    req.log.error({ err }, "Failed to list competitor checks");
    res.status(500).json({ error: "Failed to list checks" });
  }
});

router.post("/competitors/:id/run-check", async (req, res) => {
  const parsed = RunCheckParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }

  try {
    const [competitor] = await db
      .select()
      .from(competitorsTable)
      .where(eq(competitorsTable.id, parsed.data.id));

    if (!competitor) { res.status(404).json({ error: "Competitor not found" }); return; }

    const [pendingCheck] = await db
      .insert(checksTable)
      .values({
        competitorId: competitor.id,
        status: "pending",
        hasChanges: false,
      })
      .returning();

    // Run check asynchronously
    runCompetitorCheck(competitor, pendingCheck.id).catch((err) =>
      req.log.error({ err }, "Background check failed")
    );

    res.status(202).json(formatCheck(pendingCheck, competitor.name));
  } catch (err) {
    req.log.error({ err }, "Failed to trigger check");
    res.status(500).json({ error: "Failed to trigger check" });
  }
});

router.get("/checks", async (req, res) => {
  const parsed = ListChecksQueryParams.safeParse({
    limit: req.query.limit ? Number(req.query.limit) : undefined,
  });

  const limit = parsed.success && parsed.data.limit ? parsed.data.limit : 50;

  try {
    const results = await db
      .select({
        check: checksTable,
        competitorName: competitorsTable.name,
      })
      .from(checksTable)
      .leftJoin(competitorsTable, eq(checksTable.competitorId, competitorsTable.id))
      .orderBy(desc(checksTable.checkedAt))
      .limit(limit);

    res.json(
      results.map(({ check, competitorName }) =>
        formatCheck(check, competitorName ?? "Unknown")
      )
    );
  } catch (err) {
    req.log.error({ err }, "Failed to list checks");
    res.status(500).json({ error: "Failed to list checks" });
  }
});

export default router;
