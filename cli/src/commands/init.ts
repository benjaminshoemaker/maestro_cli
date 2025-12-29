import { Command } from "commander";
import { assertInternetConnectivity } from "../utils/network";
import {
  assertNodeVersionSupported,
  assertValidProjectName,
} from "../utils/validations";
import { prepareProjectDirectory } from "../utils/directory";

export function createInitCommand(): Command {
  return new Command("init")
    .description("Initialize a new Maestro project")
    .argument("<project-name>", "Name of the project directory to create/use")
    .action(async (projectName: string) => {
      assertNodeVersionSupported();
      await assertInternetConnectivity();
      assertValidProjectName(projectName);

      await prepareProjectDirectory(projectName);

      // File scaffolding is implemented in Tasks 1.3.*.
    });
}
