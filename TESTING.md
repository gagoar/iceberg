# Testing iceberg

Manual test checklist. Run after any change to skills or agents.

## 1. Trigger test

Say `check my writing` or `rate my writing` in a project with iceberg installed.

**Pass:** `/iceberg:score` fires without a slash command.
**Fail:** Claude does not recognize the intent.

## 2. Auto test

Ask Claude to write a plan or spec.

**Pass:** The score report appears automatically before the plan is returned.
**Fail:** Claude returns the plan without scoring it first.

## 3. Calibration test

```
/iceberg:score examples/violations.md
```

**Pass:** Grade F, all 14 rules flagged, each with at least 1 quoted violation.
**Fail:** Any rule has 0 violations, or the grade is above D.

## 4. False-positive test

```
/iceberg:score examples/clean.md
```

**Pass:** Grade A, ≤5 weighted violations, no HIGH violations.
**Fail:** Any HIGH violation flagged, or grade is below B.

## 5. Intent test

```
/iceberg:score examples/violations.md "conversational guide"
/iceberg:score examples/violations.md "formal engineering spec"
```

**Pass:** Same violations found in both runs. Severity weights differ — Rule 9 (second person) should be LOW for conversational, HIGH for formal.
**Fail:** Different violations found, or severity does not change with intent.

## 6. Edit test

```
/iceberg:edit examples/violations.md
```

Compare output to `examples/before-after.md`.

**Pass:** Long sentences split, passive voice converted, adverbs removed, abstract nouns made concrete.
**Fail:** Output contains sentences over 30 words, or passive voice from the original remains.

## 7. Model comparison (Haiku vs Sonnet)

Run each eval document with Haiku (the default) and record results in `examples/eval/results.md`.

```
/iceberg:score examples/eval/short-plan.md
/iceberg:score examples/eval/long-spec.md
/iceberg:score examples/eval/subtle.md
```

To test with Sonnet: temporarily change `model: haiku` to `model: sonnet` in `agents/iceberg-score.md`, re-run the same three commands, record results, then revert.

**Accept Haiku if:** grade matches Sonnet within one letter, and no HIGH rule (1, 2, 14) is missed on any document.

**`subtle.md` is the critical test.** It has zero mechanical violations — only semantic ones (rules 5, 6, 7, 8, 13, 14). If Haiku misses more than 2 of the 11 expected violations in that document, switch scoring back to Sonnet.

## Iterating on prompts

When a test fails, check which rule produced the wrong output. Edit the relevant rule section in:
- `agents/iceberg-score.md` — for scoring failures
- `agents/iceberg-edit.md` — for editing failures
- `skills/score/SKILL.md` or `skills/edit/SKILL.md` — for trigger failures

Re-run the failing test after each change. Use `examples/violations.md` as ground truth — it has known expected outputs annotated in the file header.
