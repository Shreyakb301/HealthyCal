import express from 'express';

const router = express.Router();
const buildNutrients = (overrides = {}) => ({
    carbs: 0,
    protein: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0,
    cholesterol: 0,
    saturatedFat: 0,
    ...overrides
});

const FOOD_DB = [
    { id: 'oats', name: 'Rolled Oats', serving: '1 cup cooked', calories: 154, macros: buildNutrients({ carbs: 27, protein: 6, fat: 3, fiber: 4, sugar: 1.1, sodium: 2, saturatedFat: 0.5 }) },
    { id: 'chicken', name: 'Chicken Breast', serving: '3 oz', calories: 128, macros: buildNutrients({ protein: 26, fat: 3, sodium: 44, cholesterol: 73, saturatedFat: 0.9 }) },
    { id: 'salmon', name: 'Salmon Fillet', serving: '4 oz', calories: 233, macros: buildNutrients({ protein: 25, fat: 14, sodium: 75, cholesterol: 71, saturatedFat: 3.1 }) },
    { id: 'quinoa', name: 'Quinoa', serving: '1 cup cooked', calories: 222, macros: buildNutrients({ carbs: 39, protein: 8, fat: 4, fiber: 5.2, sugar: 1.6, sodium: 13, saturatedFat: 0.4 }) },
    { id: 'greek-yogurt', name: 'Greek Yogurt (Plain)', serving: '170 g', calories: 100, macros: buildNutrients({ carbs: 6, protein: 17, sugar: 6, sodium: 65, cholesterol: 10 }) },
    { id: 'avocado', name: 'Avocado', serving: '1/2 medium', calories: 120, macros: buildNutrients({ carbs: 6, protein: 1, fat: 11, fiber: 5, sugar: 0.3, sodium: 5, saturatedFat: 1.6 }) },
    { id: 'egg', name: 'Egg', serving: '1 large', calories: 70, macros: buildNutrients({ carbs: 1, protein: 6, fat: 5, sodium: 70, cholesterol: 186, saturatedFat: 1.6 }) },
    { id: 'sweet-potato', name: 'Sweet Potato', serving: '1 medium', calories: 112, macros: buildNutrients({ carbs: 26, protein: 2, fiber: 3.9, sugar: 5.4, sodium: 41 }) },
    { id: 'apple', name: 'Apple', serving: '1 medium', calories: 95, macros: buildNutrients({ carbs: 25, fiber: 4.4, sugar: 19, sodium: 2 }) },
    { id: 'almonds', name: 'Almonds', serving: '1 oz', calories: 164, macros: buildNutrients({ carbs: 6, protein: 6, fat: 14, fiber: 3.5, sugar: 1.2, sodium: 0, saturatedFat: 1.1 }) }
];

const USDA_SEARCH_URL = 'https://api.nal.usda.gov/fdc/v1/foods/search';
const SEARCH_PAGE_SIZE = 20;
const MAX_RESULTS = 8;
const DATA_TYPE_PRIORITY = {
    Foundation: 400,
    'SR Legacy': 350,
    'Survey (FNDDS)': 300,
    Branded: 100,
    Experimental: 50
};

const roundValue = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
        return 0;
    }

    return Math.round(numeric * 10) / 10;
};

const toDisplayCase = (value) => {
    if (!value) {
        return 'Unknown';
    }

    if (value !== value.toUpperCase()) {
        return value;
    }

    return value
        .toLowerCase()
        .replace(/\b([a-z])/g, (match) => match.toUpperCase());
};

const getNutrientValue = (food, nutrientNumber) => {
    const nutrients = Array.isArray(food.foodNutrients) ? food.foodNutrients : [];
    const nutrient = nutrients.find((item) => item.nutrientNumber === nutrientNumber);
    return roundValue(nutrient?.value);
};

const formatServing = (food) => {
    if (food.householdServingFullText) {
        return food.householdServingFullText;
    }

    if (food.servingSize && food.servingSizeUnit) {
        return `${roundValue(food.servingSize)} ${String(food.servingSizeUnit).toLowerCase()}`;
    }

    if (food.packageWeight) {
        return food.packageWeight;
    }

    return 'Serving size unavailable';
};

const scoreFood = (food, normalizedQuery) => {
    const description = (food.description || '').toLowerCase();
    let score = DATA_TYPE_PRIORITY[food.dataType] || 0;

    if (description === normalizedQuery) {
        score += 100;
    }

    if (description.startsWith(normalizedQuery)) {
        score += 50;
    }

    if (description.includes(normalizedQuery)) {
        score += 20;
    }

    if (food.householdServingFullText) {
        score += 5;
    }

    if (food.dataType === 'Branded') {
        score -= 5;
    }

    return score;
};

const mapUsdaFood = (food, normalizedQuery) => ({
    id: String(food.fdcId),
    name: toDisplayCase(food.description),
    serving: formatServing(food),
    calories: getNutrientValue(food, '208'),
    macros: buildNutrients({
        carbs: getNutrientValue(food, '205'),
        protein: getNutrientValue(food, '203'),
        fat: getNutrientValue(food, '204'),
        fiber: getNutrientValue(food, '291'),
        sugar: getNutrientValue(food, '269'),
        sodium: getNutrientValue(food, '307'),
        cholesterol: getNutrientValue(food, '601'),
        saturatedFat: getNutrientValue(food, '606')
    }),
    matchScore: scoreFood(food, normalizedQuery)
});

const getUsdaApiKey = () =>
    process.env.USDA_API_KEY || process.env.DATA_GOV_API_KEY || process.env.API_KEY;

const searchUsdaFoods = async (query) => {
    const apiKey = getUsdaApiKey();

    if (!apiKey) {
        const error = new Error('USDA_API_KEY environment variable is not configured');
        error.status = 500;
        throw error;
    }

    const url = new URL(USDA_SEARCH_URL);
    url.searchParams.set('query', query);
    url.searchParams.set('pageSize', String(SEARCH_PAGE_SIZE));
    url.searchParams.set('api_key', apiKey);

    let response;

    try {
        response = await fetch(url.toString(), {
            headers: {
                'X-Api-Key': apiKey
            }
        });
    } catch (error) {
        const networkError = new Error('Unable to reach USDA FoodData Central');
        networkError.status = 502;
        throw networkError;
    }

    if (!response.ok) {
        const details = await response.text();
        const apiError = new Error(`USDA search failed (${response.status})${details ? `: ${details.slice(0, 160)}` : ''}`);
        apiError.status = 502;
        throw apiError;
    }

    const payload = await response.json();
    const normalizedQuery = query.trim().toLowerCase();
    const foods = Array.isArray(payload.foods) ? payload.foods : [];

    return foods
        .map((food) => mapUsdaFood(food, normalizedQuery))
        .sort((left, right) => right.matchScore - left.matchScore || left.name.localeCompare(right.name))
        .slice(0, MAX_RESULTS)
        .map(({ matchScore, ...food }) => food);
};

router.get('/search', async (req, res, next) => {
    const query = (req.query.q || '').toString().trim().toLowerCase();

    if (!query) {
        return res.status(400).json({ message: 'Please provide a search query with ?q=' });
    }

    try {
        const results = await searchUsdaFoods(query);

        res.json({
            query,
            results
        });
    } catch (error) {
        next(error);
    }
});

router.get('/popular', (req, res) => {
    res.json({ foods: FOOD_DB.slice(0, 6) });
});

export default router;
