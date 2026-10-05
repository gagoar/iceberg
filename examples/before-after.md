# Before / After

A single paragraph showing what iceberg does: same content, before and after `/iceberg:edit`. Both grades come from running `/iceberg:score` on the text below.

---

## Before

> The configuration system was designed in order to facilitate the seamless management of environment-specific settings, and it essentially leverages a hierarchical override mechanism that is quite flexible and arguably one of the most comprehensive solutions available for handling the somewhat complex requirements of modern cloud deployments.

**Score:** Grade F (46 words, one sentence)
- Rule 1: one sentence at 46 words [HIGH]
- Rule 2: "was designed" [HIGH]
- Rule 4: "quite flexible", "somewhat complex", "arguably one of the most comprehensive" [MEDIUM]
- Rule 5: "solutions", "requirements" [MEDIUM]
- Rule 8: opens with the passive "was designed" instead of what the system does [MEDIUM]
- Rule 13: "hierarchical override mechanism" [MEDIUM]
- Rule 14: "seamless", "flexible", "comprehensive", "complex" [HIGH]

The scorer is a model, so exact violation counts vary between runs. The grade was F on both runs.

---

## After

> The configuration system manages environment-specific settings through a hierarchical override mechanism. Teams define values at the base level, then override them per environment. The mechanism handles hundreds of parameters across staging, production, and preview environments.

**Score:** Grade A (35 words, three sentences, 0 violations)

---

## What changed

- 1 sentence (46w) → 3 sentences (11w, 12w, 12w)
- Passive "was designed" → active "manages"
- Deleted: essentially, quite, arguably, somewhat, "in order to", "leverages", "facilitate"
- "comprehensive solutions" and "complex requirements" → "hundreds of parameters across staging, production, and preview environments"
