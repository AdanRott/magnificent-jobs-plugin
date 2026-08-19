# Magnificent Jobs — Claude plugin

Find live US jobs from Claude by describing the role you want. The plugin connects Claude to the
[Magnificent Jobs](https://magnificentjobs.com) MCP server — millions of postings pulled straight
from company career sites (Workday, Greenhouse, Lever, iCIMS, SmartRecruiters …), refreshed hourly
— and ships a `find-jobs` skill that tells Claude how to search well.

## Install

```
/plugin marketplace add AdanRott/magnificent-jobs-plugin
/plugin install magnificent-jobs@magnificent-jobs
```

Or, in Claude.ai / Claude Desktop, add it as a custom connector: **Settings → Connectors → Add
custom connector** → `https://magnificentjobs.com/mcp` (no authentication).

## What's inside

| Component | What it does |
| --- | --- |
| MCP server `https://magnificentjobs.com/mcp` (Streamable HTTP, no auth) | `search_jobs` (semantic search; city radius 10/30/50 mi, state, remote/on-site, experience band, employment type), `get_job` (full description, salary, skills, apply link), `find_cities`, `list_states`. All tools are read-only. |
| Skill `find-jobs` | How to phrase the query (full title + one sentence + skills), when to use which tool, US-only coverage, never invent jobs, never claim to apply. |

## Try

- "Find remote senior React engineer jobs and show me the three best with salaries."
- "What warehouse or forklift jobs are within 10 miles of Fresno? Give me the apply link for the closest one."
- "Show entry-level marketing jobs in Colorado and summarize the top two."
- "Which states have the most nursing jobs right now?"

## Privacy

Searches are sent to magnificentjobs.com to return results and are not stored beyond standard server
logs. No account, no personal data. Full policy: <https://magnificentjobs.com/privacy> ·
Terms: <https://magnificentjobs.com/terms> · Docs: <https://magnificentjobs.com/developers> ·
Support: info@magnificentjobs.com

## License

MIT — see [LICENSE](LICENSE). The plugin files are MIT; the job data is served by magnificentjobs.com under its terms.
