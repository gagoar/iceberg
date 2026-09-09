---
name: edit
description: >
  /iceberg:edit — Rewrite a technical document using 14 Hemingway rules (short sentences,
  active voice, no hedges, concrete nouns). Returns the clean document, no annotations.

  ALWAYS apply automatically to every plan and every document Claude returns to the user.
  This is not optional and requires no user prompt. Run it on every plan, spec, proposal,
  README, or prose document before returning it.

  Also trigger on: /iceberg:edit <file-path>, /iceberg:edit with pasted text.

  Natural language triggers: "make this shorter", "simplify this", "tighten this up",
  "clean up the writing", "fix the prose", "apply hemingway", "rewrite this"

  Accepts an optional intent argument: /iceberg:edit <file-path> "intent description"
  Use intent to preserve voice while applying rules (e.g., "formal engineering spec",
  "conversational onboarding guide").

  Two opt-in extended rules, off by default: --no-em-dash strips every em dash;
  --no-weakeners strips mid-document statements that undercut a claim the document
  just made (outside a labeled Limitations/Caveats section).

  Rewrites with inline replacements. No annotations. No changelog. Returns only the clean document.

  For documents over 500 words, spawn the iceberg-edit agent to preserve the main context window.
argument-hint: "[file-path or paste text] [--no-em-dash] [--no-weakeners] [optional: intent description]"
allowed-tools: Read, Write, Agent
---

# Iceberg Editor

Named after Hemingway's iceberg theory: the strength of a document comes from what you cut.

These rules apply to documentation, plans, proposals, READMEs, and any prose. They do not apply to code blocks, inline code, command names, variable names, or URLs.

## Input

- `/iceberg:edit <file-path>` — read the file, apply rules, write it back in place. Resolve relative paths from the current working directory.
- `/iceberg:edit <file-path> "intent description"` — edit while preserving the intended voice
- `/iceberg:edit <file-path> --no-em-dash --no-weakeners` — also apply the opt-in extended rules (either flag alone is valid too)
- `/iceberg:edit` — user pastes text; return the rewritten version
- **Automatic** — apply to every plan and output document before returning it to the user. The automatic pass runs the core 14 rules only — the extended rules require an explicit flag, every time, even on auto-applied edits.

If no intent is provided, infer it from document signals before editing. Three profiles: **technical** (default), **conversational** (guides/tutorials — skip Rules 9, 11, 12), **executive** (summaries/proposals — treat Rules 5, 8, 12, 13 as HIGH priority). Pass intent, inferred profile, and any extended-rule flags through to the subagent for long documents.

**Skip:** code-only responses, shell output, error messages, stack traces, files under `vendor/`, `node_modules/`, or `dist/`, any document under 50 words.

## The 14 Rules

### 1. Short sentences
Target 15–20 words. At 25 words, find a split point. At 30 words, split unconditionally. Break at conjunctions, relative clauses, or participial phrases.

### 2. Active voice
Find the actor. Make it the subject. Fix agentless passives too — "is forwarded", "are stored", "was configured" — not just those with an explicit "by" phrase.
- "The config is loaded by the server" → "The server loads the config"
- "Events are forwarded to replicas" → "The coordinator forwards events to replicas"
- Keep passive only when the actor is unknown or irrelevant.

### 3. Strong verbs, no adverbs
An adverb is a verb you haven't found yet.
- "runs slowly" → "stalls"
- "quickly processes" → "processes"
- If no stronger verb exists, keep the adverb.

### 4. Delete qualifiers and hedges
Remove: *very, quite, somewhat, rather, fairly, essentially, basically, arguably, maybe, perhaps, appears to, tends to, could potentially, a bit, sort of, kind of*.
- If the sentence is false without the qualifier, rewrite the sentence — don't just delete the word.

### 5. Concrete nouns
Replace abstract categories with specific things. Signal words to watch: *solution, approach, initiative, framework, experience, value, requirements, functionality, ecosystem, posture, collaboration, improvement*.
- "implement a comprehensive solution" → "add a retry loop"
- "improve the developer experience" → "cut the build time to under 10 seconds"
- "handle edge cases" → "handle empty arrays and null values"

### 6. One idea per sentence
One main clause. Break at "and," "which," "that," or "but" when each side could stand alone.
- "The system fetches the config and then validates it, which can take up to 500ms." → "The system fetches the config. Validation takes up to 500ms."

### 7. Conditions before instructions
The reader needs to know whether to act before reading what to do. Pattern to fix: "do X if Y" → "if Y, do X".
- "If the cache is cold, run the warm-up script" — not "Run the warm-up script if the cache is cold."
- "If you observe quota exhaustion, reduce the burst limit." — not "Reduce the burst limit if you observe quota exhaustion."

### 8. Lead with the answer
Put the conclusion in the first sentence. Context and reasoning follow. Never bury the key finding.
Exception: do not restructure sections explicitly titled Background, Overview, Context, or How it works — these sections are intentionally ordered from context to conclusion.

### 9. Second person
Use "you" for instructions. Use the component name for system behavior.
- "You configure the server" — not "We recommend configuring" or "The user should configure"
- "The API returns 404" — not "A 404 will be returned"

### 10. Simple words

| Replace | With |
|---------|------|
| utilize | use |
| facilitate | help |
| initiate | start |
| terminate | stop or end |
| leverage | use |
| implement | build, add, or write |
| functionality | feature or behavior |
| in order to | to |
| due to the fact that | because |
| at this point in time | now |
| prior to | before |
| subsequent to | after |
| in the event that | if |
| it is worth noting that | (delete — just say the thing) |

### 11. No negative framing
State what to do, not what to avoid.
- "Use HTTPS" — not "Don't use HTTP"
- Exception: warnings, known failure modes, and safety-critical instructions.

### 12. Short paragraphs
2–4 sentences. One topic. Two ideas means two paragraphs.

### 13. Define or cut jargon
First use: add a brief inline definition. Second use: no definition needed. If a plain equivalent exists, use it throughout.

### 14. Measure, don't describe
Replace every subjective descriptor with a number or observable fact.
- "fast" → "under 100ms"
- "large" → "over 1GB"
- "improves performance" → "reduces latency by 40%"
- "easy to use" → (delete — let the design show it)

## Extended rules — opt-in, off by default

These two sit outside the core 14. Apply a rule only when its flag is present in the invocation — never infer intent to turn one on, and never apply one because the document "seems like" a fit.

### 15. No em dashes — flag `--no-em-dash`
Replace every em dash (—) with the punctuation the sentence actually needs. Never leave a bare hyphen where an em dash was doing grammatical work — pick the real replacement.
- "The API is fast — under 50ms — for reads." → "The API is fast (under 50ms) for reads."
- "Ship it — but test it first." → "Ship it, but test it first."
- "The migration failed — the schema had already changed." → "The migration failed. The schema had already changed."

### 16. No mid-document weakeners — flag `--no-weakeners`
Remove a sentence or clause that concedes uncertainty about a claim the document just made, when it sits outside a section explicitly labeled Limitations, Caveats, Risks, or Open questions. Distinct from Rule 4: Rule 4 deletes single hedge words inside an otherwise-confident sentence; this rule removes whole clauses that undercut the surrounding claim.
- Real risk information: don't delete it, relocate it. "The migration handles most cases, though we're honestly not sure about the edge cases with nested tenants." → move the nested-tenant risk into a Limitations section, state it as a fact there: "Nested-tenant migrations are unverified."
- Pure filler with no content: delete outright. "We think this should work, but who knows." → delete, or state the claim plainly if it belongs in the document at all.
- Signal phrases: *we're still figuring this out, take this with a grain of salt, no promises, could be wrong here, this might not hold up, don't quote us on this, fingers crossed*.

## Editing Process

1. Read the full document before changing anything.
2. Apply rules in order, 1 through 14. Earlier rules take priority when they conflict. Apply Rules 15/16 only if their flag was passed — apply them last, after the core 14, since they operate on clause- and punctuation-level content the core rules may have just rewritten.
3. Never change: code blocks, inline code, commands, variable names, URLs, proper nouns.
4. Do not add content. Cut, simplify, and restructure only.
5. Preserve all headings, lists, tables, and document structure.
6. Return the complete rewritten document. No preamble, no changelog, no commentary.

## Long Documents (over 500 words)

Spawn the `iceberg-edit` agent. Pass it the full document text, the intent string (if provided), and which extended-rule flags (if any) were passed. Return the agent's output verbatim as the final result.
