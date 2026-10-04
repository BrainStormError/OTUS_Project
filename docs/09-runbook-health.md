# 09. Runbook: health, readiness, and uptime monitoring

## Endpoint

`GET /api/health` is the single readiness probe.

- `200 { "status": "ok" }` — the database answered within the bounded timeout
  (`HEALTH_TIMEOUT_MS = 2000`).
- `503 { "status": "unavailable" }` — the database is unreachable or exceeded the
  timeout; a `warn` entry `readiness` is written to stdout.

The route is dynamic (`export const dynamic = 'force-dynamic'`) so it is never
statically cached.

## External uptime monitor

1. Point an external uptime monitor at `https://<app-origin>/api/health`.
2. Alert when the endpoint returns a status other than `200`, or when the
   response body's `status` is not `ok`.
3. Use a 30–60s interval with a 5s timeout; two consecutive failures raise a
   page.
4. Because the endpoint reports database reachability, an alert here means
   "the instance cannot serve traffic", not merely "the process is down".

## Local checks

```bash
curl -fsS http://127.0.0.1:3000/api/health   # expect {"status":"ok"}
```

Stop the database (for example `docker compose stop db`) and repeat: the
endpoint returns `503` with `{"status":"unavailable"}` and logs a warning.

## Docker Compose

`docker-compose.yml` wires a database healthcheck (`pg_isready`), makes the app
`depends_on: db: condition: service_healthy`, and probes the app itself through
`/api/health`. The app port is bound to loopback (`127.0.0.1:3000`) and is meant
to sit behind a reverse proxy that terminates TLS.
