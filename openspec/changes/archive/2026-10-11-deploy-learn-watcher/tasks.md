## 1. Rename project identity to learn-watcher-platform

- [x] 1.1 In `docker-compose.yml` set `name: learn-watcher-platform`, `image: learn-watcher-platform:${IMAGE_TAG:-latest}`, `${POSTGRES_DB:-watcher}`, and the database segment of `DATABASE_URL` to `watcher`; verify with `docker compose config` showing the new project name, image, and `db:5432/watcher`
- [x] 1.2 Set `name` to `learn-watcher-platform` in `package.json` and `package-lock.json` (both occurrences); verify with `npm pkg get name` and that the lockfile top-level `name` matches
- [x] 1.3 Update the defaults and comments in `scripts/deploy.sh` (`APP_IMAGE`, `PREV_IMAGE`, `MIGRATE_IMAGE`, `COMPOSE_PROJECT`) to `learn-watcher-platform`; verify with `DRY_RUN=1 bash scripts/deploy.sh` printing `learn-watcher-platform:latest`, `learn-watcher-platform:previous`, `learn-watcher-platform-migrate:latest`, and network `learn-watcher-platform_default`
- [x] 1.4 (Optional, cosmetic) Rename the `__birthdayPool` global key in `src/core/db/pool.ts`, the `birthday_test` database in `tests/integration/global-setup.ts`, and the `@/modules/birthdays/service` example in `GUIDE.md`; verify with `npm run typecheck` and `npm run deps:check` passing

## 2. Keep build placeholders in sync with the required env

- [x] 2.1 Add a non-secret `ENV TMDB_ACCESS_TOKEN=build-tmdb-token` to the `build` stage of `Dockerfile`; verify the image build target succeeds with `docker build --target build .` (or `npm run build` with the placeholder set)
- [x] 2.2 Add `TMDB_ACCESS_TOKEN: build-tmdb-token` to the `Build` step `env` in `.github/workflows/ci-cd.yml`; verify the CI `Build` step (or a local `npm run build` with that env) completes without a configuration error

## 3. Retarget CI to master and deliver images over SSH

- [x] 3.1 Change the `on.push.branches` and the `if: github.ref == 'refs/heads/main'` conditions in `.github/workflows/ci-cd.yml` from `main` to `master`; verify no `refs/heads/main` reference remains and a push to `master` starts the workflow in Actions
- [x] 3.2 Remove the GHCR login/metadata/push steps and build the `runner` and `migrator` targets locally with `load: true`; verify the build job ends with both `learn-watcher-platform` and `learn-watcher-platform-migrate` images present (`docker images`) and no registry step in the job
- [x] 3.3 Add an SSH delivery step (`docker save <app> <migrate> | gzip | ssh ... 'gunzip | docker load'`) and make the deploy job run `scripts/deploy.sh` with empty `IMAGE_REF`/`MIGRATE_IMAGE_REF` and local `APP_IMAGE`/`MIGRATE_IMAGE`; verify an end-to-end run loads the images on the host and completes `save previous -> migrate -> up`

## 4. Fix migration env for the SSH deploy path

- [x] 4.1 In `scripts/deploy.sh`, load the host `.env` (guarded `set -a; . ./.env; set +a`) before the migrator `docker run`, so `-e DATABASE_URL` has a value over a plain SSH invocation; verify with `DRY_RUN=1` against a temporary `.env` showing `DATABASE_URL` forwarded, and a real run applying migrations

## 5. Update documentation

- [x] 5.1 Update `README.md` deploy/rollback sections to the new image/tag names and the SSH delivery flow (no GHCR); verify the documented commands match `scripts/deploy.sh`
- [x] 5.2 Update `docs/07-deployment-observability.md` image/project names, add the `learn-watcher-platform` compose rationale, and note the host `.env`, `APP_ORIGIN`, Caddy block with `flush_interval -1`, and the empty-volume first deploy; verify `npm run verify:env` still passes and the described names match the compose file

## 6. Host runbook (manual, outside the repository)

- [ ] 6.1 On the VPS create `.env` with `APP_ORIGIN=https://learn-watcher-platform.duckdns.org`, `DATABASE_URL`/`POSTGRES_*`, `SESSION_SECRET`, `REGISTRATION_TICKET_SECRET`, Google `OAUTH_CLIENT_ID`/`SECRET`, and `TMDB_ACCESS_TOKEN` set to the **API Read Access Token** (the long `eyJ...` value); verify the app container stays up and `curl -fsS http://127.0.0.1:3000/api/health` returns `{"status":"ok"}`
- [ ] 6.2 Retire the old stack and replace the `Caddyfile` site block with the `learn-watcher-platform.duckdns.org` block proxying `127.0.0.1:3000` with `flush_interval -1`; verify `sudo caddy validate --config /etc/caddy/Caddyfile` succeeds, `sudo systemctl reload caddy` reports no errors, and `journalctl -u caddy` shows the certificate obtained
- [ ] 6.3 Point the DuckDNS `learn-watcher-platform` A record at the VPS and ensure ports 80 and 443 are open; verify `nslookup learn-watcher-platform.duckdns.org` returns the VPS IP and `curl -I https://learn-watcher-platform.duckdns.org/api/health` returns `200` over a valid certificate
- [ ] 6.4 Add `https://learn-watcher-platform.duckdns.org/api/auth/callback/google` to the Google OAuth client's authorized redirect URIs; verify a Google sign-in completes and the session cookie is `Secure`
