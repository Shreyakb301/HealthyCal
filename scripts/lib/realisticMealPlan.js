const DAY_MILLIS = 24 * 60 * 60 * 1000;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const DEFAULT_SETTINGS = {
    seed: 'healthycal-balanced-v1',
    minDailyCalories: 1600,
    targetDailyCalories: 1850,
    maxDailyCalories: 2000
};

const MEAL_TIME_WINDOWS = {
    breakfast: { startMinutes: 7 * 60 + 25, spreadMinutes: 70 },
    lunch: { startMinutes: 12 * 60 + 5, spreadMinutes: 75 },
    snack: { startMinutes: 15 * 60 + 5, spreadMinutes: 55 },
    dinner: { startMinutes: 18 * 60 + 25, spreadMinutes: 85 }
};

const breakfastTemplates = [
    {
        slug: 'oatmeal-protein-berries',
        name: 'Oatmeal with berries, protein powder, granola & chia',
        amounts: [
            { label: '1 bowl', factor: 1 },
            { label: '1 generous bowl', factor: 1.08 },
            { label: '3/4 bowl', factor: 0.93 }
        ],
        macros: { carbs: 58, protein: 31, fat: 13, fiber: 10, sugar: 13, sodium: 220, cholesterol: 15, saturatedFat: 3 }
    },
    {
        slug: 'oatmeal-fruit-yogurt',
        name: 'Oatmeal with fruit and yogurt',
        amounts: [
            { label: '1 bowl', factor: 1 },
            { label: '1 medium bowl', factor: 0.95 },
            { label: '1 bowl + extra fruit', factor: 1.06 }
        ],
        macros: { carbs: 49, protein: 20, fat: 9, fiber: 8, sugar: 15, sodium: 140, cholesterol: 10, saturatedFat: 2 }
    },
    {
        slug: 'oatmeal-apple-protein',
        name: 'Protein oatmeal with apple and chia seeds',
        amounts: [
            { label: '1 bowl', factor: 1 },
            { label: '1 hearty bowl', factor: 1.1 },
            { label: '3/4 bowl', factor: 0.92 }
        ],
        macros: { carbs: 54, protein: 29, fat: 11, fiber: 9, sugar: 14, sodium: 210, cholesterol: 12, saturatedFat: 2.5 }
    },
    {
        slug: 'broken-wheat-upma',
        name: 'Broken wheat upma with yogurt',
        amounts: [
            { label: '1 plate', factor: 1 },
            { label: '1.25 cups', factor: 1.06 },
            { label: '3/4 plate', factor: 0.9 }
        ],
        macros: { carbs: 48, protein: 13, fat: 11, fiber: 7, sugar: 5, sodium: 360, cholesterol: 6, saturatedFat: 2 }
    },
    {
        slug: 'paneer-paratha',
        name: 'Paneer paratha with yogurt',
        amounts: [
            { label: '2 parathas', factor: 1 },
            { label: '1 large paratha + yogurt', factor: 0.92 },
            { label: '2 parathas + extra yogurt', factor: 1.08 }
        ],
        macros: { carbs: 43, protein: 24, fat: 19, fiber: 4, sugar: 6, sodium: 420, cholesterol: 35, saturatedFat: 8 }
    },
    {
        slug: 'eggs-fruit-yogurt',
        name: 'Eggs, yogurt and fruit',
        amounts: [
            { label: '2 eggs + 1 bowl yogurt', factor: 1 },
            { label: '3 eggs + fruit', factor: 1.08 },
            { label: '2 eggs + fruit plate', factor: 0.94 }
        ],
        macros: { carbs: 24, protein: 28, fat: 18, fiber: 3, sugar: 11, sodium: 330, cholesterol: 290, saturatedFat: 5 }
    },
    {
        slug: 'greek-yogurt-granola',
        name: 'Greek yogurt with fruit and granola',
        amounts: [
            { label: '1 bowl', factor: 1 },
            { label: '1 large bowl', factor: 1.08 },
            { label: '3/4 bowl', factor: 0.9 }
        ],
        macros: { carbs: 42, protein: 23, fat: 10, fiber: 5, sugar: 17, sodium: 115, cholesterol: 12, saturatedFat: 2.5 }
    },
    {
        slug: 'eggs-oats-fruit',
        name: 'Eggs, oats and fruit',
        amounts: [
            { label: '1 plate', factor: 1 },
            { label: '1 large plate', factor: 1.06 },
            { label: '1 light plate', factor: 0.9 }
        ],
        macros: { carbs: 37, protein: 27, fat: 16, fiber: 5, sugar: 10, sodium: 280, cholesterol: 210, saturatedFat: 4.5 }
    }
];

const lunchTemplates = [
    {
        slug: 'chicken-vegetables',
        name: 'Chicken and vegetables',
        amounts: [
            { label: '1 plate', factor: 1 },
            { label: '1 plate + extra veggies', factor: 1.03 },
            { label: '3/4 plate', factor: 0.9 }
        ],
        macros: { carbs: 24, protein: 38, fat: 15, fiber: 6, sugar: 7, sodium: 350, cholesterol: 105, saturatedFat: 3.5 }
    },
    {
        slug: 'pasta-chicken',
        name: 'Pasta with vegetables and chicken',
        amounts: [
            { label: '1 bowl', factor: 1 },
            { label: '1.25 bowls', factor: 1.08 },
            { label: '3/4 bowl', factor: 0.91 }
        ],
        macros: { carbs: 62, protein: 34, fat: 16, fiber: 6, sugar: 7, sodium: 510, cholesterol: 85, saturatedFat: 4 }
    },
    {
        slug: 'rajma-rice',
        name: 'Rajma with rice',
        amounts: [
            { label: '1 bowl + 1 cup rice', factor: 1 },
            { label: '1 bowl + 1.25 cups rice', factor: 1.08 },
            { label: '3/4 bowl + rice', factor: 0.9 }
        ],
        macros: { carbs: 69, protein: 18, fat: 8, fiber: 14, sugar: 6, sodium: 420, cholesterol: 0, saturatedFat: 1 }
    },
    {
        slug: 'rajma-chapati',
        name: 'Rajma with chapati',
        amounts: [
            { label: '1 bowl + 2 chapatis', factor: 1 },
            { label: '1 bowl + 3 chapatis', factor: 1.08 },
            { label: '3/4 bowl + 2 chapatis', factor: 0.92 }
        ],
        macros: { carbs: 56, protein: 19, fat: 9, fiber: 15, sugar: 6, sodium: 410, cholesterol: 0, saturatedFat: 1 }
    },
    {
        slug: 'chicken-curry-rice',
        name: 'Chicken curry with rice',
        amounts: [
            { label: '1 bowl + 1 cup rice', factor: 1 },
            { label: '1 bowl + 1.25 cups rice', factor: 1.08 },
            { label: '3/4 bowl + rice', factor: 0.92 }
        ],
        macros: { carbs: 52, protein: 35, fat: 18, fiber: 4, sugar: 6, sodium: 560, cholesterol: 115, saturatedFat: 5 }
    },
    {
        slug: 'palak-paneer-rice',
        name: 'Palak paneer with rice',
        amounts: [
            { label: '1 bowl + 3/4 cup rice', factor: 1 },
            { label: '1 bowl + 1 cup rice', factor: 1.08 },
            { label: '3/4 bowl + rice', factor: 0.92 }
        ],
        macros: { carbs: 41, protein: 23, fat: 20, fiber: 7, sugar: 6, sodium: 470, cholesterol: 40, saturatedFat: 8 }
    },
    {
        slug: 'chole-rice',
        name: 'Chole with rice',
        amounts: [
            { label: '1 bowl + 1 cup rice', factor: 1 },
            { label: '1 bowl + 1.25 cups rice', factor: 1.08 },
            { label: '3/4 bowl + rice', factor: 0.92 }
        ],
        macros: { carbs: 72, protein: 19, fat: 10, fiber: 14, sugar: 8, sodium: 430, cholesterol: 0, saturatedFat: 1 }
    },
    {
        slug: 'dal-rice',
        name: 'Dal with rice',
        amounts: [
            { label: '1 bowl + 1 cup rice', factor: 1 },
            { label: '1 bowl + 1.25 cups rice', factor: 1.08 },
            { label: '3/4 bowl + rice', factor: 0.92 }
        ],
        macros: { carbs: 62, protein: 21, fat: 8, fiber: 11, sugar: 5, sodium: 390, cholesterol: 0, saturatedFat: 1 }
    },
    {
        slug: 'burrito-wrap',
        name: 'Burrito wrap',
        amounts: [
            { label: '1 wrap', factor: 1 },
            { label: '1 large wrap', factor: 1.08 },
            { label: '3/4 wrap + salad', factor: 0.9 }
        ],
        macros: { carbs: 54, protein: 31, fat: 16, fiber: 10, sugar: 5, sodium: 560, cholesterol: 70, saturatedFat: 4 }
    },
    {
        slug: 'sandwich-salad',
        name: 'Sandwich with salad',
        amounts: [
            { label: '1 sandwich + salad', factor: 1 },
            { label: '1 large sandwich + salad', factor: 1.08 },
            { label: '1 sandwich', factor: 0.9 }
        ],
        macros: { carbs: 44, protein: 28, fat: 14, fiber: 5, sugar: 7, sodium: 620, cholesterol: 60, saturatedFat: 3 }
    },
    {
        slug: 'chicken-salad',
        name: 'Salad with chicken',
        amounts: [
            { label: '1 salad bowl', factor: 1 },
            { label: '1 large salad bowl', factor: 1.08 },
            { label: '1 light salad bowl', factor: 0.9 }
        ],
        macros: { carbs: 18, protein: 30, fat: 14, fiber: 5, sugar: 5, sodium: 340, cholesterol: 80, saturatedFat: 2.5 }
    }
];

const snackTemplates = [
    {
        slug: 'greek-yogurt-banana',
        name: 'Greek yogurt and banana',
        amounts: [
            { label: '1 serving', factor: 1 },
            { label: '1 small bowl', factor: 0.92 },
            { label: '1 serving + a little granola', factor: 1.08 }
        ],
        macros: { carbs: 28, protein: 17, fat: 4, fiber: 3, sugar: 18, sodium: 95, cholesterol: 8, saturatedFat: 1.5 }
    },
    {
        slug: 'apple-peanut-butter',
        name: 'Apple with peanut butter',
        amounts: [
            { label: '1 apple + 1 tbsp peanut butter', factor: 1 },
            { label: '1 apple + 2 tsp peanut butter', factor: 0.9 },
            { label: '1 apple + 1.5 tbsp peanut butter', factor: 1.08 }
        ],
        macros: { carbs: 24, protein: 5, fat: 9, fiber: 5, sugar: 18, sodium: 90, cholesterol: 0, saturatedFat: 1.5 }
    },
    {
        slug: 'cottage-cheese-fruit',
        name: 'Cottage cheese with fruit',
        amounts: [
            { label: '1 bowl', factor: 1 },
            { label: '3/4 bowl', factor: 0.9 },
            { label: '1 bowl + extra fruit', factor: 1.08 }
        ],
        macros: { carbs: 18, protein: 16, fat: 3, fiber: 2, sugar: 13, sodium: 320, cholesterol: 15, saturatedFat: 1.5 }
    },
    {
        slug: 'hummus-pita-carrots',
        name: 'Hummus with carrots and pita',
        amounts: [
            { label: '1 snack plate', factor: 1 },
            { label: '1 light snack plate', factor: 0.9 },
            { label: '1 snack plate + extra carrots', factor: 1.06 }
        ],
        macros: { carbs: 24, protein: 7, fat: 7, fiber: 5, sugar: 5, sodium: 240, cholesterol: 0, saturatedFat: 1 }
    },
    {
        slug: 'nuts-mix',
        name: 'Mixed nuts',
        amounts: [
            { label: '1 small handful', factor: 1 },
            { label: '1 light handful', factor: 0.9 },
            { label: '1 handful', factor: 1.06 }
        ],
        macros: { carbs: 6.5, protein: 5.3, fat: 17.7, fiber: 2.6, sugar: 1.4, sodium: 4, cholesterol: 0, saturatedFat: 2.9 }
    },
    {
        slug: 'protein-bar',
        name: 'Protein bar',
        amounts: [
            { label: '1 bar', factor: 1 },
            { label: '1 smaller bar', factor: 0.9 },
            { label: '1 bar + fruit', factor: 1.1 }
        ],
        macros: { carbs: 22, protein: 20, fat: 7, fiber: 6, sugar: 9, sodium: 220, cholesterol: 5, saturatedFat: 2 }
    },
    {
        slug: 'fruit-cup',
        name: 'Fruit cup',
        amounts: [
            { label: '1 cup', factor: 1 },
            { label: '3/4 cup', factor: 0.88 },
            { label: '1 cup + a few berries', factor: 1.08 }
        ],
        macros: { carbs: 18, protein: 1, fat: 0, fiber: 3, sugar: 14, sodium: 5, cholesterol: 0, saturatedFat: 0 }
    }
];

const dinnerTemplates = [
    {
        slug: 'chicken-curry-chapati-dinner',
        name: 'Chicken curry with chapati',
        amounts: [
            { label: '1 bowl + 2 chapatis', factor: 1 },
            { label: '1 bowl + 3 chapatis', factor: 1.08 },
            { label: '3/4 bowl + 2 chapatis', factor: 0.92 }
        ],
        macros: { carbs: 45, protein: 35, fat: 18, fiber: 5, sugar: 5, sodium: 560, cholesterol: 115, saturatedFat: 5 }
    },
    {
        slug: 'palak-paneer-chapati-dinner',
        name: 'Palak paneer with chapati',
        amounts: [
            { label: '1 bowl + 2 chapatis', factor: 1 },
            { label: '1 bowl + 3 chapatis', factor: 1.06 },
            { label: '3/4 bowl + 2 chapatis', factor: 0.92 }
        ],
        macros: { carbs: 35, protein: 23, fat: 22, fiber: 8, sugar: 5, sodium: 470, cholesterol: 42, saturatedFat: 8.5 }
    },
    {
        slug: 'dal-rice-dinner',
        name: 'Dal with rice',
        amounts: [
            { label: '1 bowl + 1 cup rice', factor: 1 },
            { label: '1 bowl + 1.25 cups rice', factor: 1.08 },
            { label: '3/4 bowl + rice', factor: 0.92 }
        ],
        macros: { carbs: 64, protein: 22, fat: 9, fiber: 12, sugar: 5, sodium: 400, cholesterol: 0, saturatedFat: 1 }
    },
    {
        slug: 'chole-chapati-dinner',
        name: 'Chole with chapati',
        amounts: [
            { label: '1 bowl + 2 chapatis', factor: 1 },
            { label: '1 bowl + 3 chapatis', factor: 1.08 },
            { label: '3/4 bowl + 2 chapatis', factor: 0.92 }
        ],
        macros: { carbs: 52, protein: 19, fat: 10, fiber: 12, sugar: 6, sodium: 420, cholesterol: 0, saturatedFat: 1 }
    },
    {
        slug: 'pasta-chicken-dinner',
        name: 'Pasta with vegetables and chicken',
        amounts: [
            { label: '1 bowl', factor: 1 },
            { label: '1.25 bowls', factor: 1.08 },
            { label: '3/4 bowl', factor: 0.92 }
        ],
        macros: { carbs: 66, protein: 27, fat: 18, fiber: 6, sugar: 7, sodium: 540, cholesterol: 80, saturatedFat: 4.5 }
    },
    {
        slug: 'tacos-dinner',
        name: 'Tacos',
        amounts: [
            { label: '3 tacos', factor: 1 },
            { label: '2 tacos + side salad', factor: 0.9 },
            { label: '3 tacos + salsa', factor: 1.06 }
        ],
        macros: { carbs: 48, protein: 32, fat: 18, fiber: 7, sugar: 4, sodium: 650, cholesterol: 70, saturatedFat: 5 }
    },
    {
        slug: 'burrito-wrap-dinner',
        name: 'Burrito wrap',
        amounts: [
            { label: '1 wrap', factor: 1 },
            { label: '1 large wrap', factor: 1.08 },
            { label: '3/4 wrap + salad', factor: 0.92 }
        ],
        macros: { carbs: 58, protein: 33, fat: 18, fiber: 10, sugar: 5, sodium: 590, cholesterol: 75, saturatedFat: 4.5 }
    },
    {
        slug: 'grilled-chicken-salad-dinner',
        name: 'Grilled chicken meal with salad',
        amounts: [
            { label: '1 plate', factor: 1 },
            { label: '1 plate + extra salad', factor: 1.05 },
            { label: '3/4 plate', factor: 0.9 }
        ],
        macros: { carbs: 30, protein: 40, fat: 16, fiber: 6, sugar: 8, sodium: 430, cholesterol: 115, saturatedFat: 3.5 }
    },
    {
        slug: 'restaurant-salad-dinner',
        name: 'Restaurant salad with grilled chicken',
        amounts: [
            { label: '1 salad bowl', factor: 1 },
            { label: '1 large salad bowl', factor: 1.08 },
            { label: '1 salad bowl + bread', factor: 1.05 }
        ],
        macros: { carbs: 29, protein: 34, fat: 19, fiber: 7, sugar: 6, sodium: 760, cholesterol: 95, saturatedFat: 4 }
    },
    {
        slug: 'restaurant-grilled-chicken',
        name: 'Restaurant grilled chicken meal',
        amounts: [
            { label: '1 plate', factor: 1 },
            { label: '1 plate + side veggies', factor: 1.08 },
            { label: '3/4 plate', factor: 0.92 }
        ],
        macros: { carbs: 36, protein: 42, fat: 17, fiber: 6, sugar: 8, sodium: 820, cholesterol: 110, saturatedFat: 4 }
    }
];

const normalizeDateString = (value) => {
    const dateValue = String(value ?? '').trim();

    if (!DATE_PATTERN.test(dateValue)) {
        throw new Error(`Invalid date "${value}". Use YYYY-MM-DD.`);
    }

    return dateValue;
};

const toPositiveNumber = (value, fieldName) => {
    const parsed = Number(value);

    if (!Number.isFinite(parsed) || parsed <= 0) {
        throw new Error(`Invalid ${fieldName}. Expected a positive number.`);
    }

    return Math.round(parsed * 100) / 100;
};

const roundTo = (value, digits = 1) => {
    const factor = 10 ** digits;
    return Math.round(value * factor) / factor;
};

const hashString = (input) => {
    let hash = 1779033703;

    for (let index = 0; index < input.length; index += 1) {
        hash = Math.imul(hash ^ input.charCodeAt(index), 3432918353);
        hash = (hash << 13) | (hash >>> 19);
    }

    return hash >>> 0;
};

const hashToUnitFloat = (input) => hashString(input) / 4294967295;

const scaleMacros = (base, factor) => ({
    carbs: roundTo(base.carbs * factor),
    protein: roundTo(base.protein * factor),
    fat: roundTo(base.fat * factor),
    fiber: roundTo((base.fiber || 0) * factor),
    sugar: roundTo((base.sugar || 0) * factor),
    sodium: Math.round((base.sodium || 0) * factor),
    cholesterol: Math.round((base.cholesterol || 0) * factor),
    saturatedFat: roundTo((base.saturatedFat || 0) * factor)
});

const calculateCalories = (macros) =>
    Math.round((macros.carbs * 4) + (macros.protein * 4) + (macros.fat * 9));

const parseDateParts = (dateString) => {
    const normalized = normalizeDateString(dateString);
    const [year, month, day] = normalized.split('-').map(Number);
    return { year, month, day };
};

const getDayIndex = (dateString) => {
    const { year, month, day } = parseDateParts(dateString);
    return Math.floor(Date.UTC(year, month - 1, day) / DAY_MILLIS);
};

const formatMinutesAsTime = (minutes) => {
    const hour = String(Math.floor(minutes / 60)).padStart(2, '0');
    const minute = String(minutes % 60).padStart(2, '0');
    return `${hour}:${minute}`;
};

const buildMealTime = (mealType, dateString, seed, slug) => {
    const window = MEAL_TIME_WINDOWS[mealType];
    const stepCount = Math.floor(window.spreadMinutes / 5);
    const offsetStep = hashString(`${seed}:${dateString}:${mealType}:${slug}:time`) % (stepCount + 1);
    return formatMinutesAsTime(window.startMinutes + (offsetStep * 5));
};

const normalizeSettings = (options = {}) => {
    const seed = String(options.seed || DEFAULT_SETTINGS.seed).trim() || DEFAULT_SETTINGS.seed;
    const maxDailyCalories = options.maxDailyCalories === undefined
        ? DEFAULT_SETTINGS.maxDailyCalories
        : toPositiveNumber(options.maxDailyCalories, 'generator.maxDailyCalories');
    const minDailyCalories = options.minDailyCalories === undefined
        ? Math.min(DEFAULT_SETTINGS.minDailyCalories, maxDailyCalories)
        : toPositiveNumber(options.minDailyCalories, 'generator.minDailyCalories');
    const targetDailyCalories = options.targetDailyCalories === undefined
        ? Math.min(DEFAULT_SETTINGS.targetDailyCalories, maxDailyCalories)
        : toPositiveNumber(options.targetDailyCalories, 'generator.targetDailyCalories');

    if (minDailyCalories > maxDailyCalories) {
        throw new Error('generator.minDailyCalories cannot be greater than generator.maxDailyCalories.');
    }

    if (targetDailyCalories > maxDailyCalories) {
        throw new Error('generator.targetDailyCalories cannot be greater than generator.maxDailyCalories.');
    }

    return {
        seed,
        minDailyCalories,
        targetDailyCalories: Math.max(minDailyCalories, targetDailyCalories),
        maxDailyCalories
    };
};

const createCandidate = (template, mealType, dateString, settings) => {
    const amountIndex = hashString(`${settings.seed}:${dateString}:${mealType}:${template.slug}:amount`) % template.amounts.length;
    const amountOption = template.amounts[amountIndex];
    const macros = scaleMacros(template.macros, amountOption.factor);

    return {
        slug: template.slug,
        mealType,
        name: template.name,
        amount: amountOption.label,
        calories: calculateCalories(macros),
        macros,
        time: buildMealTime(mealType, dateString, settings.seed, template.slug),
        preferenceKey: hashString(`${settings.seed}:${dateString}:${mealType}:${template.slug}:pref`)
    };
};

const buildCandidates = (templates, mealType, dateString, settings) =>
    templates
        .map((template) => createCandidate(template, mealType, dateString, settings))
        .sort((a, b) => b.preferenceKey - a.preferenceKey)
        .map((candidate, index) => ({
            ...candidate,
            preferenceRank: index
        }));

const scorePlan = (meals, settings, dateString) => {
    const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);
    const preferencePenalty = meals.reduce((sum, meal) => sum + meal.preferenceRank, 0) * 8;
    const caloriePenalty = Math.abs(settings.targetDailyCalories - totalCalories) * 2;
    const lowPenalty = totalCalories < settings.minDailyCalories
        ? (settings.minDailyCalories - totalCalories) * 6
        : 0;
    const tieBreaker = hashToUnitFloat(
        `${settings.seed}:${dateString}:${meals.map((meal) => meal.slug).join('|')}`
    );

    return {
        totalCalories,
        score: preferencePenalty + caloriePenalty + lowPenalty + tieBreaker
    };
};

const stripInternalFields = (meal) => ({
    mealType: meal.mealType,
    time: meal.time,
    name: meal.name,
    amount: meal.amount,
    calories: meal.calories,
    macros: meal.macros
});

export const generateRealisticMealsForDate = (dateString, options = {}) => {
    const normalizedDate = normalizeDateString(dateString);
    const settings = normalizeSettings(options);
    const dayIndex = getDayIndex(normalizedDate);
    const dateSeed = `${settings.seed}:${normalizedDate}:${dayIndex}`;

    const breakfasts = buildCandidates(breakfastTemplates, 'breakfast', normalizedDate, settings);
    const lunches = buildCandidates(lunchTemplates, 'lunch', normalizedDate, settings);
    const snacks = buildCandidates(snackTemplates, 'snack', normalizedDate, settings);
    const dinners = buildCandidates(dinnerTemplates, 'dinner', normalizedDate, settings);

    let bestPlan = null;

    for (const breakfast of breakfasts) {
        for (const lunch of lunches) {
            for (const snack of snacks) {
                const subtotal = breakfast.calories + lunch.calories + snack.calories;

                if (subtotal >= settings.maxDailyCalories) {
                    continue;
                }

                for (const dinner of dinners) {
                    const meals = [breakfast, lunch, snack, dinner];
                    const { totalCalories, score } = scorePlan(meals, settings, dateSeed);

                    if (totalCalories > settings.maxDailyCalories) {
                        continue;
                    }

                    if (!bestPlan || score < bestPlan.score) {
                        bestPlan = {
                            score,
                            totalCalories,
                            meals
                        };
                    }
                }
            }
        }
    }

    if (!bestPlan) {
        throw new Error(`Unable to generate a realistic meal plan for ${normalizedDate} within ${settings.maxDailyCalories} calories.`);
    }

    return {
        meals: bestPlan.meals.map(stripInternalFields),
        totalCalories: bestPlan.totalCalories
    };
};
