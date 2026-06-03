<!--
  Eval: long-spec.md
  Length: ~620 words (triggers the iceberg-score subagent path)
  Violations: 18 across all 14 rules
  Expected grade: D (weighted: ~38)

  Rule 1  — 3 violations (sentences >25 words)  [HIGH]
  Rule 2  — 2 violations (passive voice)         [HIGH]
  Rule 3  — 2 violations (adverbs)               [MEDIUM]
  Rule 4  — 2 violations (qualifiers)            [MEDIUM]
  Rule 5  — 2 violations (abstract nouns)        [MEDIUM]
  Rule 6  — 1 violation  (compound sentence)     [MEDIUM]
  Rule 7  — 1 violation  (condition after inst.) [LOW]
  Rule 8  — 1 violation  (buried answer)         [MEDIUM]
  Rule 9  — 1 violation  (second person)         [LOW]
  Rule 10 — 2 violations (complex words)         [LOW]
  Rule 11 — 1 violation  (negative framing)      [LOW]
  Rule 12 — 1 violation  (long paragraph)        [LOW]
  Rule 13 — 2 violations (undefined jargon)      [MEDIUM]
  Rule 14 — 2 violations (vague descriptors)     [HIGH]
-->

# Observability Platform Specification

## Overview

The observability platform was designed in order to facilitate the comprehensive collection, aggregation, and visualization of telemetry data from distributed systems. It enables teams to improve their operational posture and implement better monitoring solutions across their infrastructure.

## Architecture

The platform consists of three components: the collector, the aggregator, and the dashboard. Telemetry data is received by the collector from instrumented services over gRPC or HTTP. The collector quickly parses incoming payloads and essentially forwards them to the aggregator for processing.

The aggregator applies a configurable pipeline of transforms. Each transform stage receives events from the previous stage, applies a function, and forwards results to the next stage, which allows teams to build flexible processing chains without modifying the core system.

## Data Collection

The collector supports three ingestion protocols: OpenTelemetry, Prometheus scrape, and a custom JSON format. OpenTelemetry is the preferred protocol for new integrations. Use the JSON format only for legacy systems that cannot be instrumented directly, because it lacks structured metadata and requires manual schema mapping.

The collection interval is configurable per-source. The default is 15 seconds. High-frequency sources can reduce this to 1 second. Don't set the interval below 1 second — the aggregator will drop excess data under high load.

The platform utilizes a push model for OpenTelemetry and a pull model for Prometheus. We recommend configuring push for all new services since it reduces coupling between the platform and service deployments.

## Storage

Metrics are stored in a time-series database with a configurable retention window. The default retention is 30 days. Log data is stored separately in object storage with a 90-day default. Both retention windows can be extended per-tenant through the admin API.

The platform achieves high throughput and scales well under load. Storage compression ratios are good in practice, typically achieving 10:1 on metric data and 3:1 on log data.

## Alerting

Alert rules are defined in YAML and evaluated every 30 seconds by the alert engine. Each rule specifies a PromQL expression, a threshold, and a severity level.

The alert engine uses a state machine with three states: firing, pending, and resolved. An alert enters the pending state when the condition is first met. It transitions to firing after the configured for duration. It transitions to resolved when the condition clears.

The alert engine, the notification router, and the deduplication layer together form the critical path for alert delivery. Alert fatigue becomes a concern when teams configure rules with low thresholds and short for durations — tune carefully.

## Installation

Install the collector on each host using the provided Helm chart. Configure the aggregator endpoint in `values.yaml` before deploying. After deployment, verify the collector is sending data by checking the aggregator's intake metrics at `http://aggregator:9090/metrics`.

The Helm chart includes a default ConfigMap for common configurations. Override individual values using `--set` flags rather than modifying the ConfigMap directly, because ConfigMap changes require a pod restart to take effect.

## Limitations

The platform does not currently support multi-tenancy at the collector level. All data from a single collector is attributed to one tenant. If you need per-service isolation on a shared host, deploy a separate collector per service.

Real-time alerting requires the aggregator to maintain state in memory. Memory usage scales linearly with the number of active alert rules. Each rule consumes approximately 2MB of aggregator memory.
