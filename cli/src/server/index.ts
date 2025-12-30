import express from "express";
import getPort, { portNumbers } from "get-port";
import { createRoutes } from "./routes";

export type CallbackServer = {
  app: express.Express;
  port: number;
  close: () => Promise<void>;
};

export async function startCallbackServer(options: {
  preferredPort?: number;
  handleSignals?: boolean;
  projectDir: string;
  sessionToken: string;
}): Promise<CallbackServer> {
  const port = await getPort({
    port: options?.preferredPort
      ? portNumbers(options.preferredPort, options.preferredPort + 10)
      : portNumbers(3847, 3857),
  });

  const app = express();
  app.use(express.json({ limit: "2mb" }));
  app.use(createRoutes({ projectDir: options.projectDir, sessionToken: options.sessionToken }));

  const server = await new Promise<import("node:http").Server>((resolve) => {
    const s = app.listen(port, () => resolve(s));
  });

  const close = async () =>
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });

  console.log(`Localhost callback server listening on http://localhost:${port}`);

  const handleSignals = options?.handleSignals ?? true;
  if (handleSignals) {
    const shutdown = async () => {
      try {
        await close();
      } finally {
        process.exit(0);
      }
    };
    process.once("SIGINT", shutdown);
    process.once("SIGTERM", shutdown);
  }

  return { app, port, close };
}
