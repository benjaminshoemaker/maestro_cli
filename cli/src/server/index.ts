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
  const candidatePorts = options.preferredPort
    ? portNumbers(options.preferredPort, options.preferredPort + 10)
    : portNumbers(3847, 3857);

  const app = express();
  app.use((req, res, next) => {
    res.header("access-control-allow-origin", "*");
    res.header("access-control-allow-methods", "POST, OPTIONS");
    res.header("access-control-allow-headers", "content-type, authorization");

    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }

    next();
  });
  app.use(express.json({ limit: "2mb" }));
  app.use(createRoutes({ projectDir: options.projectDir, sessionToken: options.sessionToken }));

  let server: import("node:http").Server | undefined;
  let port: number | undefined;

  for (const candidate of candidatePorts) {
    // get-port reduces chances of collision, but concurrent tests/processes can still race.
    const nextPort = await getPort({ port: candidate });
    try {
      const s = await new Promise<import("node:http").Server>((resolve, reject) => {
        const listener = app.listen(nextPort);
        listener.once("listening", () => resolve(listener));
        listener.once("error", reject);
      });
      server = s;
      port = nextPort;
      break;
    } catch (error: any) {
      if (error?.code === "EADDRINUSE") continue;
      throw error;
    }
  }

  if (!server || !port) {
    throw new Error("Unable to start callback server: no available ports");
  }

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
