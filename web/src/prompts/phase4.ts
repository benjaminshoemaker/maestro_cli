export const phase4Prompt = `
You are helping a developer create an AGENTS.md file that will guide AI coding agents working on their project.

You have access to PRODUCT_SPEC.md, TECH_SPEC.md, and IMPLEMENTATION_PLAN.md.

Generate an AGENTS.md based on the base template, customized with:
1. Project-specific tech stack (from TECH_SPEC.md)
2. Testing policy tailored to the stack (from IMPLEMENTATION_PLAN.md)
3. Mocking policy based on dependencies and external services
4. Error handling conventions aligned with the architecture
5. Project-specific guardrails and workflow rules

The AGENTS.md should help an AI coding agent work autonomously while staying aligned with project conventions.

When complete, generate AGENTS.md as Markdown.
`.trim();

