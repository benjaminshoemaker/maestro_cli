import { Command } from "commander";
import chalk from "chalk";
import inquirer from "inquirer";
import { mkdir, copyFile, stat } from "node:fs/promises";
import { basename, join } from "node:path";

import { CliError } from "../utils/errors";
import { assertInternetConnectivity } from "../utils/network";
import { assertNodeVersionSupported } from "../utils/validations";
import { readMaestroConfig } from "../utils/maestro-config";
import { startCallbackServer } from "../server";
import { getAppUrl, launchSessionPhaseInBrowser } from "../utils/browser";
import { validateSession } from "../utils/session";
import { waitForDocument } from "../utils/wait";

const PHASE_FILES = new Map<number, string>([
  [1, "PRODUCT_SPEC.md"],
  [2, "TECH_SPEC.md"],
  [3, "IMPLEMENTATION_PLAN.md"],
  [4, "AGENTS.md"],
]);

function parsePhase(input: string): number {
  const phase = Number(input);
  if (!Number.isInteger(phase) || phase < 1 || phase > 4) {
    throw new CliError("Invalid phase number. Expected 1-4.", 1);
  }
  return phase;
}

function getExpectedOutputPath(projectDir: string, phase: number): string {
  const filename = PHASE_FILES.get(phase);
  if (!filename) throw new CliError("Invalid phase number. Expected 1-4.", 1);
  if (phase === 4 || filename === "AGENTS.md") return join(projectDir, "AGENTS.md");
  return join(projectDir, "specs", filename);
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

export function createRedoCommand(): Command {
  return new Command("redo")
    .description("Redo a specific phase for an existing Maestro project")
    .argument("<phase-number>", "Phase number (1-4)")
    .action(async (phaseNumber: string) => {
      assertNodeVersionSupported();
      await assertInternetConnectivity();

      const phase = parsePhase(phaseNumber);
      const projectDir = process.cwd();

      const config = await readMaestroConfig(projectDir).catch(() => {
        throw new CliError(
          "This command must be run inside a Maestro project (missing .maestro/config.json).",
          3,
        );
      });

      const filename = PHASE_FILES.get(phase) ?? `phase-${phase}.md`;
      const outputPath = getExpectedOutputPath(projectDir, phase);

      if (await pathExists(outputPath)) {
        const answer = await inquirer.prompt<{ action: "keep" | "replace" }>([
          {
            type: "list",
            name: "action",
            message: `A document already exists for ${filename}. Keep it or replace it?`,
            choices: [
              { name: "Keep (make a backup before overwriting)", value: "keep" },
              { name: "Replace (overwrite on save)", value: "replace" },
            ],
          },
        ]);

        if (answer.action === "keep") {
          const backupDir = join(projectDir, ".maestro", "backups");
          await mkdir(backupDir, { recursive: true });
          const backupName = `${basename(filename, ".md")}.${Date.now()}.bak.md`;
          const backupPath = join(backupDir, backupName);
          await copyFile(outputPath, backupPath);
          console.log(chalk.gray(`Backed up existing ${filename} to ${backupPath}`));
        }
      }

      const validation = await validateSession({
        projectName: config.projectName,
        sessionToken: config.sessionToken,
      });

      if (validation.status !== "valid") {
        const hint = `maestro init ${config.projectName}`;
        throw new CliError(
          `Unable to redo phase: session is not valid (${validation.status}). Try: ${hint}`,
          1,
        );
      }

      const server = await startCallbackServer({ projectDir, sessionToken: config.sessionToken });

      const appUrl = getAppUrl();
      const url = await launchSessionPhaseInBrowser({
        appUrl,
        sessionId: validation.sessionId,
        phase,
        callbackPort: server.port,
        token: config.sessionToken,
      });

      console.log(chalk.gray(`Opened: ${url}`));

      const saved = await waitForDocument({ waitForSave: server.waitForSave });
      console.log(chalk.green(`✓ Saved ${saved.filename}`));
      console.log(chalk.gray(saved.path));

      await server.close();
    });
}
