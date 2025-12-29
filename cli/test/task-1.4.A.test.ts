import { describe, expect, it } from "vitest";
import { startCallbackServer } from "../src/server";

describe("Task 1.4.A - localhost callback server", () => {
  it("starts on a dynamically allocated port and can shut down", async () => {
    const server = await startCallbackServer({ handleSignals: false });
    expect(server.port).toBeGreaterThan(0);
    await expect(server.close()).resolves.toBeUndefined();
  });
});

