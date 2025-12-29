import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  agentsMdTemplate,
  claudeMdTemplate,
  claudeSettingsTemplate,
  codeVerificationSkillTemplate,
  codexConfigTomlTemplate,
  maestroConfigTemplate,
} from "../src/templates";

describe("Task 1.3.A - scaffold file templates", () => {
  it(".maestro/config.json matches spec structure", () => {
    const json = maestroConfigTemplate({
      projectName: "my-project",
      sessionToken: "uuid-v4-token",
      createdAt: "2024-12-28T10:00:00Z",
    });
    const parsed = JSON.parse(json) as Record<string, unknown>;

    expect(parsed).toMatchObject({
      version: "1.0.0",
      projectName: "my-project",
      sessionToken: "uuid-v4-token",
      createdAt: "2024-12-28T10:00:00Z",
    });
  });

  it(".claude/settings.json matches spec", () => {
    expect(claudeSettingsTemplate()).toContain("alwaysThinkingEnabled");
    expect(claudeSettingsTemplate()).toContain("frontend-design@claude-code-plugins");
  });

  it(".claude/skills/code-verification/SKILL.md is embedded verbatim", async () => {
    const expectedPath = join(
      process.cwd(),
      "..",
      ".claude",
      "skills",
      "code-verification",
      "SKILL.md",
    );
    const expected = await readFile(expectedPath, "utf8");
    expect(codeVerificationSkillTemplate().trimEnd()).toBe(expected.trimEnd());
  });

  it(".codex/config.toml matches spec", () => {
    const toml = codexConfigTomlTemplate();
    expect(toml).toContain('approval_policy = "on-request"');
    expect(toml).toContain('sandbox_mode = "workspace-write"');
  });

  it("CLAUDE.md points to AGENTS.md", () => {
    expect(claudeMdTemplate()).toContain("AGENTS.md");
  });

  it("AGENTS.md contains placeholder message", () => {
    expect(agentsMdTemplate()).toContain("generated when you complete Phase 4");
  });
});

