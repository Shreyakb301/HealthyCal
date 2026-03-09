import mongoose from 'mongoose';
import app from '../server/app.js';

const MONGODB_URI = process.env.MONGODB_URI;

const connectToDatabase = async () => {
    if (mongoose.connection.readyState === 1) {
        return;
    }
    if (!MONGODB_URI) {
        throw new Error('MONGODB_URI environment variable is not defined');
    }
    await mongoose.connect(MONGODB_URI);
};

export default async function handler(req, res) {
    // Vercel might strip the /api prefix, but Express routes in app.js expect it.
    // Let's ensure the URL starts with /api so Express can match the routes.
    if (!req.url.startsWith('/api')) {
        req.url = '/api' + req.url;
    }

    try {
        await connectToDatabase();
        return app(req, res);
    } catch (error) {
        console.error('Vercel API error:', error);
        return res.status(500).json({
            message: 'Internal Server Error',
            error: error.message
        });
    }
}
