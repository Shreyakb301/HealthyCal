import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
    try {
        const username = req.body.username?.trim();
        const email = req.body.email?.trim().toLowerCase();
        const password = req.body.password;

        // Validation
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Please provide username, email, and password' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email or username' });
        }

        // Create user
        const user = new User({
            username,
            email,
            password
        });

        await user.save();

        // Generate token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'my-secret-key-tapitup',
            { expiresIn: process.env.JWT_EXPIRE || '7d' }
        );

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Registration error:', error);

        // Handle duplicate key errors explicitly (username/email unique indexes)
        if (error?.code === 11000) {
            const duplicatedField = Object.keys(error.keyPattern || {})[0];
            if (duplicatedField === 'email') {
                return res.status(400).json({ message: 'Email is already registered' });
            }
            if (duplicatedField === 'username') {
                return res.status(400).json({ message: 'Username is already taken' });
            }
            return res.status(400).json({ message: 'User already exists with this email or username' });
        }

        if (error?.name === 'ValidationError') {
            const firstValidationMessage = Object.values(error.errors || {})[0]?.message;
            return res.status(400).json({ message: firstValidationMessage || 'Invalid registration data' });
        }

        res.status(500).json({ message: 'Server error during registration' });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'my-secret-key-tapitup',
            { expiresIn: process.env.JWT_EXPIRE || '7d' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login', error: error.message });
    }
});

// Get current user (verify token)
router.get('/me', authenticate, async (req, res) => {
    try {
        res.json({
            user: {
                id: req.user._id,
                username: req.user.username,
                email: req.user.email
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Logout (client-side token removal, but we can invalidate if needed)
router.post('/logout', authenticate, (req, res) => {
    // In a more advanced setup, you could maintain a token blacklist
    // For now, logout is handled client-side by removing the token
    res.json({ message: 'Logged out successfully' });
});

export default router;

