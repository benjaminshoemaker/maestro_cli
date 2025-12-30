import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { users } from "./users";

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    sessionToken: varchar("session_token", { length: 255 }).notNull().unique(),
    currentPhase: integer("current_phase").default(1),
    phase1Complete: boolean("phase_1_complete").default(false).notNull(),
    phase2Complete: boolean("phase_2_complete").default(false).notNull(),
    phase3Complete: boolean("phase_3_complete").default(false).notNull(),
    phase4Complete: boolean("phase_4_complete").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("idx_projects_user_id").on(table.userId),
    sessionTokenIdx: index("idx_projects_session_token").on(table.sessionToken),
    currentPhaseCheck: check(
      "projects_current_phase_check",
      sql`${table.currentPhase} between 1 and 5`,
    ),
    userNameUnique: unique("projects_user_id_name_unique").on(table.userId, table.name),
  }),
);

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

