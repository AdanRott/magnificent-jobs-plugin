---
name: find-jobs
description: Find live US job postings for the user via the Magnificent Jobs MCP tools (search_jobs, get_job, find_cities, list_states). Use whenever someone wants to find, compare, or get details/apply links for jobs — by role, skills, company, city, state, remote/hybrid, experience level or employment type.
---

# Find jobs with Magnificent Jobs

You have live access to 3.5M+ US job postings pulled hourly from company applicant-tracking
systems. Search is **by meaning**: pass what the person wants in plain English, not boolean
keywords. Never invent jobs — only report what the tools return.

## Workflow

1. **Turn the ask into a `search_jobs` call.**
   - `query`: **you write the expanded query** — it is embedded verbatim, the server does
     not rewrite it. Always use the shape `"<Full Job Title>. <One sentence: what the role
     does; 3-5 key skills/tools>."`, expanding every abbreviation and keeping the user's
     qualifiers (seniority, shift, domain, remote). E.g. "ML eng jobs" →
     `"Machine Learning Engineer. Builds, trains and deploys machine learning models; Python,
     PyTorch, MLOps, data pipelines."`; "RN nights" → `"Registered Nurse, night shift. Provides
     bedside patient care, medication administration, charting; ICU/med-surg, BLS/ACLS."`.
     **No abbreviations or acronyms anywhere in the query** — always spell them out
     (machine learning, artificial intelligence, registered nurse, software engineer, quality
     assurance, product manager, commercial driver's license…). Never a single word.
   - `city` if a place is named ("Austin" or "Austin, TX"); `radius_miles` 10 / 30 / 50
     (default 50 — use 10 for "near me / close by"). `state` alone for statewide.
   - Filters **only when asked**: remote → `work_arrangement` "Remote Solely" (fully remote)
     or "Remote OK"; hybrid → "Hybrid"; entry level / new grad → `experience_level` "0-2";
     senior → "5-10" or "10+"; part-time / contract / intern → `employment_type`.
   - `limit` 10–12 for a first pass; page with `offset = nextOffset`.
2. **City not found (404 "No jobs city matched")** → call `find_cities` with the prefix and
   ask the user which one they meant (or pick the biggest market if obvious).
3. **Present results** as a compact list: **title — company — location — salary (if any)
   — posted date**, each linking to its `url` on magnificentjobs.com. Keep those links;
   that page has the full description and the apply button.
4. **Details / apply link** → `get_job` with the slug (last path segment of the `url`).
   Summarize responsibilities, requirements, key skills, benefits, salary, and give the
   `apply_url`.
5. **Market questions** ("which states hire the most nurses?", "how many jobs in Denver?")
   → `list_states` / `find_cities` for counts; combine with `search_jobs` for examples.

## Don'ts
- Don't call the tools for non-job requests (resume writing without a target posting,
  salary negotiation advice, general career chat) — answer directly.
- Don't apply on the user's behalf or claim to; the tools are read-only.
- Don't paraphrase a job as available if `get_job` says it's expired — say so and offer a
  fresh search.
