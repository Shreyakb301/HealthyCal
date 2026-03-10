import express from 'express';
import Meal from '../models/Meal.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All meal routes require authentication
router.use(authenticate);

const toNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

const normalizeMealPayload = (body, existingMeal = null) => {
    const mealName = (body.name ?? body.food ?? existingMeal?.name ?? existingMeal?.food ?? '').trim();
    const normalizedMealType = (body.mealType ?? existingMeal?.mealType ?? 'snack').toLowerCase();

    const payload = {
        name: mealName,
        food: mealName,
        amount: (body.amount ?? existingMeal?.amount ?? '').trim(),
        mealType: ['breakfast', 'lunch', 'dinner', 'snack'].includes(normalizedMealType)
            ? normalizedMealType
            : 'snack',
        calories: body.calories !== undefined ? toNumber(body.calories) : toNumber(existingMeal?.calories),
        imageUrl: (body.imageUrl ?? existingMeal?.imageUrl ?? '').trim(),
        date: body.date ? new Date(body.date) : (existingMeal?.date ?? new Date()),
        macros: {
            carbs: body?.macros?.carbs !== undefined
                ? toNumber(body.macros.carbs)
                : toNumber(existingMeal?.macros?.carbs),
            protein: body?.macros?.protein !== undefined
                ? toNumber(body.macros.protein)
                : toNumber(existingMeal?.macros?.protein),
            fat: body?.macros?.fat !== undefined
                ? toNumber(body.macros.fat)
                : toNumber(existingMeal?.macros?.fat)
        }
    };

    return payload;
};

// Get all meals for the authenticated user, optionally filtered by date (?date=YYYY-MM-DD)
router.get('/', async (req, res) => {
    try {
        const query = { userId: req.user._id };

        if (req.query.date) {
            // Parse and create start/end of the requested local day
            const day = new Date(req.query.date);
            if (!isNaN(day)) {
                const start = new Date(day);
                start.setHours(0, 0, 0, 0);
                const end = new Date(day);
                end.setHours(23, 59, 59, 999);
                query.date = { $gte: start, $lte: end };
            }
        }

        const meals = await Meal.find(query)
            .sort({ date: -1 })
            .select('-__v');

        res.json({ meals });
    } catch (error) {
        console.error('Error fetching meals:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get a specific meal by ID
router.get('/:id', async (req, res) => {
    try {
        const meal = await Meal.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!meal) {
            return res.status(404).json({ message: 'Meal not found' });
        }

        res.json({ meal });
    } catch (error) {
        console.error('Error fetching meal:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Create a new meal
router.post('/', async (req, res) => {
    try {
        if (req.body.calories === undefined) {
            return res.status(400).json({
                message: 'Please provide calories'
            });
        }

        const payload = normalizeMealPayload(req.body);

        if (!payload.name) {
            return res.status(400).json({
                message: 'Please provide a meal name'
            });
        }

        const meal = new Meal({
            userId: req.user._id,
            ...payload
        });

        await meal.save();

        res.status(201).json({
            message: 'Meal added successfully',
            meal
        });
    } catch (error) {
        console.error('Error creating meal:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update a meal
router.put('/:id', async (req, res) => {
    try {
        const meal = await Meal.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!meal) {
            return res.status(404).json({ message: 'Meal not found' });
        }

        const payload = normalizeMealPayload(req.body, meal);

        if (!payload.name) {
            return res.status(400).json({
                message: 'Please provide a meal name'
            });
        }

        meal.name = payload.name;
        meal.food = payload.food;
        meal.amount = payload.amount;
        meal.mealType = payload.mealType;
        meal.calories = payload.calories;
        meal.imageUrl = payload.imageUrl;
        meal.date = payload.date;
        meal.macros = payload.macros;

        await meal.save();

        res.json({
            message: 'Meal updated successfully',
            meal
        });
    } catch (error) {
        console.error('Error updating meal:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Delete a meal
router.delete('/:id', async (req, res) => {
    try {
        const meal = await Meal.findOneAndDelete({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!meal) {
            return res.status(404).json({ message: 'Meal not found' });
        }

        res.json({ message: 'Meal deleted successfully' });
    } catch (error) {
        console.error('Error deleting meal:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

export default router;
