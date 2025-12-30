import "@testing-library/jest-dom";
import { config as loadEnv } from "dotenv";

process.env.DOTENV_CONFIG_QUIET = "true";
loadEnv({ path: ".env.local" });
