# magnificentjobs

find jobs with our cli using claude code and codex. We scrape the internet every hour to find you jobs linkedin and indeed cant find. also it's free

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
