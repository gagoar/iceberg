# Blind review — cross-reference

Agent read only the project files with no conversation context.
Each finding classified: **New** / **Confirmed** / **Disagree**.

---

## HIGH — fix before release

| # | Finding | Class | Action |
|---|---------|-------|--------|
| 1 | `[DOCUMENT]` / `[INTENT]` placeholders in agents have no defined substitution protocol. The skills say "spawn the agent, pass the document" but never define the message format. | **New** | Document handoff pattern in agents |
| 2 | Rule 9 severity escalation with intent is promised in TESTING.md test 5 but no mapping exists in any prompt. Test 5 can never reliably pass. | **New** | Add intent→severity map to score agent |
| 3 | `skills/score/SKILL.md` says `allowed-tools: Read, Write` AND "read only — never modify the input." `Write` is needed for `.iceberg/last-score.txt` but the contradiction confuses the model. | **New** | Add a comment: "Write is for .iceberg/last-score.txt only — never for the scored document" |
| 4 | `clean.md` line 42: "You do not need to notify the team before rolling back" — negatively framed, Rule 11 violation. The fixture expects Grade A, but a working scorer should flag this. | **New** | Fix clean.md: rewrite line 42 to positive framing |
| 5 | Rule 7 fix ("do X if Y" pattern) was applied to `agents/iceberg-edit.md` and `agents/iceberg-score.md` but NOT to `skills/edit/SKILL.md`. Short documents (<500w) use the skill, not the agent — Rule 7 misses for short docs. | **Confirmed** | Apply Rule 7 fix to `skills/edit/SKILL.md` |

---

## MEDIUM — degrades quality

| # | Finding | Class | Action |
|---|---------|-------|--------|
| 6 | Rule 5 (concrete nouns) has no signal-word list. Rules 4 and 10 give explicit lists; Rule 5 gives only rewrite examples. Model applies it inconsistently on novel instances. | **New** | Add signal words: solution, approach, initiative, framework, experience, value, requirements, functionality, ecosystem, posture |
| 7 | Rule 8 (lead with answer) has no exception for intentional narrative sections (Background, Context, How it works). The edit agent will restructure all of them. | **New** | Add exception: "Do not apply to sections explicitly titled Background, Overview, Context, or How it works" |
| 8 | Grade scale uses raw violation counts, not density. A 2,000-word document with the same violation rate as a 100-word document gets a far worse grade. | **New** | Design decision: accept current behavior (per-document absolute count) or normalize per 100 words. Document the choice explicitly. |
| 9 | Rule 3 and Rule 4 overlap: "essentially", "simply", "basically" are both adverbs (R3) and qualifiers (R4). Scoring double-counts them; no deduplication instruction exists. | **New** | Add to score agent: "If a word triggers both Rule 3 and Rule 4, count it under Rule 4 only." |
| 10 | Rule 13 fix (exclude common abbreviations) applied to `agents/iceberg-score.md` but NOT to `skills/score/SKILL.md`. Short docs scored by the skill still over-flag. | **Confirmed** | Apply Rule 13 fix to `skills/score/SKILL.md` |
| 11 | `violations.md` Rule 3 paragraph mixes Rule 3 (adverbs) and Rule 4 (qualifiers) violations. "very" and "simply" are Rule 4; "quickly", "carefully", "silently" are Rule 3. Annotation count (~42 total) can't be verified rule-by-rule. | **New** | Separate Rule 3 and Rule 4 content into clean paragraphs; update annotation counts per rule |
| 12 | Rule 6 (compound sentence) and Rule 1 (long sentence) can both flag the same sentence. Score agent has no deduplication → inflated weighted count. | **New** | Add to score agent: "If a sentence violates both Rule 1 and Rule 6, count it under Rule 1 only." |
| 13 | `violations.md` Rule 11 section: 3 of 4 examples are safety warnings, which are the explicit exception to Rule 11 ("Don't skip the health check", "Avoid running migrations without a backup", "Never deploy on Fridays"). Only the HTTP example is a genuine violation. | **New** | Replace 3 Rule 11 examples with non-safety-critical negative framing |
| 14 | TESTING.md test 6 references `examples/before-after.md` — agent didn't see this file but it exists. | **Disagree** | No action — file exists |
| 15 | "rewrite this" in trigger list fires on "rewrite this function" (code). Skip rule runs inside the skill — the skill activates on code requests before it can skip. | **New** | Tighten trigger: "rewrite this" → "rewrite this document / rewrite this text / rewrite this paragraph" |
| 16 | Auto-trigger fires on plans, but the 50-word skip rule applies inside the skill. No instruction on what to do when auto-trigger fires on a skip-eligible document. Return silently? Note the skip? | **New** | Add: "If auto-triggered on a document under 50 words, return it unchanged with no comment." |
| 17 | Rule 2 agentless passive fix applied to `agents/iceberg-edit.md` but NOT to `skills/edit/SKILL.md`. Short docs edited by the skill miss agentless passives. | **Confirmed** | Apply Rule 2 agentless fix to `skills/edit/SKILL.md` |

---

## LOW — polish

| # | Finding | Class | Action |
|---|---------|-------|--------|
| 18 | No fallback if `.iceberg/` directory write fails (read-only FS, missing parent). Model either silently skips or halts with no instruction. | **New** | Add: "If .iceberg/last-score.txt cannot be written, skip silently and continue." |
| 19 | `iceberg-edit.md` has no `model:` pin. `iceberg-score.md` pins Haiku. If Haiku becomes the global default, the editor silently degrades without an explicit override. | **New** | Add `model: sonnet` to `agents/iceberg-edit.md` |
| 20 | Intent calibration defined three ways: "calibrate severity weights" (score skill), "calibrate severity weights" with one example (score agent), "honor the intent" (edit agent). Three behaviors, no single definition. | **New** | Define once in each agent, consistently: "Adjust severity weights — do not suppress rules entirely" |

---

## Summary

- **New findings:** 16 (findings 1–4, 6–13, 15–16, 18–20)
- **Confirmed (already known):** 3 (findings 5, 10, 17)
- **Disagree:** 1 (finding 14 — file exists, agent didn't see it)

**Immediate fixes (high impact, low effort):**
4 → fix clean.md Rule 11 violation
5 + 17 → apply agent fixes to skills (Rule 7, Rule 2)
10 → apply Rule 13 fix to score skill
11 + 13 → fix violations.md Rule 3 and Rule 11 sections
9 + 12 → add deduplication rules to score agent
19 → pin `model: sonnet` in iceberg-edit.md

**Design decisions needed (require agreement before implementing):**
8 → grade normalization by document length
2 → define intent→severity mapping concretely
