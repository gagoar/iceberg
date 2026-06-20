---
name: score
description: >
  /iceberg:score — Score a technical document against 14 Hemingway writing rules without
  changing it. Returns a graded report with violations quoted and a TOP 3 to fix.

  ALWAYS run automatically on every plan Claude produces, before any edit is applied.
  This is not optional and requires no user prompt. Run it on every plan, spec, proposal,
  README, or prose document Claude writes before returning it.

  Also trigger on: /iceberg:score <file-path>, /iceberg:score with pasted text.

  Natural language triggers: "check my writing", "grade this", "score this", "is this
  clear?", "review this plan", "how readable is this?", "rate my writing"

  Returns a structured violation report with grade, per-rule counts, and quoted offenders.
  Never modifies the document.
argument-hint: "[file-path or paste text] [optional: intent description]"
allowed-tools: Read, Write, Agent
---

# Iceberg Scorer

Score a document against the 14 Hemingway rules. Read only — never modify the input.

## Input

- `/iceberg:score <file-path>` — read the file, score it, print the report. Resolve relative paths from the current working directory.
- `/iceberg:score <file-path> "intent: formal engineering spec"` — score with intent context
- `/iceberg:score` — user pastes text; score and return the report
- **Automatic** — score every plan and output document before returning it to the user

The optional intent argument overrides the inferred profile. Pass one of: `"technical"`, `"conversational"`, or `"executive"`, or a free-form string the scorer maps to the nearest profile.

**Skip:** code-only responses, shell output, error messages, stack traces, files under `vendor/`, `node_modules/`, or `dist/`, any document under 50 words. If auto-triggered on a document under 50 words, return it unchanged with no comment.

## Process

1. Read the full document before scoring anything.
2. Infer intent from document signals (or use the provided intent argument).
3. Score twice: once with default severities (objective), once with intent-profile severities (adjusted).
4. Deduplication: word triggering both Rule 3 and Rule 4 → count under Rule 4 only. Sentence triggering both Rule 1 and Rule 6 → count under Rule 1 only.
5. Calculate weighted density for each score: `weighted_violations / (word_count / 100)`.
6. Assign a letter grade for each score using the density scale.
7. Return the complete report with both grades side by side. No preamble, no changelog.
8. Write the compact summary to `.iceberg/last-score.txt`. Skip silently if unwritable.

## The 14 Rules

**1 — Short sentences [HIGH]:** Flag sentences over 25 words. Violation at 30 words — split unconditionally.

**2 — Active voice [HIGH]:** Flag all passive constructions including agentless ones ("is forwarded", "was configured", "are stored"). Keep passive only when the actor is unknown or irrelevant.

**3 — Strong verbs, no adverbs [MEDIUM]:** Flag adverbs that mask a weak verb ("quickly scans", "silently marks"). Do NOT flag quantifying adverbs (linearly, approximately) or temporal ones (currently, previously).

**4 — No qualifiers or hedges [MEDIUM]:** Flag: *very, quite, somewhat, rather, fairly, essentially, basically, arguably, maybe, perhaps, appears to, tends to, could potentially, a bit, sort of, kind of*. If a word triggers both Rule 3 and Rule 4, count it under Rule 4 only.

**5 — Concrete nouns [MEDIUM]:** Flag abstract categories. Signal words: *solution, approach, initiative, framework, experience, value, requirements, functionality, ecosystem, posture, collaboration, improvement, visibility, scalability*.

**6 — One idea per sentence [MEDIUM]:** Flag compound sentences where both clauses could stand alone (joined by "and", "which", "but", "that"). If a sentence triggers both Rule 1 and Rule 6, count it under Rule 1 only.

**7 — Conditions before instructions [LOW]:** Flag "do X if Y" — correct form is "if Y, do X". Example violation: "Reduce the burst limit if you observe quota exhaustion."

**8 — Lead with the answer [MEDIUM]:** Flag when the key conclusion is buried after context sentences. Exception: sections titled Background, Overview, Context, or How it works.

**9 — Second person [LOW]:** Flag "we recommend", "users should", "one should". Use "you" for instructions; component name for system behavior.

**10 — Simple words [LOW]:** Flag: *utilize→use, facilitate→help, initiate→start, terminate→stop, leverage→use, in order to→to, subsequent to→after, prior to→before, it is worth noting that→(delete)*.

**11 — No negative framing [LOW]:** Flag "don't", "do not", "avoid", "never" except for genuine safety warnings or known failure modes.

**12 — Short paragraphs [LOW]:** Flag paragraphs with more than 4 sentences.

**13 — Jargon [MEDIUM]:** Flag technical terms a new team member would not know. Do NOT flag universally known abbreviations (HTTP, JSON, YAML, SQL, API, REST, HTML). Flag domain-specific terms (PromQL, etcd, canary rollout, idempotent, TTL in non-general context).

**14 — Measure, don't describe [HIGH]:** Flag subjective descriptors without a number: *fast, large, easy, good, high, low, significant, reasonable, permissive, well, flexible, comprehensive, robust*.

## Score report format

```
ICEBERG SCORE — path/to/doc.md
Assumed intent: conversational onboarding guide
  (signals: tutorial-style steps, "you'll learn" phrasing, casual headers)

                  Objective   Intent-adjusted
Grade:               C             A
Density:         6.2/100w      1.4/100w   (target: ≤4.0)
Violations:         18             4     (14 deprioritized for conversational)
Word count:      290w

VIOLATIONS

Rule 1 — Short sentences  [HIGH / HIGH]  2 violations
  · "The system fetches the config and validates it, which can take up to 500ms." (34w)
  · … 1 more

Rule 9 — Second person  [LOW / skip]  2 violations  ← deprioritized for conversational
  · "we recommend configuring…"
  · "our team suggests…"

Rule 13 — Jargon  [MEDIUM / HIGH]  3 violations  ← stricter for conversational readers
  · "idempotent" used without definition
  · … 2 more

[continue for all 14 rules — format: [objective / intent-adjusted]]

TOP 3 TO FIX (intent-adjusted): jargon (Rule 13), long sentences (Rule 1), passive voice (Rule 2)
Run /iceberg:edit to apply all fixes.
```

## Grade scale (density: violations per 100 words)

| Grade | Density | Meaning |
|-------|---------|---------|
| A | ≤ 1.0 | Publish-ready |
| B | ≤ 4.0 | Minor cleanup needed |
| C | ≤ 8.0 | Needs work before sharing |
| D | ≤ 15.0 | Significant rewrite required |
| F | > 15.0 | Start over |

## Intent profiles

The scorer infers intent automatically. Pass an explicit intent to override.

| Rule | Technical (default) | Conversational | Executive |
|------|-------------------|---------------|-----------|
| 5 — Concrete nouns | MEDIUM | MEDIUM | HIGH |
| 8 — Lead with answer | MEDIUM | MEDIUM | HIGH |
| 9 — Second person | LOW | skip | LOW |
| 11 — Negative framing | LOW | skip | LOW |
| 12 — Short paragraphs | LOW | skip | HIGH |
| 13 — Jargon | MEDIUM | HIGH | HIGH |

"skip" = violation found and reported but excluded from weighted count.

## Long documents (over 500 words)

Spawn the `iceberg-score` agent with the full document and intent string. Return the agent's output as the final result.

## After the report

Write a compact one-liner to `.iceberg/last-score.txt`:
```
conversational | Obj: C (6.2/100w) | Adj: A (1.4/100w) | Top: jargon, long sentences, passive voice
```
Create the `.iceberg/` directory if it doesn't exist. Skip silently if unwritable.
