#!/usr/bin/env node
// Fail if a skill or agent pre-approves a write-capable tool without a path scope.
// Usage: node scripts/check-allowed-tools.ts [repo-root]
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, relative, resolve } from "node:path";

// Tools that change files or run commands. They must carry a scope: Tool(pattern).
const SCOPED_ONLY: ReadonlySet<string> = new Set([
  "Write",
  "Edit",
  "MultiEdit",
  "NotebookEdit",
  "Bash",
]);
// Scopes that match everything are the same as no scope.
const BROAD: ReadonlySet<string> = new Set(["*", "**", "/**", "./**", "//**", "~/**", "**/*"]);
const FRONTMATTER_FIELDS: readonly string[] = ["allowed-tools", "allowed_tools", "tools"];

function frontmatter(text: string): readonly string[] {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  return match?.[1] === undefined ? [] : match[1].split(/\r?\n/);
}

const unquote = (s: string): string => s.trim().replace(/^['"]|['"]$/g, "");

// Split on commas outside parentheses.
function splitTools(value: string): readonly string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = "";
  for (const ch of value) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map(unquote).filter((t) => t !== "");
}

function toolsIn(lines: readonly string[]): readonly string[] {
  const tools: string[] = [];
  const keyRe = new RegExp(`^(?:${FRONTMATTER_FIELDS.join("|")})\\s*:\\s*(.*)$`);
  lines.forEach((line, i) => {
    const m = keyRe.exec(line);
    if (!m) return;
    let value = (m[1] ?? "").trim();
    if (value.startsWith("[")) value = value.replace(/^\[|\]$/g, "");
    if (value !== "") {
      tools.push(...splitTools(value));
      return;
    }
    for (const next of lines.slice(i + 1)) {
      const item = /^\s+-\s+(.*)$/.exec(next);
      if (!item) break;
      tools.push(unquote(item[1] ?? ""));
    }
  });
  return tools;
}

function problem(tool: string): string | undefined {
  const m = /^([A-Za-z_*]+)(?:\((.*)\))?$/.exec(tool);
  if (!m) return undefined;
  const name = m[1] ?? "";
  const scope = m[2];
  if (name === "*") return "wildcard grants every tool";
  if (!SCOPED_ONLY.has(name)) return undefined;
  if (scope === undefined || scope.trim() === "") {
    return `${name} has no path scope; use ${name}(./path/**)`;
  }
  if (BROAD.has(scope.trim())) return `${name}(${scope}) matches everything; narrow the scope`;
  return undefined;
}

function listFiles(root: string): readonly string[] {
  const files: string[] = [];
  const skills = join(root, "skills");
  if (existsSync(skills)) {
    for (const d of readdirSync(skills, { withFileTypes: true })) {
      const f = join(skills, d.name, "SKILL.md");
      if (d.isDirectory() && existsSync(f)) files.push(f);
    }
  }
  for (const dir of ["agents", "commands"]) {
    const p = join(root, dir);
    if (!existsSync(p)) continue;
    for (const e of readdirSync(p)) if (e.endsWith(".md")) files.push(join(p, e));
  }
  return files.sort();
}

function main(): number {
  const root = resolve(process.argv[2] ?? ".");
  const files = listFiles(root);
  let failures = 0;
  for (const f of files) {
    for (const tool of toolsIn(frontmatter(readFileSync(f, "utf8")))) {
      const why = problem(tool);
      if (why !== undefined) {
        failures++;
        console.log(`FAIL ${relative(root, f)}: ${tool}: ${why}`);
      }
    }
  }
  console.log(`checked ${files.length} files, ${failures} unscoped grant(s)`);
  return failures > 0 ? 1 : 0;
}

process.exit(main());
