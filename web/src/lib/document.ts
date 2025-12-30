export function getPhaseFilename(phase: 1 | 2 | 3 | 4) {
  switch (phase) {
    case 1:
      return "PRODUCT_SPEC.md";
    case 2:
      return "TECH_SPEC.md";
    case 3:
      return "IMPLEMENTATION_PLAN.md";
    case 4:
      return "AGENTS.md";
  }
}

export function buildDocumentSystemPrompt(params: { phase: 1 | 2 | 3 | 4; filename: string }) {
  return [
    "You are Maestro.",
    `Generate the final document for Phase ${params.phase}.`,
    `Output must be valid Markdown only. Do not wrap in code fences.`,
    `Filename: ${params.filename}`,
  ].join("\n");
}

