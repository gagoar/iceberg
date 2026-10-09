#!/usr/bin/env python3
"""Fail if a skill or agent pre-approves a write-capable tool without a path scope.

Usage: check_allowed_tools.py [repo-root]
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

# Tools that change files or run commands. They must carry a scope: Tool(pattern).
SCOPED_ONLY = {"Write", "Edit", "MultiEdit", "NotebookEdit", "Bash"}
# Scopes that match everything are the same as no scope.
BROAD = {"*", "**", "/**", "./**", "//**", "~/**", "**/*"}
KEYS = ("allowed-tools", "allowed_tools", "tools")


def frontmatter(text: str) -> list[str]:
    m = re.match(r"---\r?\n(.*?)\r?\n---", text, re.S)
    return m.group(1).splitlines() if m else []


def split_tools(value: str) -> list[str]:
    """Split on commas outside parentheses."""
    out, depth, cur = [], 0, ""
    for ch in value:
        depth += ch == "("
        depth -= ch == ")"
        if ch == "," and depth == 0:
            out.append(cur)
            cur = ""
        else:
            cur += ch
    out.append(cur)
    return [t.strip().strip("'\"") for t in out if t.strip()]


def tools_in(lines: list[str]) -> list[str]:
    tools: list[str] = []
    for i, line in enumerate(lines):
        m = re.match(rf"({'|'.join(KEYS)})\s*:\s*(.*)$", line)
        if not m:
            continue
        value = m.group(2).strip()
        if value.startswith("["):
            value = value.strip("[]")
        if value:
            tools += split_tools(value)
        else:  # block list
            for nxt in lines[i + 1:]:
                item = re.match(r"\s+-\s+(.*)$", nxt)
                if not item:
                    break
                tools.append(item.group(1).strip().strip("'\""))
    return tools


def problems(tool: str) -> str | None:
    m = re.match(r"^([A-Za-z_*]+)(?:\((.*)\))?$", tool)
    if not m:
        return None
    name, scope = m.group(1), m.group(2)
    if name == "*":
        return "wildcard grants every tool"
    if name in SCOPED_ONLY:
        if scope is None or scope.strip() == "":
            return f"{name} has no path scope; use {name}(./path/**)"
        if scope.strip() in BROAD:
            return f"{name}({scope}) matches everything; narrow the scope"
    return None


def main() -> int:
    root = Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
    files = sorted(root.glob("skills/*/SKILL.md")) + sorted(root.glob("agents/*.md"))
    files += sorted(root.glob("commands/*.md"))
    failures = 0
    for f in files:
        for tool in tools_in(frontmatter(f.read_text(encoding="utf-8"))):
            why = problems(tool)
            if why:
                failures += 1
                print(f"FAIL {f.relative_to(root)}: {tool}: {why}")
    print(f"checked {len(files)} files, {failures} unscoped grant(s)")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
