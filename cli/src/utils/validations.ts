import { CliError } from "./errors";

const MIN_NODE_MAJOR_VERSION = 18;
const PROJECT_NAME_PATTERN = /^[a-zA-Z0-9_-]+$/;
const MAX_PROJECT_NAME_LENGTH = 64;

export function assertNodeVersionSupported(
  version = process.versions.node,
): void {
  const major = Number(version.split(".")[0]);
  if (Number.isNaN(major) || major < MIN_NODE_MAJOR_VERSION) {
    throw new CliError(
      `Maestro requires Node ${MIN_NODE_MAJOR_VERSION} or higher. Current: ${version}`,
      1,
    );
  }
}

export function assertValidProjectName(projectName: string): void {
  if (!projectName || projectName.length > MAX_PROJECT_NAME_LENGTH) {
    throw new CliError(
      `Invalid project name. Use only letters, numbers, hyphens, and underscores (max ${MAX_PROJECT_NAME_LENGTH} chars).`,
    );
  }

  if (!PROJECT_NAME_PATTERN.test(projectName)) {
    throw new CliError(
      "Invalid project name. Use only letters, numbers, hyphens, and underscores.",
    );
  }
}

