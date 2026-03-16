import express from 'express';
import Meal from '../models/Meal.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

const FALLBACK_IMAGES = {
    breakfast: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=640&q=80',
    lunch: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=640&q=80',
    dinner: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=640&q=80',
    snack: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=640&q=80'
};

const WELLNESS_TIPS = [
    {
        id: 'mindful-bites',
        message: 'Take the first three bites slowly to help your body register fullness cues earlier.',
        learnMoreUrl: 'https://www.cdc.gov/healthy-weight-growth/healthy-eating/index.html'
    },
    {
        id: 'protein-plus-fiber',
        message: 'Pair protein with fiber at each meal to stay energized and reduce afternoon cravings.',
        learnMoreUrl: 'https://www.myplate.gov/eat-healthy/protein-foods'
    },
    {
        id: 'hydration-check',
        message: 'Drink water before meals and keep a bottle nearby to support hydration through the day.',
        learnMoreUrl: 'https://www.cdc.gov/healthy-weight-growth/water-healthy-drinks/index.html'
    },
    {
        id: 'plate-balance',
        message: 'Aim for color variety on your plate to naturally increase micronutrient diversity.',
        learnMoreUrl: 'https://www.myplate.gov/eat-healthy/fruits'
    }
];

const toNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

const getLocalDayRange = () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    return { start, end };
};

const formatMeal = (meal, mealType) => ({
    id: String(meal._id),
    mealType,
    name: meal.name || meal.food,
    calories: toNumber(meal.calories),
    imageUrl: meal.imageUrl || FALLBACK_IMAGES[mealType] || FALLBACK_IMAGES.snack,
    macros: {
        carbs: toNumber(meal?.macros?.carbs),
        protein: toNumber(meal?.macros?.protein),
        fat: toNumber(meal?.macros?.fat)
    }
});

const formatMealLog = (meal) => ({
    id: String(meal._id),
    mealType: meal.mealType || 'snack',
    name: meal.name || meal.food,
    calories: toNumber(meal.calories),
    amount: meal.amount || '',
    date: meal.date ? new Date(meal.date).toISOString() : null,
    macros: {
        carbs: toNumber(meal?.macros?.carbs),
        protein: toNumber(meal?.macros?.protein),
        fat: toNumber(meal?.macros?.fat),
        fiber: toNumber(meal?.macros?.fiber),
        sugar: toNumber(meal?.macros?.sugar),
        sodium: toNumber(meal?.macros?.sodium),
        cholesterol: toNumber(meal?.macros?.cholesterol),
        saturatedFat: toNumber(meal?.macros?.saturatedFat)
    }
});

const percentage = (value, total) => {
    if (!total) return 0;
    return Math.round((value / total) * 100);
};

router.get('/', async (req, res) => {
    try {
        const { start, end } = getLocalDayRange();

        const mealsToday = await Meal.find({
            userId: req.user._id,
            date: { $gte: start, $lt: end }
        })
            .sort({ date: -1 })
            .lean();

        const byType = {
            breakfast: mealsToday.find((meal) => meal.mealType === 'breakfast') || null,
            lunch: mealsToday.find((meal) => meal.mealType === 'lunch') || null,
            dinner: mealsToday.find((meal) => meal.mealType === 'dinner') || null
        };

        const dailyMeals = {
            breakfast: byType.breakfast ? formatMeal(byType.breakfast, 'breakfast') : null,
            lunch: byType.lunch ? formatMeal(byType.lunch, 'lunch') : null,
            dinner: byType.dinner ? formatMeal(byType.dinner, 'dinner') : null
        };

        const caloriesConsumed = mealsToday.reduce((sum, meal) => sum + toNumber(meal.calories), 0);
        const calorieGoal = toNumber(req.user?.settings?.dailyCalorieGoal) || 2000;

        const totals = mealsToday.reduce(
            (acc, meal) => ({
                carbs: acc.carbs + toNumber(meal?.macros?.carbs),
                protein: acc.protein + toNumber(meal?.macros?.protein),
                fat: acc.fat + toNumber(meal?.macros?.fat)
            }),
            { carbs: 0, protein: 0, fat: 0 }
        );

        const macroSum = totals.carbs + totals.protein + totals.fat;
        const percentages = {
            carbs: percentage(totals.carbs, macroSum),
            protein: percentage(totals.protein, macroSum),
            fat: percentage(totals.fat, macroSum)
        };

        const today = new Date();
        const startOfYear = new Date(today.getFullYear(), 0, 0);
        const dayOfYear = Math.floor((today - startOfYear) / 86400000);
        const userOffset = Number(String(req.user._id).slice(-2), 16) || 0;
        const tip = WELLNESS_TIPS[(dayOfYear + userOffset) % WELLNESS_TIPS.length];

        res.json({
            date: start.toISOString().slice(0, 10),
            dailyMeals,
            todayMealLogs: mealsToday.map(formatMealLog),
            dailyCalorieSummary: {
                totalCaloriesConsumed: caloriesConsumed,
                dailyCalorieGoal: calorieGoal
            },
            macronutrientSummary: {
                totals,
                percentages
            },
            wellnessTip: tip
        });
    } catch (error) {
        console.error('Error building dashboard summary:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

const getStartOfWeek = (date) => {
    const weekStart = new Date(date);
    const day = weekStart.getDay();
    const mondayOffset = (day + 6) % 7; // Monday = 0, Sunday = 6
    weekStart.setDate(weekStart.getDate() - mondayOffset);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setMilliseconds(0);
    return weekStart;
};

router.get('/weekly', async (req, res) => {
    try {
        const { weekStart, weekOffset } = req.query;
        let startOfWeek;

        if (weekStart) {
            const parsed = new Date(`${weekStart}T00:00:00`);
            if (Number.isNaN(parsed.getTime())) {
                return res.status(400).json({ message: 'Invalid weekStart date' });
            }
            startOfWeek = getStartOfWeek(parsed);
        } else if (weekOffset !== undefined) {
            const offset = Number(weekOffset);
            if (!Number.isFinite(offset)) {
                return res.status(400).json({ message: 'Invalid weekOffset' });
            }
            const now = new Date();
            const base = getStartOfWeek(now);
            base.setDate(base.getDate() + offset * 7);
            startOfWeek = base;
        } else {
            startOfWeek = getStartOfWeek(new Date());
        }

        const days = [];

        for (let i = 0; i < 7; i++) {
            const start = new Date(startOfWeek);
            start.setDate(startOfWeek.getDate() + i);
            start.setHours(0, 0, 0, 0);

            const end = new Date(start);
            end.setDate(start.getDate() + 1);

            const meals = await Meal.find({
                userId: req.user._id,
                date: { $gte: start, $lt: end }
            }).lean();

            const calories = meals.reduce((sum, m) => sum + toNumber(m.calories), 0);
            const macros = meals.reduce(
                (acc, m) => ({
                    carbs: acc.carbs + toNumber(m?.macros?.carbs),
                    protein: acc.protein + toNumber(m?.macros?.protein),
                    fat: acc.fat + toNumber(m?.macros?.fat)
                }),
                { carbs: 0, protein: 0, fat: 0 }
            );

            days.push({
                date: start.toISOString().slice(0, 10),
                label: start.toLocaleDateString('en-US', { weekday: 'short' }),
                calories,
                macros
            });
        }

        res.json({ days });
    } catch (error) {
        console.error('Error fetching weekly summary:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

export default router;
