import fs from 'fs/promises';
import path from 'path';
import { generateRealisticMealsForDate } from './realisticMealPlan.js';

export const VALID_MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];
export const MACRO_KEYS = ['carbs', 'protein', 'fat', 'fiber', 'sugar', 'sodium', 'cholesterol', 'saturatedFat'];
export const DEFAULT_MEAL_TIMES = {
    breakfast: '08:00',
    lunch: '12:30',
    dinner: '19:00',
    snack: '15:30'
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^(\d{1,2}):(\d{2})$/;

const numberFormatters = new Map();
const weekdayFormatters = new Map();
const timeFormatters = new Map();

const buildPartsObject = (parts) =>
    parts.reduce((acc, part) => {
        if (part.type !== 'literal') {
            acc[part.type] = part.value;
        }
        return acc;
    }, {});

const getDateFormatter = (timeZone) => {
    if (!numberFormatters.has(timeZone)) {
        numberFormatters.set(
            timeZone,
            new Intl.DateTimeFormat('en-CA', {
                timeZone,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            })
        );
    }

    return numberFormatters.get(timeZone);
};

const getWeekdayFormatter = (timeZone) => {
    if (!weekdayFormatters.has(timeZone)) {
        weekdayFormatters.set(
            timeZone,
            new Intl.DateTimeFormat('en-US', {
                timeZone,
                weekday: 'long'
            })
        );
    }

    return weekdayFormatters.get(timeZone);
};

const getTimeFormatter = (timeZone) => {
    if (!timeFormatters.has(timeZone)) {
        timeFormatters.set(
            timeZone,
            new Intl.DateTimeFormat('en-US', {
                timeZone,
                hour: '2-digit',
                minute: '2-digit',
                hourCycle: 'h23'
            })
        );
    }

    return timeFormatters.get(timeZone);
};

const toDateKeyFromParts = (parts) => `${parts.year}-${parts.month}-${parts.day}`;

const normalizeText = (value) => String(value ?? '').trim();

const normalizeComparableText = (value) =>
    normalizeText(value)
        .toLowerCase()
        .replace(/\s+/g, ' ');

export const normalizeEmailAddress = (value) => normalizeText(value).toLowerCase();

export const resolveTargetMealLogEmail = (config) => {
    if (!config || typeof config !== 'object' || Array.isArray(config)) {
        return '';
    }

    return normalizeEmailAddress(config.targetEmail);
};

export const normalizeBaseUrl = (value) => normalizeText(value).replace(/\/+$/, '');

export const normalizeDateString = (value) => {
    const dateValue = normalizeText(value);

    if (!DATE_PATTERN.test(dateValue)) {
        throw new Error(`Invalid date "${value}". Use YYYY-MM-DD.`);
    }

    return dateValue;
};

export const normalizeTimeString = (value) => {
    const raw = normalizeText(value);
    const match = raw.match(TIME_PATTERN);

    if (!match) {
        throw new Error(`Invalid time "${value}". Use HH:MM in 24-hour format.`);
    }

    const hour = Number(match[1]);
    const minute = Number(match[2]);

    if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
        throw new Error(`Invalid time "${value}". Use HH:MM in 24-hour format.`);
    }

    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
};

export const getTodayDateString = (timeZone) => {
    const parts = buildPartsObject(getDateFormatter(timeZone).formatToParts(new Date()));
    return toDateKeyFromParts(parts);
};

export const getWeekdayKey = (dateString, timeZone) => {
    const zonedDate = new Date(zonedDateTimeToUtc(dateString, '12:00', timeZone));
    return getWeekdayFormatter(timeZone).format(zonedDate).toLowerCase();
};

export const zonedDateTimeToUtc = (dateString, timeString, timeZone) => {
    const normalizedDate = normalizeDateString(dateString);
    const normalizedTime = normalizeTimeString(timeString);
    const [year, month, day] = normalizedDate.split('-').map(Number);
    const [hour, minute] = normalizedTime.split(':').map(Number);
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23'
    });
    let utcMillis = Date.UTC(year, month - 1, day, hour, minute, 0);

    for (let attempt = 0; attempt < 3; attempt += 1) {
        const observed = buildPartsObject(formatter.formatToParts(new Date(utcMillis)));
        const observedAsUtc = Date.UTC(
            Number(observed.year),
            Number(observed.month) - 1,
            Number(observed.day),
            Number(observed.hour),
            Number(observed.minute),
            Number(observed.second)
        );
        const desiredAsUtc = Date.UTC(year, month - 1, day, hour, minute, 0);
        const diff = desiredAsUtc - observedAsUtc;

        if (diff === 0) {
            break;
        }

        utcMillis += diff;
    }

    return new Date(utcMillis).toISOString();
};

export const extractTimeForZone = (dateValue, timeZone) => {
    if (!dateValue) {
        return '';
    }

    const parsed = new Date(dateValue);

    if (Number.isNaN(parsed.getTime())) {
        return '';
    }

    const parts = buildPartsObject(getTimeFormatter(timeZone).formatToParts(parsed));
    return `${parts.hour}:${parts.minute}`;
};

export const createMealIdentity = (meal, timeZone) => {
    const scheduledTime = normalizeTimeString(meal.scheduledTime || extractTimeForZone(meal.date, timeZone) || DEFAULT_MEAL_TIMES[meal.mealType] || '12:00');
    const mealType = normalizeText(meal.mealType || 'snack').toLowerCase();

    return [
        mealType,
        normalizeComparableText(meal.name ?? meal.food),
        normalizeComparableText(meal.amount),
        scheduledTime
    ].join('|');
};

const toNonNegativeNumber = (value, fieldName) => {
    const parsed = Number(value);

    if (!Number.isFinite(parsed) || parsed < 0) {
        throw new Error(`Invalid ${fieldName}. Expected a non-negative number.`);
    }

    return Math.round(parsed * 100) / 100;
};

const normalizeMacros = (macros = {}) =>
    MACRO_KEYS.reduce((acc, key) => {
        const value = macros?.[key];
        acc[key] = value === undefined || value === '' ? 0 : toNonNegativeNumber(value, `macros.${key}`);
        return acc;
    }, {});

export const calculateMealCalories = (meals = []) =>
    meals.reduce((sum, meal) => sum + toNonNegativeNumber(meal?.calories || 0, 'meal calories'), 0);

export const resolveDailyCalorieLimit = (config) => {
    if (!config || typeof config !== 'object' || Array.isArray(config)) {
        return null;
    }

    const limit = config.dailyCalorieLimit ?? config.generator?.maxDailyCalories;
    if (limit === undefined || limit === null || limit === '') {
        return null;
    }

    return toNonNegativeNumber(limit, 'dailyCalorieLimit');
};

export const selectMealsForDate = (config, targetDate, timeZone) => {
    if (Array.isArray(config)) {
        return config;
    }

    if (!config || typeof config !== 'object') {
        throw new Error('Meal log config must be a JSON array or object.');
    }

    const dateMeals = config.dates?.[targetDate];
    if (Array.isArray(dateMeals)) {
        return dateMeals;
    }

    const weekdayKey = getWeekdayKey(targetDate, timeZone);
    const weekdayMeals = config.days?.[weekdayKey];
    if (Array.isArray(weekdayMeals)) {
        return weekdayMeals;
    }

    if (Array.isArray(config.days?.default)) {
        return config.days.default;
    }

    if (Array.isArray(config.default)) {
        return config.default;
    }

    if (Array.isArray(config.meals)) {
        return config.meals;
    }

    if (config.generator && config.generator.enabled !== false) {
        return generateRealisticMealsForDate(targetDate, {
            ...config.generator,
            maxDailyCalories: config.generator?.maxDailyCalories ?? config.dailyCalorieLimit ?? 2000,
            timeZone
        }).meals;
    }

    throw new Error(
        `No meals configured for ${targetDate}. Add days.default, days.${weekdayKey}, dates.${targetDate}, a top-level meals array, or a generator block.`
    );
};

export const normalizeMealEntry = (entry, index, targetDate, timeZone) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
        throw new Error(`Meal #${index + 1} must be an object.`);
    }

    const mealType = normalizeText(entry.mealType || 'snack').toLowerCase();
    if (!VALID_MEAL_TYPES.includes(mealType)) {
        throw new Error(`Meal #${index + 1} has invalid mealType "${entry.mealType}".`);
    }

    const name = normalizeText(entry.name ?? entry.food);
    if (!name) {
        throw new Error(`Meal #${index + 1} is missing a name.`);
    }

    if (entry.calories === undefined || entry.calories === null || entry.calories === '') {
        throw new Error(`Meal #${index + 1} is missing calories.`);
    }

    const scheduledTime = normalizeTimeString(entry.time || DEFAULT_MEAL_TIMES[mealType]);

    return {
        name,
        food: name,
        amount: normalizeText(entry.amount),
        mealType,
        calories: toNonNegativeNumber(entry.calories, `meal #${index + 1} calories`),
        imageUrl: normalizeText(entry.imageUrl),
        date: zonedDateTimeToUtc(targetDate, scheduledTime, timeZone),
        macros: normalizeMacros(entry.macros),
        scheduledTime
    };
};

export const assertUniqueMealIdentities = (meals, timeZone) => {
    const seen = new Map();

    meals.forEach((meal, index) => {
        const identity = createMealIdentity(meal, timeZone);

        if (seen.has(identity)) {
            throw new Error(`Duplicate meal entries detected for "${identity}" at positions ${seen.get(identity) + 1} and ${index + 1}.`);
        }

        seen.set(identity, index);
    });
};

export const mealNeedsUpdate = (existingMeal, desiredMeal, timeZone) => {
    if (!existingMeal) {
        return true;
    }

    const sameCoreFields =
        normalizeText(existingMeal.name ?? existingMeal.food) === desiredMeal.name &&
        normalizeText(existingMeal.amount) === desiredMeal.amount &&
        normalizeText(existingMeal.imageUrl) === desiredMeal.imageUrl &&
        normalizeText(existingMeal.mealType).toLowerCase() === desiredMeal.mealType &&
        Number(existingMeal.calories) === desiredMeal.calories &&
        createMealIdentity(existingMeal, timeZone) === createMealIdentity(desiredMeal, timeZone);

    if (!sameCoreFields) {
        return true;
    }

    return MACRO_KEYS.some((key) => Number(existingMeal.macros?.[key] || 0) !== desiredMeal.macros[key]);
};

export const loadMealPlanConfig = async (filePath) => {
    const absolutePath = path.resolve(filePath);

    try {
        const raw = await fs.readFile(absolutePath, 'utf8');
        return {
            absolutePath,
            config: JSON.parse(raw)
        };
    } catch (error) {
        if (error?.code === 'ENOENT') {
            throw new Error(`Meal plan file not found at ${absolutePath}. Start from scripts/meal-log-plan.example.json.`);
        }

        if (error instanceof SyntaxError) {
            throw new Error(`Meal plan file ${absolutePath} is not valid JSON.`);
        }

        throw error;
    }
};
