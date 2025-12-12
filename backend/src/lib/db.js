import mongoose from 'mongoose';

import { ENV } from './env.js';

export const connectDB = async () => {
    try {
        const conn = await mongoose.connect(ENV.DB_URL)
        console.log("MongoDB Connected succefully:", conn.connection.host);
    } catch (error) {
        console.error("Error connecting to the mongodb", error);
        process.exit(1); //note that 0 means success, 1 means failure
    }
};