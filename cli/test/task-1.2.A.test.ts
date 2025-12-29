import { describe, expect, it } from "vitest";
import { createProgram } from "../src/index";

describe("Task 1.2.A - CLI entry point and command structure", () => {
  it("registers init and redo commands", () => {
    const program = createProgram();
    const help = program.helpInformation();

    expect(help).toContain("init <project-name>");
    expect(help).toContain("redo <phase-number>");
  });
});

