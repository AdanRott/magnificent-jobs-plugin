#!/usr/bin/env node
/**
 * magnificentjobs — search live US jobs from your terminal, and wire the
 * Magnificent Jobs MCP server into your AI CLIs.
 *
 *   npx magnificentjobs                      interactive search
 *   npx magnificentjobs "ICU nurse nights" --city "Austin, TX" --radius 30
 *   npx magnificentjobs --remote "senior react engineer" --level 5-10
 *   npx magnificentjobs setup                add the MCP server to Claude Code / Codex / Cursor / …
 *   npx magnificentjobs job <slug|url>       full details + apply link
 *
 * Zero dependencies. Node ≥ 18. Data: https://magnificentjobs.com (read-only, no key).
 */
import { createInterface } from "node:readline";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir, platform } from "node:os";
import { join } from "node:path";

const SITE = "https://magnificentjobs.com";
const MCP_URL = `${SITE}/mcp`;
const UA = "magnificentjobs-cli/1.0";
const isTTY = process.stdout.isTTY && !process.env.NO_COLOR;
const c = {
  b: (s) => (isTTY ? `\x1b[1m${s}\x1b[22m` : s),
  dim: (s) => (isTTY ? `\x1b[2m${s}\x1b[22m` : s),
  ul: (s) => (isTTY ? `\x1b[4m${s}\x1b[24m` : s),
  green: (s) => (isTTY ? `\x1b[32m${s}\x1b[39m` : s),
  red: (s) => (isTTY ? `\x1b[31m${s}\x1b[39m` : s),
};

// ── args ─────────────────────────────────────────────────────────────────────
const ARR = { remote: "Remote Solely", "remote-ok": "Remote OK", hybrid: "Hybrid", onsite: "On-site", "on-site": "On-site" };
function parseArgs(argv) {
  const o = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    if (a === "--city" || a === "-c") o.city = next();
    else if (a === "--state" || a === "-s") o.state = next();
    else if (a === "--radius" || a === "-r") o.radius = next();
    else if (a === "--level" || a === "-l") o.level = next();
    else if (a === "--type" || a === "-t") o.type = next();
    else if (a === "--limit" || a === "-n") o.limit = next();
    else if (a === "--json") o.json = true;
    else if (a === "--remote") o.arr = "Remote Solely";
    else if (a === "--remote-ok") o.arr = "Remote OK";
    else if (a === "--hybrid") o.arr = "Hybrid";
    else if (a === "--onsite" || a === "--on-site") o.arr = "On-site";
    else if (a === "--arrangement" || a === "-a") o.arr = ARR[String(next()).toLowerCase()] || undefined;
    else if (a === "-h" || a === "--help") o.help = true;
    else if (a === "-v" || a === "--version") o.version = true;
    else o._.push(a);
  }
  return o;
}

function help() {
  console.log(`
${c.b("magnificentjobs")} — live US job search from your terminal ${c.dim(`(${SITE})`)}

  ${c.b("npx magnificentjobs")}                          interactive search
  ${c.b("npx magnificentjobs")} "ICU nurse nights" ${c.dim("[options]")}  one-shot search
  ${c.b("npx magnificentjobs job")} <slug|url>           full details + apply link
  ${c.b("npx magnificentjobs setup")}                    add the MCP server to Claude Code, Codex, Cursor, Windsurf, Claude Desktop

${c.b("Options")}
  -c, --city "Austin, TX"     results within --radius miles (10 | 30 | 50, default 50)
  -s, --state Texas           statewide (name or 2-letter code)
  --remote | --remote-ok | --hybrid | --onsite
  -l, --level 0-2             experience band: 0-2 | 2-5 | 5-10 | 10+
  -t, --type FULL_TIME        FULL_TIME | PART_TIME | CONTRACTOR | TEMPORARY | INTERN | …
  -n, --limit 10              results per page (max 50)
  --json                      raw JSON output

${c.b("Examples")}
  npx magnificentjobs "forklift operator" --city Fresno --radius 10
  npx magnificentjobs "senior react engineer fintech" --remote --level 5-10
  npx magnificentjobs "marketing coordinator" --state Colorado --level 0-2
`);
}

// ── http ─────────────────────────────────────────────────────────────────────
async function api(path, params) {
  const u = new URL(path, SITE);
  for (const [k, v] of Object.entries(params || {})) if (v != null && v !== "") u.searchParams.set(k, v);
  const r = await fetch(u, { headers: { "User-Agent": UA, Accept: "application/json" } });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(body.error || `${r.status} ${r.statusText}`);
  return body;
}

// ── rendering ────────────────────────────────────────────────────────────────
function money(s) {
  if (!s || (s.min == null && s.max == null)) return null;
  const f = (n) => (n >= 1000 ? `$${Math.round(n / 1000)}k` : `$${n}`);
  return s.min != null && s.max != null ? `${f(s.min)}–${f(s.max)}` : f(s.min ?? s.max);
}
function ago(iso) {
  if (!iso) return "";
  const d = Math.round((Date.now() - new Date(iso).getTime()) / 86400000);
  return d <= 0 ? "today" : d === 1 ? "1d ago" : `${d}d ago`;
}
function printResults(res, startIdx = 0) {
  const { jobs, resolved } = res;
  const where = resolved.city ? `${resolved.city.city}, ${resolved.city.state} · ${resolved.radius_miles} mi` : resolved.state || "nationwide";
  console.log(c.dim(`\n${jobs.length} result${jobs.length === 1 ? "" : "s"} · ${where}${resolved.query ? ` · "${resolved.query}"` : ""}\n`));
  jobs.forEach((j, i) => {
    const meta = [j.location, j.work_arrangement, j.experience_level && `${j.experience_level} yrs`, money(j.salary), j.distance_miles != null && `${j.distance_miles} mi`, ago(j.date_posted)].filter(Boolean).join(" · ");
    console.log(`${c.dim(String(startIdx + i + 1).padStart(3))}  ${c.b(j.title || "—")}  ${c.dim("@")} ${j.organization || "—"}`);
    if (meta) console.log(`     ${c.dim(meta)}`);
    console.log(`     ${c.ul(j.url)}`);
  });
  console.log();
}
function printJob(j) {
  const sal = money({ min: j.ai_salary_min_value, max: j.ai_salary_max_value });
  const loc = Array.isArray(j.locations) ? j.locations.slice(0, 3).join("; ").replace(/, United States/g, "") : "";
  console.log(`\n${c.b(j.title)}  ${c.dim("@")} ${j.organization}`);
  console.log(c.dim([loc, j.ai_work_arrangement, j.ai_experience_level && `${j.ai_experience_level} yrs`, sal && `${sal}${j.ai_salary_unit_text ? " / " + j.ai_salary_unit_text.toLowerCase() : ""}`, ago(j.date_posted)].filter(Boolean).join(" · ")));
  if (j.ai_core_responsibilities) console.log(`\n${c.b("What you'd do")}\n${j.ai_core_responsibilities}`);
  if (j.ai_requirements_summary) console.log(`\n${c.b("What they want")}\n${j.ai_requirements_summary}`);
  if (Array.isArray(j.ai_key_skills) && j.ai_key_skills.length) console.log(`\n${c.b("Skills")}  ${j.ai_key_skills.slice(0, 12).join(" · ")}`);
  if (Array.isArray(j.ai_benefits) && j.ai_benefits.length) console.log(`${c.b("Benefits")}  ${j.ai_benefits.slice(0, 8).join(" · ")}`);
  console.log(`\n${c.b("Apply")}   ${c.ul(j.apply_url || `${SITE}/jobs/${j.slug}`)}`);
  console.log(`${c.b("Page")}    ${c.ul(`${SITE}/jobs/${j.slug}`)}\n`);
}

// ── commands ─────────────────────────────────────────────────────────────────
function searchParams(o, query, offset = 0) {
  return {
    query, city: o.city, state: o.state, radius_miles: o.radius, work_arrangement: o.arr,
    experience_level: o.level, employment_type: o.type, limit: o.limit || 10, offset,
  };
}

async function oneShot(o) {
  const query = o._.join(" ").trim();
  const res = await api("/api/jobs/find", searchParams(o, query));
  if (o.json) return console.log(JSON.stringify(res, null, 2));
  printResults(res);
  if (res.hasMore) console.log(c.dim(`more: add --limit or run interactively (npx magnificentjobs)\n`));
}

async function jobCmd(o) {
  const arg = o._[1] || "";
  const slug = arg.replace(/^https?:\/\/[^/]+\/jobs\//, "").replace(/[?#].*$/, "").trim();
  if (!slug) throw new Error("usage: magnificentjobs job <slug|url>");
  const j = await api(`/api/jobs/${encodeURIComponent(slug)}`);
  if (o.json) return console.log(JSON.stringify(j, null, 2));
  printJob(j);
}

async function interactive(o) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q) => new Promise((r) => rl.question(q, (a) => r(a.trim())));
  console.log(`\n${c.b("Magnificent Jobs")} ${c.dim(`· live US jobs from company career sites · ${SITE}`)}`);
  console.log(c.dim("Describe the job in plain words. Optional: a city or state. Enter = skip. Ctrl-C = quit.\n"));
  let last = null, offset = 0, query = "", where = { city: o.city, state: o.state };
  for (;;) {
    if (!last) {
      query = await ask(`${c.b("job")}  ${c.dim("› ")}`);
      if (!query && !where.city && !where.state) continue;
      const place = await ask(`${c.b("where")} ${c.dim("(city, ST / state / blank = anywhere) › ")}`);
      where = parsePlace(place);
      offset = 0;
    }
    try {
      last = await api("/api/jobs/find", searchParams({ ...o, ...where }, query, offset));
    } catch (e) {
      console.log(c.red(`\n${e.message}\n`)); last = null; continue;
    }
    printResults(last, offset);
    const n = last.jobs.length;
    const cmd = await ask(c.dim(`${n ? "number = details · " : ""}${last.hasMore ? "m = more · " : ""}n = new search · q = quit › `));
    if (cmd === "q" || cmd === "quit") break;
    if (cmd === "m" && last.hasMore) { offset = last.nextOffset; continue; }
    if (/^\d+$/.test(cmd)) {
      const j = last.jobs[parseInt(cmd, 10) - 1 - offset];
      if (j) { try { printJob(await api(`/api/jobs/${encodeURIComponent(j.slug)}`)); } catch (e) { console.log(c.red(e.message)); } }
      const back = await ask(c.dim("Enter = back to results · n = new search · q = quit › "));
      if (back === "q") break;
      if (back === "n") { last = null; }
      else { printResults(last, offset); }
      continue;
    }
    last = null;
  }
  rl.close();
}
function parsePlace(s) {
  if (!s) return {};
  const m = s.match(/^(.+?),\s*([A-Za-z .]+)$/);
  if (m) return { city: s };
  // bare state name / code → statewide; anything else → city
  const STATES = "AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY".split(" ");
  const NAMES = ["alabama","alaska","arizona","arkansas","california","colorado","connecticut","delaware","florida","georgia","hawaii","idaho","illinois","indiana","iowa","kansas","kentucky","louisiana","maine","maryland","massachusetts","michigan","minnesota","mississippi","missouri","montana","nebraska","nevada","new hampshire","new jersey","new mexico","new york","north carolina","north dakota","ohio","oklahoma","oregon","pennsylvania","rhode island","south carolina","south dakota","tennessee","texas","utah","vermont","virginia","washington","west virginia","wisconsin","wyoming"];
  const t = s.trim();
  if (STATES.includes(t.toUpperCase()) || NAMES.includes(t.toLowerCase())) return { state: t };
  return { city: t };
}

// ── setup: wire the MCP server into AI CLIs ──────────────────────────────────
function has(bin) { return spawnSync(platform() === "win32" ? "where" : "which", [bin], { stdio: "ignore" }).status === 0; }
function readJson(p) { try { return JSON.parse(readFileSync(p, "utf8")); } catch { return null; } }
function writeJson(p, obj) { mkdirSync(join(p, ".."), { recursive: true }); writeFileSync(p, JSON.stringify(obj, null, 2) + "\n"); }
function addToJsonConfig(p, label) {
  const cfg = readJson(p) || {};
  cfg.mcpServers = cfg.mcpServers || {};
  if (cfg.mcpServers["magnificent-jobs"]) return `${label}: already configured (${p})`;
  cfg.mcpServers["magnificent-jobs"] = { type: "http", url: MCP_URL };
  writeJson(p, cfg);
  return `${label}: added to ${p}`;
}
async function setup() {
  const home = homedir();
  const out = [];
  // Claude Code
  if (has("claude")) {
    try { execFileSync("claude", ["mcp", "add", "--transport", "http", "--scope", "user", "magnificent-jobs", MCP_URL], { stdio: "ignore" }); out.push(c.green("✓ ") + "Claude Code: added (user scope)"); }
    catch { out.push(c.dim("• ") + "Claude Code: already configured or add failed — run: claude mcp add --transport http magnificent-jobs " + MCP_URL); }
  } else out.push(c.dim("• Claude Code not found (npm i -g @anthropic-ai/claude-code)"));
  // Codex
  if (has("codex")) {
    try { execFileSync("codex", ["mcp", "add", "magnificent-jobs", "--url", MCP_URL], { stdio: "ignore" }); out.push(c.green("✓ ") + "Codex: added"); }
    catch { out.push(c.dim("• ") + "Codex: already configured or add failed — run: codex mcp add magnificent-jobs --url " + MCP_URL); }
  } else out.push(c.dim("• Codex not found (npm i -g @openai/codex)"));
  // Cursor / Windsurf (JSON files)
  const cursor = join(home, ".cursor", "mcp.json");
  if (existsSync(join(home, ".cursor"))) out.push(c.green("✓ ") + addToJsonConfig(cursor, "Cursor"));
  const windsurf = join(home, ".codeium", "windsurf", "mcp_config.json");
  if (existsSync(join(home, ".codeium", "windsurf"))) out.push(c.green("✓ ") + addToJsonConfig(windsurf, "Windsurf"));
  // Claude Desktop
  const cd = platform() === "darwin" ? join(home, "Library", "Application Support", "Claude", "claude_desktop_config.json")
    : platform() === "win32" ? join(process.env.APPDATA || join(home, "AppData", "Roaming"), "Claude", "claude_desktop_config.json")
    : join(home, ".config", "Claude", "claude_desktop_config.json");
  if (existsSync(join(cd, ".."))) out.push(c.dim("• ") + "Claude Desktop: add a custom connector in Settings → Connectors → " + MCP_URL + " (remote servers aren't configured via the JSON file)");
  console.log(`\n${c.b("Magnificent Jobs MCP server")} ${c.dim(MCP_URL)}\n`);
  for (const l of out) console.log("  " + l);
  console.log(`\n  ${c.dim("Then just ask your AI: “find remote senior React jobs with salaries”.")}\n  ${c.dim("ChatGPT: install Magnificent Jobs from the Plugins directory. Docs: " + SITE + "/developers")}\n`);
}

// ── main ─────────────────────────────────────────────────────────────────────
const o = parseArgs(process.argv.slice(2));
(async () => {
  try {
    if (o.version) return console.log("1.0.1");
    if (o.help) return help();
    const cmd = o._[0];
    if (cmd === "setup" || cmd === "init" || cmd === "install") return await setup();
    if (cmd === "job" || cmd === "show") return await jobCmd(o);
    if (cmd === "help") return help();
    if (o._.length || o.city || o.state || o.arr || o.level || o.type) return await oneShot(o);
    if (!process.stdin.isTTY) return help();
    await interactive(o);
  } catch (e) {
    console.error(c.red(`error: ${e.message}`));
    process.exit(1);
  }
})();
