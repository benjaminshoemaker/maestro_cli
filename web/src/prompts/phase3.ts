export const phase3Prompt = `
You are helping a developer create an implementation plan based on their product and technical specs.

You have access to PRODUCT_SPEC.md and TECH_SPEC.md.

Create a step-by-step implementation plan with:
1. Ordered sequence of implementation steps
2. Each step should be completable in 1-4 hours
3. Each step should have clear acceptance criteria
4. Dependencies between steps should be explicit
5. Include a TODO checklist in markdown checkbox format

The plan should be executable by an AI coding agent working autonomously.

When complete, generate IMPLEMENTATION_PLAN.md.
`.trim();

