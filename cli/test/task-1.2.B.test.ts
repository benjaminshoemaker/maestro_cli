import { createServer } from "node:http";
import { describe, expect, it } from "vitest";
import { CliError } from "../src/utils/errors";
import { assertInternetConnectivity } from "../src/utils/network";
import {
  assertNodeVersionSupported,
  assertValidProjectName,
} from "../src/utils/validations";

describe("Task 1.2.B - pre-flight validations", () => {
  it("fails gracefully when Node version is < 18", () => {
    expect(() => assertNodeVersionSupported("17.9.0")).toThrow(CliError);
    expect(() => assertNodeVersionSupported("17.9.0")).toThrow(
      /requires Node 18 or higher/i,
    );
  });

  it("accepts Node version >= 18", () => {
    expect(() => assertNodeVersionSupported("18.0.0")).not.toThrow();
  });

  it("enforces project name rules", () => {
    expect(() => assertValidProjectName("bad name")).toThrow(/Invalid project name/i);
    expect(() => assertValidProjectName("a".repeat(65))).toThrow(/max 64/i);
    expect(() => assertValidProjectName("ok_name-123")).not.toThrow();
  });

  it("treats an accessible health endpoint as online", async () => {
    const server = createServer((_, res) => {
      res.statusCode = 200;
      res.end("ok");
    });

    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address();
    if (!address || typeof address === "string") {
      server.close();
      throw new Error("Expected server to have a numeric port");
    }

    try {
      await expect(
        assertInternetConnectivity({
          baseUrl: `http://127.0.0.1:${address.port}`,
          timeoutMs: 1000,
        }),
      ).resolves.toBeUndefined();
    } finally {
      server.close();
    }
  });

  it("fails gracefully when health endpoint is unreachable", async () => {
    await expect(
      assertInternetConnectivity({
        baseUrl: "http://127.0.0.1:1",
        timeoutMs: 200,
      }),
    ).rejects.toMatchObject({ exitCode: 2 });
  });
});

