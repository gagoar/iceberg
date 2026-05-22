---
name: edit
description: >
  Apply Hemingway writing rules to any technical document — plans, specs, proposals, READMEs,
  or any prose Claude generates.

  Trigger on: /iceberg:edit <file-path>, /iceberg:edit with pasted text, or automatically
  on every plan and output document Claude writes before returning it to the user.

  Rewrites with inline replacements. No annotations. No changelog. Returns only the clean document.

  For documents over 500 words, spawn an Agent subagent to preserve the main context window.
argument-hint: "[file-path or paste text]"
allowed-tools: Read, Write
---

# Iceberg Editor

Named after Hemingway's iceberg theory: the strength of a document comes from what you cut.

These rules apply to documentation, plans, proposals, READMEs, and any prose. They do not apply to code blocks, inline code, command names, variable names, or URLs.

## Input

- `/iceberg:edit <file-path>` — read the file, apply rules, write it back in place
- `/iceberg:edit` — user pastes text; return the rewritten version
- Automatic — apply to every plan or output document before returning it

## The 14 Rules

### 1. Short sentences
Target 15–20 words. At 25 words, find a split point. At 30 words, split unconditionally. Break at conjunctions, relative clauses, or participial phrases.

### 2. Active voice
Find the actor. Make it the subject.
- "The config is loaded by the server" → "The server loads the config"
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
Replace abstract categories with specific things.
- "implement a comprehensive solution" → "add a retry loop"
- "improve the developer experience" → "cut the build time to under 10 seconds"
- "handle edge cases" → "handle empty arrays and null values"

### 6. One idea per sentence
One main clause. Break at "and," "which," "that," or "but" when each side could stand alone.
- "The system fetches the config and then validates it, which can take up to 500ms." → "The system fetches the config. Validation takes up to 500ms."

### 7. Conditions before instructions
The reader needs to know whether to act before reading what to do.
- "If the cache is cold, run the warm-up script" — not "Run the warm-up script if the cache is cold."

### 8. Lead with the answer
Put the conclusion in the first sentence. Context and reasoning follow. Never bury the key finding.

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

## Editing Process

1. Read the full document before changing anything.
2. Apply rules in order, 1 through 14. Earlier rules take priority when they conflict.
3. Never change: code blocks, inline code, commands, variable names, URLs, proper nouns.
4. Do not add content. Cut, simplify, and restructure only.
5. Preserve all headings, lists, tables, and document structure.
6. Return the complete rewritten document. No preamble, no changelog, no commentary.

## Long Documents (over 500 words)

Spawn an Agent subagent with this prompt. Return the agent's output as the final result.

---

Apply these 14 Hemingway writing rules to the document below. Return only the rewritten document. No preamble, no changelog, no commentary.

Rules:
1. Sentences 20 words or fewer. Split unconditionally at 30.
2. Active voice. Convert passive unless the actor is unknown.
3. Strong verbs. Delete adverbs.
4. Delete qualifiers: very, quite, somewhat, arguably, tends to, could potentially.
5. Concrete nouns. Replace abstractions with specific things.
6. One idea per sentence. Break compound sentences.
7. Conditions before instructions.
8. Lead with the answer. Context follows.
9. Second person for instructions. Component name for system behavior.
10. Simple words: utilize→use, facilitate→help, leverage→use, implement→build or add or write, in order to→to.
11. No negative framing. State what to do.
12. Paragraphs four sentences or fewer.
13. Define technical terms on first use. Cut if a plain equivalent exists.
14. Measure, don't describe. Replace fast/large/easy with numbers or observable facts.

Do not change: code blocks, inline code, commands, variable names, URLs, proper nouns.

Document:
[paste full document here]

---
