import express from 'express';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

const FOOD_DB = [
    { id: 'oats', name: 'Rolled Oats', serving: '1 cup cooked', calories: 154, macros: { carbs: 27, protein: 6, fat: 3 } },
    { id: 'chicken', name: 'Chicken Breast', serving: '3 oz', calories: 128, macros: { carbs: 0, protein: 26, fat: 3 } },
    { id: 'salmon', name: 'Salmon Fillet', serving: '4 oz', calories: 233, macros: { carbs: 0, protein: 25, fat: 14 } },
    { id: 'quinoa', name: 'Quinoa', serving: '1 cup cooked', calories: 222, macros: { carbs: 39, protein: 8, fat: 4 } },
    { id: 'greek-yogurt', name: 'Greek Yogurt (Plain)', serving: '170 g', calories: 100, macros: { carbs: 6, protein: 17, fat: 0 } },
    { id: 'avocado', name: 'Avocado', serving: '1/2 medium', calories: 120, macros: { carbs: 6, protein: 1, fat: 11 } },
    { id: 'egg', name: 'Egg', serving: '1 large', calories: 70, macros: { carbs: 1, protein: 6, fat: 5 } },
    { id: 'sweet-potato', name: 'Sweet Potato', serving: '1 medium', calories: 112, macros: { carbs: 26, protein: 2, fat: 0 } },
    { id: 'apple', name: 'Apple', serving: '1 medium', calories: 95, macros: { carbs: 25, protein: 0, fat: 0 } },
    { id: 'almonds', name: 'Almonds', serving: '1 oz', calories: 164, macros: { carbs: 6, protein: 6, fat: 14 } }
];

router.use(authenticate);

router.get('/search', (req, res) => {
    const query = (req.query.q || '').toString().trim().toLowerCase();

    if (!query) {
        return res.status(400).json({ message: 'Please provide a search query with ?q=' });
    }

    const results = FOOD_DB.filter((item) =>
        item.name.toLowerCase().includes(query)
    ).slice(0, 8);

    res.json({
        query,
        results
    });
});

router.get('/popular', (req, res) => {
    res.json({ foods: FOOD_DB.slice(0, 6) });
});

export default router;
