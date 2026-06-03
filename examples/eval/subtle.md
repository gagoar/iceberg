<!--
  Eval: subtle.md
  Length: ~190 words
  Violations: semantic rules only (5, 6, 7, 8, 13, 14) — NO mechanical violations
  No long sentences, no passive voice, no adverbs, no qualifiers, no complex words.
  Expected grade: C (weighted: ~16)

  Rule 5  — 2 violations (abstract nouns)             [MEDIUM]
  Rule 6  — 2 violations (compound sentences)         [MEDIUM]
  Rule 7  — 2 violations (instruction before condition) [LOW]
  Rule 8  — 1 violation  (buried answer)              [MEDIUM]
  Rule 13 — 2 violations (undefined jargon)           [MEDIUM]
  Rule 14 — 4 violations (vague descriptors)          [HIGH]
  Rules 1–4, 9–12 — 0 violations
-->

# Rate Limiting Guide

The rate limiting system has seen strong adoption since the v2 release. Several teams have integrated it into their pipelines, and the feedback has been positive. Based on this experience, you should enable rate limiting for all public endpoints.

Run the enable command and check the logs to verify the service started correctly.

The system uses a token bucket algorithm with configurable burst capacity. It improves throughput under high load and simplifies edge case handling. Configure the burst limit before deploying.

The retry policy uses exponential backoff with jitter, and it respects the Retry-After header when present. The client retries on a 429 response.

Reduce the alert window if you observe a high false positive rate. Enable strict mode if your service handles sensitive data.

Set the alert threshold based on your traffic profile. High-volume services need a lower threshold. Low-traffic services can use a more permissive configuration. Tune the sensitivity based on your baseline error rate.
