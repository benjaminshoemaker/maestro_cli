# Maestro Product Specification

**Version:** 1.0 (MVP)
**Date:** December 2024
**Author:** Ben / Claude

---

## Executive Summary

Maestro is a CLI + hosted chat UI that orchestrates project bootstrapping for AI-assisted development. It combines opinionated project scaffolding (config files, folder structure) with guided spec generation (product spec, technical spec, implementation plan, agent configurations) via an interactive chat interface powered by Claude.

The core insight: developers using AI coding tools (Claude Code, Cursor, Codex) get stuck because they under-specify their projects. Maestro solves this by walking users through a structured 4-phase conversation that produces the documentation AI tools need to be effective.

---

## Problem Statement

### The Gap in AI-Assisted Development

AI coding tools get developers 80% of the way through projects, then fail. The root cause: insufficient upfront specification. Developers jump into code generation without clearly defining what they're building, how it should work technically, or how to break implementation into AI-friendly chunks.

### Current Pain Points

1. **Repeated setup friction:** Developers who've optimized their AI coding workflow (custom prompts, config files, agent definitions) must manually recreate this setup for each new project.

2. **Specification quality:** Most developers skip proper specification, leading to AI tools that hallucinate features, make inconsistent technical choices, or require constant correction.

3. **Tool fragmentation:** The spec-writing process and the local development environment are disconnected—developers write specs in one place, then manually copy them into their project.

### Why Existing Solutions Fall Short

- **VibeScaffold (predecessor):** Web-only, generates docs but doesn't integrate with local environment. Users must manually download and organize outputs.
- **AI chat tools directly:** No guided structure, no project scaffolding, no persistence of best-practice configs.
- **Boilerplate generators:** Create code structure but not the specification documents AI tools need.

---

## Solution Overview

Maestro bridges local development setup and hosted AI conversation:

```
$ npx maestro init my-project

✓ Created ./my-project
  ├── .claude/settings.json
  ├── .codex/config.toml
  ├── skills/
  ├── CLAUDE.md
  ├── AGENTS.md
  └── specs/

Phase 1 of 4: Product Spec
Press Enter to open...

[browser opens to maestro.dev/session/abc123]
[user completes guided chat, clicks Done]
[PRODUCT_SPEC.md saves to ./my-project/specs/]

✓ PRODUCT_SPEC.md saved

Phase 2 of 4: Technical Spec
Press Enter to continue...
```

### Key Value Propositions

1. **Instant best-practice setup:** Ship with opinionated, battle-tested configs for Claude Code, Codex, and other AI tools.
2. **Guided specification:** Structured 4-phase conversation ensures comprehensive project definition.
3. **Seamless local integration:** Generated docs land directly in project folder via localhost callback—no download/copy friction.
4. **Platform control:** Hosted chat UI (not native Claude/ChatGPT) enables custom UX, prompt engineering, and future features.

---

## Target User

### Primary Persona

**Solo developers and small team leads (1-5 person teams)** who:

- Already use AI coding tools (Claude Code, Cursor, GitHub Copilot, Codex)
- Have experienced the "80% problem"—AI gets them most of the way, then stalls
- Are comfortable with CLI tools and terminal workflows
- Start new projects regularly (side projects, MVPs, prototypes)
- Value speed and reducing setup friction

### User Skill Level

- Intermediate to advanced developers
- Familiar with modern dev tooling (npm/npx, git, VS Code or similar)
- Have used AI assistants for coding but may not have optimized their workflow
- Technical enough to modify generated config files if needed

### Out of Scope for MVP

- Enterprise teams (no SSO, seat management, or team billing)
- Non-technical users (CLI-first approach assumes terminal comfort)
- Users who primarily work on existing codebases (MVP is greenfield only)

---

## Platform & Architecture

### Components

| Component | Technology | Purpose |
|-----------|------------|---------|
| **CLI** (`maestro`) | Node.js (npx distribution) | Scaffolds project, manages phases, runs localhost callback server |
| **Web Chat UI** | Vercel AI SDK, React | Hosts guided conversation, streams Claude responses |
| **Backend API** | Node.js (Vercel/similar) | Auth, session state, Claude API calls, Stripe integration |
| **Localhost Callback** | Express (temp server in CLI) | Receives completed docs from web UI, writes to local filesystem |

### Platform Requirements

- **CLI:** Node 18+ (current LTS)
- **Web UI:** Modern browsers (Chrome, Firefox, Safari, Edge—latest 2 versions)
- **Auth:** GitHub OAuth
- **Payment:** Stripe (subscriptions)

### High-Level Data Flow

```
┌─────────────┐     npx maestro init     ┌─────────────┐
│   Terminal  │ ──────────────────────▶  │  CLI Tool   │
└─────────────┘                          └──────┬──────┘
                                                │
                    1. Scaffold files           │
                    2. Start localhost:PORT     │
                    3. Open browser             ▼
                                         ┌─────────────┐
                                         │ Web Chat UI │
                                         │ (maestro.dev)│
                                         └──────┬──────┘
                                                │
                    4. User chats               │ 5. Auth via GitHub
                    6. Claude API calls         │ 7. Stream responses
                                                ▼
                                         ┌─────────────┐
                                         │ Backend API │
                                         └──────┬──────┘
                                                │
                    8. User clicks "Done"       │
                    9. POST doc to localhost    ▼
                                         ┌─────────────┐
                                         │  CLI saves  │
                                         │  to ./specs │
                                         └─────────────┘
```

---

## Core User Experience

### End-to-End Flow

#### Step 1: Installation & Init

User runs in terminal:
```bash
$ npx maestro init my-project
```

CLI behavior:
1. Check Node version (18+ required, fail with clear message if not)
2. Check internet connectivity (fail fast if offline)
3. Check if `./my-project` exists:
   - If exists with Maestro files: prompt "Project already exists. Resume? (y/n)"
   - If exists without Maestro files: fail with "Directory exists but isn't a Maestro project"
   - If doesn't exist: create directory
4. Scaffold default files (see File Structure below)
5. Display success message with file tree
6. Prompt: "Phase 1 of 4: Product Spec — Press Enter to open..."

#### Step 2: Authentication

On first Enter press:
1. CLI starts localhost callback server on available port
2. CLI opens browser to `maestro.dev/session/new?callback=localhost:PORT&project=my-project`
3. Web UI immediately prompts GitHub OAuth (required before any chat)
4. On successful auth:
   - If first project ever: proceed to chat (free project)
   - If free project used & no subscription: show paywall, prompt for payment
   - If subscribed: proceed to chat

#### Step 3: Phase 1 — Product Spec Chat

Web UI experience:
1. Display phase context: "Let's define what you're building"
2. Begin guided conversation (prompts baked into system)
3. User chats naturally; AI asks clarifying questions
4. When spec is complete, AI presents summary and "Done" button
5. User clicks Done
6. Web UI POSTs `PRODUCT_SPEC.md` content to `localhost:PORT/save`
7. Web UI shows confirmation: "Saved! Return to terminal."

CLI behavior:
1. Receives POST, writes to `./my-project/specs/PRODUCT_SPEC.md`
2. Displays: "✓ PRODUCT_SPEC.md saved"
3. Prompts: "Phase 2 of 4: Technical Spec — Press Enter to continue..."

#### Step 4: Phases 2-4

Repeat Step 3 pattern for:
- Phase 2: TECH_SPEC.md
- Phase 3: IMPLEMENTATION_PLAN.md
- Phase 4: AGENTS.md (also updates `./my-project/AGENTS.md` root file)

Each phase's conversation is informed by previous phase outputs (context passed to Claude).

#### Step 5: Completion

After Phase 4:
```
✓ All specs complete!

Your project is ready:
  ./my-project/
  ├── specs/
  │   ├── PRODUCT_SPEC.md
  │   ├── TECH_SPEC.md
  │   ├── IMPLEMENTATION_PLAN.md
  │   └── AGENTS.md
  ├── .claude/settings.json
  ├── .codex/config.yaml
  ├── skills/
  ├── CLAUDE.md
  └── AGENTS.md

Next: Open this project in Claude Code or Cursor to start building.
```

CLI exits. Localhost server stops.

### Redo Flow

At any phase prompt, user can type `redo` (or `redo 2` for specific phase):
1. CLI opens browser to that phase's chat
2. If document already exists for that phase, web UI prompts: "You have an existing [DOC_NAME]. Keep existing or start fresh?"
   - Keep existing: doc content is shown as context, user can iterate
   - Start fresh: begin phase conversation from scratch
3. When done, subsequent phases are still available but user must re-complete them (since inputs changed)

### Interrupted Session Flow

If user closes terminal mid-flow or connection drops:
1. Server-side session state tracks: project name, completed phases, user ID
2. Next `maestro init my-project` in same folder:
   - Detects existing Maestro files
   - Prompts: "Project already exists. Resume? (y/n)"
   - If yes: opens browser to next incomplete phase
   - If no: exits without changes

---

## MVP Feature Set

### Must-Have (P0)

| Feature | Description |
|---------|-------------|
| `maestro init <name>` | Create project folder with default scaffolding |
| Default file scaffolding | Ship with opinionated .claude, .codex, skills, CLAUDE.md configs |
| GitHub OAuth | Required authentication before chat access |
| 4-phase guided chat | PRODUCT_SPEC → TECH_SPEC → IMPLEMENTATION_PLAN → AGENTS |
| Localhost callback | Web UI POSTs completed docs to CLI for local save |
| Session state persistence | Track completed phases per project per user |
| Free tier | One complete project free per account |
| Stripe subscription | $19/mo or $149/yr for unlimited projects |
| Project resume | Detect existing project, offer to resume incomplete session |
| Phase redo | Allow user to redo any completed phase |

### Nice-to-Have (P1) — Not in MVP

| Feature | Rationale for Deferral |
|---------|------------------------|
| Custom config templates | Validate demand for default configs first |
| Existing codebase analysis | Complex; MVP focuses on greenfield |
| Team/org accounts | B2B complexity; validate B2C first |
| Cross-device resume | Requires file sync; users will finish in one sitting |
| Config auto-updates | Static copies simpler; users can re-run init |
| Phase skipping | Linear flow ensures quality; skipping breaks context chain |
| Multiple AI providers | Claude-only for MVP; add OpenAI/others if requested |

---

## Data Model & Persistence

### Server-Side Data

#### Users Table

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | Primary key |
| github_id | string | GitHub OAuth identifier |
| github_username | string | Display name |
| email | string | From GitHub profile |
| stripe_customer_id | string | Nullable until first payment |
| subscription_status | enum | `none`, `active`, `canceled`, `past_due` |
| subscription_plan | enum | `monthly`, `annual`, null |
| free_project_used | boolean | Tracks one-time free project |
| created_at | timestamp | |
| updated_at | timestamp | |

#### Projects Table

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | Primary key |
| user_id | uuid | Foreign key to users |
| name | string | Project folder name |
| session_token | string | Unique token for localhost callback auth |
| current_phase | integer | 1-4, or 5 if complete |
| phase_1_complete | boolean | |
| phase_2_complete | boolean | |
| phase_3_complete | boolean | |
| phase_4_complete | boolean | |
| created_at | timestamp | |
| updated_at | timestamp | |

#### Conversation History Table (Optional for MVP)

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | Primary key |
| project_id | uuid | Foreign key to projects |
| phase | integer | 1-4 |
| messages | jsonb | Array of {role, content} |
| generated_doc | text | Final markdown output |
| created_at | timestamp | |

> **Note:** Conversation history storage is optional for MVP. Minimum viable: just track phase completion. Full history enables redo with context and future analytics.

### Client-Side Data (CLI)

No persistent storage. CLI reads project state from:
1. Existence of `./project/.maestro/` folder (indicates Maestro project)
2. Existence of `./project/specs/*.md` files (indicates completed phases)
3. Server-side session state (fetched on resume)

### Local File Structure

```
my-project/
├── .maestro/
│   └── config.json          # Project metadata (session token, etc.)
├── .claude/
│   └── settings.json        # Claude Code configuration
├── .codex/
│   └── config.yaml          # Codex CLI configuration
├── skills/
│   └── [skill files]        # Skill definitions for AI tools
├── specs/
│   ├── PRODUCT_SPEC.md      # Generated Phase 1
│   ├── TECH_SPEC.md         # Generated Phase 2
│   ├── IMPLEMENTATION_PLAN.md # Generated Phase 3
│   └── AGENTS.md            # Generated Phase 4
├── CLAUDE.md                # Root-level Claude instructions
└── AGENTS.md                # Root-level agent config (copy of specs/ version)
```

---

## Authentication & Access Control

### Auth Flow

1. User runs `maestro init my-project`
2. CLI opens browser to `maestro.dev/session/new?callback=localhost:PORT&project=my-project`
3. Web UI redirects to GitHub OAuth
4. User authorizes Maestro app
5. GitHub redirects back with auth code
6. Backend exchanges code for access token, creates/updates user record
7. Backend creates project record, generates session token
8. Web UI stores session in cookie, proceeds to chat

### Access Control Rules

| Action | Rule |
|--------|------|
| View landing page | Public |
| Start Phase 1 chat | Authenticated |
| Complete Phase 1 | Authenticated |
| Start Phase 2+ | Authenticated + (free project unused OR active subscription) |
| Redo any phase | Same as starting that phase |
| Access project | User must own project (user_id match) |

### Session Security

- Session token is UUID, generated per project
- Localhost callback includes session token in URL for verification
- CLI validates token matches before accepting POST
- Session expires after 24 hours of inactivity (configurable)

---

## Pricing & Billing

### Pricing Structure

| Tier | Price | Includes |
|------|-------|----------|
| Free | $0 | One complete project (all 4 phases) |
| Monthly | $19/mo | Unlimited projects |
| Annual | $149/yr | Unlimited projects (~35% savings) |

### Billing Implementation

- **Provider:** Stripe
- **Model:** Subscription (not usage-based)
- **Trial:** None separate—free project serves as trial
- **Upgrade flow:** Paywall appears when starting Phase 2+ after free project used
- **Payment UI:** Stripe Checkout (hosted), not embedded
- **Webhook handling:** subscription.created, subscription.updated, subscription.deleted, invoice.payment_failed

### Paywall UX

When user hits paywall:
1. Web UI displays: "You've used your free project. Subscribe to continue."
2. Shows pricing options (monthly/annual)
3. "Subscribe" button redirects to Stripe Checkout
4. On success, Stripe redirects back to web UI
5. Web UI refreshes subscription status, proceeds to chat

---

## Error Handling

### CLI Errors

| Scenario | Behavior |
|----------|----------|
| Node version < 18 | Exit with: "Maestro requires Node 18 or higher. Current: [version]" |
| No internet | Exit with: "Maestro requires an internet connection. Check your network and try again." |
| Directory exists (non-Maestro) | Exit with: "Directory 'my-project' already exists but isn't a Maestro project." |
| Port unavailable | Try next port (3847, 3848, etc.); fail after 10 attempts |
| Browser won't open | Display URL manually: "Open this URL in your browser: [url]" |
| Callback timeout (5 min) | Display: "Session timed out. Press Enter to retry or Ctrl+C to exit." |

### Web UI Errors

| Scenario | Behavior |
|----------|----------|
| GitHub OAuth fails | Display error, offer retry button |
| Claude API error | Display: "Something went wrong. Retrying..." (auto-retry 3x) |
| Claude API rate limit | Display: "High demand—please wait a moment" with countdown |
| Localhost callback fails | Display: "Couldn't save to your machine. Copy this content manually: [doc]" with copy button |
| Session expired | Redirect to re-auth flow |

### Backend Errors

| Scenario | Behavior |
|----------|----------|
| Stripe webhook failure | Log, retry via Stripe's built-in retry; alert if repeated failures |
| Database unavailable | Return 503, web UI shows "Service temporarily unavailable" |
| Claude API key invalid | Alert team immediately; show maintenance message to users |

---

## Analytics & Success Metrics

### Key Metrics to Track

| Metric | Definition | Target (MVP) |
|--------|------------|--------------|
| Activation rate | % of inits that complete Phase 1 | > 60% |
| Completion rate | % of Phase 1 users that complete Phase 4 | > 40% |
| Free-to-paid conversion | % of free users that subscribe | > 10% |
| Time to complete | Average time from init to Phase 4 done | < 30 min |
| Churn rate | Monthly subscription cancellation rate | < 10% |

### Events to Log

- `cli_init_started`
- `cli_init_completed`
- `auth_started`
- `auth_completed`
- `phase_N_started`
- `phase_N_completed`
- `phase_N_redo`
- `paywall_shown`
- `checkout_started`
- `subscription_created`
- `subscription_canceled`
- `session_timeout`
- `error_*` (by type)

---

## Out of Scope / Deferred

| Item | Reason |
|------|--------|
| Existing codebase support | Complex analysis required; MVP is greenfield only |
| Custom config templates | Validate default configs first |
| Team/org billing | B2B complexity; start B2C |
| Cross-device project sync | File system sync is hard; users finish in one sitting |
| Multiple AI providers | Claude-only simplifies MVP; add if users request |
| Config auto-updates | Users can re-run init or manually update |
| Offline mode | Core value requires AI; no meaningful offline experience |
| IDE plugins | CLI-first; IDE integration is future enhancement |
| Self-hosted option | Hosted-only for MVP; simplifies ops |

---

## Open Questions for Technical Spec

1. **Localhost port selection:** Start at 3847 and increment, or use OS-assigned port?
2. **Session token storage:** Store in `.maestro/config.json` or query server each time?
3. **Conversation context:** How much of previous phases to include in Claude context for subsequent phases?
4. **Default configs:** Need to finalize exact contents of `.claude/settings.json`, `.codex/config.yaml`, `skills/`, `CLAUDE.md`
5. **Rate limiting:** Per-user limits on Claude API calls to prevent abuse?
6. **Doc format:** Pure markdown or frontmatter with metadata (date, version, project name)?

---

## Appendix: CLI Command Reference

### Primary Commands

```bash
# Create new project
$ npx maestro init <project-name>

# Resume existing project
$ npx maestro init <existing-project-name>
# → Prompts: "Project already exists. Resume? (y/n)"

# Redo specific phase
$ npx maestro redo <phase-number>
# → Opens browser to that phase's chat
```

### Future Commands (Not MVP)

```bash
# Update configs to latest
$ npx maestro update

# Show project status
$ npx maestro status

# Export specs to different format
$ npx maestro export --format=pdf
```

---

*This document is ready for handoff to technical specification.*
