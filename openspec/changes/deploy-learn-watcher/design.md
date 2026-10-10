## Context

See `proposal.md` for motivation. Current state that shapes the approach:

- `docker-compose.yml` hardcodes the legacy identity: `name: birthday-platform` (which derives the compose network `birthday-platform_default` and volume `birthday-platform_db_data`), `image: birthday-platform:${IMAGE_TAG:-latest}`, and `${POSTGRES_DB:-birthday}`.
- `scripts/deploy.sh` defaults to the same names (`APP_IMAGE`, `PREV_IMAGE`, `MIGRATE_IMAGE`, `COMPOSE_PROJECT`) and always runs a migrator container with `-e DATABASE_URL`, but it never loads the host `.env`; Compose itself auto-loads `.env` for interpolation on `up`, so the migrate step is the gap.
- `.github/workflows/ci-cd.yml` triggers on `main`, but the repository's only branch is `master`; the `build` job logs into GHCR and the `deploy` job pulls by `IMAGE_REF`.
- `Dockerfile` and the CI `build` step set non-secret build-time placeholders for every required env var **except** `TMDB_ACCESS_TOKEN`, which was added as required (`src/core/config/env.ts:11`) by the `tmdb-catalog` change.
- The app binds `127.0.0.1:3000` and expects a host-level TLS terminator; `src/app/api/feed/stream/route.ts` serves an SSE stream (`text/event-stream`).
- Host `Caddy`, the host `.env`, DuckDNS, and the Google OAuth console live outside this repository.
- The old deployment on the VPS is being shut down, so port `127.0.0.1:3000` and the database volume are free; there is no data to migrate.

## Goals / Non-Goals

**Goals:**

- A deployable, correctly named project (`learn-watcher-platform`) with a CI/CD path that runs on `master` and delivers images straight to the host over SSH without a registry.
- The host-side steps for `learn-watcher-platform.duckdns.org` (Caddy TLS, `APP_ORIGIN`, DNS, OAuth redirect) documented so the deployment is reproducible.
- Make the migration path and SSE streaming work behind the proxy, not just the happy path.

**Non-Goals:**

- Any change to application runtime behavior, API, data model, or product requirements (hence `skip_specs: true`).
- Preserving the previous `birthday-platform` volume or data.
- Automated provisioning of the VPS, Caddy installation, DuckDNS client, or Google Cloud project.
- Renaming the Git branch (we retarget CI to `master` instead).

## Decisions

### Rename the identity to `learn-watcher-platform`

Change `docker-compose.yml` `name`, the app image tag, the migrator tag (`learn-watcher-platform-migrate`), the `previous` tag, the default database name (`watcher`), `package.json`/`package-lock.json` `name`, `scripts/deploy.sh` defaults, and the docs. The `name:` change also renames the network and volume (`learn-watcher-platform_default`, `learn-watcher-platform_db_data`), which is why a fresh volume is acceptable here. Alternative: keep the name and only change image tags — rejected; the project/volume names would still collide with any other template-derived stack and the user asked for the rename.

### Retarget CI to `master`

Change the `push`/`if` branch filters from `main` to `master` in `.github/workflows/ci-cd.yml`. Alternative: rename the branch to `main` — rejected as unnecessary history/PR churn for a solo repository.

### Deliver images over SSH instead of GHCR

The `build` job builds the `runner` and `migrator` targets on the runner (`docker/build-push-action` with `load: true`), then streams both to the host:

```
docker save <app> <migrate> | gzip | ssh <host> 'gunzip | docker load'
```

The `deploy` job then runs `scripts/deploy.sh` with empty `IMAGE_REF`/`MIGRATE_IMAGE_REF` and local `APP_IMAGE`/`MIGRATE_IMAGE` tags; the `deliver` step becomes a no-op because the tags already exist. `buildx` GHA cache is still used so rebuilds stay fast. Alternatives: GHCR (explicitly declined), build on the VPS (heavier host, slower, needs source and toolchain there) — rejected.

### Make `scripts/deploy.sh` load the host `.env`

Add `set -a; . ./.env; set +a` (guarded by an existence check) before the migrate run so `-e DATABASE_URL` receives a value over a plain SSH invocation. Alternative: pass `--env-file .env` to the `docker run` — equivalent; sourcing also matches how an operator runs the script locally. This fixes a latent bug: today CI never supplies `DATABASE_URL` to the migrate container.

### Add `TMDB_ACCESS_TOKEN` build placeholder

Add a non-secret dummy to the `Dockerfile` `build` stage and to the CI `build` env, matching the existing placeholder set, so the now-required variable cannot break `next build`. Runtime still receives the real value from the host `.env`.

### Caddy terminates TLS for the new domain

Replace the (now unused) site block in the host `Caddyfile` with:

```caddyfile
learn-watcher-platform.duckdns.org {
    reverse_proxy 127.0.0.1:3000 {
        flush_interval -1
    }
}
```

Caddy obtains and renews the Let's Encrypt certificate automatically once the DuckDNS A record points at the VPS, ports 80/443 are reachable, and the hostname in the block matches the DNS name. `flush_interval -1` disables response buffering so the SSE feed streams. Apply with `sudo caddy validate` then `sudo systemctl reload caddy` (graceful, no downtime). The app is reached only through this proxy; `APP_ORIGIN=https://learn-watcher-platform.duckdns.org` makes `auth.ts` mark the session cookie `Secure`, and the Google OAuth client gets a new redirect URI `https://learn-watcher-platform.duckdns.org/api/auth/callback/google`. Alternative: Caddy serving both old and new domains — rejected; the old stack is retired.

## Risks / Trade-offs

- [Streaming both images over SSH is slow on every deploy] -> gzip + buildx layer cache; only changed layers rebuild.
- [New compose project name creates an empty volume, so first boot has no schema] -> the deploy sequence runs migrations before `up`; the runbook states the first deploy must include the migrate step.
- [Caddy cannot obtain a cert if DNS/ports are wrong, and LE has rate limits] -> verify the A record resolves to the VPS and 80/443 are open before reloading; keep the hostname fixed.
- [`.env` still not on the host at first deploy] -> creating the host `.env` with `APP_ORIGIN` and the real `TMDB_ACCESS_TOKEN` is an explicit prerequisite step in the runbook.
- [Renaming `package.json`/lock name is cosmetic but touches the lockfile] -> change only the `name` fields; do not regenerate dependencies.

## Migration Plan

1. Apply the repository changes (rename, CI retarget, SSH delivery, build placeholder, deploy.sh `.env` load, docs).
2. On the host: create `.env` (`APP_ORIGIN`, `DATABASE_URL`/`POSTGRES_*`, secrets, `OAUTH_*`, `TMDB_ACCESS_TOKEN`), retire the old stack, and update the `Caddyfile`.
3. Point the DuckDNS A record at the VPS and reload Caddy; confirm `https://learn-watcher-platform.duckdns.org/api/health` returns `200`.
4. Push to `master`; CI builds and streams the images, then runs `save previous -> migrate -> up`.
5. Rollback: `scripts/deploy.sh` keeps the previous image and restores it via its `ERR` trap; manual `docker tag ..._previous ...:latest && docker compose up -d --no-build app` also works.

## Open Questions

None blocking. The exact `.env` secret values and DuckDNS token are operational inputs supplied on the host.
