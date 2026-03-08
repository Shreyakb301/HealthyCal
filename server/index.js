import mongoose from 'mongoose';
import dotenv from 'dotenv';
import app from './app.js';

dotenv.config();

const PORT = process.env.PORT || 5005;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/healthycal';

async function start() {
    try {
        if (!process.env.MONGODB_URI) {
            console.warn('Warning: MONGODB_URI is not defined in .env, using mongodb://127.0.0.1:27017/healthycal');
        }

        await mongoose.connect(MONGODB_URI);
        console.log('MongoDB connected');

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (err) {
        console.error('Failed to start server', err);
        process.exit(1);
    }
}

start();


