import mongoose from 'mongoose';
import app from '../server/app.js';

const MONGODB_URI = process.env.MONGODB_URI;

const connectToDatabase = async () => {
    // 1 = connected, 2 = connecting
    if (mongoose.connection.readyState >= 1) {
        return;
    }

    if (!MONGODB_URI) {
        throw new Error('MONGODB_URI environment variable is missing in Vercel settings');
    }

    try {
        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 5000 // fail fast instead of hanging
        });
        console.log('Successfully connected to MongoDB Atlas');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        throw new Error(`Cloud Database Connection Failed: ${err.message}. Check your Atlas IP Access List (Whitelist) and credentials.`);
    }
};

export default async function handler(req, res) {
    // Vercel might strip the /api prefix, but Express routes in app.js expect it.
    // However, if the user navigates directly to /api/auth/login, it might already be there.
    if (!req.url.startsWith('/api')) {
        req.url = '/api' + req.url;
    }

    try {
        await connectToDatabase();
        return app(req, res);
    } catch (error) {
        console.error('Vercel API error:', error);
        return res.status(500).json({
            message: 'Server Error: ' + error.message,
            reason: error.message,
            tip: 'If this is a database error, ensure your MongoDB Atlas IP Access List is set to 0.0.0.0/0 (Access From Anywhere) for Vercel.'
        });
    }
}
