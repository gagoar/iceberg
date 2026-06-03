# iceberg

A Claude Code plugin that applies Hemingway writing rules to technical documentation.

Named after Hemingway's iceberg theory: the strength of a document comes from what you cut, not what you add.

## Install

```
/plugin marketplace add gagoar/iceberg
/plugin install iceberg@iceberg
/reload-plugins
```

## What it does

Two skills ship with iceberg:

**`/iceberg:score`** reads any document, analyzes it against 14 writing rules, and returns a graded report — without touching the file. It infers the document's intent automatically and shows two grades side by side: an objective score and an intent-adjusted score.

**`/iceberg:edit`** rewrites the document inline using those same 14 rules. It applies them in order and returns the clean document. No annotations. No changelog.

Both skills run automatically on every plan Claude produces. No setup needed after install.

## What happens automatically

After install, every plan Claude generates is scored before it reaches you. The score report appears at the top of the response. If you want the plan rewritten, run `/iceberg:edit` on it.

## Usage

**Score a file:**
```
/iceberg:score path/to/document.md
```

**Score with explicit intent:**
```
/iceberg:score path/to/document.md "executive summary"
```

**Edit a file:**
```
/iceberg:edit path/to/document.md
```

**Edit pasted text:**
```
/iceberg:edit
```
Paste your text. The skill returns the rewritten version.

## Reading the score report

```
ICEBERG SCORE — deployment-guide.md
Assumed intent: technical spec
  (signals: code blocks, component names as subjects, formal headers)

                  Objective   Intent-adjusted
Grade:               C             C
Density:         6.2/100w      6.2/100w   (target: ≤4.0)
Violations:         18            18
Word count:      290w

VIOLATIONS

Rule 1 — Short sentences  [HIGH / HIGH]  2 violations
  · "The system fetches the config and validates it, which can take up to 500ms
    depending on network conditions and cache state." (34w)
  · … 1 more

Rule 2 — Active voice  [HIGH / HIGH]  3 violations
  · "The config is loaded by the server"
  · "Errors are forwarded to the logging service"
  · … 1 more

Rule 9 — Second person  [LOW / LOW]  1 violation
  · "We recommend configuring the timeout before deploying."

[14 rules total — every violation quoted]

TOP 3 TO FIX (intent-adjusted): passive voice (Rule 2), long sentences (Rule 1), vague descriptors (Rule 14)
Run /iceberg:edit to apply all fixes.
```

**Grade** uses violation density — weighted violations per 100 words — so a clean 2,000-word spec and a clean 100-word summary both grade A.

**Objective vs intent-adjusted:** The objective grade applies default severity to all 14 rules. The intent-adjusted grade uses the inferred profile to deprioritize rules that don't apply to this document type. A "we recommend" in a conversational guide is expected; in a formal spec it's a violation.

## Grade scale

| Grade | Density (per 100 words) | Meaning |
|-------|------------------------|---------|
| A | ≤ 1.0 | Publish-ready |
| B | ≤ 4.0 | Minor cleanup needed |
| C | ≤ 8.0 | Needs work before sharing |
| D | ≤ 15.0 | Significant rewrite required |
| F | > 15.0 | Start over |

## Intent profiles

The scorer infers intent from the document's structure, tone, and vocabulary. You can override it by passing an explicit intent string.

| Rule | Technical (default) | Conversational | Executive |
|------|-------------------|---------------|-----------|
| 5 — Concrete nouns | MEDIUM | MEDIUM | HIGH |
| 8 — Lead with answer | MEDIUM | MEDIUM | HIGH |
| 9 — Second person | LOW | skip | LOW |
| 11 — Negative framing | LOW | skip | LOW |
| 12 — Short paragraphs | LOW | skip | HIGH |
| 13 — Jargon | MEDIUM | HIGH | HIGH |

**Conversational** — guides, tutorials, onboarding docs. "We built this to help you" is expected; jargon is penalized harder because readers need definitions.

**Executive** — summaries, proposals, recommendations. Buried answers and long paragraphs are penalized hard; second-person informality is ignored.

**Technical** — specs, READMEs, API docs, plans. Default severity on all rules.

## Before / after

The same paragraph, before and after `/iceberg:edit`:

**Before** (Grade D, density 8.0/100w):
> The configuration system was designed in order to facilitate the seamless management of environment-specific settings, and it essentially leverages a hierarchical override mechanism that is quite flexible and arguably one of the most comprehensive solutions available for handling the somewhat complex requirements of modern cloud deployments.

**After** (Grade A, density 0.8/100w):
> The configuration system manages environment-specific settings through a hierarchical override mechanism. You define values at the base level, then override them per environment. This works well for deployments with hundreds of configuration parameters across staging, production, and preview environments.

What changed: 1 sentence (67w) → 3 sentences. Passive voice fixed. Adverbs removed. Qualifiers deleted. Abstract nouns made concrete.

## The 14 Rules

| # | Rule | Example |
|---|------|---------|
| 1 | Short sentences | Target 15–20 words. Split at 30. |
| 2 | Active voice | "The server loads the config" — not "The config is loaded" |
| 3 | Strong verbs, no adverbs | "stalls" — not "runs slowly" |
| 4 | No qualifiers or hedges | Delete: *very, quite, arguably, tends to, could potentially* |
| 5 | Concrete nouns | "add a retry loop" — not "implement a comprehensive solution" |
| 6 | One idea per sentence | Break at "and," "which," or "but" when each side stands alone |
| 7 | Conditions before instructions | "If the cache is cold, run the script" — not the reverse |
| 8 | Lead with the answer | Conclusion first. Context follows. |
| 9 | Second person | "You configure the server" — not "We recommend" |
| 10 | Simple words | use, help, start, stop — not utilize, facilitate, initiate, terminate |
| 11 | No negative framing | "Use HTTPS" — not "Don't use HTTP" |
| 12 | Short paragraphs | 2–4 sentences. One topic. |
| 13 | Define or cut jargon | First use gets an inline definition. Plain equivalent beats jargon. |
| 14 | Measure, don't describe | "under 100ms" — not "fast" |

## What it doesn't touch

Code blocks, inline code, command names, variable names, URLs, and proper nouns are never modified.

## Long documents

For documents over 500 words, both skills spawn dedicated subagents (`iceberg-edit`, `iceberg-score`). The main context window stays clean.

## Status line

Run `/statusline-setup` to surface the last score in the Claude Code status bar. The score skill writes `.iceberg/last-score.txt` after every run.

## For plugin developers

See `TESTING.md` for the manual test checklist. Calibration fixtures are in `examples/eval/` — `violations.md` (expected Grade F), `clean.md` (expected Grade A), and three model-comparison documents. `examples/eval/results.md` records Haiku vs Sonnet accuracy findings.

## License

MIT — [gagoar](https://github.com/gagoar)
