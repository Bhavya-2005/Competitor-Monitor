import { pgTable, text, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { competitorsTable } from "./competitors";
import { relations } from "drizzle-orm";

export const checksTable = pgTable("checks", {
  id: serial("id").primaryKey(),
  competitorId: integer("competitor_id").notNull().references(() => competitorsTable.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"), // pending | running | completed | failed
  checkedAt: timestamp("checked_at", { withTimezone: true }).notNull().defaultNow(),
  hasChanges: boolean("has_changes").notNull().default(false),
  changeType: text("change_type"), // pricing | features | blog | jobs
  summary: text("summary"),
  details: text("details"),
  errorMessage: text("error_message"),
});

export const checksRelations = relations(checksTable, ({ one }) => ({
  competitor: one(competitorsTable, {
    fields: [checksTable.competitorId],
    references: [competitorsTable.id],
  }),
}));

export const insertCheckSchema = createInsertSchema(checksTable).omit({
  id: true,
  checkedAt: true,
});

export type InsertCheck = z.infer<typeof insertCheckSchema>;
export type Check = typeof checksTable.$inferSelect;
