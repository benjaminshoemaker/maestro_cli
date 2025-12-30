import "@testing-library/jest-dom";
import { config as loadEnv } from "dotenv";
import { TransformStream } from "node:stream/web";

process.env.DOTENV_CONFIG_QUIET = "true";
loadEnv({ path: ".env.local" });

if (!globalThis.TransformStream) {
  // @ts-expect-error - jsdom env does not include Web Streams by default
  globalThis.TransformStream = TransformStream;
}
