#!/usr/bin/env node

import { Command } from "commander";
import { pathToFileURL } from "node:url";
import { createInitCommand } from "./commands/init";
import { createRedoCommand } from "./commands/redo";
import { isCliError } from "./utils/errors";

export function createProgram(): Command {
  const program = new Command();

  program.name("maestro").description("Maestro CLI").version("1.0.0");
  program.addCommand(createInitCommand());
  program.addCommand(createRedoCommand());

  return program;
}

export async function main(argv = process.argv): Promise<void> {
  const program = createProgram();
  try {
    await program.parseAsync(argv);
  } catch (error) {
    if (isCliError(error)) {
      process.exitCode = error.exitCode;
      console.error(error.message);
      return;
    }
    throw error;
  }
}

const isExecutedDirectly =
  !!process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isExecutedDirectly) {
  await main();
}
