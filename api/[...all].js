import mongoose from 'mongoose';
import app from '../server/app.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/healthycal';

let cachedConnectionPromise = globalThis.__healthycalDbPromise;

const connectToDatabase = async () => {
    if (mongoose.connection.readyState === 1) {
        return;
    }

    if (!cachedConnectionPromise) {
        cachedConnectionPromise = mongoose.connect(MONGODB_URI);
        globalThis.__healthycalDbPromise = cachedConnectionPromise;
    }

    await cachedConnectionPromise;
};

export default async function handler(req, res) {
    try {
        await connectToDatabase();
        return app(req, res);
    } catch (error) {
        console.error('Vercel API bootstrap error:', error);
        return res.status(500).json({ message: 'Server initialization failed' });
    }
}
