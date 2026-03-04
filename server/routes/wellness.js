import express from 'express';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

const WELLNESS_TIPS = [
    {
        id: 'mindful-bites',
        title: 'Slow First Bites',
        message: 'Take your first three bites slowly and chew thoroughly to support digestion and satiety.',
        category: 'Mindful Eating',
        learnMoreUrl: 'https://www.cdc.gov/healthy-weight-growth/healthy-eating/index.html'
    },
    {
        id: 'balanced-plate',
        title: 'Build a Balanced Plate',
        message: 'Fill half your plate with vegetables, then add protein and whole grains for steadier energy.',
        category: 'Meal Balance',
        learnMoreUrl: 'https://www.myplate.gov/'
    },
    {
        id: 'hydration-rhythm',
        title: 'Hydration Rhythm',
        message: 'Drink water between meals and keep a bottle visible to make hydration automatic.',
        category: 'Hydration',
        learnMoreUrl: 'https://www.cdc.gov/healthy-weight-growth/water-healthy-drinks/index.html'
    },
    {
        id: 'fiber-focus',
        title: 'Add More Fiber',
        message: 'Include a fiber source in at least two meals today to support fullness and gut health.',
        category: 'Nutrition',
        learnMoreUrl: 'https://www.myplate.gov/eat-healthy/fruits'
    },
    {
        id: 'protein-spacing',
        title: 'Distribute Protein',
        message: 'Spread protein intake across breakfast, lunch, and dinner instead of loading it in one meal.',
        category: 'Nutrition',
        learnMoreUrl: 'https://www.myplate.gov/eat-healthy/protein-foods'
    }
];

const getDailyTip = (userId) => {
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((today - startOfYear) / 86400000);
    const userOffset = Number(String(userId).slice(-2), 16) || 0;

    return WELLNESS_TIPS[(dayOfYear + userOffset) % WELLNESS_TIPS.length];
};

router.use(authenticate);

router.get('/daily', (req, res) => {
    const tip = getDailyTip(req.user._id);
    res.json({ tip });
});

router.get('/tips', (req, res) => {
    res.json({
        tips: WELLNESS_TIPS,
        dailyTipId: getDailyTip(req.user._id).id
    });
});

export default router;
