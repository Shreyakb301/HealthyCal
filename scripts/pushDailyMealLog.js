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
const DEFAULT_EXAMPLE_CONFIG_PATH = 'scripts/meal-log-plan.example.json';

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

const addDays = (dateString, daysToAdd) => {
    const pieces = dateString.split('-').map(Number);

    if (pieces.length !== 3 || pieces.some((n) => Number.isNaN(n))) {
        throw new Error(`Invalid date format when adding days: ${dateString}`);
    }

    const [year, month, day] = pieces;
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + daysToAdd);

    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const printUsage = () => {
    console.log(`Usage:
  npm run push:daily-meals -- [--date=YYYY-MM-DD] [--days=N] [--file=path/to/meal-log-plan.json] [--dry-run]

Required environment variables:
  MEAL_LOG_BASE_URL   Base URL for the HealthyCal site, for example https://healthycal.vercel.app
  MEAL_LOG_EMAIL      Login email for the account that should receive the meals
  MEAL_LOG_PASSWORD   Login password for that account

Optional environment variables:
  MEAL_LOG_FILE       Defaults to scripts/meal-log-plan.json
  MEAL_LOG_TIMEZONE   Overrides the plan timezone and system timezone
  MEAL_LOG_DATE       Overrides today's date for backfills
  MEAL_LOG_DAYS       Number of days to push (default: 1)
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

const registerUser = async (baseUrl, username, email, password) => {
    const payload = await requestJson(baseUrl, '/api/auth/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email, password })
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

    let configPath = args.file || process.env.MEAL_LOG_FILE || DEFAULT_CONFIG_PATH;
    let configData;

    try {
        configData = await loadMealPlanConfig(configPath);
    } catch (error) {
        if (
            configPath === DEFAULT_CONFIG_PATH &&
            error?.message?.includes('Meal plan file not found')
        ) {
            console.warn(`Warning: ${error.message}`);
            console.warn(`Falling back to example plan file at ${DEFAULT_EXAMPLE_CONFIG_PATH}.`);
            configPath = DEFAULT_EXAMPLE_CONFIG_PATH;
            configData = await loadMealPlanConfig(configPath);
        } else {
            throw error;
        }
    }

    const { absolutePath, config } = configData;
    const timeZone = process.env.MEAL_LOG_TIMEZONE || config.timezone || process.env.TZ || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const targetDate = normalizeDateString(args.date || process.env.MEAL_LOG_DATE || getTodayDateString(timeZone));
    const days = Number(args.days || process.env.MEAL_LOG_DAYS || 1);

    if (!Number.isInteger(days) || days < 1) {
        throw new Error(`Invalid number of days: ${args.days || process.env.MEAL_LOG_DAYS}. Provide an integer >= 1.`);
    }

    const datesToProcess = Array.from({ length: days }, (_, i) => addDays(targetDate, i));
    const baseUrl = normalizeBaseUrl(process.env.MEAL_LOG_BASE_URL);
    const email = String(process.env.MEAL_LOG_EMAIL || 'shreya@healthycal.com').trim();
    const password = String(process.env.MEAL_LOG_PASSWORD || '');
    const dryRun = args.dryRun || envBool(process.env.MEAL_LOG_DRY_RUN);

    if (!baseUrl) {
        throw new Error('MEAL_LOG_BASE_URL is required.');
    }

    if (!email || !password) {
        throw new Error('MEAL_LOG_EMAIL and MEAL_LOG_PASSWORD are required.');
    }

    console.log(`Meal plan: ${absolutePath}`);
    console.log(`Date start: ${targetDate}`);
    console.log(`Timezone: ${timeZone}`);
    console.log(`Days to push: ${days}`);
    console.log(`Dates to push: ${datesToProcess.join(', ')}`);

    let token;

    try {
        token = await login(baseUrl, email, password);
    } catch (error) {
        const messageText = String(error?.message || '').toLowerCase();

        if (messageText.includes('invalid credentials') || messageText.includes('401')) {
            const username = process.env.MEAL_LOG_USERNAME || email.split('@')[0];
            console.log(`Login failed with invalid credentials, attempting register as ${username} <${email}>`);

            try {
                token = await registerUser(baseUrl, username, email, password);
                console.log('User registered successfully, proceeding with meal push.');
            } catch (registerError) {
                throw new Error(`Login failed and registration also failed: ${registerError.message || registerError}`);
            }
        } else {
            throw error;
        }
    }
    const summary = {
        created: 0,
        updated: 0,
        skipped: 0
    };

    for (const date of datesToProcess) {
        let selectedMeals;

        try {
            selectedMeals = selectMealsForDate(config, date, timeZone);
        } catch (error) {
            console.warn(`Skipping ${date}: ${error.message}`);
            continue;
        }

        if (!Array.isArray(selectedMeals) || selectedMeals.length === 0) {
            console.log(`No meals configured for ${date}. Skipping.`);
            continue;
        }

        const desiredMealsForDate = selectedMeals.map((entry, index) => normalizeMealEntry(entry, index, date, timeZone));
        assertUniqueMealIdentities(desiredMealsForDate, timeZone);

        console.log(`\nProcessing ${desiredMealsForDate.length} meals for ${date}...`);

        const existingPayload = await requestJson(baseUrl, `/api/meals?date=${date}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const existingMealsForDate = existingPayload.meals || [];
        const existingByIdentity = new Map();

        existingMealsForDate.forEach((meal) => {
            const identity = createMealIdentity(meal, timeZone);
            if (!existingByIdentity.has(identity)) {
                existingByIdentity.set(identity, meal);
            }
        });

        for (const meal of desiredMealsForDate) {
            const identity = createMealIdentity(meal, timeZone);
            const existingMeal = existingByIdentity.get(identity);

            if (existingMeal && !mealNeedsUpdate(existingMeal, meal, timeZone)) {
                summary.skipped += 1;
                console.log(`SKIP   ${meal.mealType.padEnd(9)} ${meal.name} @ ${meal.scheduledTime} (${date})`);
                continue;
            }

            if (dryRun) {
                const action = existingMeal ? 'UPDATE' : 'CREATE';
                summary[existingMeal ? 'updated' : 'created'] += 1;
                console.log(`DRYRUN ${action.padEnd(6)} ${meal.mealType.padEnd(9)} ${meal.name} @ ${meal.scheduledTime} (${date})`);
                continue;
            }

            if (existingMeal) {
                await requestJson(baseUrl, `/api/meals/${existingMeal._id}`, {
                    method: 'PUT',
                    headers: buildAuthHeaders(token),
                    body: JSON.stringify(meal)
                });
                summary.updated += 1;
                console.log(`UPDATE ${meal.mealType.padEnd(9)} ${meal.name} @ ${meal.scheduledTime} (${date})`);
                continue;
            }

            const created = await requestJson(baseUrl, '/api/meals', {
                method: 'POST',
                headers: buildAuthHeaders(token),
                body: JSON.stringify(meal)
            });
            existingByIdentity.set(identity, created.meal || meal);
            summary.created += 1;
            console.log(`CREATE ${meal.mealType.padEnd(9)} ${meal.name} @ ${meal.scheduledTime} (${date})`);
        }
    }

    console.log(
        `Finished: ${summary.created} created, ${summary.updated} updated, ${summary.skipped} skipped${dryRun ? ' (dry run)' : ''}.`
    );
};

main().catch((error) => {
    console.error(error.message || error);
    process.exitCode = 1;
});
