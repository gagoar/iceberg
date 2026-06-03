# Before / After

A single paragraph showing what iceberg does — same content, before and after `/iceberg:edit`.

---

## Before

> The configuration system was designed in order to facilitate the seamless management of environment-specific settings, and it essentially leverages a hierarchical override mechanism that is quite flexible and arguably one of the most comprehensive solutions available for handling the somewhat complex requirements of modern cloud deployments, which tend to have very large numbers of configuration parameters that need to be carefully managed across multiple environments.

**Violations:** 8 total (weighted: 12)
- Rule 1 — 1 sentence at 67 words [HIGH]
- Rule 2 — "was designed" [HIGH]
- Rule 3 — essentially, carefully, quite, very [MEDIUM]
- Rule 4 — arguably, tends to, somewhat [MEDIUM]
- Rule 5 — "comprehensive solutions", "complex requirements" [MEDIUM]
- Rule 10 — "in order to", "leverage", "facilitate" [LOW]

**Score:** Grade D (weighted: 12)

---

## After

> The configuration system manages environment-specific settings through a hierarchical override mechanism. You define values at the base level, then override them per environment. This works well for deployments with hundreds of configuration parameters across staging, production, and preview environments.

**Score:** Grade A (weighted: 2)
- Rule 1 — 0 violations (longest sentence: 18 words)
- All other rules — 0 violations

---

## What changed

- 1 sentence (67w) → 3 sentences (18w, 12w, 19w)
- Passive "was designed" → active "manages"
- Deleted: essentially, carefully, quite, very, arguably, tends to, somewhat
- "in order to" → (removed), "leverage" → (removed), "facilitate" → "manages"
- "comprehensive solutions" → specific mechanism described, "complex requirements" → "hundreds of configuration parameters"
