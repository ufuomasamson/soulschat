#!/usr/bin/env bash
# SoulsChat Contabo VPS deploy script.
# Safe defaults: staged build in a sibling directory, preserve .env.local,
# restart only the PM2 process named "soulschat".
#
# This is NOT zero-downtime. There is a short disruption window while
# build artifacts are swapped and PM2 restarts the process.
#
# After promotion begins, failures restore previous .next and node_modules
# (when backups exist) and restart only "soulschat". This is best-effort
# recovery, not a full automatic rollback of the git tree.

set -euo pipefail

readonly EXPECTED_USER="serveradmin"
readonly LIVE_DIR="/home/serveradmin/soulschat"
readonly STAGING_DIR="/home/serveradmin/soulschat-build"
readonly NODE_BIN_DIR="/www/server/nodejs/v24.18.0/bin"
readonly NPM_CACHE_DIR="/home/serveradmin/.npm-cache"
readonly PM2_APP_NAME="soulschat"
readonly APP_PORT="3002"
readonly ENV_FILE=".env.local"
readonly NEXT_BACKUP="${LIVE_DIR}/.next.previous"
readonly MODULES_BACKUP="${LIVE_DIR}/node_modules.previous"

# 0 = not yet promoting live artifacts; 1 = promotion/health window active
PROMOTION_STARTED=0
RECOVERY_ATTEMPTED=0

log() {
  printf '[deploy] %s\n' "$*"
}

# True when HTTP status is 2xx or 3xx (auth redirects like 307 are OK).
is_healthy_http_status() {
  [[ "${1:-}" =~ ^[23][0-9][0-9]$ ]]
}

cleanup_staging() {
  if [[ -d "${LIVE_DIR}/.git" ]]; then
    git -C "${LIVE_DIR}" worktree remove --force "${STAGING_DIR}" >/dev/null 2>&1 || true
  fi
  rm -rf "${STAGING_DIR}"
}

cleanup_backups() {
  rm -rf "${NEXT_BACKUP}" "${MODULES_BACKUP}"
}

manual_intervention() {
  printf '[deploy] ERROR: %s\n' "$*" >&2
  printf '[deploy] ERROR: MANUAL INTERVENTION REQUIRED.\n' >&2
  printf '[deploy] ERROR: Live app files may be inconsistent. Inspect %s,\n' "${LIVE_DIR}" >&2
  printf '[deploy] ERROR: check backups %s and %s if present,\n' "${NEXT_BACKUP}" "${MODULES_BACKUP}" >&2
  printf '[deploy] ERROR: verify %s still exists, then restart only PM2 process "%s".\n' \
    "${LIVE_DIR}/${ENV_FILE}" "${PM2_APP_NAME}" >&2
  printf '[deploy] ERROR: Do not run "pm2 restart all".\n' >&2
}

# Restore previous live artifacts after a failed promotion, then restart soulschat only.
# Supports partial backup: restores whichever backups exist and leaves untouched
# live dirs that were not moved yet.
restore_previous_release() {
  RECOVERY_ATTEMPTED=1
  # Avoid ERR-trap recursion while recovering.
  set +e
  trap - ERR

  log "promotion failed; restoring previous .next and node_modules"

  local restore_ok=1

  if [[ -d "${NEXT_BACKUP}" ]]; then
    rm -rf "${LIVE_DIR}/.next"
    if ! mv "${NEXT_BACKUP}" "${LIVE_DIR}/.next"; then
      restore_ok=0
      printf '[deploy] ERROR: failed to restore %s -> %s/.next\n' "${NEXT_BACKUP}" "${LIVE_DIR}" >&2
    else
      log "restored previous .next"
    fi
  elif [[ -d "${LIVE_DIR}/.next" ]]; then
    log "live .next still present; no .next restore needed"
  else
    restore_ok=0
    printf '[deploy] ERROR: no live .next and no backup at %s\n' "${NEXT_BACKUP}" >&2
  fi

  if [[ -d "${MODULES_BACKUP}" ]]; then
    rm -rf "${LIVE_DIR}/node_modules"
    if ! mv "${MODULES_BACKUP}" "${LIVE_DIR}/node_modules"; then
      restore_ok=0
      printf '[deploy] ERROR: failed to restore %s -> %s/node_modules\n' "${MODULES_BACKUP}" "${LIVE_DIR}" >&2
    else
      log "restored previous node_modules"
    fi
  elif [[ -d "${LIVE_DIR}/node_modules" ]]; then
    log "live node_modules still present; no node_modules restore needed"
  else
    restore_ok=0
    printf '[deploy] ERROR: no live node_modules and no backup at %s\n' "${MODULES_BACKUP}" >&2
  fi

  if [[ ! -f "${LIVE_DIR}/${ENV_FILE}" ]]; then
    restore_ok=0
    printf '[deploy] ERROR: %s is missing during recovery\n' "${LIVE_DIR}/${ENV_FILE}" >&2
  fi

  if [[ "${restore_ok}" -ne 1 ]]; then
    manual_intervention "artifact restore incomplete"
    cleanup_staging || true
    return 1
  fi

  log "restarting PM2 process '${PM2_APP_NAME}' with restored artifacts"
  if ! pm2 restart "${PM2_APP_NAME}" --update-env; then
    manual_intervention "PM2 restart of '${PM2_APP_NAME}' failed after restore"
    cleanup_staging || true
    return 1
  fi

  log "recovery restart issued for '${PM2_APP_NAME}'"
  cleanup_staging || true
  return 0
}

# Shared failure path for both fail() and the ERR trap.
# Attempts recovery at most once after promotion begins.
handle_failure() {
  local message="${1:-deployment failed}"
  local exit_code="${2:-1}"

  printf '[deploy] ERROR: %s\n' "${message}" >&2

  if [[ "${PROMOTION_STARTED}" -eq 1 && "${RECOVERY_ATTEMPTED}" -eq 0 ]]; then
    if ! restore_previous_release; then
      exit 1
    fi
    # Artifacts restored and soulschat restarted, but deploy still failed.
    exit 1
  fi

  # Pre-promotion failure, or recovery already attempted.
  if [[ "${RECOVERY_ATTEMPTED}" -eq 0 ]]; then
    cleanup_staging || true
  fi
  exit "${exit_code}"
}

fail() {
  # Explicit exit bypasses ERR; route through handle_failure so post-promotion
  # fail() still restores previous artifacts exactly once.
  handle_failure "$*" 1
}

on_error() {
  local exit_code=$?
  handle_failure "deployment failed (exit ${exit_code})" "${exit_code}"
}

trap on_error ERR

# --- Safety checks -----------------------------------------------------------

if [[ "$(id -un)" != "${EXPECTED_USER}" ]]; then
  fail "must run as ${EXPECTED_USER} (current user: $(id -un))"
fi

cd "${LIVE_DIR}" || fail "cannot cd to ${LIVE_DIR}"

if [[ "$(pwd -P)" != "${LIVE_DIR}" ]]; then
  fail "working directory must be exactly ${LIVE_DIR} (now: $(pwd -P))"
fi

if [[ ! -f "${LIVE_DIR}/${ENV_FILE}" ]]; then
  fail "${LIVE_DIR}/${ENV_FILE} is missing; refusing to deploy without production env"
fi

if [[ ! -d "${NODE_BIN_DIR}" ]]; then
  fail "Node.js bin directory not found: ${NODE_BIN_DIR}"
fi

export PATH="${NODE_BIN_DIR}:${PATH}"

command -v node >/dev/null 2>&1 || fail "node not found on PATH"
command -v npm >/dev/null 2>&1 || fail "npm not found on PATH"
command -v pm2 >/dev/null 2>&1 || fail "pm2 not found on PATH"
command -v git >/dev/null 2>&1 || fail "git not found on PATH"
command -v rsync >/dev/null 2>&1 || fail "rsync not found on PATH"
command -v curl >/dev/null 2>&1 || fail "curl not found on PATH"

log "node: $(command -v node) ($(node -v))"
log "npm:  $(command -v npm) ($(npm -v))"
log "pm2:  $(command -v pm2)"

if ! pm2 describe "${PM2_APP_NAME}" >/dev/null 2>&1; then
  fail "PM2 process '${PM2_APP_NAME}' not found; refusing to create/restart other apps"
fi

mkdir -p "${NPM_CACHE_DIR}"

# --- Fetch latest main into LIVE git metadata --------------------------------

log "fetching origin/main"
git fetch --prune origin main
git rev-parse --verify origin/main >/dev/null 2>&1 || fail "origin/main not found"

TARGET_SHA="$(git rev-parse origin/main)"
log "target revision: ${TARGET_SHA}"

# --- Staged build (sibling directory; does not overwrite live .next) ---------

log "preparing staged build at ${STAGING_DIR}"
cleanup_staging
git worktree add --detach "${STAGING_DIR}" "${TARGET_SHA}"

# Provide env to staging for NEXT_PUBLIC_* inlining at build time.
# Copy only; never print contents.
cp -a "${LIVE_DIR}/${ENV_FILE}" "${STAGING_DIR}/${ENV_FILE}"

log "installing dependencies in staging (npm ci)"
(
  cd "${STAGING_DIR}"
  npm ci --cache "${NPM_CACHE_DIR}" --prefer-offline --no-audit --no-fund
)

log "building Next.js app in staging"
(
  cd "${STAGING_DIR}"
  npm run build
)

if [[ ! -d "${STAGING_DIR}/.next" ]]; then
  fail "staged build did not produce ${STAGING_DIR}/.next"
fi

if [[ ! -d "${STAGING_DIR}/node_modules" ]]; then
  fail "staged build did not produce ${STAGING_DIR}/node_modules"
fi

# --- Pre-promotion live artifact requirements --------------------------------
# Abort before changing the live Git tree or moving artifacts, so recovery
# always has previous .next and node_modules available to restore.

if [[ ! -d "${LIVE_DIR}/.next" ]]; then
  fail "refusing to promote: missing ${LIVE_DIR}/.next (required so recovery can restore the previous build)"
fi

if [[ ! -d "${LIVE_DIR}/node_modules" ]]; then
  fail "refusing to promote: missing ${LIVE_DIR}/node_modules (required so recovery can restore previous dependencies)"
fi

# --- Promote into LIVE -------------------------------------------------------

# From this point, failures trigger restore of previous .next + node_modules.
PROMOTION_STARTED=1

log "updating live git tree to origin/main (preserves untracked ${ENV_FILE})"
git reset --hard "${TARGET_SHA}"
# Intentionally no `git clean`: must not remove .env.local or other untracked files.

log "preserving previous .next and node_modules before replacement"
cleanup_backups

if ! mv "${LIVE_DIR}/.next" "${NEXT_BACKUP}"; then
  fail "failed to preserve previous .next at ${NEXT_BACKUP}"
fi
log "preserved previous .next -> ${NEXT_BACKUP}"

if ! mv "${LIVE_DIR}/node_modules" "${MODULES_BACKUP}"; then
  # .next backup already exists; fail() triggers recovery which restores it
  # and keeps/restores node_modules if still present or backed up.
  fail "failed to preserve previous node_modules at ${MODULES_BACKUP}"
fi
log "preserved previous node_modules -> ${MODULES_BACKUP}"

log "moving staged .next into live directory"
mv "${STAGING_DIR}/.next" "${LIVE_DIR}/.next"

log "syncing staged node_modules into live directory"
mkdir -p "${LIVE_DIR}/node_modules"
rsync -a --delete "${STAGING_DIR}/node_modules/" "${LIVE_DIR}/node_modules/"

# Ensure live env file is still present and was never replaced by staging cleanup.
if [[ ! -f "${LIVE_DIR}/${ENV_FILE}" ]]; then
  fail "${ENV_FILE} missing after promote; aborting before PM2 restart"
fi

log "restarting PM2 process '${PM2_APP_NAME}' only"
pm2 restart "${PM2_APP_NAME}" --update-env

# --- Health check ------------------------------------------------------------

log "waiting for port ${APP_PORT} to accept connections"
ready=0
for _ in $(seq 1 45); do
  if ss -ltn "( sport = :${APP_PORT} )" 2>/dev/null | grep -q ":${APP_PORT}"; then
    ready=1
    break
  fi
  # Fallback parsers for busybox/older ss
  if ss -ltn 2>/dev/null | grep -E ":${APP_PORT}\b" >/dev/null 2>&1; then
    ready=1
    break
  fi
  http_code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 2 "http://127.0.0.1:${APP_PORT}/" || true)"
  # Only 2xx/3xx count as healthy (307 auth redirect is OK; 4xx/5xx are not).
  if is_healthy_http_status "${http_code}"; then
    ready=1
    break
  fi
  sleep 1
done

if [[ "${ready}" -ne 1 ]]; then
  fail "app is not listening on port ${APP_PORT} after restart"
fi

log "port ${APP_PORT} is listening"

# Final HTTP check: require 2xx or 3xx only. curl is a required dependency.
http_code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 "http://127.0.0.1:${APP_PORT}/" || true)"
log "local HTTP check returned status ${http_code}"
if ! is_healthy_http_status "${http_code}"; then
  fail "local HTTP health check failed (expected 2xx/3xx, got ${http_code})"
fi

# Success: backups are no longer needed.
log "health checks passed; removing artifact backups"
cleanup_backups

log "cleaning staging worktree"
cleanup_staging

# Disable failure recovery now that deploy completed successfully.
PROMOTION_STARTED=0
trap - ERR

log "deployment succeeded (${TARGET_SHA})"
