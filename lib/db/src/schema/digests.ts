import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const digestsTable = pgTable("digests", {
  id: serial("id").primaryKey(),
  sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
  status: text("status").notNull().default("sent"), // sent | failed | skipped
  competitorsChecked: integer("competitors_checked").notNull().default(0),
  changesFound: integer("changes_found").notNull().default(0),
  slackMessageId: text("slack_message_id"),
  content: text("content"),
});

export const insertDigestSchema = createInsertSchema(digestsTable).omit({
  id: true,
  sentAt: true,
});

export type InsertDigest = z.infer<typeof insertDigestSchema>;
export type Digest = typeof digestsTable.$inferSelect;
