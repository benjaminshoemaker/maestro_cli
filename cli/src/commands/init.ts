import { Command } from "commander";

export function createInitCommand(): Command {
  return new Command("init")
    .description("Initialize a new Maestro project")
    .argument("<project-name>", "Name of the project directory to create/use")
    .action(async () => {
      // Implemented in Task 1.2.B/C and later phases.
    });
}

