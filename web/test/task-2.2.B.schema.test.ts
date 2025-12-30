/**
 * @jest-environment node
 */

import { getTableConfig } from "drizzle-orm/pg-core";

import { conversations, projects, users } from "../src/db/schema";

function columnNames(table: any) {
  return getTableConfig(table).columns.map((column: any) => column.name);
}

describe("Task 2.2.B schema definitions", () => {
  test("users table matches expected shape", () => {
    const config = getTableConfig(users);
    expect(config.name).toBe("users");
    expect(columnNames(users)).toEqual(
      expect.arrayContaining([
        "id",
        "github_id",
        "github_username",
        "email",
        "stripe_customer_id",
        "subscription_status",
        "subscription_plan",
        "free_project_used",
        "created_at",
        "updated_at",
      ]),
    );
    expect(config.checks.length).toBeGreaterThanOrEqual(2);
    expect(config.indexes.length).toBeGreaterThanOrEqual(2);
  });

  test("projects table matches expected shape", () => {
    const config = getTableConfig(projects);
    expect(config.name).toBe("projects");
    expect(columnNames(projects)).toEqual(
      expect.arrayContaining([
        "id",
        "user_id",
        "name",
        "session_token",
        "current_phase",
        "phase_1_complete",
        "phase_2_complete",
        "phase_3_complete",
        "phase_4_complete",
        "created_at",
        "updated_at",
      ]),
    );
    expect(config.foreignKeys.length).toBeGreaterThanOrEqual(1);
    expect(config.checks.length).toBeGreaterThanOrEqual(1);
    expect(config.uniqueConstraints.length).toBeGreaterThanOrEqual(1);
    expect(config.indexes.length).toBeGreaterThanOrEqual(2);
  });

  test("conversations table matches expected shape", () => {
    const config = getTableConfig(conversations);
    expect(config.name).toBe("conversations");
    expect(columnNames(conversations)).toEqual(
      expect.arrayContaining([
        "id",
        "project_id",
        "phase",
        "messages",
        "generated_doc",
        "created_at",
        "updated_at",
      ]),
    );
    expect(config.foreignKeys.length).toBeGreaterThanOrEqual(1);
    expect(config.checks.length).toBeGreaterThanOrEqual(1);
    expect(config.uniqueConstraints.length).toBeGreaterThanOrEqual(1);
    expect(config.indexes.length).toBeGreaterThanOrEqual(1);
  });
});

