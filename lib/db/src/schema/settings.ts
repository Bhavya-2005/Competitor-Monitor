import { pgTable, text, serial, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const settingsTable = pgTable("settings", {
  id: serial("id").primaryKey(),
  slackWebhookUrl: text("slack_webhook_url"),
  digestSchedule: text("digest_schedule").notNull().default("daily"), // daily | weekly
  digestTime: text("digest_time").notNull().default("08:00"),
  isDigestEnabled: boolean("is_digest_enabled").notNull().default(false),
  timezone: text("timezone").notNull().default("UTC"),
});

export const insertSettingsSchema = createInsertSchema(settingsTable).omit({ id: true });

export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settingsTable.$inferSelect;
