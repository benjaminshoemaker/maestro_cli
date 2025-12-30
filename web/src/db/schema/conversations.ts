import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { projects } from "./projects";

export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    phase: integer("phase").notNull(),
    messages: jsonb("messages").default(sql`'[]'::jsonb`),
    generatedDoc: text("generated_doc"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    projectIdIdx: index("idx_conversations_project_id").on(table.projectId),
    phaseCheck: check("conversations_phase_check", sql`${table.phase} between 1 and 4`),
    projectPhaseUnique: unique("conversations_project_id_phase_unique").on(
      table.projectId,
      table.phase,
    ),
  }),
);

export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;

