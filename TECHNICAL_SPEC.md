# Maestro Technical Specification

**Version:** 1.0 (MVP)  
**Date:** December 2024  
**Status:** Ready for Implementation

---

## 1. Architecture Overview

### 1.1 System Components

Maestro consists of four primary components that communicate via HTTP:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER'S MACHINE                                  │
│  ┌─────────────┐                                    ┌─────────────────────┐ │
│  │   Terminal  │◄──────────────────────────────────►│  Localhost Server   │ │
│  │  (npx CLI)  │         stdio                      │  (Express, temp)    │ │
│  └──────┬──────┘                                    └──────────▲──────────┘ │
│         │                                                      │            │
│         │ 1. Scaffold files                                    │ 8. POST    │
│         │ 2. Start localhost server                            │    document│
│         │ 3. Open browser                                      │            │
└─────────┼──────────────────────────────────────────────────────┼────────────┘
          │                                                      │
          │ Browser opens                                        │
          ▼                                                      │
┌─────────────────────────────────────────────────────────────────────────────┐
│                              VERCEL (maestro.dev)                            │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                           Next.js Application                           ││
│  │  ┌─────────────────────┐    ┌─────────────────────┐                    ││
│  │  │   React Frontend    │    │   API Routes        │                    ││
│  │  │   (Chat UI)         │◄──►│   /api/*            │                    ││
│  │  │   - Vercel AI SDK   │    │   - Auth            │                    ││
│  │  │   - Tailwind CSS    │    │   - Sessions        │                    ││
│  │  └─────────────────────┘    │   - Chat streaming  │                    ││
│  │                             │   - Stripe webhooks │                    ││
│  │                             └──────────┬──────────┘                    ││
│  └─────────────────────────────────────────┼───────────────────────────────┘│
└────────────────────────────────────────────┼────────────────────────────────┘
                                             │
                    ┌────────────────────────┼────────────────────────┐
                    │                        │                        │
                    ▼                        ▼                        ▼
            ┌──────────────┐        ┌──────────────┐        ┌──────────────┐
            │    Neon      │        │   OpenAI     │        │   Stripe     │
            │  PostgreSQL  │        │   API        │        │   API        │
            └──────────────┘        └──────────────┘        └──────────────┘
```

### 1.2 Component Responsibilities

| Component | Technology | Responsibilities |
|-----------|------------|------------------|
| **CLI** | Node.js (TypeScript) | Scaffold project files, start localhost callback server, open browser, receive and save generated documents |
| **Web Frontend** | Next.js 14 + React | Render chat UI, stream AI responses, handle OAuth flow, display paywall, POST documents to localhost |
| **API Routes** | Next.js API Routes | GitHub OAuth, session management, OpenAI API calls, Stripe integration, project state persistence |
| **Database** | Neon PostgreSQL | Store users, projects, subscription status, conversation history |
| **Localhost Server** | Express (embedded in CLI) | Temporary server that receives POST requests from web UI and writes files to local filesystem |

### 1.3 Key Design Decisions

1. **Monorepo structure**: Single repository with `/cli` and `/web` directories
2. **Serverless-first**: No long-running backend servers; all API logic in Vercel serverless functions
3. **Session-based auth**: JWT tokens stored in HTTP-only cookies, validated per request
4. **Streaming responses**: OpenAI responses streamed via Vercel AI SDK for real-time UX
5. **Localhost callback**: Web UI POSTs to user's localhost; CLI validates token before accepting

---

## 2. Data Models

### 2.1 Database Schema (Neon PostgreSQL)

#### Users Table

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    github_id VARCHAR(255) UNIQUE NOT NULL,
    github_username VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    subscription_status VARCHAR(50) DEFAULT 'none' 
        CHECK (subscription_status IN ('none', 'active', 'canceled', 'past_due')),
    subscription_plan VARCHAR(50) 
        CHECK (subscription_plan IN ('monthly', 'annual') OR subscription_plan IS NULL),
    free_project_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_github_id ON users(github_id);
CREATE INDEX idx_users_stripe_customer_id ON users(stripe_customer_id);
```

#### Projects Table

```sql
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    current_phase INTEGER DEFAULT 1 CHECK (current_phase BETWEEN 1 AND 5),
    phase_1_complete BOOLEAN DEFAULT FALSE,
    phase_2_complete BOOLEAN DEFAULT FALSE,
    phase_3_complete BOOLEAN DEFAULT FALSE,
    phase_4_complete BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, name)
);

CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_session_token ON projects(session_token);
```

#### Conversations Table

```sql
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    phase INTEGER NOT NULL CHECK (phase BETWEEN 1 AND 4),
    messages JSONB DEFAULT '[]'::jsonb,
    generated_doc TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(project_id, phase)
);

CREATE INDEX idx_conversations_project_id ON conversations(project_id);
```

#### Messages JSONB Structure

```typescript
interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string; // ISO 8601
}

// Example:
[
  { "role": "system", "content": "...", "timestamp": "2024-12-28T10:00:00Z" },
  { "role": "user", "content": "I want to build...", "timestamp": "2024-12-28T10:00:05Z" },
  { "role": "assistant", "content": "Great! Let me ask...", "timestamp": "2024-12-28T10:00:08Z" }
]
```

### 2.2 Local File Structure (Scaffolded by CLI)

```
my-project/
├── .maestro/
│   └── config.json              # Session metadata
├── .claude/
│   ├── settings.json            # Claude Code configuration
│   └── skills/
│       └── code-verification/
│           └── SKILL.md         # Code verification skill
├── .codex/
│   └── config.toml              # Codex CLI configuration
├── specs/
│   ├── PRODUCT_SPEC.md          # Generated Phase 1
│   ├── TECH_SPEC.md             # Generated Phase 2
│   └── IMPLEMENTATION_PLAN.md   # Generated Phase 3
├── CLAUDE.md                    # Points to AGENTS.md
└── AGENTS.md                    # Generated Phase 4 (replaces scaffold)
```

### 2.3 Config File Contents

#### .maestro/config.json

```json
{
  "version": "1.0.0",
  "projectName": "my-project",
  "sessionToken": "uuid-v4-token",
  "createdAt": "2024-12-28T10:00:00Z"
}
```

#### .claude/settings.json

```json
{
  "enabledPlugins": {
    "frontend-design@claude-code-plugins": true
  },
  "alwaysThinkingEnabled": true
}
```

#### .claude/skills/code-verification/SKILL.md

---
name: code-verification
description: Multi-agent code verification workflow using a main agent and sub-agent loop. Use when verifying code against requirements, acceptance criteria, or quality standards. Triggers on requests to verify, validate, or check code against specifications, checklists, or instructions.
---

# Code Verification Skill

Verify code against requirements using a main agent / sub-agent loop with structured feedback and automatic retry.

## Workflow Overview

```
1. Parse verification instructions into testable items
2. For each instruction:
   a. Pre-flight: Confirm instruction is testable
   b. Sub-agent: Verify if instruction is met
   c. If failed: Main agent attempts fix
   d. Repeat b-c up to 5 times or until success
   e. Update checklist with result
3. Generate verification report
```

## Step 1: Parse Verification Instructions

Extract each verification instruction into a discrete, testable item:

- **ID**: Unique identifier (e.g., `V-001`)
- **Instruction**: The requirement text
- **Test approach**: How to verify (file inspection, run tests, lint, type check, etc.)
- **Files involved**: Which files to examine
- **Requires Browser**: Whether the instruction needs Chrome DevTools MCP verification
  - Auto-detect from keywords: UI, render, display, visible, hidden, show, hide, click, hover, focus, blur, scroll, DOM, element, component, layout, responsive, style, CSS, color, font, screenshot, visual, appearance, console, error, warning, log, network, request, response, accessibility, a11y, ARIA, animation, transition, loading, performance
  - Mark as: `browser: true` or `browser: false`
- **Browser Verification Type** (if `browser: true`):
  - `DOM_INSPECTION` - Element presence, visibility, content, computed styles
  - `SCREENSHOT` - Visual appearance, layout verification
  - `CONSOLE` - Browser console errors, warnings, logs
  - `NETWORK` - API requests, responses, status codes
  - `PERFORMANCE` - Load times, Core Web Vitals
  - `ACCESSIBILITY` - ARIA attributes, semantic HTML, color contrast

## Step 2: Pre-flight Validation

Before the verification loop, confirm each instruction is testable:

- Instruction is specific and unambiguous
- Success criteria are clear
- Required files/resources exist

Flag untestable instructions immediately rather than attempting verification.

### Browser-Specific Pre-Flight

For instructions with `browser: true`:

1. **Check Chrome DevTools MCP availability**
   - If unavailable, mark instruction as BLOCKED with reason: "Chrome DevTools MCP not available"
   - Suggest: "Ensure Chrome DevTools MCP server is running and accessible"

2. **Verify dev server is running**
   - Check if configured dev server URL responds (e.g., `http://localhost:3000`)
   - If not running, attempt to start using configured command (e.g., `npm run dev`)
   - Wait for configured startup time before proceeding
   - If unable to start, mark as BLOCKED: "Dev server not accessible at {URL}"

3. **Confirm target route exists**
   - Navigate to the page specified in the instruction
   - If 404 or error, mark as BLOCKED: "Target route not found: {route}"

## Step 3: Sub-Agent Verification Protocol

Spawn a sub-agent to verify each instruction. The sub-agent MUST return structured output:

```
VERIFICATION RESULT
-------------------
Instruction ID: [ID]
Status: PASS | FAIL | BLOCKED
Location: [file:line or "N/A"]
Severity: BLOCKING | MINOR
Finding: [What was found]
Expected: [What was expected]
Suggested Fix: [Specific fix recommendation]
```

Sub-agent rules:
- Check ONLY the specific instruction assigned
- Do not attempt fixes—report findings only
- Be precise about location (file, line number, function name)
- Distinguish between blocking failures and minor issues

### Browser-Enhanced Verification Output

For instructions with `browser: true`, the sub-agent MUST use Chrome DevTools MCP and return this extended format:

```
BROWSER VERIFICATION RESULT
---------------------------
Instruction ID: [ID]
Status: PASS | FAIL | BLOCKED
Verification Type: DOM | VISUAL | CONSOLE | NETWORK | PERFORMANCE | ACCESSIBILITY
URL Tested: [URL navigated to]
Viewport: [width]x[height]

Finding: [What was observed in the browser]
Expected: [What was expected]

--- DOM Details (if DOM inspection) ---
Selector: [CSS selector or data-testid used]
Element Found: Yes | No
Element Visible: Yes | No | N/A
Element Content: [text content or "N/A"]
Computed Styles: [relevant CSS properties if checking styles]

--- Screenshot (if visual check) ---
Screenshot Path: [path to captured screenshot]
Visual Description: [description of what's shown]

--- Console (if console check) ---
Errors: [count and messages]
Warnings: [count and messages]
Relevant Logs: [any logs matching the criterion]

--- Network (if network check) ---
Request URL: [API endpoint called]
Method: [GET/POST/etc]
Status: [response status code]
Response Summary: [brief response description]

--- Performance (if timing check) ---
Page Load Time: [ms]
LCP: [Largest Contentful Paint in ms]
FID: [First Input Delay in ms]
CLS: [Cumulative Layout Shift score]

--- Accessibility (if a11y check) ---
ARIA Attributes: [present/missing]
Semantic HTML: [proper usage assessment]
Color Contrast: [pass/fail]
Keyboard Navigation: [accessible/issues found]

Suggested Fix: [Specific fix recommendation]
```

#### Browser Sub-Agent Rules

In addition to standard sub-agent rules, browser verification sub-agents MUST:
- Start with a screenshot of the initial state
- Use stable selectors (prefer `data-testid` over complex CSS paths)
- Wait for dynamic content to load before inspecting DOM
- Capture console output before and after actions
- Take "after" screenshots when verifying interactive behavior
- Test at default viewport unless criterion specifies responsive/mobile

## Step 4: Main Agent Fix Protocol

When sub-agent reports FAIL:

1. **Review the finding** - Understand what failed and why
2. **Check fix history** - Do not repeat a previously attempted fix
3. **Apply targeted fix** - Make the minimum change to address the issue
4. **Log the attempt** - Record what was changed

### Fix attempt tracking

Maintain a fix log per instruction:

```
FIX LOG: [Instruction ID]
--------------------------
Attempt 1: [Description of change] → [Result]
Attempt 2: [Description of change] → [Result]
...
```

### Strategy escalation

- Attempts 1-2: Direct fix based on sub-agent suggestion
- Attempt 3: Try alternative approach
- Attempts 4-5: Broaden scope, consider architectural changes

If the same failure pattern repeats twice, explicitly try a different strategy.

### Browser-Specific Fix Strategies

When fixing browser verification failures:

**DOM/Visibility failures:**
- Check for conditional rendering logic
- Verify CSS display/visibility properties
- Check for z-index issues
- Verify data is being passed to component

**Console error failures:**
- Address JavaScript exceptions first
- Check for missing API mocks in tests
- Verify environment variables are set
- Check for CORS issues in development

**Network failures:**
- Verify API endpoints are correct
- Check authentication headers
- Verify request payload format
- Check for CORS configuration

**Visual/Screenshot failures:**
- Compare with baseline if available
- Check for CSS cascade issues
- Verify responsive breakpoints
- Check for font loading issues

**Performance failures:**
- Look for large bundle sizes
- Check for unoptimized images
- Verify lazy loading is working
- Check for render-blocking resources

**Accessibility failures:**
- Add missing ARIA attributes
- Fix color contrast issues
- Ensure proper heading hierarchy
- Add keyboard event handlers

## Step 5: Exit Conditions

Exit the verification loop when ANY condition is met:

| Condition | Action |
|-----------|--------|
| Sub-agent reports PASS | ✅ Check off instruction |
| 5 attempts exhausted | ❌ Mark failed with notes |
| Same failure 3+ times | ⚠️ Exit early, flag for review |
| Fix introduces regression | ⚠️ Revert, flag for review |
| Issue is MINOR severity | ⚠️ Note and continue |

## Step 6: Regression Check

After each fix attempt, verify:

- The targeted instruction (primary check)
- Any previously-passing related instructions (regression check)

If a fix breaks something else, revert and note the conflict.

### Browser Regression Checks

After each browser-related fix:

1. **Console regression**: Verify no new console errors introduced
2. **Visual regression**: Re-capture screenshots of affected pages
3. **Performance regression**: Re-check page load metrics if relevant
4. **Accessibility regression**: Re-run accessibility checks on modified components

If browser regression detected:
- Capture screenshots of before/after state
- Log the specific regression in the fix log
- Consider whether fix scope was too broad

## Step 7: Generate Verification Report

After all instructions are processed:

```
VERIFICATION REPORT
===================
Total Instructions: [N]
Passed: [N] ✅
Failed: [N] ❌
Needs Review: [N] ⚠️

DETAILS
-------
[V-001] ✅ [Instruction summary]
[V-002] ❌ [Instruction summary]
  - Failed after 5 attempts
  - Last error: [description]
  - Attempts: [brief log]
[V-003] ⚠️ [Instruction summary]
  - Flagged: Repeated same failure pattern
  - Recommendation: [suggestion]

AUDIT TRAIL
-----------
[Timestamp] V-001: Verified PASS on first check
[Timestamp] V-002: Attempt 1 - Changed X → FAIL
[Timestamp] V-002: Attempt 2 - Changed Y → FAIL
...

BROWSER VERIFICATION SUMMARY (if applicable)
--------------------------------------------
Total Browser Checks: [N]
Browser Checks Passed: [N] ✅
Browser Checks Failed: [N] ❌
Browser Checks Blocked: [N] ⚠️
Chrome DevTools MCP Status: Available | Unavailable
Dev Server Status: Running at [URL] | Not Running

Screenshots Captured:
- [V-001] screenshot-v001-initial.png
- [V-001] screenshot-v001-after-click.png
- [V-003] screenshot-v003-mobile-view.png

Console Issues Found:
- [V-002] Error: "Cannot read property 'map' of undefined" (app.js:45)

Network Issues Found:
- [V-004] 404 on GET /api/users

Performance Metrics:
- Page Load: 1.2s (target: <2s) ✅
- LCP: 0.8s (target: <2.5s) ✅
```

## Example

Given a checklist:
```
[ ] All functions have docstrings
[ ] No unused imports
[ ] Tests pass with >80% coverage
```

Workflow execution:
1. Parse into V-001, V-002, V-003
2. Pre-flight confirms all are testable
3. Sub-agent checks V-001 → FAIL (missing docstring in `utils.py:45`)
4. Main agent adds docstring
5. Sub-agent re-checks → PASS
6. Continue to V-002...
7. Final report shows 3/3 passed

## Key Principles

- **Structured feedback**: Sub-agent always returns actionable, located findings
- **No repeated fixes**: Track what was tried to avoid loops
- **Early exit**: Don't burn attempts on unfixable issues
- **Regression awareness**: Fixes shouldn't break other things
- **Audit everything**: The journey matters for debugging

#### .codex/config.toml

```toml
model = "gpt-4o-mini"
model_reasoning_effort = "high"

approval_policy = "on-request"
sandbox_mode = "workspace-write"

[sandbox_workspace_write]
writable_roots = ["."]
network_access = true
```

#### CLAUDE.md

```markdown
# Project Instructions

All project context, conventions, and agent instructions are maintained in AGENTS.md.

See: [AGENTS.md](./AGENTS.md)
```

#### AGENTS.md (Initial Scaffold)

```markdown
# AGENTS.md

This file will be generated when you complete Phase 4 of the Maestro workflow.

Run `npx maestro init` to continue where you left off.
```

---

## 3. API/Interface Contracts

### 3.1 CLI Commands

#### `npx maestro init <project-name>`

**Behavior:**
1. Validate Node.js version (≥18)
2. Check internet connectivity
3. Check if directory exists:
   - Exists with `.maestro/`: Prompt "Resume? (y/n)"
   - Exists without `.maestro/`: Exit with error
   - Does not exist: Create directory
4. Scaffold default files
5. Display file tree
6. Prompt for Phase 1, start localhost server, open browser

**Exit Codes:**
| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Node version too low |
| 2 | No internet connection |
| 3 | Directory exists (non-Maestro) |
| 4 | User declined to resume |

#### `npx maestro redo <phase-number>`

**Behavior:**
1. Validate inside Maestro project (`.maestro/` exists)
2. Validate phase number (1-4)
3. Start localhost server
4. Open browser to specified phase

### 3.2 Web API Endpoints

#### Authentication

**POST /api/auth/github**
```typescript
// Request: Redirected from GitHub OAuth
// Query params: code, state

// Response: Sets HTTP-only cookie, redirects to /session/:id
```

**GET /api/auth/me**
```typescript
// Response
{
  "user": {
    "id": "uuid",
    "githubUsername": "string",
    "email": "string | null",
    "subscriptionStatus": "none" | "active" | "canceled" | "past_due",
    "freeProjectUsed": boolean
  }
}
// or 401 if not authenticated
```

**POST /api/auth/logout**
```typescript
// Clears auth cookie
// Response: 200 OK
```

#### Sessions/Projects

**POST /api/sessions**
```typescript
// Request
{
  "projectName": "string",
  "callbackPort": number
}

// Response
{
  "sessionId": "uuid",
  "sessionToken": "string",
  "projectId": "uuid",
  "currentPhase": number,
  "isNewProject": boolean
}
```

**GET /api/sessions/:id**
```typescript
// Response
{
  "session": {
    "id": "uuid",
    "projectName": "string",
    "currentPhase": number,
    "phases": {
      "1": { "complete": boolean, "document": "string | null" },
      "2": { "complete": boolean, "document": "string | null" },
      "3": { "complete": boolean, "document": "string | null" },
      "4": { "complete": boolean, "document": "string | null" }
    }
  }
}
```

**POST /api/sessions/:id/phase/:phase/complete**
```typescript
// Request
{
  "document": "string (markdown content)"
}

// Response
{
  "success": true,
  "nextPhase": number | null
}
```

#### Chat

**POST /api/chat**
```typescript
// Request
{
  "sessionId": "uuid",
  "phase": number,
  "messages": Message[]
}

// Response: Server-Sent Events stream (Vercel AI SDK format)
// Each event: { "content": "string" }
```

#### Billing

**POST /api/billing/create-checkout**
```typescript
// Request
{
  "plan": "monthly" | "annual",
  "successUrl": "string",
  "cancelUrl": "string"
}

// Response
{
  "checkoutUrl": "string"
}
```

**POST /api/billing/webhook**
```typescript
// Stripe webhook handler
// Events: checkout.session.completed, customer.subscription.updated,
//         customer.subscription.deleted, invoice.payment_failed
```

**GET /api/billing/subscription**
```typescript
// Response
{
  "status": "none" | "active" | "canceled" | "past_due",
  "plan": "monthly" | "annual" | null,
  "currentPeriodEnd": "ISO date string | null"
}
```

### 3.3 Localhost Callback Server

**POST /save**
```typescript
// Request Headers
Authorization: Bearer <session-token>

// Request Body
{
  "phase": number,
  "filename": "string",
  "content": "string (markdown)"
}

// Response
{
  "success": true,
  "path": "string (absolute path to saved file)"
}

// Error Response (401)
{
  "error": "Invalid session token"
}
```

### 3.4 URL Structures

| URL | Purpose |
|-----|---------|
| `maestro.dev/` | Landing page |
| `maestro.dev/session/new?callback=localhost:PORT&token=TOKEN&project=NAME` | Start new session |
| `maestro.dev/session/:id` | Active chat session |
| `maestro.dev/session/:id/phase/:phase` | Specific phase chat |
| `maestro.dev/pricing` | Pricing page |
| `maestro.dev/login` | GitHub OAuth initiation |

---

## 4. State Management

### 4.1 Server-Side State

**Source of Truth:** Neon PostgreSQL

| State | Storage | Lifecycle |
|-------|---------|-----------|
| User identity | `users` table | Permanent |
| Subscription status | `users` table | Updated via Stripe webhooks |
| Project metadata | `projects` table | Permanent |
| Phase completion | `projects` table | Updated on phase complete |
| Conversation history | `conversations` table | Updated on each message |
| Session authentication | HTTP-only cookie (JWT) | 24-hour expiry |

### 4.2 Client-Side State (Web UI)

**React State (useState/useReducer):**
- Current messages in chat
- Streaming response buffer
- UI state (loading, errors)

**Server State (fetched via API):**
- User authentication status
- Session/project details
- Phase completion status

**No localStorage/sessionStorage** — all persistence via server.

### 4.3 CLI-Side State

**File-based (`.maestro/config.json`):**
- Session token
- Project name

**Runtime (in-memory):**
- Localhost server port
- Active session token for validation

**Derived from filesystem:**
- Project exists: `.maestro/` directory present
- Phase completion: `specs/*.md` files present

### 4.4 State Synchronization

```
CLI starts → Reads .maestro/config.json → Has session token?
    │                                           │
    No                                         Yes
    │                                           │
    ▼                                           ▼
Create new session ◄─────────────────── Validate with server
    │                                           │
    │                                      Valid?
    │                                       │   │
    │                                      No  Yes
    │                                       │   │
    ▼                                       ▼   ▼
Save token to config.json            Re-auth   Resume session
```

---

## 5. Dependencies & Libraries

### 5.1 CLI Package (`/cli`)

```json
{
  "name": "maestro",
  "version": "1.0.0",
  "type": "module",
  "bin": {
    "maestro": "./dist/index.js"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "dependencies": {
    "commander": "^12.1.0",
    "express": "^4.21.0",
    "open": "^10.1.0",
    "chalk": "^5.3.0",
    "ora": "^8.0.1",
    "inquirer": "^9.2.0",
    "get-port": "^7.0.0",
    "node-fetch": "^3.3.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "@types/node": "^20.0.0",
    "@types/express": "^4.17.0",
    "@types/inquirer": "^9.0.0",
    "tsup": "^8.0.0"
  }
}
```

| Package | Version | Purpose |
|---------|---------|---------|
| commander | ^12.1.0 | CLI argument parsing |
| express | ^4.21.0 | Localhost callback server |
| open | ^10.1.0 | Open browser cross-platform |
| chalk | ^5.3.0 | Terminal colored output |
| ora | ^8.0.1 | Terminal spinners |
| inquirer | ^9.2.0 | Interactive prompts |
| get-port | ^7.0.0 | Find available port |
| node-fetch | ^3.3.0 | HTTP requests to API |
| tsup | ^8.0.0 | TypeScript bundling |

### 5.2 Web Package (`/web`)

```json
{
  "name": "maestro-web",
  "version": "1.0.0",
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "ai": "^3.3.0",
    "@ai-sdk/openai": "^0.0.60",
    "@neondatabase/serverless": "^0.9.0",
    "drizzle-orm": "^0.32.0",
    "stripe": "^16.0.0",
    "jose": "^5.6.0",
    "react-markdown": "^9.0.0",
    "remark-gfm": "^4.0.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "@types/node": "^20.0.0",
    "@types/react": "^18.3.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "drizzle-kit": "^0.23.0"
  }
}
```

| Package | Version | Purpose |
|---------|---------|---------|
| next | ^14.2.0 | React framework, API routes |
| ai | ^3.3.0 | Vercel AI SDK for streaming |
| @ai-sdk/openai | ^0.0.60 | OpenAI provider for AI SDK |
| @neondatabase/serverless | ^0.9.0 | Neon PostgreSQL client |
| drizzle-orm | ^0.32.0 | Type-safe SQL ORM |
| stripe | ^16.0.0 | Stripe API client |
| jose | ^5.6.0 | JWT handling |
| react-markdown | ^9.0.0 | Render markdown in chat |
| remark-gfm | ^4.0.0 | GitHub-flavored markdown |
| tailwindcss | ^3.4.0 | Utility-first CSS |

### 5.3 Environment Variables

#### Web Application (`.env.local`)

```bash
# Database
DATABASE_URL="postgresql://..."

# GitHub OAuth
GITHUB_CLIENT_ID="..."
GITHUB_CLIENT_SECRET="..."

# OpenAI
OPENAI_API_KEY="sk-..."

# Stripe
STRIPE_SECRET_KEY="sk_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_MONTHLY="price_..."
STRIPE_PRICE_ANNUAL="price_..."

# App
NEXT_PUBLIC_APP_URL="https://maestro.dev"
JWT_SECRET="random-32-char-string"
```

---

## 6. Edge Cases & Boundary Conditions

### 6.1 CLI Edge Cases

| Scenario | Handling |
|----------|----------|
| Node.js < 18 | Exit with message: "Maestro requires Node 18 or higher. Current: {version}" |
| No internet | Exit with message: "Maestro requires an internet connection." (Test via fetch to API health endpoint) |
| Directory exists (non-Maestro) | Exit with message: "Directory '{name}' exists but isn't a Maestro project." |
| Directory exists (Maestro) | Prompt: "Project exists. Resume? (y/n)" |
| Invalid project name | Validate: alphanumeric, hyphens, underscores only. Max 64 chars. |
| No available ports | Try ports dynamically via get-port; it handles fallback automatically |
| Browser won't open | Display: "Open this URL in your browser: {url}" |
| Localhost POST timeout | CLI waits up to 5 minutes; then displays: "Session timed out. Press Enter to retry." |
| User Ctrl+C during wait | Gracefully shut down localhost server, exit cleanly |
| Token validation fails | Clear local config, prompt for re-authentication |

### 6.2 Web UI Edge Cases

| Scenario | Handling |
|----------|----------|
| GitHub OAuth failure | Display error message, offer retry button |
| OAuth state mismatch | Reject auth, redirect to login with error |
| Session token invalid | Redirect to re-authenticate |
| User not authorized for project | 403 error, display "Project not found" |
| OpenAI API error (5xx) | Auto-retry 3 times with exponential backoff (1s, 2s, 4s) |
| OpenAI rate limit | Display: "High demand—please wait" with retry countdown |
| Localhost callback fails | Display document content with "Copy to clipboard" button |
| User closes browser mid-phase | Session persists; CLI times out and offers retry |
| Message exceeds context limit | Summarize older messages, keep recent ones |
| 100 messages reached in phase | Display: "Message limit reached. Click Done to complete this phase." |

### 6.3 Billing Edge Cases

| Scenario | Handling |
|----------|----------|
| Checkout abandoned | No action; user can retry |
| Payment fails | Stripe handles retry; subscription status → `past_due` |
| Subscription canceled | Allow current period access; block after period ends |
| Webhook delivery fails | Stripe retries; implement idempotency keys |
| Free project + subscription | Free project remains marked used (no reset) |
| User has past_due status | Treat as `none` for access control |

### 6.4 Context Window Management

**OpenAI GPT-4o-mini context limit:** 128K tokens

**Strategy:**
1. System prompt: ~2K tokens (fixed)
2. Previous phase documents: up to 15K tokens
3. Current conversation: remaining space (~110K tokens)

**If previous docs exceed 15K tokens:**
- Include most recent phase document in full
- Truncate earlier phases from the beginning
- Add note: "[Earlier content truncated for context]"

**Message limit per phase:** 100 messages
- Enforced server-side
- Counter displayed in UI after 80 messages

---

## 7. Implementation Sequence

### Phase 1: Project Setup & CLI Foundation (Days 1-2)

**Step 1.1: Repository Setup**
- Create monorepo with `/cli` and `/web` directories
- Initialize package.json in both
- Configure TypeScript in both
- Set up shared types package if needed

**Step 1.2: CLI Basic Structure**
- Implement `maestro init` command skeleton
- Node version check
- Internet connectivity check
- Directory existence checks
- Project name validation

**Step 1.3: File Scaffolding**
- Create all template files as embedded strings
- Implement directory creation logic
- Write all scaffold files on init
- Display file tree after creation

**Step 1.4: Localhost Callback Server**
- Express server setup
- Dynamic port allocation via get-port
- POST `/save` endpoint with token validation
- File writing to specs/ directory
- Graceful shutdown on completion

**Deliverables:**
- [ ] `npx maestro init my-project` creates all scaffold files
- [ ] Localhost server starts and accepts POST requests
- [ ] Token validation works

---

### Phase 2: Web Application Foundation (Days 3-5)

**Step 2.1: Next.js Setup**
- Create Next.js 14 app with App Router
- Configure Tailwind CSS
- Set up basic layout and pages
- Create landing page placeholder

**Step 2.2: Database Setup**
- Create Neon database
- Define Drizzle schema
- Run initial migration
- Test connection from Vercel

**Step 2.3: GitHub OAuth**
- Register GitHub OAuth app
- Implement `/api/auth/github` callback
- JWT token generation and cookie setting
- `/api/auth/me` endpoint
- Logout functionality

**Step 2.4: Session Management**
- `POST /api/sessions` - create new session
- `GET /api/sessions/:id` - retrieve session
- Session token generation
- Link session to user and project

**Deliverables:**
- [ ] User can log in via GitHub
- [ ] Session is created and persisted
- [ ] Auth state available across pages

---

### Phase 3: Chat Interface (Days 6-8)

**Step 3.1: Chat UI Components**
- Message list component
- Message input component
- Streaming message display
- Phase indicator
- "Done" button

**Step 3.2: OpenAI Integration**
- Configure AI SDK with OpenAI provider
- Create `/api/chat` streaming endpoint
- System prompts for each phase
- Context injection (previous phase docs)

**Step 3.3: Phase Flow**
- Phase navigation logic
- Document generation on "Done" click
- POST to localhost callback
- Success/error handling UI
- Phase completion persistence

**Step 3.4: System Prompts**
Create detailed system prompts for each phase:
- Phase 1: Product Spec generation
- Phase 2: Technical Spec generation
- Phase 3: Implementation Plan generation
- Phase 4: AGENTS.md generation

**Deliverables:**
- [ ] Chat streams responses in real-time
- [ ] "Done" generates and sends document to localhost
- [ ] All four phases are navigable

---

### Phase 4: CLI-Web Integration (Days 9-10)

**Step 4.1: Browser Launch**
- Open browser with session URL
- Pass callback port and token in URL
- Handle "browser won't open" fallback

**Step 4.2: Phase Orchestration**
- CLI waits for localhost POST
- Display success message on save
- Prompt for next phase
- Handle timeout and retry

**Step 4.3: Resume Flow**
- Detect existing `.maestro/config.json`
- Validate session with server
- Resume at correct phase
- Handle expired sessions

**Step 4.4: Redo Command**
- Implement `maestro redo <phase>`
- Open browser to specific phase
- Handle existing document (keep/replace)

**Deliverables:**
- [ ] Full flow works: init → chat → save → next phase
- [ ] Resume works after interruption
- [ ] Redo command works

---

### Phase 5: Billing Integration (Days 11-12)

**Step 5.1: Stripe Setup**
- Create Stripe products and prices
- Configure webhook endpoint
- Test in Stripe test mode

**Step 5.2: Paywall Logic**
- Check subscription status before Phase 2+
- Display paywall component
- Redirect to Stripe Checkout

**Step 5.3: Webhook Handling**
- `checkout.session.completed` → activate subscription
- `customer.subscription.updated` → update status
- `customer.subscription.deleted` → mark canceled
- `invoice.payment_failed` → mark past_due

**Step 5.4: Free Tier**
- Track `free_project_used` on first project
- Allow full project completion for free project
- Block subsequent projects without subscription

**Deliverables:**
- [ ] Free project works without payment
- [ ] Paywall appears for second project
- [ ] Subscription activates after payment
- [ ] Webhooks update subscription status

---

### Phase 6: Polish & Error Handling (Days 13-14)

**Step 6.1: Error States**
- All error scenarios have user-friendly messages
- Retry logic for transient failures
- Fallback UI for localhost callback failure

**Step 6.2: Analytics Events**
- Implement event tracking (use simple logging for MVP)
- Track all events from spec (init, auth, phase complete, etc.)

**Step 6.3: Rate Limiting**
- Implement 100 message limit per phase
- Display warning at 80 messages
- Enforce at API level

**Step 6.4: Testing**
- End-to-end test: new user full flow
- End-to-end test: returning user resume
- Edge case testing

**Deliverables:**
- [ ] All error states handled gracefully
- [ ] Rate limiting works
- [ ] Full flow tested end-to-end

---

## Appendix A: Scaffold File Contents

### A.1 Code Verification Skill

File: `.claude/skills/code-verification/SKILL.md`

```markdown
---
name: code-verification
description: Multi-agent code verification workflow using a main agent and sub-agent loop. Use when verifying code against requirements, acceptance criteria, or quality standards. Triggers on requests to verify, validate, or check code against specifications, checklists, or instructions.
---

# Code Verification Skill

Verify code against requirements using a main agent / sub-agent loop with structured feedback and automatic retry.

## Workflow Overview

[Full content from provided SKILL.md - approximately 400 lines]
```

*(Full SKILL.md content to be embedded verbatim from provided file)*

### A.2 AGENTS.md Base Template

File: `AGENTS.md` (initial scaffold, replaced by Phase 4)

```markdown
# AGENTS.md

This file will be generated when you complete Phase 4 of the Maestro workflow.

Run `npx maestro init` to continue where you left off.
```

### A.3 AGENTS.md Template for Phase 4 Generation

The Phase 4 system prompt should generate an AGENTS.md based on the AGENTS_BASE.md template, customized with:
- Project-specific tech stack
- File structure conventions from TECH_SPEC.md
- Testing requirements from IMPLEMENTATION_PLAN.md
- Mocking policies based on dependencies
- Error handling patterns based on architecture

---

## Appendix B: System Prompts

### B.1 Phase 1: Product Spec

```
You are helping a developer create a comprehensive product specification for their project. Your goal is to extract all the information needed to understand WHAT they're building and WHY.

Guide the conversation through these areas:
1. Problem Statement - What problem does this solve? Who has this problem?
2. Target User - Who is the primary user? What's their skill level?
3. Core Value Proposition - What's the single most important benefit?
4. Key Features - What must the MVP include? What's explicitly out of scope?
5. User Flows - What are the 2-3 critical user journeys?
6. Success Metrics - How will you know if this works?

Ask clarifying questions. Challenge vague answers. Be conversational but focused.

When you have enough information, present a summary and offer to generate the PRODUCT_SPEC.md document.
```

### B.2 Phase 2: Technical Spec

```
You are helping a developer create a technical specification based on their product spec. Your goal is to define HOW the product will be built.

You have access to the PRODUCT_SPEC.md from the previous phase.

Guide the conversation through:
1. Architecture - What are the main components? How do they communicate?
2. Tech Stack - What languages, frameworks, databases?
3. Data Model - What are the core entities and relationships?
4. APIs/Interfaces - What endpoints or interfaces are needed?
5. Third-party Services - What external services are required?
6. Security Considerations - Auth, data protection, etc.

Recommend simple, proven technologies. Challenge over-engineering. Bias toward MVP simplicity.

When complete, generate TECH_SPEC.md.
```

### B.3 Phase 3: Implementation Plan

```
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
```

### B.4 Phase 4: AGENTS.md

```
You are helping a developer create an AGENTS.md file that will guide AI coding agents working on their project.

You have access to PRODUCT_SPEC.md, TECH_SPEC.md, and IMPLEMENTATION_PLAN.md.

Generate an AGENTS.md based on the base template, customized with:
1. Project-specific context (tech stack, file structure)
2. Testing policy tailored to their stack
3. Mocking policy based on their dependencies
4. Error handling conventions
5. Any project-specific guardrails

The AGENTS.md should help an AI agent work autonomously while staying aligned with project conventions.

When complete, generate AGENTS.md.
```

---

## Appendix C: Analytics Events

| Event | Trigger | Properties |
|-------|---------|------------|
| `cli_init_started` | CLI init command run | projectName |
| `cli_init_completed` | Scaffold files created | projectName |
| `auth_started` | OAuth redirect initiated | - |
| `auth_completed` | OAuth successful | userId |
| `phase_N_started` | Phase chat opened | projectId, phase |
| `phase_N_completed` | Document saved | projectId, phase, messageCount |
| `phase_N_redo` | Redo command used | projectId, phase |
| `paywall_shown` | Paywall displayed | userId |
| `checkout_started` | Stripe checkout initiated | userId, plan |
| `subscription_created` | Subscription activated | userId, plan |
| `subscription_canceled` | Subscription canceled | userId |
| `session_timeout` | Localhost callback timeout | projectId, phase |
| `localhost_callback_failed` | POST to localhost failed | projectId, phase |
| `error_*` | Any error | errorType, message |

---

*End of Technical Specification*
