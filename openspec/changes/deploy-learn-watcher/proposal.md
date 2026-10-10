## Why

The application is ready to run but cannot be deployed with the repository as it stands. The compose project, image tags, and volumes are still named `birthday-platform` (a template leftover), CI is triggered on `main` while the repository lives on `master`, and images are delivered through GHCR, which we do not want to use. We need a repeatable deploy onto the existing VPS behind its host-level Caddy reverse proxy, under the new DuckDNS domain `learn-watcher-platform.duckdns.org`, so the TMDB-backed catalog can go live.

## What Changes

- Rename the project identity from `birthday-platform` to `learn-watcher-platform`: compose project name, app/migrator image tags and the `previous` tag, the compose network, the default database name, the npm package name, and the docs that mention them. The new database default becomes `watcher`.
- Add a non-secret build-time placeholder for `TMDB_ACCESS_TOKEN` to the `Dockerfile` build stage and to the CI build environment, because the variable is now required by the fail-fast schema and the build placeholders must stay in sync with it.
- Retarget CI to the `master` branch: change the workflow triggers from `main` to `master` so checks, build, and deploy actually run.
- Replace GHCR image delivery with direct SSH delivery: CI builds the app and migrator images, streams them to the host (`docker save | gzip | ssh ... docker load`), and then runs `scripts/deploy.sh` using local image tags instead of pulling from a registry.
- Document the host-side deploy steps for the new domain: the Caddy site block (with `flush_interval -1` so the SSE activity feed is not buffered), the `APP_ORIGIN` value, the DuckDNS A record, and the Google OAuth redirect URI.

## Capabilities

### New Capabilities

None. This change is tooling, packaging, and deployment configuration only; no product behavior or requirement changes.

### Modified Capabilities

None.

## Impact

- Deployment config: `docker-compose.yml`, `scripts/deploy.sh`, `Dockerfile`.
- CI/CD: `.github/workflows/ci-cd.yml` (branch trigger, no registry login, SSH image delivery, build env).
- Project metadata and docs: `package.json`, `package-lock.json`, `README.md`, `docs/07-deployment-observability.md`.
- Optional cosmetic rename: `src/core/db/pool.ts` (global key), `tests/integration/global-setup.ts` (test database name), `GUIDE.md` example reference.
- Notable breaking rename: the compose project, network, and volume names change, so an existing `birthday-platform` deployment's volume is not reused.
- Out of scope (host, not in the repository): `Caddyfile`, the host `.env`, DuckDNS, and the Google OAuth console.
