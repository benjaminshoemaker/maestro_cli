import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import inquirer from "inquirer";
import { join } from "node:path";
import { writeFile } from "node:fs/promises";
import crypto from "node:crypto";
import { assertInternetConnectivity } from "../utils/network";
import {
  assertNodeVersionSupported,
  assertValidProjectName,
} from "../utils/validations";
import { prepareProjectDirectory } from "../utils/directory";
import { scaffoldProject } from "../utils/scaffold";
import { formatFileTree } from "../utils/filetree";
import { startCallbackServer } from "../server";
import { readMaestroConfig } from "../utils/maestro-config";
import { getAppUrl, launchSessionInBrowser } from "../utils/browser";
import { waitForDocument } from "../utils/wait";
import { validateSessionFromConfig } from "../utils/session";
import { maestroConfigTemplate } from "../templates/maestro-config";

const PHASE_FILES = new Map<number, string>([
  [1, "PRODUCT_SPEC.md"],
  [2, "TECH_SPEC.md"],
  [3, "IMPLEMENTATION_PLAN.md"],
  [4, "AGENTS.md"],
]);

function getExpectedOutputPath(projectDir: string, phase: number): string | null {
  const filename = PHASE_FILES.get(phase);
  if (!filename) return null;
  if (phase === 4 || filename === "AGENTS.md") return join(projectDir, "AGENTS.md");
  return join(projectDir, "specs", filename);
}

function phaseLabel(phase: number): string {
  const filename = PHASE_FILES.get(phase);
  if (!filename) return `Phase ${phase}`;
  return `Phase ${phase} (${filename})`;
}

export function createInitCommand(): Command {
  return new Command("init")
    .description("Initialize a new Maestro project")
    .argument("<project-name>", "Name of the project directory to create/use")
    .action(async (projectName: string) => {
      assertNodeVersionSupported();
      await assertInternetConnectivity();
      assertValidProjectName(projectName);

      const { projectDir, isResume } = await prepareProjectDirectory(projectName);
      let sessionToken: string;
      let createdPaths: string[] = [];
      let effectiveProjectName = projectName;

      if (isResume) {
        const config = await readMaestroConfig(projectDir);
        sessionToken = config.sessionToken;
        effectiveProjectName = config.projectName;

        const validation = await validateSessionFromConfig({ projectDir });
        if (validation.status === "valid") {
          console.log(chalk.gray(`Server session valid. Current: ${phaseLabel(validation.currentPhase)}`));
        } else if (validation.status === "invalid") {
          console.log(chalk.yellow("Server does not recognize this session token."));
          const answer = await inquirer.prompt<{ startFresh: boolean }>([
            {
              type: "confirm",
              name: "startFresh",
              message: "Start fresh with a new session token?",
              default: true,
            },
          ]);

          if (!answer.startFresh) {
            console.log(chalk.gray("\nTo try again later, run:"));
            console.log(chalk.cyan(`maestro init ${projectName}`));
            return;
          }

          sessionToken = crypto.randomUUID();
          await writeFile(
            join(projectDir, ".maestro", "config.json"),
            maestroConfigTemplate({
              projectName: effectiveProjectName,
              sessionToken,
              createdAt: new Date().toISOString(),
            }),
            "utf8",
          );
          console.log(chalk.green("✓ Created a new session token."));
        } else {
          console.log(chalk.yellow(`Could not validate session: ${validation.message}`));
          console.log(chalk.gray("Continuing without validation..."));
        }
      } else {
        const spinner = ora("Scaffolding files...").start();
        const scaffolded = await scaffoldProject({ projectDir, projectName });
        spinner.succeed("Scaffolded files");
        sessionToken = scaffolded.sessionToken;
        createdPaths = scaffolded.createdPaths;

        console.log(chalk.gray(formatFileTree({ projectDir, createdPaths })));
      }

      const server = await startCallbackServer({ projectDir, sessionToken });

      const appUrl = getAppUrl();
      const savedDocs = new Map<number, { filename: string; path: string }>();

      const openBrowser = async () => {
        try {
          const url = await launchSessionInBrowser({
            appUrl,
            callbackPort: server.port,
            token: sessionToken,
            projectName: effectiveProjectName,
          });
          console.log(chalk.gray(`Opened: ${url}`));
        } catch {
          const url = new URL("/session/new", appUrl);
          url.searchParams.set("callback", `localhost:${server.port}`);
          url.searchParams.set("token", sessionToken);
          url.searchParams.set("project", effectiveProjectName);

          console.log(chalk.yellow("Could not open your browser automatically."));
          console.log(chalk.yellow("Open this URL manually to continue:"));
          console.log(chalk.cyan(url.toString()));
        }
      };

      await openBrowser();

      while (true) {
        const saved = await waitForDocument({ waitForSave: server.waitForSave });
        savedDocs.set(saved.phase, { filename: saved.filename, path: saved.path });

        console.log(chalk.green(`✓ Saved ${saved.filename}`));
        console.log(chalk.gray(saved.path));

        if (saved.phase >= 4) {
          console.log(chalk.green("\n✓ All specs complete!\n"));

          for (const phase of [1, 2, 3, 4]) {
            const expectedPath = getExpectedOutputPath(projectDir, phase);
            const filename = PHASE_FILES.get(phase);
            if (!expectedPath || !filename) continue;

            console.log(chalk.gray(`- ${filename}: ${expectedPath}`));
          }

          await server.close();
          return;
        }

        const nextPhase = saved.phase + 1;
        const nextName = PHASE_FILES.get(nextPhase) ?? `Phase ${nextPhase}`;

        const response = await inquirer.prompt([
          {
            type: "confirm",
            name: "continue",
            message: `Continue to Phase ${nextPhase} (${nextName})?`,
            default: true,
          },
        ]);

        if (!response.continue) {
          console.log(chalk.gray("\nResume anytime by running:"));
          console.log(chalk.cyan(`maestro init ${projectName}`));
          await server.close();
          return;
        }

        await openBrowser();
      }
    });
}
