# Maestro

Maestro is a monorepo with:

- A Node.js CLI (`maestro`) that scaffolds a project and runs a localhost callback server.
- A Next.js web app that provides a multi-phase, streaming chat UI to generate project documents and POST them back to the callback server.

## Repo Layout

```
.
├── cli/   # npx maestro (scaffold + localhost callback server)
└── web/   # Next.js app (auth, sessions, chat UI + API)
```

## Requirements

- Node.js 18+
- npm (workspaces)

## Install

From the repo root:

```bash
npm install
```

## Services / Integrations

### Web (Next.js on Vercel)

- Deploy `web/` as the Vercel root directory (recommended), or configure a monorepo build that runs `npm run build` in `web/`.
- Required environment variables on Vercel (and locally in `web/.env.local`):
  - `DATABASE_URL` (Neon Postgres connection string)
  - `JWT_SECRET` (32+ chars recommended)
  - `GITHUB_CLIENT_ID`
  - `GITHUB_CLIENT_SECRET`
  - `OPENAI_API_KEY`
- Optional:
  - `OPENAI_MODEL` (defaults to `gpt-4o-mini`)
  - Stripe variables are present in the spec but billing is not implemented yet.

### Database (Neon Postgres)

- The web app uses Drizzle + Neon serverless driver.
- Scripts:
  - `cd web && npm run db:generate`
  - `cd web && npm run db:push`

### GitHub OAuth

- OAuth endpoints:
  - `GET /api/auth/github/redirect`
  - `GET /api/auth/github` (callback)
- Set GitHub app callback URL to:
  - `https://<your-app-url>/api/auth/github`

### OpenAI (Vercel AI SDK)

- Chat streaming: `POST /api/chat`
- Document generation: `POST /api/generate-document`
- Uses `OPENAI_API_KEY` (+ optional `OPENAI_MODEL`).

### CLI → Web “Internet Connectivity” Hook

The CLI checks connectivity by requesting:

- `GET {MAESTRO_API_BASE_URL}/api/health` (default base URL: `https://maestro.dev`)

For local development, set:

```bash
MAESTRO_API_BASE_URL=http://localhost:3000
```

## Local Development

### Web

```bash
cd web
npm run dev
```

### CLI

```bash
cd cli
npm run build
node dist/index.js --help
```

### Manual End-to-End (CLI callback + Web chat)

Today, `maestro init` scaffolds + starts the localhost callback server, but does not yet create a web session or open the browser automatically.

1. Terminal A (web):
   - `cd web && npm run dev`
2. Terminal B (cli):
   - `cd cli`
   - `MAESTRO_API_BASE_URL=http://localhost:<web-port> node dist/index.js init <project-name>`
   - Keep this running (it prints the callback port, e.g. `http://localhost:50045`)
3. In the browser:
   - Visit `http://localhost:<web-port>/login` and complete GitHub OAuth.
   - Create a session via `POST /api/sessions` (DevTools Console is easiest) using `callbackPort` from the CLI output.
   - Open `/session/<id>/phase/1?port=<callbackPort>&token=<sessionToken>` where `sessionToken` comes from `<project>/.maestro/config.json`.
4. Click `Done` to generate a doc and POST it to the CLI callback server.
   - Phase 1–3 docs land in `<project>/specs/`
   - Phase 4 doc lands in `<project>/AGENTS.md`

## Commands / Checks

### Tests

```bash
cd web && npm test
cd cli && npm test
```

### Typecheck / Lint / Build (Web)

```bash
cd web && npx next lint
cd web && npm run build
```

## Useful API Endpoints

- `GET /api/health` – deploy/CLI connectivity check
- `GET /api/auth/me`, `POST /api/auth/logout`
- `POST /api/sessions`, `GET /api/sessions/:id`, `POST /api/sessions/:id/phase/:phase/complete`
- `GET /api/chat?sessionId=...&phase=...`
- `POST /api/chat` (SSE streaming response)
- `POST /api/generate-document`

## Troubleshooting

- `Maestro requires an internet connection...` when running `maestro init` locally:
  - Set `MAESTRO_API_BASE_URL=http://localhost:<web-port>` and ensure `GET /api/health` returns 200.
- `The package "@esbuild/darwin-arm64" could not be found` when building the CLI:
  - Ensure optional deps are installed: `npm install --include=optional`
  - If needed, install the platform binary matching your `esbuild` version:
    - `npm install --no-save @esbuild/darwin-arm64@$(node -p "require('esbuild/package.json').version")`

