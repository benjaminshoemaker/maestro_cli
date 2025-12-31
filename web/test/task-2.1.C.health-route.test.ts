/**
 * @jest-environment node
 */

import { GET } from "../app/api/health/route";

describe("Task 2.1.C health route", () => {
  test("/api/health returns ok", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
  });
});

