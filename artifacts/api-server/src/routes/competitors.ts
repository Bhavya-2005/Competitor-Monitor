import { Router } from "express";
import { db, competitorsTable, checksTable } from "@workspace/db";
import { eq, desc, count, and, sql } from "drizzle-orm";
import {
  CreateCompetitorBody,
  UpdateCompetitorBody,
  UpdateCompetitorParams,
  GetCompetitorParams,
  DeleteCompetitorParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/competitors", async (req, res) => {
  try {
    const competitors = await db.select().from(competitorsTable).orderBy(desc(competitorsTable.createdAt));

    const checksCountResult = await db
      .select({
        competitorId: checksTable.competitorId,
        checksCount: count(checksTable.id),
        changesCount: sql<number>`sum(case when ${checksTable.hasChanges} then 1 else 0 end)`,
      })
      .from(checksTable)
      .groupBy(checksTable.competitorId);

    const countsMap = new Map(checksCountResult.map((r) => [r.competitorId, r]));

    const result = competitors.map((c) => {
      const counts = countsMap.get(c.id);
      return {
        ...c,
        createdAt: c.createdAt.toISOString(),
        lastCheckedAt: c.lastCheckedAt?.toISOString() ?? null,
        checksCount: Number(counts?.checksCount ?? 0),
        changesCount: Number(counts?.changesCount ?? 0),
      };
    });

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to list competitors");
    res.status(500).json({ error: "Failed to list competitors" });
  }
});

router.post("/competitors", async (req, res) => {
  const parsed = CreateCompetitorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  try {
    const [competitor] = await db
      .insert(competitorsTable)
      .values({
        name: parsed.data.name,
        url: parsed.data.url,
        description: parsed.data.description ?? null,
        monitorPricing: parsed.data.monitorPricing ?? true,
        monitorFeatures: parsed.data.monitorFeatures ?? true,
        monitorBlog: parsed.data.monitorBlog ?? true,
        monitorJobs: parsed.data.monitorJobs ?? true,
      })
      .returning();

    res.status(201).json({
      ...competitor,
      createdAt: competitor.createdAt.toISOString(),
      lastCheckedAt: competitor.lastCheckedAt?.toISOString() ?? null,
      checksCount: 0,
      changesCount: 0,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create competitor");
    res.status(500).json({ error: "Failed to create competitor" });
  }
});

router.get("/competitors/:id", async (req, res) => {
  const parsed = GetCompetitorParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }

  try {
    const [competitor] = await db
      .select()
      .from(competitorsTable)
      .where(eq(competitorsTable.id, parsed.data.id));

    if (!competitor) { res.status(404).json({ error: "Not found" }); return; }

    const [counts] = await db
      .select({
        checksCount: count(checksTable.id),
        changesCount: sql<number>`sum(case when ${checksTable.hasChanges} then 1 else 0 end)`,
      })
      .from(checksTable)
      .where(eq(checksTable.competitorId, parsed.data.id));

    res.json({
      ...competitor,
      createdAt: competitor.createdAt.toISOString(),
      lastCheckedAt: competitor.lastCheckedAt?.toISOString() ?? null,
      checksCount: Number(counts?.checksCount ?? 0),
      changesCount: Number(counts?.changesCount ?? 0),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get competitor");
    res.status(500).json({ error: "Failed to get competitor" });
  }
});

router.patch("/competitors/:id", async (req, res) => {
  const paramsParsed = UpdateCompetitorParams.safeParse({ id: Number(req.params.id) });
  if (!paramsParsed.success) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = UpdateCompetitorBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  try {
    const [competitor] = await db
      .update(competitorsTable)
      .set({
        ...(parsed.data.name !== undefined && { name: parsed.data.name }),
        ...(parsed.data.url !== undefined && { url: parsed.data.url }),
        ...(parsed.data.description !== undefined && { description: parsed.data.description }),
        ...(parsed.data.monitorPricing !== undefined && { monitorPricing: parsed.data.monitorPricing }),
        ...(parsed.data.monitorFeatures !== undefined && { monitorFeatures: parsed.data.monitorFeatures }),
        ...(parsed.data.monitorBlog !== undefined && { monitorBlog: parsed.data.monitorBlog }),
        ...(parsed.data.monitorJobs !== undefined && { monitorJobs: parsed.data.monitorJobs }),
        ...(parsed.data.isActive !== undefined && { isActive: parsed.data.isActive }),
      })
      .where(eq(competitorsTable.id, paramsParsed.data.id))
      .returning();

    if (!competitor) { res.status(404).json({ error: "Not found" }); return; }

    const [counts] = await db
      .select({
        checksCount: count(checksTable.id),
        changesCount: sql<number>`sum(case when ${checksTable.hasChanges} then 1 else 0 end)`,
      })
      .from(checksTable)
      .where(eq(checksTable.competitorId, paramsParsed.data.id));

    res.json({
      ...competitor,
      createdAt: competitor.createdAt.toISOString(),
      lastCheckedAt: competitor.lastCheckedAt?.toISOString() ?? null,
      checksCount: Number(counts?.checksCount ?? 0),
      changesCount: Number(counts?.changesCount ?? 0),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to update competitor");
    res.status(500).json({ error: "Failed to update competitor" });
  }
});

router.delete("/competitors/:id", async (req, res) => {
  const parsed = DeleteCompetitorParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }

  try {
    await db.delete(competitorsTable).where(eq(competitorsTable.id, parsed.data.id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete competitor");
    res.status(500).json({ error: "Failed to delete competitor" });
  }
});

export default router;
