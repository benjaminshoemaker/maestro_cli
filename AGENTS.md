# AGENTS.md - Maestro

Project-wide workflow guidance for AI agents working in this project.

## Instruction Hierarchy

- This file is the durable, project-wide baseline.
- Initial greenfield execution guidance lives in `plans/greenfield/AGENTS.md`.
- Feature execution guidance lives in `features/<name>/AGENTS.md`.
- When working in a scoped directory, read this file first, then the local `AGENTS.md` or `CLAUDE.md` in that directory.

## Project Context

Greenfield planning documents now live in `plans/greenfield/`. Project-specific durable guidance appears below.

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

## Git Rules

| Rule | Details |
|------|---------|
| Branch | `task-{id}` (e.g., `task-1.1.A`) |
| Commit | `task({id}): {description}` |
| Scope | Only modify task-relevant files |
| Ignore | Never commit `.env`, `.env.local`, `node_modules`, `dist`, `.next` |

---

## Critical Guardrails

- **Do not duplicate files to work around issues** — fix the original
- **Do not guess** — if you can't access something, say so
- **Read error output fully** before attempting fixes
- Make the smallest change that satisfies the acceptance criteria
- Do not introduce new APIs without noting it for spec updates
- **Follow the spec** — plans/greenfield/TECHNICAL_SPEC.md is the source of truth for behavior
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
