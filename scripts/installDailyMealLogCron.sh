#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
ROOT_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
RUNNER="$SCRIPT_DIR/runDailyMealLog.sh"
SCHEDULE=${1:-${MEAL_LOG_CRON_TIME:-08:00}}
LOG_FILE=${MEAL_LOG_LOG_FILE:-/tmp/healthycal-meal-log.log}
MARKER="# healthycal-daily-meal-log"

validate_time() {
    case "$1" in
        [0-1][0-9]:[0-5][0-9] | 2[0-3]:[0-5][0-9]) return 0 ;;
        *) return 1 ;;
    esac
}

if ! validate_time "$SCHEDULE"; then
    echo "Invalid time \"$SCHEDULE\". Use HH:MM in 24-hour format." >&2
    exit 1
fi

if [ ! -f "$SCRIPT_DIR/meal-log.env" ]; then
    echo "Missing $SCRIPT_DIR/meal-log.env. Copy scripts/meal-log.env.example first." >&2
    exit 1
fi

HOUR=${SCHEDULE%:*}
MINUTE=${SCHEDULE#*:}
CRON_COMMAND="cd '$ROOT_DIR' && /bin/sh '$RUNNER' >> '$LOG_FILE' 2>&1"
CRON_LINE="$MINUTE $HOUR * * * $CRON_COMMAND $MARKER"
TEMP_FILE=$(mktemp)

cleanup() {
    rm -f "$TEMP_FILE"
}

trap cleanup EXIT HUP INT TERM

if crontab -l >/dev/null 2>&1; then
    crontab -l | grep -F -v "$MARKER" > "$TEMP_FILE" || true
else
    : > "$TEMP_FILE"
fi

printf '%s\n' "$CRON_LINE" >> "$TEMP_FILE"
crontab "$TEMP_FILE"

printf 'Installed HealthyCal daily meal-log job at %s.\n' "$SCHEDULE"
printf 'Log file: %s\n' "$LOG_FILE"
printf 'Runner: %s\n' "$RUNNER"
