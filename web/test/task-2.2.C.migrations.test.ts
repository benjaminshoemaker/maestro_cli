/**
 * @jest-environment node
 */

import crypto from "node:crypto";

import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";

import { db } from "../src/db";
import { conversations, projects, users } from "../src/db/schema";

async function tableExists(tableName: string) {
  const result: any = await db.execute(sql`
    select to_regclass(${`public.${tableName}`}) as regclass
  `);
  return Boolean(result.rows?.[0]?.regclass);
}

async function indexExists(indexName: string) {
  const result: any = await db.execute(sql`
    select 1 as ok
    from pg_indexes
    where schemaname = 'public' and indexname = ${indexName}
    limit 1
  `);
  return result.rows?.[0]?.ok === 1;
}

describe("Task 2.2.C database migrations", () => {
  test("tables exist in the database", async () => {
    await expect(tableExists("users")).resolves.toBe(true);
    await expect(tableExists("projects")).resolves.toBe(true);
    await expect(tableExists("conversations")).resolves.toBe(true);
  });

  test("indexes exist in the database", async () => {
    await expect(indexExists("idx_users_github_id")).resolves.toBe(true);
    await expect(indexExists("idx_users_stripe_customer_id")).resolves.toBe(true);

    await expect(indexExists("idx_projects_user_id")).resolves.toBe(true);
    await expect(indexExists("idx_projects_session_token")).resolves.toBe(true);

    await expect(indexExists("idx_conversations_project_id")).resolves.toBe(true);
  });

  test("can insert and select from each table", async () => {
    const githubId = `test-${crypto.randomUUID()}`;
    const githubUsername = `test-user-${crypto.randomUUID()}`;

    const [user] = await db
      .insert(users)
      .values({ githubId, githubUsername })
      .returning({ id: users.id });

    const [project] = await db
      .insert(projects)
      .values({ userId: user.id, name: `project-${crypto.randomUUID()}`, sessionToken: crypto.randomUUID() })
      .returning({ id: projects.id });

    await db.insert(conversations).values({
      projectId: project.id,
      phase: 1,
      generatedDoc: "# Test",
    });

    const conversationRows = await db
      .select({ generatedDoc: conversations.generatedDoc })
      .from(conversations)
      .where(eq(conversations.projectId, project.id));

    expect(conversationRows.length).toBe(1);
    expect(conversationRows[0]?.generatedDoc).toBe("# Test");

    await db.delete(users).where(eq(users.id, user.id));
  });
});
