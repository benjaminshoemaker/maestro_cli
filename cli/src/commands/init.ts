import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { assertInternetConnectivity } from "../utils/network";
import {
  assertNodeVersionSupported,
  assertValidProjectName,
} from "../utils/validations";
import { prepareProjectDirectory } from "../utils/directory";
import { scaffoldProject } from "../utils/scaffold";
import { formatFileTree } from "../utils/filetree";

export function createInitCommand(): Command {
  return new Command("init")
    .description("Initialize a new Maestro project")
    .argument("<project-name>", "Name of the project directory to create/use")
    .action(async (projectName: string) => {
      assertNodeVersionSupported();
      await assertInternetConnectivity();
      assertValidProjectName(projectName);

      const { projectDir, isResume } = await prepareProjectDirectory(projectName);
      if (isResume) return;

      const spinner = ora("Scaffolding files...").start();
      const { createdPaths } = await scaffoldProject({
        projectDir,
        projectName,
      });
      spinner.succeed("Scaffolded files");

      console.log(chalk.gray(formatFileTree({ projectDir, createdPaths })));
    });
}
