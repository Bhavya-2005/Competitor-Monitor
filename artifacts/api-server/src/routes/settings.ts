import { Router } from "express";
import { db, settingsTable } from "@workspace/db";
import { UpdateSettingsBody } from "@workspace/api-zod";

const router = Router();

async function ensureSettings() {
  const existing = await db.select().from(settingsTable).limit(1);
  if (existing.length === 0) {
    await db.insert(settingsTable).values({
      digestSchedule: "daily",
      digestTime: "08:00",
      isDigestEnabled: false,
      timezone: "UTC",
    });
    return (await db.select().from(settingsTable).limit(1))[0];
  }
  return existing[0];
}

router.get("/settings", async (req, res) => {
  try {
    const settings = await ensureSettings();
    res.json({
      ...settings,
      slackWebhookConfigured: !!settings.slackWebhookUrl,
      slackWebhookUrl: undefined,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get settings");
    res.status(500).json({ error: "Failed to get settings" });
  }
});

router.patch("/settings", async (req, res) => {
  const parsed = UpdateSettingsBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  try {
    const current = await ensureSettings();
    const [updated] = await db
      .update(settingsTable)
      .set({
        ...(parsed.data.slackWebhookUrl !== undefined && { slackWebhookUrl: parsed.data.slackWebhookUrl }),
        ...(parsed.data.digestSchedule !== undefined && { digestSchedule: parsed.data.digestSchedule }),
        ...(parsed.data.digestTime !== undefined && { digestTime: parsed.data.digestTime }),
        ...(parsed.data.isDigestEnabled !== undefined && { isDigestEnabled: parsed.data.isDigestEnabled }),
        ...(parsed.data.timezone !== undefined && { timezone: parsed.data.timezone }),
      })
      .returning();

    res.json({
      ...updated,
      slackWebhookConfigured: !!updated.slackWebhookUrl,
      slackWebhookUrl: undefined,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to update settings");
    res.status(500).json({ error: "Failed to update settings" });
  }
});

export { ensureSettings };
export default router;
