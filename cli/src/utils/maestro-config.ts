import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { CliError } from "./errors";

type MaestroConfig = {
  version: string;
  projectName: string;
  sessionToken: string;
  createdAt: string;
};

export async function readMaestroConfig(projectDir: string): Promise<MaestroConfig> {
  const configPath = join(projectDir, ".maestro", "config.json");
  try {
    const raw = await readFile(configPath, "utf8");
    return JSON.parse(raw) as MaestroConfig;
  } catch {
    throw new CliError("Missing or invalid .maestro/config.json", 3);
  }
}

