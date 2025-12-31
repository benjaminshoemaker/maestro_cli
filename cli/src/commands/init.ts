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
import { startCallbackServer } from "../server";
import { readMaestroConfig } from "../utils/maestro-config";
import { getAppUrl, launchSessionInBrowser } from "../utils/browser";
import { waitForDocument } from "../utils/wait";

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

      if (isResume) {
        const config = await readMaestroConfig(projectDir);
        sessionToken = config.sessionToken;
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
      try {
        const url = await launchSessionInBrowser({
          appUrl,
          callbackPort: server.port,
          token: sessionToken,
          projectName,
        });
        console.log(chalk.gray(`Opened: ${url}`));
      } catch {
        const url = new URL("/session/new", appUrl);
        url.searchParams.set("callback", `localhost:${server.port}`);
        url.searchParams.set("token", sessionToken);
        url.searchParams.set("project", projectName);

        console.log(chalk.yellow("Could not open your browser automatically."));
        console.log(chalk.yellow("Open this URL manually to continue:"));
        console.log(chalk.cyan(url.toString()));
      }

      const saved = await waitForDocument({ waitForSave: server.waitForSave });
      console.log(chalk.green(`✓ Saved ${saved.filename}`));
      console.log(chalk.gray(saved.path));
    });
}
