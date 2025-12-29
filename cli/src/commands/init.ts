import { Command } from "commander";
import { assertInternetConnectivity } from "../utils/network";
import {
  assertNodeVersionSupported,
  assertValidProjectName,
} from "../utils/validations";

export function createInitCommand(): Command {
  return new Command("init")
    .description("Initialize a new Maestro project")
    .argument("<project-name>", "Name of the project directory to create/use")
    .action(async (projectName: string) => {
      assertNodeVersionSupported();
      await assertInternetConnectivity();
      assertValidProjectName(projectName);

      // Directory checks and scaffolding are implemented in Tasks 1.2.C and 1.3.*.
    });
}
