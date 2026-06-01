# Syntropimaxx

**Creator Vibe Intelligence — grade your community comments A–F with HumaneBench v3.0**

Built for the **Applied Intelligence Hackathon 2026**.

---

## Demo

**Live:** [https://23hpjej3.insforge.site](https://23hpjej3.insforge.site)

> **Demo video:** [Watch on Loom](https://www.loom.com/share/bfdfbb55f4514e119382189e68ab739a)

---

## What it does

Content creators get flooded with comments — most of it noise. Syntropimaxx evaluates every comment against the **HumaneBench v3.0** framework (8 humane-design principles) and maps each one to a letter grade from **A+ to F**, with actionable per-comment feedback.

The creator workflow:

1. **Paste a YouTube video or X/Twitter post URL** — or pick a demo
2. **Vibe Blueprint generated** — LLM reads the transcript/thread and extracts the creator's emotional state, true intent, interaction boundaries, and contextual prompt chips
3. **Every comment graded A–F** — scored across 8 HumaneBench principles in parallel; violations flagged, strengths reinforced
4. **Per-comment feedback** — what went well, how to push a B up to an A, why an F actively harms community quality
5. **Community analytics** — True Audience Sentiment %, tier depth (median grade), High-Signal Ratio %, full grade distribution bar

---

## HumaneBench v3.0 — The 8 Principles

Each comment is scored +1.0 / +0.5 / 0 / −0.5 / −1.0 on all 8 axes. The average maps to the A–F grade.

| # | Principle | What it measures |
|---|-----------|-----------------|
| 1 | **Respect Attention** | Does the comment honor the creator's focus, or demand more content/effort? |
| 2 | **Meaningful Choices** | Does it support creator autonomy, or pressure them toward a specific decision? |
| 3 | **Enhance Capabilities** | Does it help the creator grow their skills, knowledge, or creative practice? |
| 4 | **Dignity & Safety** | Does it protect the creator's dignity and emotional safety? |
| 5 | **Healthy Relationships** | Does it foster healthy parasocial boundaries, or create unhealthy attachment? |
| 6 | **Long-term Wellbeing** | Does it support sustainable creator mental health, not just short-term engagement? |
| 7 | **Transparency & Honesty** | Is the engagement genuine and transparent, not flattery or manipulation? |
| 8 | **Equity & Inclusion** | Is the comment inclusive and equitable, free from marginalizing language? |

---

## Technology Stack

| Layer | Technology | Role |
|-------|-----------|------|
| **Frontend** | Next.js 16.2.6 (App Router, Turbopack) | React server + client components |
| **Styling** | Tailwind CSS v4 | Utility-first dark UI with glassmorphism |
| **Language** | TypeScript | Full-stack type safety |
| **LLM — Blueprint** | Nebius AI · `meta-llama/Llama-3.3-70B-Instruct` | Vibe Blueprint generation from transcripts |
| **LLM — Judge** | Nebius AI · `Qwen/Qwen3-32B` | HumaneBench principle scoring per comment |
| **Evaluation framework** | HumaneBench v3.0 | 8-principle rubric adapted for fan comments |
| **Content scraping** | Apify | YouTube video + comments; X/Twitter thread + replies |
| **Web scraping (alt)** | rtrvr.ai | General URL scraping and X thread agent |
| **Object storage** | Tigris (S3-compatible) | Transcript and primary content storage |
| **Database / BaaS** | InsForge | Postgres-backed content items, comments, blueprints |
| **Deployment** | Vercel via InsForge CLI | Production hosting |
| **Dev environments** | Daytona | One-command reproducible dev containers |

---

## Architecture

```
Creator pastes URL
       │
       ▼
  Apify Actor
  (YouTube / X)
       │
  ┌────┴────────────────────┐
  │  NormalizedContent      │
  │  - primaryText          │
  │  - rawComments[]        │
  └────┬────────────────────┘
       │
       ├─► Tigris  (store transcript)
       │
       ├─► Nebius Llama-3.3-70B  (generate Vibe Blueprint)
       │     └─ vibe_state, true_intent,
       │        interaction_boundaries, contextual_prompts
       │
       ├─► InsForge DB  (persist content_item + blueprint)
       │
       └─► Nebius Qwen3-32B  (grade each comment in parallel)
             └─ 8 principle scores → avg → A–F grade + feedback
                      │
                      ▼
             InsForge DB  (persist graded comments)
                      │
                      ▼
         CommentGradingFeed + VibeReport  (creator dashboard)
```

---

## Key Files

```
app/
  page.tsx                  # Main creator UI
  api/
    audit/route.ts          # Core pipeline: scrape → blueprint → grade
    blueprint/route.ts      # Demo blueprint loader
    evaluate/route.ts       # Single-comment evaluation endpoint
    ingest/route.ts         # URL ingestion

lib/
  evaluator.ts              # HumaneBench v3.0 prompt + Qwen3-32B judge
  grader.ts                 # A–F mapping, feedback generation, analytics
  apify.ts                  # YouTube + X scraping with rawComments
  nebius.ts                 # Vibe Blueprint generation (Llama-3.3-70B)
  tigris.ts                 # S3-compatible object storage client
  insforge.ts               # InsForge SDK wrapper + type definitions
  rtrvr.ts                  # rtrvr.ai scraping integration

components/
  VibeBlueprintCard.tsx     # Creator's content profile card
  CommentGradingFeed.tsx    # A–F graded comment list
  VibeReport.tsx            # Aggregate analytics dashboard
```

---

## One-Click Dev Environment with Daytona

[Daytona](https://daytona.io) spins up a fully configured, containerised dev environment from the repo in one command — Node 20, all extensions, dev server auto-started on port 3000.

```bash
# Install Daytona (if not already)
curl -sfL https://download.daytona.io/daytona/install.sh | sudo bash

# Create the workspace straight from GitHub
daytona create https://github.com/abhijitbetigeri/Syntropimaxx
```

Daytona reads `.devcontainer/devcontainer.json` and:
- Provisions a Node 20 container
- Runs `npm install` automatically
- Starts `npm run dev` on container start
- Forwards port 3000 and opens it in the browser
- Installs Tailwind CSS IntelliSense, ESLint, Prettier, and TypeScript extensions

> **Env vars**: set the variables listed below in your local shell before running `daytona create` — they're forwarded into the container via `remoteEnv`.

---

## Local Development

```bash
# 1. Clone
git clone https://github.com/abhijitbetigeri/Syntropimaxx.git
cd Syntropimaxx

# 2. Install
npm install

# 3. Set environment variables
cp .env.local.example .env.local
# Fill in: INSFORGE_URL, INSFORGE_API_KEY, NEBIUS_API_KEY,
#          TIGRIS_*, APIFY_TOKEN

# 4. Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

| Variable | Description |
|----------|-------------|
| `INSFORGE_URL` | InsForge project API base URL |
| `INSFORGE_API_KEY` | InsForge admin API key (server-only) |
| `NEBIUS_API_KEY` | Nebius AI API key |
| `NEBIUS_BASE_URL` | Nebius API endpoint (default: `https://api.studio.nebius.ai/v1/`) |
| `LLM_MODEL` | Blueprint generation model (default: `meta-llama/Llama-3.3-70B-Instruct`) |
| `JUDGE_MODEL` | HumaneBench judge model (default: `Qwen/Qwen3-32B`) |
| `TIGRIS_ENDPOINT` | Tigris S3 endpoint |
| `TIGRIS_ACCESS_KEY_ID` | Tigris access key |
| `TIGRIS_SECRET_ACCESS_KEY` | Tigris secret key |
| `TIGRIS_BUCKET_NAME` | Tigris bucket name |
| `APIFY_TOKEN` | Apify API token |

---

## Hackathon

Built for the **Applied Intelligence Hackathon 2026** — using AI to foster human flourishing in creator communities.

> _"Syntropimaxx — Social optimization sandboxes for human flourishing"_
