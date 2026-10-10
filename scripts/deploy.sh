#!/usr/bin/env bash
# Deploy with rollback. Runs on the target host (invoked by CI, or locally).
#
# Steps: save previous -> deliver -> migrate -> up, with rollback to the
# previous image on any failure.
#
# Environment:
#   IMAGE_REF          new app image reference (default: nothing to pull)
#   MIGRATE_IMAGE_REF  new migrator image reference
#   APP_IMAGE          local tag for the app image (default: learn-watcher-platform:latest)
#   PREV_IMAGE         local tag holding the previous image (default: learn-watcher-platform:previous)
#   MIGRATE_IMAGE      local tag for the migrator image (default: learn-watcher-platform-migrate:latest)
#   COMPOSE_FILE       compose file (default: docker-compose.yml)
#   COMPOSE_PROJECT    compose project name (default: learn-watcher-platform)
#   DRY_RUN=1          print commands instead of running them
#   SIMULATE_FAILURE=1 force a failure to exercise the rollback path

set -euo pipefail

DRY_RUN="${DRY_RUN:-0}"
SIMULATE_FAILURE="${SIMULATE_FAILURE:-0}"
IMAGE_REF="${IMAGE_REF:-}"
MIGRATE_IMAGE_REF="${MIGRATE_IMAGE_REF:-}"
APP_IMAGE="${APP_IMAGE:-learn-watcher-platform:latest}"
PREV_IMAGE="${PREV_IMAGE:-learn-watcher-platform:previous}"
MIGRATE_IMAGE="${MIGRATE_IMAGE:-learn-watcher-platform-migrate:latest}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"
COMPOSE_PROJECT="${COMPOSE_PROJECT:-learn-watcher-platform}"

run() {
  if [ "$DRY_RUN" = "1" ]; then
    echo "[dry-run] $*"
  else
    "$@"
  fi
}

rollback() {
  echo "!! deploy failed — rolling back to previous image"
  if [ "$DRY_RUN" = "1" ]; then
    echo "[dry-run] docker tag ${PREV_IMAGE} ${APP_IMAGE}"
    echo "[dry-run] docker compose -f ${COMPOSE_FILE} up -d --no-build app"
    return 0
  fi
  docker tag "$PREV_IMAGE" "$APP_IMAGE" || true
  docker compose -f "$COMPOSE_FILE" up -d --no-build app || true
}

trap 'rollback' ERR

echo "== 1/4 save previous =="
run docker tag "$APP_IMAGE" "$PREV_IMAGE" || true

echo "== 2/4 deliver =="
if [ -n "$IMAGE_REF" ]; then
  run docker pull "$IMAGE_REF" || true
  run docker tag "$IMAGE_REF" "$APP_IMAGE" || true
fi
if [ -n "$MIGRATE_IMAGE_REF" ]; then
  run docker pull "$MIGRATE_IMAGE_REF" || true
  run docker tag "$MIGRATE_IMAGE_REF" "$MIGRATE_IMAGE" || true
fi

echo "== 3/4 migrate =="
if [ "$SIMULATE_FAILURE" = "1" ]; then
  echo "simulated migration failure"
  false
fi
# Load the host .env so `-e DATABASE_URL` has a value over a plain SSH invocation.
if [ -f ./.env ]; then
  set -a
  . ./.env
  set +a
fi
run docker run --rm --network "${COMPOSE_PROJECT}_default" \
  -e DATABASE_URL "$MIGRATE_IMAGE"

echo "== 4/4 up =="
run docker compose -f "$COMPOSE_FILE" up -d --no-build

echo "deploy complete"
