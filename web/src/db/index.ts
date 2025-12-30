import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

export function getDatabaseUrl(env: Record<string, string | undefined> = process.env) {
  const databaseUrl = env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("Missing required environment variable: DATABASE_URL");
  }
  return databaseUrl;
}

export function createDb(databaseUrl = getDatabaseUrl()) {
  const client = neon(databaseUrl);
  return drizzle(client);
}

export const db = createDb();

