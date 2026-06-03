# Model comparison results

Run `/iceberg:score` on each document with Haiku (default) and Sonnet (change `model:` in `agents/iceberg-score.md`). Record results below.

**Accept Haiku if:** grade matches Sonnet within one letter, and no HIGH rule (1, 2, 14) is missed.

| Document | Expected | Haiku grade | Haiku weighted | Sonnet grade | Sonnet weighted | Verdict |
|----------|----------|-------------|---------------|--------------|-----------------|---------|
| short-plan.md | C | B | 10 | B | 14 | ✓ same grade |
| long-spec.md | D | D | 38.5 | D | ~38 | ✓ same grade |
| subtle.md | C | C | 24.5 | C | ~17 | ✓ same grade |

**Verdict: Haiku is acceptable for grade-level scoring.**
All three documents matched Sonnet's grade exactly. No HIGH rule was missed on any document.

---

## Observations

### Rule 7 — Condition order (both models)
Neither Haiku nor Sonnet caught the two Rule 7 violations in `subtle.md`:
- "Reduce the alert window if you observe a high false positive rate."
- "Enable strict mode if your service handles sensitive data."

Both have the instruction before the condition ("do X if Y" — should be "if Y, do X").
Rule 7 is the weakest rule in the scorer. The scoring prompt needs clearer examples.

**Fix:** Add explicit examples to the Rule 7 section in `agents/iceberg-score.md`:
> Violation: "Reduce X if Y." → Correct: "If Y, reduce X."

### Rule 13 — Jargon (Haiku overcounts)
On `long-spec.md`, Haiku flagged `YAML`, `HTTP`, `Prometheus`, `OpenTelemetry`, and `gRPC`
as undefined jargon. These are standard technical terms any engineer knows.
Sonnet was more conservative.

**Fix:** Add a note to the scoring prompt: "Do not flag universally known technical
abbreviations (HTTP, YAML, JSON, SQL, API). Flag domain-specific terms a new team member
would not know."

### Rule 3 — Adverbs (Haiku overcounts)
On `long-spec.md`, Haiku flagged `linearly` ("scales linearly"), `approximately`, and
`currently` as adverb violations. These are precise or quantifying adverbs, not weak ones.
The rule targets adverbs masking weak verbs (e.g., "runs slowly" → "stalls").

**Fix:** Add to the Rule 3 prompt: "Do not flag quantifying adverbs (linearly, approximately,
exactly) or temporal adverbs (currently, previously). Flag only adverbs that mask a weak verb."

### Rule 2 — Passive voice (Haiku undercounts)
On `short-plan.md`, Haiku found 1 passive construction; Sonnet found 2–3.
Haiku missed: "Invalidation events are forwarded to all replicas by the coordinator."
This is a clear passive construction. Haiku may skip passive forms without an explicit "by" agent.

**Fix:** Add to the Rule 2 prompt: "Flag all passive constructions, including those without
an explicit 'by' agent: 'are forwarded', 'is configured', 'was built'."

---

## Prompt fixes queued

1. Rule 7: add violation example ("do X if Y" pattern)
2. Rule 13: exclude common technical abbreviations
3. Rule 3: exclude quantifying and temporal adverbs
4. Rule 2: explicitly include agentless passives
