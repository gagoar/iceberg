<!-- Expected: Grade A | ≤5 weighted violations | no false positives -->

# Deployment Guide

## Before you start

Check two things before deploying:

1. All integration tests pass on the staging branch.
2. The on-call engineer is available.

If either condition fails, stop. Fix it first.

## Deploy

Run the deploy script:

```
./scripts/deploy.sh --env production
```

The script does three things in order: validates the artifact, migrates the database, then starts the new containers. Each step must complete before the next begins. If any step fails, the script stops and prints the error.

Migration takes up to 90 seconds on a cold database. The script waits automatically.

## Verify

After the script exits, check the service health:

```
./scripts/healthcheck.sh --env production
```

You should see `status: healthy` within 30 seconds. If the check fails after 60 seconds, run the rollback:

```
./scripts/rollback.sh --env production
```

## Rollback

The rollback script restores the previous artifact and re-runs migrations in reverse. It takes under 2 minutes. Roll back first, then post in #deployments.

## Configuration

The deploy reads from `config/production.yml`. Three values require a restart if changed:

- `database.pool_size` — maximum concurrent connections (default: 20)
- `cache.ttl` — cache entry lifetime in seconds (default: 300)
- `workers.count` — background job threads (default: 4)

All other config changes take effect without a restart.
