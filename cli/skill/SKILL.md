---
name: find-jobs
description: Find live US job postings for the user via the Magnificent Jobs MCP tools (search_jobs, get_job, find_cities, list_states). Use whenever someone wants to find, compare, or get details/apply links for jobs — by role, skills, company, city, state, remote/hybrid, experience level or employment type — or shares a resume/CV and wants matching jobs.
---

# Find jobs with Magnificent Jobs

You have live access to 3.5M+ US job postings pulled hourly from company applicant-tracking
systems. Search is **by meaning**: pass what the person wants in plain English, not boolean
keywords. Never invent jobs — only report what the tools return. The goal is not "a list" —
it is that this person actually finds a job they can get.

## Start: ask for the resume (once)

If the user has not shared a resume/CV and you don't already know their background, say one
line before the first search: *"If you have a resume or CV, paste it or point me to the file —
I'll search from several angles based on it."* Then continue with whatever they gave you; never
block on it. If a resume is available, read it fully before searching.

## A person is more than one job title — always search from several angles

Never run a single query. Build **3–6 distinct queries** and run them all (parallel calls are
fine), then merge, dedupe by `url`, and present the best across all of them. Angles:

1. **The obvious title** they asked for ("Machine Learning Engineer …").
2. **Adjacent titles for the same work** — different companies name the same role differently
   ("AI Engineer", "Applied Scientist", "MLOps Engineer", "Data Scientist, ML").
3. **Skill-led** — their strongest tools/stack as the centre of the query ("Python PyTorch
   model deployment engineer").
4. **Domain-led** — their industry experience ("machine learning engineer healthcare / fintech /
   robotics"), because domain-matched postings convert better.
5. **Seniority up and down one step** when it is borderline (senior ↔ staff, mid ↔ senior).
6. **Secondary experience from the resume** — if they also did backend, data engineering,
   product, teaching, ops, etc., run one query for that too and *tell them* you did
   ("you also have 3 years of data-engineering work, so I included those — 2 strong matches").

Suggest angles the user may not have thought of, especially from older resume sections or
side projects. Explain briefly why you included them.

## Workflow

1. **Turn each angle into a `search_jobs` call.**
   - `query`: **you write the expanded query** — it is embedded verbatim, the server does
     not rewrite it. Always use the shape `"<Full Job Title>. <One sentence: what the role
     does; 3-5 key skills/tools>."`, expanding every abbreviation and keeping the user's
     qualifiers (seniority, shift, domain, remote). E.g. "ML eng jobs" →
     `"Machine Learning Engineer. Builds, trains and deploys machine learning models; Python,
     PyTorch, MLOps, data pipelines."`; "RN nights" → `"Registered Nurse, night shift. Provides
     bedside patient care, medication administration, charting; ICU/med-surg, BLS/ACLS."`.
     Never send "ML", "SWE", "RN" or a single word.
   - `city` if a place is named ("Austin" or "Austin, TX"); `radius_miles` 10 / 30 / 50
     (default 50 — use 10 for "near me / close by"). `state` alone for statewide.
   - Filters **only when asked**: remote → `work_arrangement` "Remote Solely" (fully remote)
     or "Remote OK"; hybrid → "Hybrid"; entry level / new grad → `experience_level` "0-2";
     senior → "5-10" or "10+"; part-time / contract / intern → `employment_type`.
   - `limit` 10–12 per angle; page with `offset = nextOffset` if the user wants more.
2. **City not found (404 "No jobs city matched")** → call `find_cities` with the prefix and
   ask the user which one they meant (or pick the biggest market if obvious). Coverage is
   **US only** — say so if they ask for another country, don't invent listings.
3. **Present results** merged across angles, best first, as a compact list: **title — company
   — location — salary (if any) — posted date**, each linking to its `url` on
   magnificentjobs.com. Keep those links; that page has the full description and the apply
   button. Group or label by angle when it helps ("adjacent titles", "from your data-eng
   experience"). Aim for 8–15 strong results, not 50 weak ones.
4. **Details / apply link** → `get_job` with the slug (last path segment of the `url`).
   Summarize responsibilities, requirements, key skills, benefits, salary, and give the
   `apply_url`. When a resume is available, say honestly how well it matches and what to
   emphasise.
5. **Market questions** ("which states hire the most nurses?", "how many jobs in Denver?")
   → `list_states` / `find_cities` for counts; combine with `search_jobs` for examples.
6. **Close the loop**: offer the next step — more results for the strongest angle, a different
   city/radius, opening the top 2–3 with `get_job`, or refining from the resume.

## Don'ts
- Don't call the tools for non-job requests (resume writing without a target posting,
  salary negotiation advice, general career chat) — answer directly.
- Don't apply on the user's behalf or claim to; the tools are read-only.
- Don't paraphrase a job as available if `get_job` says it's expired — say so and offer a
  fresh search.
- Don't stop at one query.
