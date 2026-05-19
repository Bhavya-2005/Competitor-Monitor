import { db, competitorsTable, settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { runCompetitorCheck } from "./scraper";
import { logger } from "./logger";

let schedulerInterval: NodeJS.Timeout | null = null;

export function startScheduler() {
  // Check every hour if it's time to run checks or send a digest
  schedulerInterval = setInterval(async () => {
    try {
      await runScheduledChecks();
    } catch (err) {
      logger.error({ err }, "Scheduler error");
    }
  }, 60 * 60 * 1000); // every hour

  logger.info("Scheduler started");
}

async function runScheduledChecks() {
  const [settings] = await db.select().from(settingsTable).limit(1);
  if (!settings) return;

  const now = new Date();
  const currentHour = now.getUTCHours().toString().padStart(2, "0");
  const currentMinutes = now.getUTCMinutes().toString().padStart(2, "0");
  const currentTime = `${currentHour}:${currentMinutes}`;

  // Only run at the configured digest time
  const [scheduledHour] = (settings.digestTime ?? "08:00").split(":");
  if (currentHour !== scheduledHour) return;

  const competitors = await db
    .select()
    .from(competitorsTable)
    .where(eq(competitorsTable.isActive, true));

  logger.info({ count: competitors.length }, "Running scheduled checks");

  const { checksTable } = await import("@workspace/db");

  for (const competitor of competitors) {
    try {
      const [check] = await db
        .insert(checksTable)
        .values({ competitorId: competitor.id, status: "pending", hasChanges: false })
        .returning();
      await runCompetitorCheck(competitor, check.id);
    } catch (err) {
      logger.error({ err, competitorId: competitor.id }, "Scheduled check failed");
    }
  }
}

export function stopScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
  }
}
