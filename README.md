**find jobs with our cli using claude code and codex. We scrape the internet every hour to find you jobs linkedin and indeed cant find. also it's free**

```
npx magnificentjobs setup      # Claude Code · Codex
npx magnificentjobs            # terminal
```

# Magnificent Jobs


## Install

```
/plugin marketplace add AdanRott/magnificent-jobs-plugin
/plugin install magnificent-jobs@magnificent-jobs
```

Or, in Claude.ai / Claude Desktop, add it as a custom connector: **Settings → Connectors → Add
custom connector** → `https://magnificentjobs.com/mcp` (no authentication).

## Use with any MCP client

The server is remote, read-only and needs no key. Listed in the official MCP Registry as
`com.magnificentjobs/jobs`. Add it to any client that supports Streamable HTTP:

```json
{
  "mcpServers": {
    "magnificent-jobs": { "type": "http", "url": "https://magnificentjobs.com/mcp" }
  }
}
```

- **Claude Code:** `claude mcp add --transport http magnificent-jobs https://magnificentjobs.com/mcp`
- **Cursor / Windsurf / VS Code:** paste the JSON above into the MCP settings.
- **ChatGPT:** install *Magnificent Jobs* from the Plugins directory, or in Developer mode add `https://magnificentjobs.com/mcp`.
- **Claude.ai / Desktop:** Settings → Connectors → Add custom connector → `https://magnificentjobs.com/mcp`.

Tools: `search_jobs` · `get_job` · `find_cities` · `list_states`. Docs: <https://magnificentjobs.com/developers>.

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
Support: info --- at --- magnificentjobs.com

## License

MIT — see [LICENSE](LICENSE). The plugin files are MIT; the job data is served by magnificentjobs.com under its terms.
