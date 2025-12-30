import { defineConfig } from "drizzle-kit";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL must be set (e.g. in web/.env.local) to run drizzle-kit.");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  dbCredentials: {
    url: databaseUrl,
  },
});

