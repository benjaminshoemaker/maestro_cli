import { sql } from "drizzle-orm";
import { boolean, check, index, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    githubId: varchar("github_id", { length: 255 }).notNull().unique(),
    githubUsername: varchar("github_username", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }),
    stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
    subscriptionStatus: varchar("subscription_status", { length: 50 })
      .default("none")
      .notNull(),
    subscriptionPlan: varchar("subscription_plan", { length: 50 }),
    freeProjectUsed: boolean("free_project_used").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    githubIdIdx: index("idx_users_github_id").on(table.githubId),
    stripeCustomerIdIdx: index("idx_users_stripe_customer_id").on(table.stripeCustomerId),
    subscriptionStatusCheck: check(
      "users_subscription_status_check",
      sql`${table.subscriptionStatus} in ('none', 'active', 'canceled', 'past_due')`,
    ),
    subscriptionPlanCheck: check(
      "users_subscription_plan_check",
      sql`(${table.subscriptionPlan} in ('monthly', 'annual') or ${table.subscriptionPlan} is null)`,
    ),
  }),
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

