/**
 * @jest-environment node
 */

import { sql } from "drizzle-orm";

import { db, getDatabaseUrl } from "../src/db";

describe("Task 2.2.A database connection", () => {
  test("getDatabaseUrl reads DATABASE_URL", () => {
    expect(getDatabaseUrl({ DATABASE_URL: "postgresql://example" })).toBe(
      "postgresql://example",
    );
  });

  test("getDatabaseUrl throws if DATABASE_URL is missing", () => {
    expect(() => getDatabaseUrl({})).toThrow(/DATABASE_URL/);
  });

  test("can execute a simple query", async () => {
    const result: any = await db.execute(sql`select 1 as ok`);
    expect(result).toBeTruthy();
    expect(result.rows?.[0]?.ok).toBe(1);
  });
});

