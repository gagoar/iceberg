#!/usr/bin/env node
// Plugin-directory upload gate. Fails when a plugin ships something the upload
// scanner holds for review:
//   1. a skill/agent/command pre-approves a write- or exec-capable tool with no path scope
//   2. shipped code copies the whole environment (every secret in it) instead of named variables
//   3. a native executable is committed (the scanner cannot read it)
// Usage: node scripts/check-plugin-safety.ts [plugin-root ...]   (default: .)
import { closeSync, existsSync, openSync, readdirSync, readFileSync, readSync, statSync } from "node:fs";
import type { Dirent } from "node:fs";
import { basename, extname, join, relative, resolve } from "node:path";

const SELF = "check-plugin-safety.ts";
const SKIP_DIRS: ReadonlySet<string> = new Set([".git", "node_modules"]);
const MAX_SCAN_BYTES = 67_108_864;
const HEAD_CHARS = 200;
const SNIPPET_CHARS = 100;
const ARGV_ROOTS_START = 2; // argv[0] is node, argv[1] is this script

// ---- rule 1: unscoped grants -------------------------------------------------

// Tools that change files or run commands. They must carry a scope: Tool(pattern).
const SCOPED_ONLY: ReadonlySet<string> = new Set(["Write", "Edit", "MultiEdit", "NotebookEdit", "Bash"]);
// Scopes that match everything are the same as no scope.
const BROAD: ReadonlySet<string> = new Set(["*", "**", "/**", "./**", "//**", "~/**", "**/*"]);
const FRONTMATTER_FIELDS: readonly string[] = ["allowed-tools", "allowed_tools", "tools"];
const FIELD_RE = new RegExp(`^(?:${FRONTMATTER_FIELDS.join("|")})\\s*:\\s*(.*)$`);
const LIST_ITEM_RE = /^\s+-\s+(.*)$/;

function frontmatter(text: string): readonly string[] {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  return match?.[1] === undefined ? [] : match[1].split(/\r?\n/);
}

const unquote = (s: string): string => s.trim().replace(/^['"]|['"]$/g, "");

interface SplitState {
  readonly parts: readonly string[];
  readonly current: string;
  readonly depth: number;
}

function splitStep(state: SplitState, ch: string): SplitState {
  if (ch === "(") return { ...state, current: state.current + ch, depth: state.depth + 1 };
  if (ch === ")") return { ...state, current: state.current + ch, depth: state.depth - 1 };
  if (ch === "," && state.depth === 0) return { parts: [...state.parts, state.current], current: "", depth: 0 };
  return { ...state, current: state.current + ch };
}

// Split on commas outside parentheses.
function splitTools(value: string): readonly string[] {
  const end = Array.from(value).reduce(splitStep, { parts: [], current: "", depth: 0 });
  return [...end.parts, end.current].map(unquote).filter((t) => t !== "");
}

function blockList(rest: readonly string[]): readonly string[] {
  const stop = rest.findIndex((l) => !LIST_ITEM_RE.test(l));
  const items = stop === -1 ? rest : rest.slice(0, stop);
  return items.map((l) => unquote(LIST_ITEM_RE.exec(l)?.[1] ?? ""));
}

function toolsOnLine(lines: readonly string[], index: number): readonly string[] {
  const m = FIELD_RE.exec(lines[index] ?? "");
  if (!m) return [];
  const value = (m[1] ?? "").trim().replace(/^\[|\]$/g, "");
  return value === "" ? blockList(lines.slice(index + 1)) : splitTools(value);
}

const toolsIn = (lines: readonly string[]): readonly string[] => lines.flatMap((_, i) => toolsOnLine(lines, i));

function grantProblem(tool: string): string | undefined {
  const m = /^([A-Za-z_*]+)(?:\((.*)\))?$/.exec(tool);
  if (!m) return undefined;
  const name = m[1] ?? "";
  const scope = m[2];
  if (name === "*") return "wildcard grants every tool";
  if (!SCOPED_ONLY.has(name)) return undefined;
  if (scope === undefined || scope.trim() === "") return `${name} has no path scope; use ${name}(./path/**)`;
  return BROAD.has(scope.trim()) ? `${name}(${scope}) matches everything; narrow the scope` : undefined;
}

// ---- rule 2: whole-environment forwarding -----------------------------------

// Reading one named variable (process.env.COLUMNS) is fine. Copying or listing
// the whole environment hands every secret in it to the code.
const ENV_PATTERNS: readonly { readonly re: RegExp; readonly why: string }[] = [
  { re: /\.\.\.\s*process\.env\b(?!\s*\.|\s*\[)/, why: "spreads the whole environment" },
  { re: /Object\.(?:keys|entries|values)\(\s*process\.env\s*\)/, why: "enumerates the whole environment" },
  { re: /Object\.assign\([^)]*\bprocess\.env\s*[,)]/, why: "copies the whole environment" },
  { re: /\benv\s*:\s*process\.env\s*[,}\n]/, why: "passes the whole environment to a child process" },
];
const CODE_EXTS: ReadonlySet<string> = new Set([".ts", ".tsx", ".js", ".mjs", ".cjs", ".mts", ".cts"]);
const TEST_FILE = /(?:\.test|\.spec)\.[cm]?[jt]sx?$/;
const NODE_SHEBANG = /^#!.*\bnode\b/;

function isShippedCode(path: string, head: string): boolean {
  if (basename(path) === SELF || TEST_FILE.test(path)) return false;
  const ext = extname(path).toLowerCase();
  return CODE_EXTS.has(ext) || (ext === "" && NODE_SHEBANG.test(head));
}

function envProblems(path: string): readonly string[] {
  const text = statSync(path).size > MAX_SCAN_BYTES ? "" : readFileSync(path, "utf8");
  if (!isShippedCode(path, text.slice(0, HEAD_CHARS))) return [];
  return text.split(/\r?\n/).flatMap((line, i) =>
    ENV_PATTERNS.filter(({ re }) => re.test(line)).map(
      ({ why }) => `line ${i + 1} ${why}: ${line.trim().slice(0, SNIPPET_CHARS)}`,
    ),
  );
}

// ---- rule 3: native executables ---------------------------------------------

const HEADER_BYTES = 0x40;
const MAGIC_BYTES = 4;
const ELF_MAGIC = 0x7f454c46;
const MACHO_32 = 0xfeedface;
const MACHO_64 = 0xfeedfacf;
const MACHO_32_SWAPPED = 0xcefaedfe;
const MACHO_64_SWAPPED = 0xcffaedfe;
const MACHO_MAGICS: ReadonlySet<number> = new Set([MACHO_32, MACHO_64, MACHO_32_SWAPPED, MACHO_64_SWAPPED]);
const FAT_MACHO_MAGIC = 0xcafebabe; // also the magic of a Java .class, which is small
const JAVA_CLASS_MAX_BYTES = 4096;
const DOS_MAGIC = 0x4d5a;
const PE_OFFSET_FIELD = 0x3c;
const PE_SIGNATURE = "PE\0\0";

function readBytes(path: string, length: number, position: number): Buffer {
  const fd = openSync(path, "r");
  try {
    const buf = Buffer.alloc(length);
    return buf.subarray(0, readSync(fd, buf, 0, length, position));
  } finally {
    closeSync(fd);
  }
}

function isPortableExecutable(path: string, head: Buffer): boolean {
  if (head.length < HEADER_BYTES || head.readUInt16BE(0) !== DOS_MAGIC) return false;
  const sig = readBytes(path, MAGIC_BYTES, head.readUInt32LE(PE_OFFSET_FIELD));
  return sig.toString("latin1") === PE_SIGNATURE;
}

function nativeKind(path: string): string | undefined {
  const head = readBytes(path, HEADER_BYTES, 0);
  if (head.length < MAGIC_BYTES) return undefined;
  const magic = head.readUInt32BE(0);
  if (magic === ELF_MAGIC) return "ELF executable";
  if (MACHO_MAGICS.has(magic)) return "Mach-O executable";
  if (magic === FAT_MACHO_MAGIC && statSync(path).size > JAVA_CLASS_MAX_BYTES) return "Mach-O universal binary";
  return isPortableExecutable(path, head) ? "Windows PE executable" : undefined;
}

// ---- walk and report --------------------------------------------------------

function expand(dir: string, entry: Dirent): readonly string[] {
  const p = join(dir, entry.name);
  if (entry.isDirectory()) return walk(p);
  return entry.isFile() ? [p] : [];
}

function walk(dir: string): readonly string[] {
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => !SKIP_DIRS.has(e.name))
    .flatMap((e) => expand(dir, e));
}

function isGrantFile(root: string, path: string): boolean {
  if (!path.endsWith(".md")) return false;
  const dirs = relative(root, path).split(/[\\/]/);
  return basename(path) === "SKILL.md" || dirs.includes("agents") || dirs.includes("commands");
}

function grantProblems(root: string, path: string): readonly string[] {
  if (!isGrantFile(root, path)) return [];
  return toolsIn(frontmatter(readFileSync(path, "utf8"))).flatMap((tool) => {
    const why = grantProblem(tool);
    return why === undefined ? [] : [`${tool}: ${why}`];
  });
}

function fileProblems(root: string, path: string): readonly string[] {
  const grants = grantProblems(root, path);
  const kind = nativeKind(path);
  if (kind !== undefined) {
    return [...grants, `${kind} committed; the scanner cannot read it. Ship source and fetch a pinned build instead`];
  }
  return [...grants, ...envProblems(path)];
}

function checkRoot(root: string): number {
  const files = walk(root);
  const lines = files.flatMap((f) => fileProblems(root, f).map((p) => `FAIL ${relative(root, f)}: ${p}`));
  lines.forEach((l) => console.log(l));
  console.log(`${root}: checked ${files.length} files, ${lines.length} problem(s)`);
  return lines.length;
}

function checkTarget(root: string): number {
  if (existsSync(root)) return checkRoot(root);
  console.log(`FAIL ${root}: no such directory`);
  return 1;
}

function main(): number {
  const roots = process.argv.slice(ARGV_ROOTS_START).map((r) => resolve(r));
  const targets = roots.length > 0 ? roots : [resolve(".")];
  const failures = targets.map(checkTarget).reduce((a, b) => a + b, 0);
  return failures > 0 ? 1 : 0;
}

process.exit(main());
