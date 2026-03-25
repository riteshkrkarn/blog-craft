# BlogCraft AI — Paragraph-Outline First Blog Writer with Quality Gates

## What it solves (real problem)
Students and early-career creators struggle to write blogs that are **clear**, **well-structured**, and **matched to the audience**. This system reduces cognitive load by turning writing into a guided, iterative process:

**choose a strategy → approve paragraph-by-paragraph plan → generate → score → targeted fixes without breaking the rest**.

---

## Inputs (low-friction)
- **Topic**
- **Audience** (e.g., “students starting coding”)
- **Word count**
- Optional: **User insights** (real problems you’ve seen + your solutions)
- Optional toggle: **Enable research** (web search + source synthesis)

---

## Core Workflow (final)

### 1) Strategy Selection (3 variations)
After user inputs, the system proposes **3 high-level blog strategies**, each with a 2–3 line description, for example:
- Beginner-friendly roadmap
- Mistakes-first (pitfalls + fixes)
- Project-driven tutorial

User selects **one strategy** (or regenerates strategies). This choice locks tone + structure constraints.

**Demonstrates**: deliberate system design + human-in-the-loop control (not one-shot generation).

---

### 2) Paragraph Outline (“What each paragraph will say”)
The system generates a **paragraph-by-paragraph outline** (8–14 paragraphs depending on word count).  
Each paragraph includes:
- **Goal** (what it must accomplish)
- **Key points** (bullets)
- **Transition intent** (how it links from previous to next)
- Optional: which **user insight** it should incorporate

User can:
- approve as-is
- regenerate the entire paragraph outline
- regenerate only specific paragraphs (e.g., “para 4 is boring”)

This locks the narrative flow before writing.

**Demonstrates**: planning-first generation + controllable iteration.

---

### 3) Writing (paragraph-wise with consistency constraints)
The blog is written paragraph-by-paragraph using the locked paragraph outline.

Each paragraph generation gets:
- the **current paragraph plan**
- a short summary of the **previous paragraph**
- the plan/summary of the **next paragraph**
- global style constraints (audience, tone, length budget)
- optional research cache + user insights

So every paragraph is produced with awareness of its neighbors.

**Demonstrates**: stateful long-form generation and consistency without relying on one huge prompt.

---

### 4) Scoring (3 criteria)
After draft completion, the system scores:
1. **Clarity** — understandable for the audience; low jargon; concrete examples
2. **Logical progression** — paragraphs build naturally; smooth transitions
3. **Audience fit** — vocabulary, assumptions, examples match the audience

Scores return with:
- **actionable feedback**
- **localized blame** (which paragraphs caused low scores)

**Demonstrates**: measurable evaluation (good for observability) + quality gating.

---

### 5) Targeted Rewrite Loop (improve weak parts only)
If any score is below threshold, the system produces a **Rewrite Plan** listing:
- which paragraphs to revise
- what to keep (strengths)
- what to change (weakness)
- constraints to maintain consistency

#### Consistency-preserving rewrite inputs (explicit)
Each rewrite receives:
- original paragraph
- predecessor paragraph (or summary)
- successor paragraph (or plan/summary)
- **keep list** (what must not change: examples, tone, key idea)
- **fix list** (what must improve: clarity/progression/audience mismatch)

This ensures:
- transitions don’t break
- voice doesn’t drift
- only weak parts are edited (no unnecessary rewrites)

Loop stops when thresholds are met or max iterations reached.

**Demonstrates**: robust iterative workflow + constrained editing (strong AI system design signal).

---

## Optional Research Mode (toggle)
If enabled:
- web search + scrape → synthesize into a compact **research cache**
- writing is grounded in this cache (plus user insights)

If disabled:
- no browsing; relies on model knowledge + user insights

**Demonstrates**: conditional tool use and controllable complexity.

---

## Demo Deliverables (what you show)
- Strategy selection → paragraph outline approval/regeneration → blog generation
- Quality report (scores + feedback)
- One targeted rewrite iteration improving low score **without changing strong paragraphs**
- Final export (Markdown)