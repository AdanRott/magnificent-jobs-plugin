# magnificentjobs

**Search jobs with Claude Code or Codex. Not LinkedIn. Not Indeed.**

Live US job search from your terminal and your AI CLI — 3.5M+ postings pulled straight from company career sites,
searched by meaning. No account, no key.

```
npx magnificentjobs                                   # interactive
npx magnificentjobs "ICU nurse nights" --city "Austin, TX" --radius 30
npx magnificentjobs "senior react engineer" --remote --level 5-10
npx magnificentjobs job <slug|url>                    # full details + apply link
npx magnificentjobs setup                             # add the MCP server to Claude Code / Codex / Cursor / Windsurf
```

`setup` registers `https://magnificentjobs.com/mcp` with every AI CLI it finds, so you can just ask
Claude Code or Codex: *"find remote senior React jobs with salaries"*.

Docs: https://magnificentjobs.com/developers · Source: https://github.com/AdanRott/magnificent-jobs-plugin
