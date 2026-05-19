import { pgTable, text, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const competitorsTable = pgTable("competitors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  description: text("description"),
  faviconUrl: text("favicon_url"),
  monitorPricing: boolean("monitor_pricing").notNull().default(true),
  monitorFeatures: boolean("monitor_features").notNull().default(true),
  monitorBlog: boolean("monitor_blog").notNull().default(true),
  monitorJobs: boolean("monitor_jobs").notNull().default(true),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }),
});

export const insertCompetitorSchema = createInsertSchema(competitorsTable).omit({
  id: true,
  createdAt: true,
  lastCheckedAt: true,
});

export type InsertCompetitor = z.infer<typeof insertCompetitorSchema>;
export type Competitor = typeof competitorsTable.$inferSelect;
