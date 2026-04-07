#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
ROOT_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
ENV_FILE=${MEAL_LOG_ENV_FILE:-"$SCRIPT_DIR/meal-log.env"}

print_usage() {
    cat <<EOF
Usage:
  sh scripts/runDailyMealLog.sh [--date=YYYY-MM-DD] [--days=N] [--dry-run]

This wrapper loads meal-log credentials from:
  $ENV_FILE

Setup:
  1. cp scripts/meal-log.env.example scripts/meal-log.env
  2. cp scripts/meal-log-plan.example.json scripts/meal-log-plan.json
  3. Fill in your site URL, login email, and password
  4. Run this script directly or from cron

Examples:
  sh scripts/runDailyMealLog.sh --dry-run
  sh scripts/runDailyMealLog.sh --date=2026-04-07
EOF
}

if [ "${1:-}" = "--help" ] || [ "${1:-}" = "-h" ]; then
    print_usage
    exit 0
fi

DRY_RUN=false
for arg in "$@"; do
    if [ "$arg" = "--dry-run" ]; then
        DRY_RUN=true
        break
    fi
done

if [ -f "$ENV_FILE" ]; then
    set -a
    # shellcheck disable=SC1090
    . "$ENV_FILE"
    set +a
fi

if [ "$DRY_RUN" != "true" ] && { [ -z "${MEAL_LOG_BASE_URL:-}" ] || [ -z "${MEAL_LOG_EMAIL:-}" ] || [ -z "${MEAL_LOG_PASSWORD:-}" ]; }; then
    echo "Missing meal-log credentials. Set MEAL_LOG_BASE_URL, MEAL_LOG_EMAIL, and MEAL_LOG_PASSWORD in $ENV_FILE or your environment." >&2
    exit 1
fi

cd "$ROOT_DIR"
exec node scripts/pushDailyMealLog.js "$@"
