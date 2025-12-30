# Execution Plan: Maestro

## Overview

| Metric | Value |
|--------|-------|
| Total Phases | 6 |
| Total Steps | 22 |
| Total Tasks | 52 |

## Phase Dependency Graph

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│   Phase 1: CLI Foundation ──────► Phase 2: Web Foundation ──────►               │
│   (Scaffold, localhost)          (Next.js, DB, OAuth)                           │
│                                           │                                      │
│                                           ▼                                      │
│                               Phase 3: Chat Interface ──────►                   │
│                               (UI, OpenAI, streaming)                            │
│                                           │                                      │
│                                           ▼                                      │
│                               Phase 4: CLI-Web Integration ──────►              │
│                               (Browser launch, orchestration)                    │
│                                           │                                      │
│                                           ▼                                      │
│                               Phase 5: Billing Integration ──────►              │
│                               (Stripe, paywall, webhooks)                        │
│                                           │                                      │
│                                           ▼                                      │
│                               Phase 6: Polish & Hardening                       │
│                               (Errors, analytics, testing)                       │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Project Setup & CLI Foundation

**Goal:** Create the monorepo structure, implement the CLI `init` command with file scaffolding, and build the localhost callback server that receives documents from the web UI.

**Depends On:** None

### Pre-Phase Setup

Human must complete before starting:
- [ ] Create GitHub repository for Maestro
- [ ] Install Node.js 18+ on development machine
- [ ] Create npm account (if publishing to npm)
- [ ] Set up local development environment with TypeScript support

### Step 1.1: Repository & Project Structure

**Depends On:** None

---

#### Task 1.1.A: Initialize Monorepo Structure

**Description:**  
Create the monorepo structure with `/cli` and `/web` directories. Set up root-level configuration for TypeScript and establish the project foundation that both packages will share.

**Acceptance Criteria:**
- [x] Root `package.json` exists with workspaces configured for `/cli` and `/web`
- [x] `/cli/package.json` exists with correct name, version, bin entry, and engine requirement (Node ≥18)
- [x] `/web/package.json` exists with correct name and version
- [x] Root `tsconfig.json` exists with base TypeScript configuration
- [x] Both `/cli/tsconfig.json` and `/web/tsconfig.json` extend root config

**Files to Create:**
- `package.json` — Root monorepo config with workspaces
- `tsconfig.json` — Root TypeScript configuration
- `cli/package.json` — CLI package config with bin entry
- `cli/tsconfig.json` — CLI TypeScript config
- `web/package.json` — Web package config
- `web/tsconfig.json` — Web TypeScript config
- `.gitignore` — Standard Node/TypeScript ignores

**Files to Modify:**
- None

**Dependencies:** None

**Spec Reference:** Section 1.3 (Key Design Decisions), Section 5.1 (CLI Package), Section 5.2 (Web Package)

**Requires Browser Verification:** No

---

#### Task 1.1.B: Install CLI Dependencies

**Description:**  
Install and configure all CLI dependencies including commander, express, chalk, ora, inquirer, open, get-port, and node-fetch. Set up tsup for building the CLI.

**Acceptance Criteria:**
- [x] All CLI dependencies from spec are installed (commander, express, open, chalk, ora, inquirer, get-port, node-fetch)
- [x] All CLI devDependencies installed (typescript, @types/*, tsup)
- [x] `tsup.config.ts` exists with correct build configuration for ESM output
- [x] `npm run build` successfully compiles TypeScript to `/dist`

**Files to Create:**
- `cli/tsup.config.ts` — Build configuration for CLI

**Files to Modify:**
- `cli/package.json` — Add build scripts

**Dependencies:** Task 1.1.A

**Spec Reference:** Section 5.1 (CLI Package dependencies table)

**Requires Browser Verification:** No

---

### Step 1.2: CLI Init Command

**Depends On:** Step 1.1

---

#### Task 1.2.A: Implement CLI Entry Point and Command Structure

**Description:**  
Create the CLI entry point using commander. Implement the `maestro init <project-name>` command skeleton with argument parsing and the `maestro redo <phase>` command skeleton.

**Acceptance Criteria:**
- [x] `cli/src/index.ts` exists as CLI entry point with shebang
- [x] `maestro init <project-name>` command is registered and accepts project name argument
- [x] `maestro redo <phase-number>` command is registered and accepts phase argument
- [x] Running `npx maestro --help` displays available commands
- [x] Running `npx maestro init --help` displays init command options

**Files to Create:**
- `cli/src/index.ts` — CLI entry point with commander setup
- `cli/src/commands/init.ts` — Init command module (skeleton)
- `cli/src/commands/redo.ts` — Redo command module (skeleton)

**Files to Modify:**
- None

**Dependencies:** Task 1.1.B

**Spec Reference:** Section 3.1 (CLI Commands)

**Requires Browser Verification:** No

---

#### Task 1.2.B: Implement Pre-flight Validations

**Description:**  
Implement Node.js version checking, internet connectivity verification, and project name validation. These checks run before any scaffolding occurs.

**Acceptance Criteria:**
- [x] Node.js version check fails gracefully with message if version < 18
- [x] Internet connectivity check pings API health endpoint and fails gracefully if unreachable
- [x] Project name validation enforces: alphanumeric, hyphens, underscores only, max 64 chars
- [x] Invalid project name displays specific error message
- [x] All exit codes match spec (1 = Node version, 2 = No internet)

**Files to Create:**
- `cli/src/utils/validations.ts` — Validation utility functions
- `cli/src/utils/network.ts` — Network connectivity check

**Files to Modify:**
- `cli/src/commands/init.ts` — Add validation calls

**Dependencies:** Task 1.2.A

**Spec Reference:** Section 3.1 (CLI Commands - Exit Codes), Section 6.1 (CLI Edge Cases)

**Requires Browser Verification:** No

---

#### Task 1.2.C: Implement Directory Existence Checks

**Description:**  
Implement logic to check if the target directory exists. Handle three cases: directory with `.maestro/` (offer resume), directory without `.maestro/` (exit with error), directory doesn't exist (create it).

**Acceptance Criteria:**
- [x] If directory exists with `.maestro/`, prompts user "Resume? (y/n)" using inquirer
- [x] If user declines resume, exits with code 4
- [x] If directory exists without `.maestro/`, exits with code 3 and specific error message
- [x] If directory doesn't exist, creates it successfully
- [x] Uses chalk for colored output messages

**Files to Create:**
- `cli/src/utils/directory.ts` — Directory handling utilities

**Files to Modify:**
- `cli/src/commands/init.ts` — Add directory check logic

**Dependencies:** Task 1.2.B

**Spec Reference:** Section 3.1 (CLI Commands - Exit Codes), Section 6.1 (CLI Edge Cases)

**Requires Browser Verification:** No

---

### Step 1.3: File Scaffolding

**Depends On:** Step 1.2

---

#### Task 1.3.A: Create Scaffold File Templates

**Description:**  
Create embedded template strings for all scaffold files: `.maestro/config.json`, `.claude/settings.json`, `.claude/skills/code-verification/SKILL.md`, `.codex/config.toml`, `CLAUDE.md`, and initial `AGENTS.md`.

**Acceptance Criteria:**
- [x] Template for `.maestro/config.json` matches spec structure (version, projectName, sessionToken, createdAt)
- [x] Template for `.claude/settings.json` matches spec (enabledPlugins, alwaysThinkingEnabled)
- [x] Template for `.claude/skills/code-verification/SKILL.md` contains full SKILL.md content from spec
- [x] Template for `.codex/config.toml` matches spec (model, approval_policy, sandbox settings)
- [x] Template for `CLAUDE.md` points to AGENTS.md
- [x] Template for `AGENTS.md` contains placeholder message

**Files to Create:**
- `cli/src/templates/index.ts` — Export all template generators
- `cli/src/templates/maestro-config.ts` — .maestro/config.json template
- `cli/src/templates/claude-settings.ts` — .claude/settings.json template
- `cli/src/templates/code-verification-skill.ts` — SKILL.md template
- `cli/src/templates/codex-config.ts` — .codex/config.toml template
- `cli/src/templates/claude-md.ts` — CLAUDE.md template
- `cli/src/templates/agents-md.ts` — Initial AGENTS.md template

**Files to Modify:**
- None

**Dependencies:** Task 1.2.C

**Spec Reference:** Section 2.2 (Local File Structure), Section 2.3 (Config File Contents), Appendix A

**Requires Browser Verification:** No

---

#### Task 1.3.B: Implement File Writing Logic

**Description:**  
Implement the scaffolding logic that creates all directories and writes all template files to the project directory. Display the file tree after creation using chalk.

**Acceptance Criteria:**
- [x] All directories created: `.maestro/`, `.claude/`, `.claude/skills/`, `.claude/skills/code-verification/`, `.codex/`, `specs/`
- [x] All files written with correct content from templates
- [x] Session token generated as UUID v4 and stored in config.json
- [x] File tree displayed after creation showing all created files
- [x] Uses ora spinner during file creation

**Files to Create:**
- `cli/src/utils/scaffold.ts` — Scaffolding logic
- `cli/src/utils/filetree.ts` — File tree display utility

**Files to Modify:**
- `cli/src/commands/init.ts` — Call scaffold after validations

**Dependencies:** Task 1.3.A

**Spec Reference:** Section 2.2 (Local File Structure), Section 3.1 (CLI Commands - init behavior)

**Requires Browser Verification:** No

---

### Step 1.4: Localhost Callback Server

**Depends On:** Step 1.3

---

#### Task 1.4.A: Implement Express Server with Dynamic Port

**Description:**  
Create an Express server that listens on a dynamically allocated port using get-port. The server will receive POST requests from the web UI to save generated documents.

**Acceptance Criteria:**
- [x] Express server starts successfully on dynamically allocated port
- [x] Port is allocated using get-port library
- [x] Server logs startup message with port number
- [x] Server handles graceful shutdown on SIGINT/SIGTERM
- [x] Server exports port number for use in browser launch

**Files to Create:**
- `cli/src/server/index.ts` — Express server setup
- `cli/src/server/routes.ts` — Route definitions

**Files to Modify:**
- None

**Dependencies:** Task 1.3.B

**Spec Reference:** Section 1.2 (Localhost Server), Section 3.3 (Localhost Callback Server)

**Requires Browser Verification:** No

---

#### Task 1.4.B: Implement POST /save Endpoint

**Description:**  
Implement the `/save` endpoint that receives document content from the web UI, validates the session token, and writes files to the appropriate location in the project directory.

**Acceptance Criteria:**
- [x] POST `/save` accepts JSON body with phase, filename, and content
- [x] Authorization header with Bearer token is validated against session token
- [x] Invalid token returns 401 with `{"error": "Invalid session token"}`
- [x] Valid request writes file to correct location (specs/ for phases 1-3, root for AGENTS.md)
- [x] Success response includes `{"success": true, "path": "<absolute-path>"}`
- [x] File content is written correctly as markdown

**Files to Create:**
- `cli/src/server/handlers/save.ts` — Save endpoint handler

**Files to Modify:**
- `cli/src/server/routes.ts` — Add /save route

**Dependencies:** Task 1.4.A

**Spec Reference:** Section 3.3 (Localhost Callback Server - POST /save)

**Requires Browser Verification:** No

---

### Phase 1 Checkpoint

**Automated Checks:**
- [x] All tests pass (`npm test` in /cli)
- [x] TypeScript compilation succeeds (`npm run build` in /cli)
- [ ] ESLint passes (if configured)

**Manual Verification:**
- [x] Running `npx maestro init test-project` creates all expected files
- [x] File content matches spec templates
- [x] Session token is valid UUID in config.json
- [x] Localhost server starts and `/save` endpoint responds correctly
- [x] Invalid token is rejected with 401
- [x] Ctrl+C gracefully shuts down server

---

## Phase 2: Web Application Foundation

**Goal:** Set up the Next.js application with Tailwind CSS, configure the Neon PostgreSQL database with Drizzle ORM, implement GitHub OAuth authentication, and create session management endpoints.

**Depends On:** Phase 1

### Pre-Phase Setup

Human must complete before starting:
- [ ] Create Neon PostgreSQL database and obtain DATABASE_URL
- [ ] Create GitHub OAuth application and obtain GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET
- [ ] Generate JWT_SECRET (random 32+ character string)
- [ ] Create Vercel project (for deployment)
- [ ] Set up environment variables in `.env.local`

### Step 2.1: Next.js Setup

**Depends On:** None

---

#### Task 2.1.A: Initialize Next.js 14 Application

**Description:**  
Create a Next.js 14 application with App Router in the `/web` directory. Configure Tailwind CSS for styling and set up the basic layout structure.

**Acceptance Criteria:**
- [x] Next.js 14 app created with App Router (`app/` directory)
- [x] Tailwind CSS configured with `tailwind.config.js` and `globals.css`
- [x] Root layout (`app/layout.tsx`) exists with basic HTML structure
- [x] Homepage (`app/page.tsx`) renders a placeholder landing page
- [x] `npm run dev` starts development server successfully

**Files to Create:**
- `web/app/layout.tsx` — Root layout with Tailwind
- `web/app/page.tsx` — Landing page placeholder
- `web/app/globals.css` — Global styles with Tailwind directives
- `web/tailwind.config.js` — Tailwind configuration
- `web/postcss.config.js` — PostCSS configuration

**Files to Modify:**
- `web/package.json` — Add scripts (dev, build, start)

**Dependencies:** None

**Spec Reference:** Section 5.2 (Web Package), Step 2.1 in Implementation Sequence

**Requires Browser Verification:** Yes
- Criteria 5 (dev server runs and page displays correctly)

---

#### Task 2.1.B: Create Basic Page Routes

**Description:**  
Create the basic page route structure for the application including session pages, pricing page, and login page. These will be placeholders initially.

**Acceptance Criteria:**
- [ ] `/session/new` route exists (`app/session/new/page.tsx`)
- [ ] `/session/[id]` dynamic route exists (`app/session/[id]/page.tsx`)
- [ ] `/session/[id]/phase/[phase]` nested dynamic route exists
- [ ] `/pricing` route exists (`app/pricing/page.tsx`)
- [ ] `/login` route exists (`app/login/page.tsx`)
- [ ] All routes render placeholder content

**Files to Create:**
- `web/app/session/new/page.tsx` — New session page
- `web/app/session/[id]/page.tsx` — Session detail page
- `web/app/session/[id]/phase/[phase]/page.tsx` — Phase-specific page
- `web/app/pricing/page.tsx` — Pricing page
- `web/app/login/page.tsx` — Login page

**Files to Modify:**
- None

**Dependencies:** Task 2.1.A

**Spec Reference:** Section 3.4 (URL Structures)

**Requires Browser Verification:** Yes
- All criteria (navigation to each route should display content)

---

### Step 2.2: Database Setup

**Depends On:** Step 2.1

---

#### Task 2.2.A: Configure Drizzle ORM and Database Connection

**Description:**  
Set up Drizzle ORM with the Neon serverless driver. Create the database connection utility and configure environment variable handling.

**Acceptance Criteria:**
- [ ] Drizzle ORM and @neondatabase/serverless are installed
- [ ] Database connection utility exports configured client (`web/src/db/index.ts`)
- [ ] Environment variable `DATABASE_URL` is read correctly
- [ ] drizzle.config.ts exists for migrations
- [ ] Connection can be tested with a simple query

**Files to Create:**
- `web/src/db/index.ts` — Database connection export
- `web/drizzle.config.ts` — Drizzle Kit configuration

**Files to Modify:**
- `web/package.json` — Add drizzle-kit scripts

**Dependencies:** Task 2.1.A

**Spec Reference:** Section 2.1 (Database Schema), Section 5.2 (Web Package)

**Requires Browser Verification:** No

---

#### Task 2.2.B: Define Database Schema

**Description:**  
Create Drizzle schema definitions for the users, projects, and conversations tables. Include all fields, constraints, and indexes from the spec.

**Acceptance Criteria:**
- [ ] `users` table schema matches spec (id, github_id, github_username, email, stripe fields, free_project_used, timestamps)
- [ ] `projects` table schema matches spec (id, user_id FK, name, session_token, phase flags, timestamps)
- [ ] `conversations` table schema matches spec (id, project_id FK, phase, messages JSONB, generated_doc, timestamps)
- [ ] All CHECK constraints are defined
- [ ] All indexes are defined
- [ ] TypeScript types are exported for each table

**Files to Create:**
- `web/src/db/schema/users.ts` — Users table schema
- `web/src/db/schema/projects.ts` — Projects table schema
- `web/src/db/schema/conversations.ts` — Conversations table schema
- `web/src/db/schema/index.ts` — Export all schemas

**Files to Modify:**
- None

**Dependencies:** Task 2.2.A

**Spec Reference:** Section 2.1 (Database Schema - all tables)

**Requires Browser Verification:** No

---

#### Task 2.2.C: Run Initial Database Migration

**Description:**  
Generate and run the initial database migration to create all tables in the Neon database. Verify the schema is correctly applied.

**Acceptance Criteria:**
- [ ] `npm run db:generate` creates migration files
- [ ] `npm run db:push` applies schema to database
- [ ] All three tables exist in Neon database
- [ ] Indexes are created correctly
- [ ] Test insert/select works for each table

**Files to Create:**
- `web/drizzle/` — Generated migration files (auto-generated)

**Files to Modify:**
- `web/package.json` — Add db:generate, db:push scripts

**Dependencies:** Task 2.2.B

**Spec Reference:** Section 2.1 (Database Schema)

**Requires Browser Verification:** No

---

### Step 2.3: GitHub OAuth

**Depends On:** Step 2.2

---

#### Task 2.3.A: Implement OAuth Redirect Route

**Description:**  
Create the login route that redirects users to GitHub for OAuth authentication. Include state parameter for CSRF protection.

**Acceptance Criteria:**
- [ ] GET `/api/auth/github/redirect` redirects to GitHub OAuth URL
- [ ] OAuth URL includes correct client_id, redirect_uri, scope (user:email)
- [ ] Random state parameter is generated and stored in cookie
- [ ] Redirect URI points to callback endpoint

**Files to Create:**
- `web/app/api/auth/github/redirect/route.ts` — OAuth redirect handler

**Files to Modify:**
- None

**Dependencies:** Task 2.2.C

**Spec Reference:** Section 3.2 (Authentication endpoints)

**Requires Browser Verification:** No

---

#### Task 2.3.B: Implement OAuth Callback Handler

**Description:**  
Handle the GitHub OAuth callback. Exchange the code for an access token, fetch user info, create or update user in database, generate JWT, and set HTTP-only cookie.

**Acceptance Criteria:**
- [ ] GET `/api/auth/github` handles callback with code and state params
- [ ] State parameter is validated against cookie (reject mismatches)
- [ ] Code is exchanged for access token via GitHub API
- [ ] User info (id, username, email) fetched from GitHub API
- [ ] User created in database if new, or updated if existing
- [ ] JWT generated with user ID and stored in HTTP-only cookie
- [ ] Cookie settings: httpOnly, secure, sameSite=lax, 24h expiry
- [ ] Redirects to `/session/new` on success

**Files to Create:**
- `web/app/api/auth/github/route.ts` — OAuth callback handler
- `web/src/lib/auth.ts` — JWT utilities (sign, verify)
- `web/src/lib/github.ts` — GitHub API utilities

**Files to Modify:**
- None

**Dependencies:** Task 2.3.A

**Spec Reference:** Section 3.2 (POST /api/auth/github), Section 6.2 (OAuth edge cases)

**Requires Browser Verification:** No

---

#### Task 2.3.C: Implement Auth Endpoints (me, logout)

**Description:**  
Create the `/api/auth/me` endpoint to get current user info and `/api/auth/logout` to clear the auth cookie.

**Acceptance Criteria:**
- [ ] GET `/api/auth/me` returns user object if authenticated
- [ ] Returns 401 if no valid JWT cookie
- [ ] User object includes: id, githubUsername, email, subscriptionStatus, freeProjectUsed
- [ ] POST `/api/auth/logout` clears the auth cookie
- [ ] Logout returns 200 OK

**Files to Create:**
- `web/app/api/auth/me/route.ts` — Current user endpoint
- `web/app/api/auth/logout/route.ts` — Logout endpoint

**Files to Modify:**
- None

**Dependencies:** Task 2.3.B

**Spec Reference:** Section 3.2 (GET /api/auth/me, POST /api/auth/logout)

**Requires Browser Verification:** No

---

### Step 2.4: Session Management

**Depends On:** Step 2.3

---

#### Task 2.4.A: Implement Create Session Endpoint

**Description:**  
Create the POST `/api/sessions` endpoint that creates a new project and session. Generate a session token, link to user, and return session details.

**Acceptance Criteria:**
- [ ] POST `/api/sessions` accepts projectName and callbackPort in body
- [ ] Requires authentication (401 if not logged in)
- [ ] Creates new project in database linked to user
- [ ] Generates unique session token (UUID v4)
- [ ] Returns: sessionId, sessionToken, projectId, currentPhase (1), isNewProject
- [ ] Handles duplicate project name gracefully (return existing project)

**Files to Create:**
- `web/app/api/sessions/route.ts` — Create session endpoint

**Files to Modify:**
- None

**Dependencies:** Task 2.3.C

**Spec Reference:** Section 3.2 (POST /api/sessions)

**Requires Browser Verification:** No

---

#### Task 2.4.B: Implement Get Session Endpoint

**Description:**  
Create the GET `/api/sessions/:id` endpoint that returns session details including phase completion status and generated documents.

**Acceptance Criteria:**
- [ ] GET `/api/sessions/:id` returns session object
- [ ] Requires authentication
- [ ] Returns 404 if session not found or user doesn't own it
- [ ] Response includes: id, projectName, currentPhase
- [ ] Response includes phases object with complete status and document for each phase
- [ ] Documents are fetched from conversations table

**Files to Create:**
- `web/app/api/sessions/[id]/route.ts` — Get session endpoint

**Files to Modify:**
- None

**Dependencies:** Task 2.4.A

**Spec Reference:** Section 3.2 (GET /api/sessions/:id)

**Requires Browser Verification:** No

---

#### Task 2.4.C: Implement Phase Complete Endpoint

**Description:**  
Create the POST `/api/sessions/:id/phase/:phase/complete` endpoint that marks a phase as complete and stores the generated document.

**Acceptance Criteria:**
- [ ] POST endpoint accepts document in request body
- [ ] Requires authentication
- [ ] Updates conversation record with generated_doc
- [ ] Updates project phase_N_complete flag to true
- [ ] Updates project current_phase to next phase (or null if phase 4)
- [ ] Returns success: true and nextPhase
- [ ] Validates phase number (1-4)

**Files to Create:**
- `web/app/api/sessions/[id]/phase/[phase]/complete/route.ts` — Phase complete endpoint

**Files to Modify:**
- None

**Dependencies:** Task 2.4.B

**Spec Reference:** Section 3.2 (POST /api/sessions/:id/phase/:phase/complete)

**Requires Browser Verification:** No

---

### Phase 2 Checkpoint

**Automated Checks:**
- [ ] All tests pass (`npm test` in /web)
- [ ] TypeScript compilation succeeds (`npm run build` in /web)
- [ ] Database migrations applied successfully
- [ ] ESLint passes

**Manual Verification:**
- [ ] GitHub OAuth flow works end-to-end (login → redirect → callback → cookie set)
- [ ] `/api/auth/me` returns user info when logged in
- [ ] Creating a session generates valid session token
- [ ] Session can be retrieved with all phase data
- [ ] Logout clears cookie

**Browser Verification:**
- [ ] Login page redirects to GitHub correctly
- [ ] OAuth callback redirects to session page
- [ ] No console errors during auth flow

---

## Phase 3: Chat Interface

**Goal:** Build the chat UI with real-time streaming, integrate OpenAI via Vercel AI SDK, implement phase flow with document generation, and create system prompts for each phase.

**Depends On:** Phase 2

### Pre-Phase Setup

Human must complete before starting:
- [ ] Obtain OpenAI API key and set OPENAI_API_KEY environment variable
- [ ] Install Vercel AI SDK and OpenAI provider packages
- [ ] Decide on model (GPT-4o-mini per spec)

### Step 3.1: Chat UI Components

**Depends On:** None

---

#### Task 3.1.A: Create Message Components

**Description:**  
Build React components for displaying chat messages including user messages, assistant messages with markdown rendering, and loading states.

**Acceptance Criteria:**
- [ ] MessageList component renders array of messages
- [ ] UserMessage component displays user messages with appropriate styling
- [ ] AssistantMessage component renders markdown content using react-markdown
- [ ] Loading indicator shows when assistant is typing
- [ ] Messages scroll to bottom on new message
- [ ] remark-gfm plugin enabled for GitHub-flavored markdown

**Files to Create:**
- `web/src/components/chat/MessageList.tsx` — Message list container
- `web/src/components/chat/UserMessage.tsx` — User message bubble
- `web/src/components/chat/AssistantMessage.tsx` — Assistant message with markdown
- `web/src/components/chat/LoadingIndicator.tsx` — Typing indicator

**Files to Modify:**
- None

**Dependencies:** None

**Spec Reference:** Section 4.2 (Client-Side State), Step 3.1 in Implementation Sequence

**Requires Browser Verification:** Yes
- All criteria (visual rendering of messages)

---

#### Task 3.1.B: Create Message Input Component

**Description:**  
Build the chat input component with textarea, submit button, and keyboard handling. Include character count and disabled states.

**Acceptance Criteria:**
- [ ] ChatInput component with auto-resizing textarea
- [ ] Submit button sends message on click
- [ ] Enter key submits (Shift+Enter for newline)
- [ ] Input is disabled while waiting for response
- [ ] Submit button shows loading state during submission
- [ ] Empty messages cannot be submitted

**Files to Create:**
- `web/src/components/chat/ChatInput.tsx` — Chat input component

**Files to Modify:**
- None

**Dependencies:** Task 3.1.A

**Spec Reference:** Step 3.1 (Chat UI Components)

**Requires Browser Verification:** Yes
- All criteria (input interaction)

---

#### Task 3.1.C: Create Phase Indicator and Done Button

**Description:**  
Build UI components that show the current phase, provide phase navigation context, and include the "Done" button to complete a phase.

**Acceptance Criteria:**
- [ ] PhaseIndicator shows current phase (1-4) with phase name
- [ ] Phase names: Product Spec, Technical Spec, Implementation Plan, AGENTS.md
- [ ] Progress indicator shows completed phases
- [ ] DoneButton is prominently displayed
- [ ] DoneButton is disabled during document generation
- [ ] Confirmation dialog before completing phase

**Files to Create:**
- `web/src/components/chat/PhaseIndicator.tsx` — Phase status display
- `web/src/components/chat/DoneButton.tsx` — Complete phase button
- `web/src/components/chat/ConfirmDialog.tsx` — Confirmation modal

**Files to Modify:**
- None

**Dependencies:** Task 3.1.A

**Spec Reference:** Step 3.1 (Phase indicator, Done button)

**Requires Browser Verification:** Yes
- All criteria (visual elements and interactions)

---

#### Task 3.1.D: Assemble Chat Page Layout

**Description:**  
Compose all chat components into the session page layout. Include header with project name, phase indicator, chat area, and input.

**Acceptance Criteria:**
- [ ] Session page displays project name in header
- [ ] PhaseIndicator visible in header area
- [ ] MessageList fills available space with scrolling
- [ ] ChatInput fixed at bottom
- [ ] DoneButton visible and accessible
- [ ] Responsive layout for different screen sizes

**Files to Create:**
- `web/src/components/chat/ChatContainer.tsx` — Main chat layout

**Files to Modify:**
- `web/app/session/[id]/phase/[phase]/page.tsx` — Integrate ChatContainer

**Dependencies:** Task 3.1.A, Task 3.1.B, Task 3.1.C

**Spec Reference:** Step 3.1 (Chat UI Components)

**Requires Browser Verification:** Yes
- All criteria (full page layout)

---

### Step 3.2: OpenAI Integration

**Depends On:** Step 3.1

---

#### Task 3.2.A: Configure Vercel AI SDK

**Description:**  
Set up the Vercel AI SDK with OpenAI provider. Create the configuration and utility functions for making AI requests.

**Acceptance Criteria:**
- [ ] AI SDK configured with OpenAI provider
- [ ] Model set to GPT-4o-mini
- [ ] Utility function for creating chat completions
- [ ] Environment variable OPENAI_API_KEY is read correctly
- [ ] Proper error handling for missing API key

**Files to Create:**
- `web/src/lib/ai.ts` — AI SDK configuration and utilities

**Files to Modify:**
- None

**Dependencies:** None

**Spec Reference:** Section 5.2 (ai, @ai-sdk/openai packages), Step 3.2

**Requires Browser Verification:** No

---

#### Task 3.2.B: Implement Streaming Chat API Endpoint

**Description:**  
Create the POST `/api/chat` endpoint that handles chat requests and streams responses using the Vercel AI SDK.

**Acceptance Criteria:**
- [ ] POST `/api/chat` accepts sessionId, phase, and messages array
- [ ] Requires authentication
- [ ] Validates session ownership
- [ ] Streams response using AI SDK streamText
- [ ] Persists messages to conversations table
- [ ] Returns Server-Sent Events stream format
- [ ] Handles OpenAI errors with appropriate responses

**Files to Create:**
- `web/app/api/chat/route.ts` — Streaming chat endpoint

**Files to Modify:**
- None

**Dependencies:** Task 3.2.A

**Spec Reference:** Section 3.2 (POST /api/chat), Section 6.2 (OpenAI error handling)

**Requires Browser Verification:** No

---

#### Task 3.2.C: Implement useChat Hook Integration

**Description:**  
Create a custom hook that wraps the Vercel AI SDK useChat hook with session context, error handling, and message persistence.

**Acceptance Criteria:**
- [ ] Custom hook manages chat state for a specific session/phase
- [ ] Integrates with `/api/chat` endpoint
- [ ] Handles streaming responses correctly
- [ ] Provides loading and error states
- [ ] Persists conversation on message send
- [ ] Loads existing messages from server on mount

**Files to Create:**
- `web/src/hooks/useSessionChat.ts` — Custom chat hook

**Files to Modify:**
- None

**Dependencies:** Task 3.2.B

**Spec Reference:** Section 4.2 (Client-Side State)

**Requires Browser Verification:** No

---

### Step 3.3: Phase Flow

**Depends On:** Step 3.2

---

#### Task 3.3.A: Implement Context Injection

**Description:**  
Create logic to inject previous phase documents into the chat context. Handle context window limits by truncating older content if needed.

**Acceptance Criteria:**
- [ ] Previous phase documents loaded from conversations table
- [ ] Documents included in system message for context
- [ ] Total context limited to ~15K tokens for previous docs
- [ ] If exceeding limit: most recent doc in full, earlier docs truncated
- [ ] Truncation note added when content is cut

**Files to Create:**
- `web/src/lib/context.ts` — Context building utilities

**Files to Modify:**
- `web/app/api/chat/route.ts` — Add context injection

**Dependencies:** Task 3.2.B

**Spec Reference:** Section 6.4 (Context Window Management)

**Requires Browser Verification:** No

---

#### Task 3.3.B: Implement Document Generation

**Description:**  
Create the logic that generates the final document when user clicks "Done". Parse the conversation to extract the document and format as markdown.

**Acceptance Criteria:**
- [ ] "Done" click triggers document generation request
- [ ] AI generates document based on conversation
- [ ] Document formatted as markdown
- [ ] Correct filename for each phase (PRODUCT_SPEC.md, TECH_SPEC.md, etc.)
- [ ] Generated document stored in conversation record

**Files to Create:**
- `web/src/lib/document.ts` — Document generation utilities
- `web/app/api/generate-document/route.ts` — Document generation endpoint

**Files to Modify:**
- None

**Dependencies:** Task 3.3.A

**Spec Reference:** Step 3.3 (Document generation on Done click)

**Requires Browser Verification:** No

---

#### Task 3.3.C: Implement Localhost Callback

**Description:**  
Create the client-side logic to POST the generated document to the user's localhost callback server. Handle success and failure cases.

**Acceptance Criteria:**
- [ ] Document POSTed to localhost:PORT/save with correct payload
- [ ] Authorization header includes session token
- [ ] Success triggers phase completion API call
- [ ] On failure: display document with "Copy to clipboard" fallback
- [ ] Timeout handling for localhost POST (5s timeout)
- [ ] Error message displayed on network failure

**Files to Create:**
- `web/src/lib/localhost.ts` — Localhost callback utilities
- `web/src/components/chat/FallbackDialog.tsx` — Copy fallback UI

**Files to Modify:**
- `web/src/components/chat/DoneButton.tsx` — Add document send logic

**Dependencies:** Task 3.3.B

**Spec Reference:** Section 3.3 (Localhost Callback Server), Section 6.2 (Localhost callback fails)

**Requires Browser Verification:** Yes
- Criteria related to fallback UI display

---

#### Task 3.3.D: Implement Phase Navigation

**Description:**  
Create the navigation flow between phases. After completing a phase, redirect to the next phase or show completion message.

**Acceptance Criteria:**
- [ ] After phase 1-3 complete, redirect to next phase
- [ ] After phase 4 complete, show "Project Complete" message
- [ ] Navigation updates URL correctly
- [ ] Phase state persisted and reflected in UI
- [ ] Cannot navigate to future phases until prior complete

**Files to Create:**
- `web/src/components/chat/PhaseComplete.tsx` — Phase completion UI

**Files to Modify:**
- `web/app/session/[id]/phase/[phase]/page.tsx` — Add navigation logic

**Dependencies:** Task 3.3.C

**Spec Reference:** Step 3.3 (Phase navigation logic)

**Requires Browser Verification:** Yes
- Navigation and redirect behavior

---

### Step 3.4: System Prompts

**Depends On:** Step 3.3

---

#### Task 3.4.A: Create Phase 1 System Prompt (Product Spec)

**Description:**  
Create the system prompt for Phase 1 that guides the AI to gather information for the product specification.

**Acceptance Criteria:**
- [ ] Prompt covers: Problem Statement, Target User, Core Value Proposition
- [ ] Prompt covers: Key Features, User Flows, Success Metrics
- [ ] Instructs AI to ask clarifying questions
- [ ] Instructs AI to challenge vague answers
- [ ] Instructs AI to offer document generation when ready

**Files to Create:**
- `web/src/prompts/phase1.ts` — Phase 1 system prompt

**Files to Modify:**
- None

**Dependencies:** None

**Spec Reference:** Appendix B.1 (Phase 1: Product Spec prompt)

**Requires Browser Verification:** No

---

#### Task 3.4.B: Create Phase 2 System Prompt (Technical Spec)

**Description:**  
Create the system prompt for Phase 2 that guides the AI to gather technical architecture information.

**Acceptance Criteria:**
- [ ] Prompt covers: Architecture, Tech Stack, Data Model
- [ ] Prompt covers: APIs/Interfaces, Third-party Services, Security
- [ ] References PRODUCT_SPEC.md from previous phase
- [ ] Recommends simple, proven technologies
- [ ] Biases toward MVP simplicity

**Files to Create:**
- `web/src/prompts/phase2.ts` — Phase 2 system prompt

**Files to Modify:**
- None

**Dependencies:** Task 3.4.A

**Spec Reference:** Appendix B.2 (Phase 2: Technical Spec prompt)

**Requires Browser Verification:** No

---

#### Task 3.4.C: Create Phase 3 System Prompt (Implementation Plan)

**Description:**  
Create the system prompt for Phase 3 that guides the AI to create a step-by-step implementation plan.

**Acceptance Criteria:**
- [ ] Prompt references PRODUCT_SPEC.md and TECH_SPEC.md
- [ ] Instructs steps completable in 1-4 hours
- [ ] Requires clear acceptance criteria per step
- [ ] Explicit dependencies between steps
- [ ] Includes TODO checklist in markdown format
- [ ] Plan executable by AI coding agent

**Files to Create:**
- `web/src/prompts/phase3.ts` — Phase 3 system prompt

**Files to Modify:**
- None

**Dependencies:** Task 3.4.B

**Spec Reference:** Appendix B.3 (Phase 3: Implementation Plan prompt)

**Requires Browser Verification:** No

---

#### Task 3.4.D: Create Phase 4 System Prompt (AGENTS.md)

**Description:**  
Create the system prompt for Phase 4 that guides the AI to generate a customized AGENTS.md file.

**Acceptance Criteria:**
- [ ] Prompt references all three previous phase documents
- [ ] Customizes for project-specific tech stack
- [ ] Includes testing policy tailored to stack
- [ ] Includes mocking policy based on dependencies
- [ ] Includes error handling conventions
- [ ] Includes project-specific guardrails

**Files to Create:**
- `web/src/prompts/phase4.ts` — Phase 4 system prompt
- `web/src/prompts/index.ts` — Export all prompts

**Files to Modify:**
- None

**Dependencies:** Task 3.4.C

**Spec Reference:** Appendix B.4 (Phase 4: AGENTS.md prompt)

**Requires Browser Verification:** No

---

### Phase 3 Checkpoint

**Automated Checks:**
- [ ] All tests pass
- [ ] TypeScript compilation succeeds
- [ ] ESLint passes

**Manual Verification:**
- [ ] Chat interface renders correctly with all components
- [ ] Messages stream in real-time from OpenAI
- [ ] "Done" button generates document correctly
- [ ] Document is POSTed to localhost callback
- [ ] Fallback copy UI works when localhost fails
- [ ] Phase navigation works correctly
- [ ] System prompts produce appropriate AI behavior

**Browser Verification:**
- [ ] All UI acceptance criteria verified
- [ ] No console errors during chat flow
- [ ] Streaming displays smoothly
- [ ] Responsive layout works on different sizes

---

## Phase 4: CLI-Web Integration

**Goal:** Complete the integration between CLI and web by implementing browser launch, phase orchestration, resume flow, and the redo command.

**Depends On:** Phase 3

### Pre-Phase Setup

Human must complete before starting:
- [ ] Web application deployed to maestro.dev (or staging URL)
- [ ] CLI and web can communicate (localhost callback tested)

### Step 4.1: Browser Launch

**Depends On:** None

---

#### Task 4.1.A: Implement Browser Launch with Session URL

**Description:**  
Implement the logic to open the user's browser with the correct session URL, including callback port and token parameters.

**Acceptance Criteria:**
- [ ] Uses `open` package to launch browser
- [ ] URL format: `{APP_URL}/session/new?callback=localhost:{port}&token={token}&project={name}`
- [ ] Handles "browser won't open" error by displaying URL to user
- [ ] Displays instructions for manual browser opening

**Files to Create:**
- `cli/src/utils/browser.ts` — Browser launch utility

**Files to Modify:**
- `cli/src/commands/init.ts` — Call browser launch after scaffold

**Dependencies:** None

**Spec Reference:** Section 3.4 (URL Structures), Step 4.1

**Requires Browser Verification:** No

---

#### Task 4.1.B: Implement New Session Page Handler

**Description:**  
Create the web page that handles incoming session requests from CLI, creates or resumes the session, and redirects to the chat interface.

**Acceptance Criteria:**
- [ ] `/session/new` reads callback, token, and project from query params
- [ ] Creates session via API if new
- [ ] Validates existing session if resuming
- [ ] Stores callback port in session/memory for later use
- [ ] Redirects to `/session/{id}/phase/{currentPhase}`
- [ ] Handles missing or invalid params gracefully

**Files to Modify:**
- `web/app/session/new/page.tsx` — Implement session creation/resume logic

**Dependencies:** Task 4.1.A

**Spec Reference:** Section 3.4 (URL Structures), Section 4.4 (State Synchronization)

**Requires Browser Verification:** Yes
- Redirect behavior and error handling

---

### Step 4.2: Phase Orchestration

**Depends On:** Step 4.1

---

#### Task 4.2.A: Implement CLI Wait for Document

**Description:**  
Implement the CLI logic that waits for the localhost server to receive a document POST. Display appropriate messages and handle timeout.

**Acceptance Criteria:**
- [ ] CLI displays "Waiting for document..." with spinner
- [ ] Success message displayed when document received
- [ ] Displays saved file path on success
- [ ] Timeout after 5 minutes with retry prompt
- [ ] Pressing Enter retries the wait

**Files to Create:**
- `cli/src/utils/wait.ts` — Wait for document utility

**Files to Modify:**
- `cli/src/commands/init.ts` — Add wait logic after browser launch

**Dependencies:** Task 4.1.A

**Spec Reference:** Section 6.1 (Localhost POST timeout)

**Requires Browser Verification:** No

---

#### Task 4.2.B: Implement Phase Transition Flow

**Description:**  
Create the CLI flow for transitioning between phases. After receiving a document, prompt user to continue to next phase or exit.

**Acceptance Criteria:**
- [ ] After document saved, prompts "Continue to Phase N? (y/n)"
- [ ] If yes, opens browser to next phase
- [ ] If no, displays resume instructions and exits
- [ ] After Phase 4, displays completion message
- [ ] All 4 generated files listed on completion

**Files to Modify:**
- `cli/src/commands/init.ts` — Add phase transition logic
- `cli/src/server/handlers/save.ts` — Signal document received

**Dependencies:** Task 4.2.A

**Spec Reference:** Step 4.2 (Phase Orchestration)

**Requires Browser Verification:** No

---

### Step 4.3: Resume Flow

**Depends On:** Step 4.2

---

#### Task 4.3.A: Implement Session Validation

**Description:**  
Create logic to validate an existing session with the server. Check if the session token is still valid and get current phase status.

**Acceptance Criteria:**
- [ ] Reads session token from `.maestro/config.json`
- [ ] Validates token with server API
- [ ] Returns current phase if valid
- [ ] Returns invalid status if token expired or not found
- [ ] Handles network errors gracefully

**Files to Create:**
- `cli/src/utils/session.ts` — Session validation utilities

**Files to Modify:**
- None

**Dependencies:** None

**Spec Reference:** Section 4.4 (State Synchronization)

**Requires Browser Verification:** No

---

#### Task 4.3.B: Implement Resume Logic in Init Command

**Description:**  
Update the init command to handle resume flow. When `.maestro/` exists and user confirms resume, validate session and continue from current phase.

**Acceptance Criteria:**
- [ ] Detects existing `.maestro/config.json`
- [ ] Prompts user to resume
- [ ] Validates session with server
- [ ] If valid, resumes at correct phase
- [ ] If invalid, offers to start fresh (clear config)
- [ ] Displays current phase status before resuming

**Files to Modify:**
- `cli/src/commands/init.ts` — Add resume flow logic

**Dependencies:** Task 4.3.A

**Spec Reference:** Step 4.3 (Resume Flow), Section 6.1 (Token validation fails)

**Requires Browser Verification:** No

---

### Step 4.4: Redo Command

**Depends On:** Step 4.3

---

#### Task 4.4.A: Implement Redo Command

**Description:**  
Implement the `maestro redo <phase>` command that allows users to redo a specific phase, opening the browser directly to that phase.

**Acceptance Criteria:**
- [ ] `maestro redo <phase>` validates phase number (1-4)
- [ ] Validates inside Maestro project (`.maestro/` exists)
- [ ] Starts localhost server
- [ ] Opens browser to specific phase URL
- [ ] If document exists for phase, prompts to keep or replace
- [ ] Exits with error if not in Maestro project

**Files to Modify:**
- `cli/src/commands/redo.ts` — Implement full redo logic

**Dependencies:** Task 4.3.B

**Spec Reference:** Section 3.1 (npx maestro redo), Step 4.4

**Requires Browser Verification:** No

---

### Phase 4 Checkpoint

**Automated Checks:**
- [ ] All tests pass
- [ ] TypeScript compilation succeeds
- [ ] Both CLI and web build successfully

**Manual Verification:**
- [ ] Full flow works: init → chat → save → next phase
- [ ] Resume works after interruption
- [ ] Redo command works for each phase
- [ ] Browser launch works on target OS
- [ ] Timeout handling works correctly
- [ ] Session validation catches expired sessions

---

## Phase 5: Billing Integration

**Goal:** Integrate Stripe for subscription billing, implement paywall logic, handle webhooks, and enforce free tier limits.

**Depends On:** Phase 4

### Pre-Phase Setup

Human must complete before starting:
- [ ] Create Stripe account and switch to test mode
- [ ] Create products: "Maestro Monthly" and "Maestro Annual"
- [ ] Create prices for each product and note price IDs
- [ ] Set environment variables: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_MONTHLY, STRIPE_PRICE_ANNUAL
- [ ] Configure webhook endpoint in Stripe dashboard (pointing to /api/billing/webhook)

### Step 5.1: Stripe Setup

**Depends On:** None

---

#### Task 5.1.A: Configure Stripe Client

**Description:**  
Set up the Stripe client library and create utility functions for common Stripe operations.

**Acceptance Criteria:**
- [ ] Stripe client initialized with secret key from environment
- [ ] Utility to create checkout session
- [ ] Utility to retrieve subscription
- [ ] Utility to verify webhook signature
- [ ] Error handling for Stripe API errors

**Files to Create:**
- `web/src/lib/stripe.ts` — Stripe client and utilities

**Files to Modify:**
- None

**Dependencies:** None

**Spec Reference:** Section 5.2 (stripe package), Section 5.3 (Stripe env vars)

**Requires Browser Verification:** No

---

### Step 5.2: Paywall Logic

**Depends On:** Step 5.1

---

#### Task 5.2.A: Implement Subscription Check Middleware

**Description:**  
Create middleware/utility that checks user subscription status before allowing access to Phase 2 and beyond.

**Acceptance Criteria:**
- [ ] Checks subscription status from user record
- [ ] Free project: allows all phases if `free_project_used` is false
- [ ] Subscribed users (`active` status): allows all phases
- [ ] Others: blocks at Phase 2+ with paywall
- [ ] `past_due` treated same as `none`

**Files to Create:**
- `web/src/lib/subscription.ts` — Subscription check utilities

**Files to Modify:**
- None

**Dependencies:** Task 5.1.A

**Spec Reference:** Step 5.2 (Paywall Logic), Section 6.3 (Billing Edge Cases)

**Requires Browser Verification:** No

---

#### Task 5.2.B: Create Paywall Component

**Description:**  
Build the paywall UI component that displays when a user needs to subscribe to continue.

**Acceptance Criteria:**
- [ ] Displays pricing options (monthly and annual)
- [ ] Shows feature list / value proposition
- [ ] Subscribe buttons for each plan
- [ ] Clicking subscribe initiates Stripe checkout
- [ ] Loading state during checkout creation

**Files to Create:**
- `web/src/components/billing/Paywall.tsx` — Paywall component
- `web/src/components/billing/PricingCard.tsx` — Pricing option card

**Files to Modify:**
- None

**Dependencies:** Task 5.2.A

**Spec Reference:** Step 5.2 (Display paywall component)

**Requires Browser Verification:** Yes
- Visual rendering and button interactions

---

#### Task 5.2.C: Implement Create Checkout Endpoint

**Description:**  
Create the API endpoint that initiates Stripe checkout session for subscription.

**Acceptance Criteria:**
- [ ] POST `/api/billing/create-checkout` accepts plan (monthly/annual)
- [ ] Accepts successUrl and cancelUrl
- [ ] Creates Stripe checkout session with correct price ID
- [ ] Links checkout to user via customer_id or creates customer
- [ ] Returns checkoutUrl for redirect

**Files to Create:**
- `web/app/api/billing/create-checkout/route.ts` — Checkout creation endpoint

**Files to Modify:**
- None

**Dependencies:** Task 5.1.A

**Spec Reference:** Section 3.2 (POST /api/billing/create-checkout)

**Requires Browser Verification:** No

---

#### Task 5.2.D: Integrate Paywall into Chat Flow

**Description:**  
Integrate the paywall into the chat interface so it displays when a non-subscribed user tries to access Phase 2+.

**Acceptance Criteria:**
- [ ] Paywall displays instead of chat when subscription required
- [ ] Phase 1 always accessible
- [ ] After successful checkout, user can continue to Phase 2
- [ ] Free project users see chat for all phases

**Files to Modify:**
- `web/app/session/[id]/phase/[phase]/page.tsx` — Add paywall logic

**Dependencies:** Task 5.2.B, Task 5.2.C

**Spec Reference:** Step 5.2 (Paywall integration)

**Requires Browser Verification:** Yes
- Paywall displays at correct times

---

### Step 5.3: Webhook Handling

**Depends On:** Step 5.2

---

#### Task 5.3.A: Implement Webhook Endpoint

**Description:**  
Create the webhook endpoint that receives and validates Stripe webhook events.

**Acceptance Criteria:**
- [ ] POST `/api/billing/webhook` receives raw body
- [ ] Validates webhook signature using STRIPE_WEBHOOK_SECRET
- [ ] Returns 400 for invalid signature
- [ ] Returns 200 for valid webhooks (even if event not handled)
- [ ] Logs webhook events for debugging

**Files to Create:**
- `web/app/api/billing/webhook/route.ts` — Webhook endpoint

**Files to Modify:**
- None

**Dependencies:** Task 5.1.A

**Spec Reference:** Section 3.2 (POST /api/billing/webhook)

**Requires Browser Verification:** No

---

#### Task 5.3.B: Implement Webhook Event Handlers

**Description:**  
Implement handlers for each Stripe webhook event type to update user subscription status.

**Acceptance Criteria:**
- [ ] `checkout.session.completed`: Activates subscription, updates stripe_customer_id
- [ ] `customer.subscription.updated`: Updates subscription_status and plan
- [ ] `customer.subscription.deleted`: Sets status to `canceled`
- [ ] `invoice.payment_failed`: Sets status to `past_due`
- [ ] All handlers update user record correctly
- [ ] Idempotent handling (same event twice = same result)

**Files to Modify:**
- `web/app/api/billing/webhook/route.ts` — Add event handlers

**Dependencies:** Task 5.3.A

**Spec Reference:** Step 5.3 (Webhook events)

**Requires Browser Verification:** No

---

### Step 5.4: Free Tier

**Depends On:** Step 5.3

---

#### Task 5.4.A: Implement Free Project Tracking

**Description:**  
Implement logic to track when a user uses their free project and enforce the limit.

**Acceptance Criteria:**
- [ ] First project marks `free_project_used = true` on Phase 1 start
- [ ] Free project allows completion of all 4 phases
- [ ] Second project creation requires subscription
- [ ] Free project flag never resets (even after subscribing)

**Files to Modify:**
- `web/app/api/sessions/route.ts` — Add free project logic
- `web/src/lib/subscription.ts` — Add free project check

**Dependencies:** Task 5.2.A

**Spec Reference:** Step 5.4 (Free Tier), Section 6.3 (Free project + subscription)

**Requires Browser Verification:** No

---

#### Task 5.4.B: Implement Get Subscription Endpoint

**Description:**  
Create the endpoint to get current user's subscription status.

**Acceptance Criteria:**
- [ ] GET `/api/billing/subscription` returns subscription info
- [ ] Returns status, plan, and currentPeriodEnd
- [ ] Returns null for non-subscribed users
- [ ] Requires authentication

**Files to Create:**
- `web/app/api/billing/subscription/route.ts` — Subscription status endpoint

**Files to Modify:**
- None

**Dependencies:** Task 5.1.A

**Spec Reference:** Section 3.2 (GET /api/billing/subscription)

**Requires Browser Verification:** No

---

### Phase 5 Checkpoint

**Automated Checks:**
- [ ] All tests pass
- [ ] TypeScript compilation succeeds
- [ ] Webhook signature validation works

**Manual Verification:**
- [ ] Free project works without payment
- [ ] Paywall appears for second project
- [ ] Stripe checkout completes successfully
- [ ] Subscription activates after payment
- [ ] Webhooks update subscription status
- [ ] Canceled subscription blocks at period end

**Browser Verification:**
- [ ] Paywall displays correctly
- [ ] Checkout redirect works
- [ ] Post-checkout access works

---

## Phase 6: Polish & Error Handling

**Goal:** Implement comprehensive error handling, add analytics events, implement rate limiting, and perform end-to-end testing.

**Depends On:** Phase 5

### Pre-Phase Setup

Human must complete before starting:
- [ ] Identify logging/analytics service (or use simple file logging for MVP)
- [ ] Set up test accounts (GitHub, Stripe) for e2e testing

### Step 6.1: Error States

**Depends On:** None

---

#### Task 6.1.A: Implement User-Friendly Error Messages

**Description:**  
Create a consistent error handling system with user-friendly messages for all error scenarios.

**Acceptance Criteria:**
- [ ] Error boundary component catches React errors
- [ ] API errors return consistent format: `{error: string, code: string}`
- [ ] User sees friendly message, not technical details
- [ ] Retry button shown for transient errors
- [ ] Error states styled consistently

**Files to Create:**
- `web/src/components/ErrorBoundary.tsx` — React error boundary
- `web/src/components/ErrorMessage.tsx` — Error display component
- `web/src/lib/errors.ts` — Error utilities and types

**Files to Modify:**
- None

**Dependencies:** None

**Spec Reference:** Step 6.1 (Error States)

**Requires Browser Verification:** Yes
- Error display and retry behavior

---

#### Task 6.1.B: Implement Retry Logic for Transient Failures

**Description:**  
Add automatic retry logic for transient failures, especially OpenAI API errors.

**Acceptance Criteria:**
- [ ] OpenAI 5xx errors retry 3 times with exponential backoff (1s, 2s, 4s)
- [ ] Rate limit errors show countdown timer
- [ ] Network errors show retry button
- [ ] User informed during retry attempts
- [ ] Max retries reached shows final error

**Files to Modify:**
- `web/app/api/chat/route.ts` — Add retry logic
- `web/src/hooks/useSessionChat.ts` — Add client-side retry

**Dependencies:** Task 6.1.A

**Spec Reference:** Section 6.2 (OpenAI API error handling)

**Requires Browser Verification:** No

---

#### Task 6.1.C: Implement Localhost Callback Fallback

**Description:**  
Improve the fallback UI when localhost callback fails, ensuring users can still get their document.

**Acceptance Criteria:**
- [ ] On localhost failure, modal displays with full document content
- [ ] "Copy to clipboard" button works correctly
- [ ] Download as file option available
- [ ] Clear instructions for manual saving
- [ ] Phase can still be marked complete

**Files to Modify:**
- `web/src/components/chat/FallbackDialog.tsx` — Enhance fallback UI

**Dependencies:** Task 6.1.A

**Spec Reference:** Section 6.2 (Localhost callback fails)

**Requires Browser Verification:** Yes
- Fallback modal display and copy functionality

---

### Step 6.2: Analytics Events

**Depends On:** Step 6.1

---

#### Task 6.2.A: Implement Event Logging Infrastructure

**Description:**  
Create a simple event logging system for MVP. Log events to console/file initially, with structure allowing future integration with analytics service.

**Acceptance Criteria:**
- [ ] Event logger utility with consistent interface
- [ ] Events include timestamp, event name, and properties
- [ ] Events logged to console in development
- [ ] Events logged to file in production (optional for MVP)
- [ ] No performance impact on main flow

**Files to Create:**
- `web/src/lib/analytics.ts` — Analytics/logging utilities
- `cli/src/utils/analytics.ts` — CLI event logging

**Files to Modify:**
- None

**Dependencies:** None

**Spec Reference:** Step 6.2 (Analytics Events)

**Requires Browser Verification:** No

---

#### Task 6.2.B: Instrument Key Events

**Description:**  
Add event logging calls at all key points in the user flow as defined in the spec.

**Acceptance Criteria:**
- [ ] CLI events: `cli_init_started`, `cli_init_completed`
- [ ] Auth events: `auth_started`, `auth_completed`
- [ ] Phase events: `phase_N_started`, `phase_N_completed`, `phase_N_redo`
- [ ] Billing events: `paywall_shown`, `checkout_started`, `subscription_created`, `subscription_canceled`
- [ ] Error events: `session_timeout`, `localhost_callback_failed`, `error_*`

**Files to Modify:**
- `cli/src/commands/init.ts` — Add CLI event calls
- `web/app/api/auth/github/route.ts` — Add auth events
- `web/app/session/[id]/phase/[phase]/page.tsx` — Add phase events
- `web/src/components/billing/Paywall.tsx` — Add billing events

**Dependencies:** Task 6.2.A

**Spec Reference:** Appendix C (Analytics Events table)

**Requires Browser Verification:** No

---

### Step 6.3: Rate Limiting

**Depends On:** Step 6.2

---

#### Task 6.3.A: Implement Message Count Tracking

**Description:**  
Track message count per phase and enforce the 100 message limit.

**Acceptance Criteria:**
- [ ] Message count tracked in conversations table or in-memory
- [ ] Count incremented on each user message
- [ ] Count displayed in UI after 80 messages
- [ ] Warning displayed at 80 messages
- [ ] At 100 messages, input disabled with message

**Files to Modify:**
- `web/app/api/chat/route.ts` — Add count tracking and enforcement
- `web/src/hooks/useSessionChat.ts` — Track count client-side
- `web/src/components/chat/ChatInput.tsx` — Show count and warning

**Dependencies:** None

**Spec Reference:** Section 6.4 (Message limit per phase), Step 6.3

**Requires Browser Verification:** Yes
- Warning and disabled state display

---

### Step 6.4: Testing

**Depends On:** Step 6.3

---

#### Task 6.4.A: Create End-to-End Test: New User Flow

**Description:**  
Create an automated or documented manual test for a completely new user going through the full flow.

**Acceptance Criteria:**
- [ ] Test script/documentation covers: CLI init → GitHub auth → Phase 1-4 → Document saves
- [ ] Verifies all files created correctly
- [ ] Verifies subscription flow (free project)
- [ ] Can be run repeatedly with fresh state
- [ ] Documents expected behavior at each step

**Files to Create:**
- `tests/e2e/new-user-flow.md` — E2E test documentation/script
- `tests/e2e/new-user-flow.ts` — Automated test (if using Playwright/Cypress)

**Files to Modify:**
- None

**Dependencies:** All previous tasks

**Spec Reference:** Step 6.4 (E2E test: new user full flow)

**Requires Browser Verification:** Yes
- Full flow verification

---

#### Task 6.4.B: Create End-to-End Test: Returning User Flow

**Description:**  
Create test coverage for a returning user resuming their project.

**Acceptance Criteria:**
- [ ] Test covers: CLI init in existing project → Resume prompt → Continue phase
- [ ] Verifies session validation
- [ ] Verifies correct phase resumed
- [ ] Verifies redo command works
- [ ] Documents edge cases (expired session, etc.)

**Files to Create:**
- `tests/e2e/returning-user-flow.md` — E2E test documentation/script

**Files to Modify:**
- None

**Dependencies:** Task 6.4.A

**Spec Reference:** Step 6.4 (E2E test: returning user resume)

**Requires Browser Verification:** Yes
- Resume flow verification

---

#### Task 6.4.C: Document Edge Cases and Manual Testing

**Description:**  
Document all edge cases from the spec and create a testing checklist for manual QA.

**Acceptance Criteria:**
- [ ] All CLI edge cases from spec documented with expected behavior
- [ ] All Web UI edge cases documented
- [ ] All Billing edge cases documented
- [ ] Testing checklist created for manual QA
- [ ] Known issues documented (if any)

**Files to Create:**
- `tests/EDGE_CASES.md` — Edge case documentation
- `tests/QA_CHECKLIST.md` — Manual QA checklist

**Files to Modify:**
- None

**Dependencies:** Task 6.4.B

**Spec Reference:** Section 6 (Edge Cases & Boundary Conditions)

**Requires Browser Verification:** No

---

### Phase 6 Checkpoint

**Automated Checks:**
- [ ] All unit tests pass
- [ ] TypeScript compilation succeeds in both packages
- [ ] ESLint passes
- [ ] E2E tests pass (if automated)

**Manual Verification:**
- [ ] All error states handled gracefully
- [ ] Rate limiting works (warning at 80, blocked at 100)
- [ ] Analytics events logged correctly
- [ ] Full new user flow works end-to-end
- [ ] Returning user flow works end-to-end
- [ ] All edge cases verified

**Browser Verification:**
- [ ] Error displays are user-friendly
- [ ] Fallback copy dialog works
- [ ] Message count warning appears correctly
- [ ] No console errors throughout flows

---

## Final Deliverables Checklist

```
CLI Package (/cli)
□ npx maestro init creates all scaffold files
□ Localhost server accepts POST /save
□ Token validation works
□ Browser launch works
□ Resume flow works
□ Redo command works

Web Application (/web)
□ GitHub OAuth flow complete
□ Sessions created and persisted
□ Chat streams responses
□ Documents generated and sent
□ Phase navigation works
□ Paywall displays correctly
□ Stripe checkout works
□ Webhooks update status
□ Error handling complete
□ Rate limiting enforced

Integration
□ Full flow: init → auth → chat → save → next phase
□ Resume works after interruption
□ Redo command works
□ Free project allows full completion
□ Subscription required for second project

Documentation
□ E2E test documentation
□ Edge case documentation
□ QA checklist
```
