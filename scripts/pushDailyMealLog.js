import 'dotenv/config';

import {
    assertUniqueMealIdentities,
    createMealIdentity,
    getTodayDateString,
    loadMealPlanConfig,
    mealNeedsUpdate,
    normalizeBaseUrl,
    normalizeDateString,
    normalizeMealEntry,
    selectMealsForDate
} from './lib/mealLogAutomation.js';

const DEFAULT_CONFIG_PATH = 'scripts/meal-log-plan.json';

const parseArgs = (argv) =>
    argv.reduce((acc, arg) => {
        if (arg === '--dry-run') {
            acc.dryRun = true;
            return acc;
        }

        if (arg === '--help' || arg === '-h') {
            acc.help = true;
            return acc;
        }

        const match = arg.match(/^--([^=]+)=(.+)$/);
        if (match) {
            acc[match[1]] = match[2];
            return acc;
        }

        throw new Error(`Unknown argument "${arg}". Use --help for usage.`);
    }, {});

const printUsage = () => {
    console.log(`Usage:
  npm run push:daily-meals -- [--date=YYYY-MM-DD] [--file=path/to/meal-log-plan.json] [--dry-run]

Required environment variables:
  MEAL_LOG_BASE_URL   Base URL for the HealthyCal site, for example https://healthycal.vercel.app
  MEAL_LOG_EMAIL      Login email for the account that should receive the meals
  MEAL_LOG_PASSWORD   Login password for that account

Optional environment variables:
  MEAL_LOG_FILE       Defaults to scripts/meal-log-plan.json
  MEAL_LOG_TIMEZONE   Overrides the plan timezone and system timezone
  MEAL_LOG_DATE       Overrides today's date for backfills
  MEAL_LOG_DRY_RUN    Set to true to preview without sending API requests
`);
};

const parseJsonResponse = async (response) => {
    const raw = await response.text();

    if (!raw) {
        return {};
    }

    try {
        return JSON.parse(raw);
    } catch {
        return { message: raw };
    }
};

const requestJson = async (baseUrl, endpoint, options = {}) => {
    const response = await fetch(`${baseUrl}${endpoint}`, options);
    const payload = await parseJsonResponse(response);

    if (!response.ok) {
        const message = payload.message || payload.error || `${response.status} ${response.statusText}`;
        throw new Error(`${options.method || 'GET'} ${endpoint} failed: ${message}`);
    }

    return payload;
};

const login = async (baseUrl, email, password) => {
    const payload = await requestJson(baseUrl, '/api/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    });

    return payload.token;
};

const buildAuthHeaders = (token) => ({
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
});

const envBool = (value) => ['1', 'true', 'yes', 'on'].includes(String(value ?? '').toLowerCase());

const main = async () => {
    const args = parseArgs(process.argv.slice(2));

    if (args.help) {
        printUsage();
        return;
    }

    const configPath = args.file || process.env.MEAL_LOG_FILE || DEFAULT_CONFIG_PATH;
    const { absolutePath, config } = await loadMealPlanConfig(configPath);
    const timeZone = process.env.MEAL_LOG_TIMEZONE || config.timezone || process.env.TZ || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const targetDate = normalizeDateString(args.date || process.env.MEAL_LOG_DATE || getTodayDateString(timeZone));
    const selectedMeals = selectMealsForDate(config, targetDate, timeZone);
    const desiredMeals = selectedMeals.map((entry, index) => normalizeMealEntry(entry, index, targetDate, timeZone));
    const baseUrl = normalizeBaseUrl(process.env.MEAL_LOG_BASE_URL);
    const email = String(process.env.MEAL_LOG_EMAIL || '').trim();
    const password = String(process.env.MEAL_LOG_PASSWORD || '');
    const dryRun = args.dryRun || envBool(process.env.MEAL_LOG_DRY_RUN);

    if (!baseUrl) {
        throw new Error('MEAL_LOG_BASE_URL is required.');
    }

    if (!email || !password) {
        throw new Error('MEAL_LOG_EMAIL and MEAL_LOG_PASSWORD are required.');
    }

    assertUniqueMealIdentities(desiredMeals, timeZone);

    console.log(`Meal plan: ${absolutePath}`);
    console.log(`Date: ${targetDate}`);
    console.log(`Timezone: ${timeZone}`);
    console.log(`Meals selected: ${desiredMeals.length}`);

    const token = await login(baseUrl, email, password);
    const existingPayload = await requestJson(baseUrl, `/api/meals?date=${targetDate}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    const existingMeals = existingPayload.meals || [];
    const existingByIdentity = new Map();

    existingMeals.forEach((meal) => {
        const identity = createMealIdentity(meal, timeZone);

        if (!existingByIdentity.has(identity)) {
            existingByIdentity.set(identity, meal);
        }
    });

    const summary = {
        created: 0,
        updated: 0,
        skipped: 0
    };

    for (const meal of desiredMeals) {
        const identity = createMealIdentity(meal, timeZone);
        const existingMeal = existingByIdentity.get(identity);

        if (existingMeal && !mealNeedsUpdate(existingMeal, meal, timeZone)) {
            summary.skipped += 1;
            console.log(`SKIP   ${meal.mealType.padEnd(9)} ${meal.name} @ ${meal.scheduledTime}`);
            continue;
        }

        if (dryRun) {
            const action = existingMeal ? 'UPDATE' : 'CREATE';
            summary[existingMeal ? 'updated' : 'created'] += 1;
            console.log(`DRYRUN ${action.padEnd(6)} ${meal.mealType.padEnd(9)} ${meal.name} @ ${meal.scheduledTime}`);
            continue;
        }

        if (existingMeal) {
            await requestJson(baseUrl, `/api/meals/${existingMeal._id}`, {
                method: 'PUT',
                headers: buildAuthHeaders(token),
                body: JSON.stringify(meal)
            });
            summary.updated += 1;
            console.log(`UPDATE ${meal.mealType.padEnd(9)} ${meal.name} @ ${meal.scheduledTime}`);
            continue;
        }

        const created = await requestJson(baseUrl, '/api/meals', {
            method: 'POST',
            headers: buildAuthHeaders(token),
            body: JSON.stringify(meal)
        });
        existingByIdentity.set(identity, created.meal || meal);
        summary.created += 1;
        console.log(`CREATE ${meal.mealType.padEnd(9)} ${meal.name} @ ${meal.scheduledTime}`);
    }

    console.log(
        `Finished: ${summary.created} created, ${summary.updated} updated, ${summary.skipped} skipped${dryRun ? ' (dry run)' : ''}.`
    );
};

main().catch((error) => {
    console.error(error.message || error);
    process.exitCode = 1;
});
