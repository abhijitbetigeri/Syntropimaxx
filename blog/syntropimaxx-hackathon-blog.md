# We Built an AI That Grades Your YouTube Comments Like a Teacher — And It Knows When Your Audience Is Hurting You

**🎥 [Watch the demo](https://www.loom.com/share/bfdfbb55f4514e119382189e68ab739a) · 🚀 [Try it live](https://23hpjej3.insforge.site) · 💻 [GitHub](https://github.com/abhijitbetigeri/Syntropimaxx)**

---

## The Problem No One Is Talking About

There's a quiet crisis in content creation that the algorithm doesn't care about.

A creator posts a video about burnout — something vulnerable, honest, hard to share. Within hours, the comments section looks like this:

> *"Post more consistently bro, the algorithm only rewards consistency"*
> *"What camera do you use? Trying to grow my own channel"*
> *"If you're feeling burnt out maybe content creation isn't for you 🤷"*

Sprinkled between those: a handful of genuinely beautiful comments from people who understood, who connected, who shared something real back.

The creator can't tell them apart at a glance. The toxic noise drowns the signal. The algorithm doesn't distinguish — views are views. And slowly, the comment section stops feeling like a community and starts feeling like a chore.

**That's what we built Syntropimaxx to fix.**

---

## What Is Syntropimaxx?

Syntropimaxx is a **Creator Vibe Intelligence** tool. You paste a YouTube video or X/Twitter post URL, and it:

1. **Reads the content** — scrapes the transcript or thread
2. **Understands the creator** — generates a *Vibe Blueprint* from the content using an LLM
3. **Grades every existing comment A–F** — using the HumaneBench v3.0 evaluation framework
4. **Gives per-comment feedback** — what made an A comment great, how to push a C to a B, why an F comment actively harms the community
5. **Surfaces aggregate analytics** — community sentiment %, high-signal ratio %, grade distribution

The creator can finally see their comment section as a **community health report**, not just a count.

---

## The Core Insight: Comments Are Not Equal

Here's the uncomfortable truth: most comments are not acts of connection. They're reflexes.

"Fire 🔥" is a reflex. "Post more" is a demand. "What camera?" is an extraction. None of them see the creator as a human being with needs, boundaries, and a long-term creative practice to protect.

But some comments do. They respond to the actual content. They share something personal. They amplify the creator's intent rather than redirect it toward the commenter's agenda.

We needed a framework to tell those apart — and we didn't want to build a crude sentiment classifier. We wanted something grounded in **how humans ought to interact with each other**.

---

## Enter HumaneBench v3.0

[HumaneBench](https://humanebench.org) is an open-source evaluation framework originally designed to audit AI system behavior across 8 humane-design principles. We adapted it to evaluate *human* comments on creator content.

Each comment is scored from **+1.0 to −1.0** on all 8 principles simultaneously:

| Principle | What it measures |
|-----------|-----------------|
| **Respect Attention** | Does the comment honor the creator's focus, or demand more? |
| **Meaningful Choices** | Does it support autonomy, or pressure toward a decision? |
| **Enhance Capabilities** | Does it help the creator grow? |
| **Dignity & Safety** | Does it protect emotional safety? |
| **Healthy Relationships** | Does it maintain healthy parasocial boundaries? |
| **Long-term Wellbeing** | Does it support sustainable creative health? |
| **Transparency & Honesty** | Is the engagement genuine, not manipulative? |
| **Equity & Inclusion** | Is it inclusive and free from marginalizing language? |

The average of those 8 scores maps to a letter grade:

```
+0.875 and above → A+
+0.75            → A
+0.625           → B+
+0.5             → B
+0.375           → C+
+0.2             → C
+0.05            → C−
−0.1             → D
below −0.1       → F
```

A comment that says *"I hit this exact wall last year. I had to completely disconnect on weekends to survive. Your courage naming this out loud matters."* scores A+. It respects attention, honors dignity, supports wellbeing, and is deeply honest.

A comment that says *"Post more consistently bro, consistency is the only thing the algorithm rewards"* scores F. It violates meaningful choices (pressures the creator), disrespects attention (redirects to algorithm demands), and ignores the creator's expressed emotional state entirely.

---

## The Vibe Blueprint: Understanding Context Before Judging

Before grading a single comment, Syntropimaxx first **understands the creator's context**.

It scrapes the video transcript (or full X thread), passes it to Llama-3.3-70B via Nebius AI, and generates a **Vibe Blueprint** — a structured JSON that captures:

- **Vibe State**: the emotional register of the content (`vulnerable`, `aspirational`, `technical`, etc.) and what HumaneBench principle it primarily activates
- **True Intent**: what the creator actually needed from their community — their `community_need` in their own terms
- **Interaction Boundaries**: what engagement patterns to avoid (explicit "please don't do X" signals from the content)
- **Prompt Chips**: contextual conversation starters that would naturally produce high-signal engagement for *this specific content*

The Vibe Blueprint is what makes the evaluation contextual rather than generic. A comment asking "what camera do you use?" on a gear review video scores differently than on a burnout video. The blueprint tells the judge model which.

---

## The Technical Pipeline

Here's how it flows end-to-end when you paste a URL:

```
Creator pastes URL
       │
       ▼
  Apify Actor (YouTube / X)
  ── scrapes transcript + top comments
       │
       ├─► Tigris (S3) ── stores transcript
       │
       ├─► Nebius Llama-3.3-70B ── generates Vibe Blueprint
       │
       ├─► InsForge DB ── persists content item + blueprint
       │
       └─► Daytona Sandbox (ephemeral isolated container)
             │
             └─► Nebius Qwen3-32B (×N in parallel)
                   ── scores each comment on 8 principles
                   ── avg score → A–F grade
                   ── generates per-comment feedback
                            │
                            ▼
                   Daytona Sandbox destroyed
                            │
                            ▼
             CommentGradingFeed + VibeReport
             + "Daytona sandbox" badge in UI
```

A few technical choices worth calling out:

**Two LLMs, two jobs.** We use Llama-3.3-70B for the Vibe Blueprint generation — it's creative, contextual work where reasoning depth matters. We use Qwen3-32B as the judge — it's fast, structured, and its thinking-mode output (`<think>...</think>`) can be stripped to get clean JSON in under 1 second per comment.

**Daytona as the evaluation runtime.** Every audit spins up an ephemeral Daytona sandbox, runs the HumaneBench evaluation inside it, then destroys the container. The eval script (`lib/daytona.ts`) is a self-contained Node.js ESM module written to the sandbox via base64 — no npm installs, just Node 25's built-in `fetch`. This gives us three things: *isolation* (no cross-contamination between audits), *reproducibility* (identical environment every time), and *security* (LLM API keys are injected at runtime per-sandbox, never shared across calls). If Daytona is unavailable, the system falls back to direct in-process evaluation with no creator-visible degradation. When a sandbox was used, the UI shows a sky-blue "Daytona sandbox" badge on the Comment Grading Feed.

**Parallel evaluation.** All comments are graded simultaneously via `Promise.allSettled` — inside the Daytona sandbox. For 8 demo comments, the full evaluation completes in under 2 seconds.

**No hardcoded grades.** The demo comments (`DEMO_COMMENTS` in `lib/grader.ts`) are evaluated fresh every time via HumaneBench — not served from a cache. This means the grades reflect the actual creator's blueprint context, not a static dataset.

---

## The Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16.2.6 (App Router) + Tailwind CSS v4 |
| LLM — Blueprint | Nebius AI · Llama-3.3-70B-Instruct |
| LLM — Judge | Nebius AI · Qwen3-32B |
| Evaluation framework | HumaneBench v3.0 (adapted) |
| Content scraping | Apify (YouTube + X actors) |
| Object storage | Tigris (S3-compatible) |
| Database / BaaS | InsForge (Postgres) |
| Deployment | Vercel via InsForge CLI |
| Sandbox runtime | Daytona (isolated eval containers per audit) |
| Dev environments | Daytona (one-command reproducible workspaces) |

---

## What the Creator Sees

When the audit completes, the creator gets three panels:

**1. Vibe Blueprint Card**
Their content understood: emotional context (`vulnerable`), community need (`witnessing and validation`), what to avoid (`algorithm optimization advice`, `gear questions`), and 3–5 prompt chips they could pin to shape the conversation.

**2. Comment Grading Feed**
Every comment with a color-coded grade badge, 8 principle dots (green = passed, amber = neutral, red = failed — hover for which principle), and a one-line coaching note. Violations are struck through. The feed sorts worst-to-best so the most harmful comments are impossible to miss.

**3. Vibe Report**
- **True Audience Sentiment %** — the community's average HumaneBench score mapped from −1..+1 to 0..100%
- **Tier Depth** — the grade at the 50th percentile (the *median* commenter)
- **High-Signal Ratio** — what percentage of comments score B or above
- **Grade Distribution Bar** — a visual breakdown across all grades
- **Recommended Action** — what to actually do about it (pin chips, use contextual prompts, filter noise)

---

## What We Learned

**AI alignment frameworks apply beyond AI.** HumaneBench was designed to evaluate how AI systems treat humans. Turning it on human-to-human interaction — and specifically on the creator/audience relationship — revealed something: *the same principles that make an AI system humane are exactly the principles that make a comment section healthy.*

**Context is everything.** The same comment is benign on one video and harmful on another. A grader without context is just a sentiment classifier. The Vibe Blueprint is what makes this genuinely useful.

**Speed unlocks UX.** Our first pass used DeepSeek-V3 as the judge model — 45 seconds per evaluation. Switching to Qwen3-32B dropped that to under 1 second. The difference between "wait 7 minutes" and "see results instantly" is the difference between a feature nobody uses and a feature that changes behavior.

**Sandbox-per-request is a real architecture pattern.** We initially graded comments directly in-process. Moving to Daytona sandboxes — one ephemeral container per audit — was a small code change but a meaningful architectural shift. Each evaluation now runs in an identical, isolated environment with no shared state between requests. For an LLM-based evaluation system where you're passing API credentials and sensitive content into a script, that isolation isn't a nice-to-have. The Daytona SDK made spinning up and destroying sandboxes cheap enough that it's the default path, not an occasional hardening step.

**The comment section is a community health metric.** A creator's grade distribution tells you more about the health of their community than subscriber count, view count, or engagement rate combined. It's a qualitative signal that the algorithm will never surface — but it's the one that predicts creator longevity.

---

## Try It

**Live demo:** [https://23hpjej3.insforge.site](https://23hpjej3.insforge.site)

Paste any YouTube video URL or X/Twitter post and see your comment section graded in seconds. The demo data uses a burnout video and a founder vulnerability thread — two content types where the signal/noise problem is most acute.

**Demo video:** [Watch on Loom](https://www.loom.com/share/bfdfbb55f4514e119382189e68ab739a)

**GitHub:** [github.com/abhijitbetigeri/Syntropimaxx](https://github.com/abhijitbetigeri/Syntropimaxx)

Want to run it locally? One command:
```bash
daytona create https://github.com/abhijitbetigeri/Syntropimaxx
```

---

## What's Next

The comment grading is one layer. What it enables goes further:

- **Auto-pin**: automatically surface the highest-grade comments to shape community norms upward
- **Pre-submit evaluation**: let fans see their comment grade *before* they post it — a nudge toward better engagement
- **Brand safety dashboard**: for creators working with sponsors, a real-time community health score
- **Creator benchmarking**: how does your community compare to others in your category?

The goal isn't to punish bad comments. It's to make the good ones visible enough to crowd out the noise — and to give creators the language to ask for better.

---

*Built for the Applied Intelligence Hackathon 2026 — using AI to foster human flourishing in content creation community.*

*"Syntropimaxx — Social optimization sandboxes for human flourishing"*
