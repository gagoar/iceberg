<!--
  Eval: short-plan.md
  Length: ~150 words
  Violations: 8 (mechanical rules only — 1, 2, 3, 4)
  Expected grade: C (weighted: ~16)

  Rule 1 — 2 violations (sentences >25 words)  [HIGH]
  Rule 2 — 2 violations (passive voice)         [HIGH]
  Rule 3 — 2 violations (adverbs)               [MEDIUM]
  Rule 4 — 2 violations (qualifiers)            [MEDIUM]
  Rules 5–14 — 0 violations
-->

# Cache Invalidation Plan

The cache invalidation system was designed to handle stale entries across multiple regions, and it operates by comparing timestamps between the primary store and the regional replicas.

The background worker detects stale entries every 5 minutes. The detection algorithm quickly scans all keys and silently marks any entry where the timestamp delta exceeds the configured threshold, which determines when an entry is refreshed from the primary store.

Invalidation events are forwarded to all replicas by the coordinator. Each replica acknowledges receipt before the coordinator clears the entry from the primary store.

This approach could potentially cause brief inconsistency windows during high write periods. The window is arguably small — under 200ms in most cases — but it is worth monitoring in production.
