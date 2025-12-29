import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import {
  agentsMdTemplate,
  claudeMdTemplate,
  claudeSettingsTemplate,
  codeVerificationSkillTemplate,
  codexConfigTomlTemplate,
  maestroConfigTemplate,
} from "../templates";

export async function scaffoldProject(params: {
  projectDir: string;
  projectName: string;
}): Promise<{ sessionToken: string; createdPaths: string[] }> {
  const sessionToken = randomUUID();
  const createdAt = new Date().toISOString();

  const maestroDir = join(params.projectDir, ".maestro");
  const claudeDir = join(params.projectDir, ".claude");
  const claudeSkillsDir = join(params.projectDir, ".claude", "skills");
  const codeVerificationDir = join(
    params.projectDir,
    ".claude",
    "skills",
    "code-verification",
  );
  const codexDir = join(params.projectDir, ".codex");
  const specsDir = join(params.projectDir, "specs");

  await mkdir(maestroDir, { recursive: true });
  await mkdir(claudeDir, { recursive: true });
  await mkdir(claudeSkillsDir, { recursive: true });
  await mkdir(codeVerificationDir, { recursive: true });
  await mkdir(codexDir, { recursive: true });
  await mkdir(specsDir, { recursive: true });

  const createdPaths: string[] = [];

  const maestroConfigPath = join(maestroDir, "config.json");
  await writeFile(
    maestroConfigPath,
    maestroConfigTemplate({
      projectName: params.projectName,
      sessionToken,
      createdAt,
    }),
    "utf8",
  );
  createdPaths.push(maestroConfigPath);

  const claudeSettingsPath = join(claudeDir, "settings.json");
  await writeFile(claudeSettingsPath, claudeSettingsTemplate(), "utf8");
  createdPaths.push(claudeSettingsPath);

  const skillPath = join(codeVerificationDir, "SKILL.md");
  await writeFile(skillPath, codeVerificationSkillTemplate(), "utf8");
  createdPaths.push(skillPath);

  const codexConfigPath = join(codexDir, "config.toml");
  await writeFile(codexConfigPath, codexConfigTomlTemplate(), "utf8");
  createdPaths.push(codexConfigPath);

  const claudeMdPath = join(params.projectDir, "CLAUDE.md");
  await writeFile(claudeMdPath, claudeMdTemplate(), "utf8");
  createdPaths.push(claudeMdPath);

  const agentsMdPath = join(params.projectDir, "AGENTS.md");
  await writeFile(agentsMdPath, agentsMdTemplate(), "utf8");
  createdPaths.push(agentsMdPath);

  return { sessionToken, createdPaths };
}

