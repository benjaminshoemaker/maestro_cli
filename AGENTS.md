# AGENTS.md - Maestro

> Workflow guidelines for AI agents in a serial development process.

## Workflow Overview

```
HUMAN (Orchestrator)
├── Assigns tasks from EXECUTION_PLAN.md (one at a time)
├── Reviews completed tasks before assigning next
└── Reviews at phase checkpoints

AI AGENT (Claude Code or Codex CLI)
├── Executes ONE task at a time
├── Works on the main branch or a feature branch
├── Follows TDD: tests first, then implementation
└── Reports completion or blockers
```

## Execution Hierarchy

| Level | Managed By | Boundary |
|-------|------------|----------|
| Phase | Human | Manual testing, approval gate |
| Step | Human | Review and approval of completed tasks |
| Task | Agent | Single focused implementation |

---

## Before Starting Any Task

1. **Read CLAUDE.md** at the project root (if it exists)
2. **Check `.claude/`** directory for project-specific skills and instructions
3. **Explore the codebase** to understand existing patterns and conventions
4. **Review the task** — acceptance criteria, dependencies, spec references
5. **Ask if unclear** — Don't guess on ambiguous requirements

---

## Task Execution

1. **Verify dependencies exist** — Check that prior tasks are merged and working
2. **Write tests first** — One test per acceptance criterion
3. **Implement** — Minimum code to pass tests
4. **Run verification** — Use the code-verification skill against acceptance criteria
   - The skill automatically detects UI/browser criteria and uses Chrome DevTools MCP
5. **Update EXECUTION_PLAN.md** — When code-verification passes, check off the task's verification checkboxes
6. **Commit** — Format: `task(1.1.A): brief description`

---

## Browser Verification Protocol

When acceptance criteria involve UI/browser behavior (detected by keywords: UI, render, display, click, visual, DOM, style, console, network, accessibility, responsive), the code-verification skill will automatically use Chrome DevTools MCP.

### Pre-Verification Setup
1. **Start dev server** — `npm run dev` in `/web` directory
2. **Wait for ready** — Allow 5-10 seconds for Next.js to compile
3. **Confirm MCP availability** — Verify Chrome DevTools MCP is accessible

### Verification Types

| Criterion Pattern | MCP Capability | Verification Method |
|-------------------|----------------|---------------------|
| "displays X", "shows Y", "renders Z" | DOM Inspection | Query selector, check visibility/content |
| "looks like", "visual", "screenshot" | Screenshots | Capture and compare/describe |
| "click", "hover", "focus" | DOM Events | Trigger action, observe result |
| "no console errors" | Console Monitoring | Check console for errors/warnings |
| "API call succeeds", "network" | Network Monitoring | Observe request/response |
| "loads in < X seconds" | Performance Metrics | Measure timing |
| "accessible", "ARIA", "a11y" | DOM + Accessibility | Check ARIA attributes, semantic HTML |
| "responsive", "mobile", "breakpoint" | Viewport Control | Resize viewport, verify layout |

### Verification Output
Include in verification report:
- Screenshot path (for visual verifications)
- DOM state (for element verifications)
- Console log excerpt (if console errors checked)
- Network request summary (if API behavior checked)

### Fallback When MCP Unavailable
If Chrome DevTools MCP is not available:
1. Log a warning: "Browser verification skipped - Chrome DevTools MCP unavailable"
2. Mark browser-related criteria as BLOCKED (not FAIL)
3. Continue with code-based verification
4. Note in report: "Manual browser verification recommended"

---

## Context Management

### Starting a new task
Start a **fresh conversation** for each new task. Before working, load:
1. `AGENTS.md` (this file)
2. `TECHNICAL_SPEC.md` (architecture reference)
3. The task definition from `EXECUTION_PLAN.md`

Read source files and tests on-demand as needed. Do not preload the entire codebase.

### Why fresh context per task?
- Each task is self-contained with complete instructions
- Decisions from previous tasks exist in the code, not conversation history
- Stale context causes confusion and wastes tokens
- The code and tests are the source of truth

### When to preserve context
**Within a single task**, if tests fail or issues arise, continue in the same conversation to debug:

```
Task starts (fresh context)
    → Implement
    → Test fails
    → Debug (keep context)
    → Fix
    → Tests pass
    → Task complete
Next task (fresh context)
```

Only clear context when moving to the next task, not while iterating on the current one.

### Resuming work after a break
When returning to a project:
1. Start a fresh conversation
2. Load `AGENTS.md`, `TECHNICAL_SPEC.md`
3. Check `EXECUTION_PLAN.md` to find the current task
4. Run tests to verify current state
5. Continue from where you left off

Do not attempt to reconstruct previous conversation context.

---

## Serial Workflow Context

Tasks are executed one at a time in sequence:

```
Task 1.1.A → complete → Task 1.1.B → complete → Task 1.2.A → ...
```

**Key implications:**
- Complete the current task before moving to the next
- Previous tasks should already be merged and available
- Only modify files relevant to your current task
- If you need work from a future task, report it as a blocker

---

## Project Structure

Maestro is a monorepo with two packages:

```
maestro/
├── cli/                    # CLI package (npx maestro)
│   ├── src/
│   │   ├── commands/       # init, redo commands
│   │   ├── server/         # Express localhost server
│   │   ├── templates/      # Scaffold file templates
│   │   └── utils/          # Validation, browser, etc.
│   └── dist/               # Compiled output
│
├── web/                    # Next.js 14 web application
│   ├── app/                # App Router pages and API routes
│   │   ├── api/            # API endpoints
│   │   └── session/        # Session pages
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── db/             # Drizzle schema and connection
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utilities (auth, stripe, ai, etc.)
│   │   └── prompts/        # AI system prompts
│   └── drizzle/            # Database migrations
│
└── tests/                  # E2E test documentation
```

---

## When to Stop and Ask

Stop and ask the human if:
- A dependency is missing (file, function, or service doesn't exist)
- You need environment variables or secrets you don't have
- An external dependency or major architectural change seems required
- A test is failing and you cannot determine why **after reading the full error output**
- Acceptance criteria are ambiguous
- You need to modify files outside the task scope
- You're unsure whether a change is user-facing

**Read the full error output before attempting fixes.** The answer is usually in the stack trace. Do not guess or work around.

---

## Blocker Report Format

```
BLOCKED: Task {id}
Issue: {what's wrong}
Tried: {approaches attempted}
Need: {what would unblock}
```

---

## Completion Report

When done, briefly report:
- What was built (1-2 sentences)
- Files created/modified
- Test status (passing/failing)
- Commit hash

Keep it concise. The human can review the diff for details.

---

## Deferred Work

When a task is intentionally paused or skipped:
- Report it clearly to the human
- Note the reason and what would unblock it
- The human will update the execution plan accordingly

---

## Git Rules

| Rule | Details |
|------|---------|
| Branch | `task-{id}` (e.g., `task-1.1.A`) |
| Commit | `task({id}): {description}` |
| Scope | Only modify task-relevant files |
| Ignore | Never commit `.env`, `.env.local`, `node_modules`, `dist`, `.next` |

---

## Testing Policy

- Tests must exist for all acceptance criteria
- Tests must pass before reporting complete
- Never skip or disable tests to make them pass
- If tests won't pass, report as a blocker
- **Never claim "working" when any functionality is disabled or broken**

### Testing by Package

**CLI (`/cli`):**
- Unit tests for utilities (validation, scaffolding)
- Integration tests for commands
- Use Vitest or Jest

**Web (`/web`):**
- Unit tests for utilities and hooks
- Component tests for React components
- API route tests for endpoints
- Use Jest with React Testing Library

---

## Critical Guardrails

- **Do not duplicate files to work around issues** — fix the original
- **Do not guess** — if you can't access something, say so
- **Read error output fully** before attempting fixes
- Make the smallest change that satisfies the acceptance criteria
- Do not introduce new APIs without noting it for spec updates
- **Follow the spec** — TECHNICAL_SPEC.md is the source of truth for behavior
- **Keep packages independent** — CLI and Web communicate via HTTP only

---

## Environment Variables Reference

### CLI
No environment variables required for CLI.

### Web (`.env.local`)
```bash
DATABASE_URL          # Neon PostgreSQL connection string
GITHUB_CLIENT_ID      # GitHub OAuth app client ID
GITHUB_CLIENT_SECRET  # GitHub OAuth app client secret
OPENAI_API_KEY        # OpenAI API key
STRIPE_SECRET_KEY     # Stripe secret key
STRIPE_WEBHOOK_SECRET # Stripe webhook signing secret
STRIPE_PRICE_MONTHLY  # Stripe price ID for monthly plan
STRIPE_PRICE_ANNUAL   # Stripe price ID for annual plan
NEXT_PUBLIC_APP_URL   # Public URL (https://maestro.dev)
JWT_SECRET            # Secret for JWT signing (32+ chars)
```

If environment variables are missing, report as a blocker. Do not hardcode secrets.

---

## Common Commands

### CLI Development
```bash
cd cli
npm install           # Install dependencies
npm run build         # Compile TypeScript
npm run dev           # Watch mode
npm test              # Run tests
```

### Web Development
```bash
cd web
npm install           # Install dependencies
npm run dev           # Start Next.js dev server
npm run build         # Production build
npm test              # Run tests
npm run db:generate   # Generate Drizzle migrations
npm run db:push       # Apply migrations to database
```

### Running the Full Stack
```bash
# Terminal 1: Web
cd web && npm run dev

# Terminal 2: CLI (simulating user)
cd cli && npm run build && npx . init test-project
```

---

*The agent discovers project conventions (error handling, mocking strategies, naming patterns) from the existing codebase. This document only covers workflow mechanics.*
