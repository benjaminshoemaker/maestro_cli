import chalk from "chalk";
import inquirer from "inquirer";
import { mkdir, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import { CliError } from "./errors";

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

export async function prepareProjectDirectory(
  projectName: string,
  options?: {
    cwd?: string;
    confirmResume?: () => Promise<boolean>;
  },
): Promise<{ projectDir: string; isResume: boolean }> {
  const cwd = options?.cwd ?? process.cwd();
  const projectDir = resolve(cwd, projectName);

  const exists = await pathExists(projectDir);
  if (!exists) {
    await mkdir(projectDir, { recursive: true });
    console.log(chalk.green(`✓ Created ${projectDir}`));
    return { projectDir, isResume: false };
  }

  const maestroDir = join(projectDir, ".maestro");
  const isMaestroProject = await pathExists(maestroDir);
  if (!isMaestroProject) {
    throw new CliError(
      chalk.red(
        `Directory '${projectName}' already exists but isn't a Maestro project.`,
      ),
      3,
    );
  }

  const confirmResume =
    options?.confirmResume ??
    (async () => {
      const answer = await inquirer.prompt<{ resume: boolean }>([
        {
          type: "confirm",
          name: "resume",
          message: "Project already exists. Resume?",
          default: true,
        },
      ]);
      return answer.resume;
    });

  const shouldResume = await confirmResume();
  if (!shouldResume) {
    throw new CliError(chalk.yellow("Resume declined."), 4);
  }

  console.log(chalk.green(`✓ Resuming ${projectDir}`));
  return { projectDir, isResume: true };
}

