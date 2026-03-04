import express from 'express';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

const toPositiveNumber = (value, fallback) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return fallback;
    }
    return parsed;
};

router.get('/', async (req, res) => {
    res.json({
        settings: req.user.settings || {
            dailyCalorieGoal: 2000,
            darkMode: false,
            notificationsEnabled: true
        }
    });
});

router.put('/', async (req, res) => {
    try {
        const current = req.user.settings || {};

        const updatedSettings = {
            dailyCalorieGoal: toPositiveNumber(req.body.dailyCalorieGoal, current.dailyCalorieGoal || 2000),
            darkMode: req.body.darkMode !== undefined ? Boolean(req.body.darkMode) : Boolean(current.darkMode),
            notificationsEnabled: req.body.notificationsEnabled !== undefined
                ? Boolean(req.body.notificationsEnabled)
                : (current.notificationsEnabled !== undefined ? Boolean(current.notificationsEnabled) : true)
        };

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: { settings: updatedSettings } },
            { new: true }
        ).select('-password');

        res.json({ settings: user.settings });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

export default router;
