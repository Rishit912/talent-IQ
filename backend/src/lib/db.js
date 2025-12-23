import mongoose from 'mongoose';

import { ENV } from './env.js';

export const connectDB = async () => {
    try {
     
        if(!ENV.DB_URL)
        {
            throw new Error("DB_URL is not defined in environment variables");
        }

        const conn = await mongoose.connect(ENV.DB_URL)
        console.log("MongoDB Connected succefully:", conn.connection.host);

        // Cleanup legacy indexes that can break auth provisioning
        try {
            const db = mongoose.connection.db;
            if (db) {
                // Some older schemas used a capitalized ClerkId field which
                // left behind a unique index on { ClerkId: 1 }.
                // That index causes duplicate-key errors when creating
                // multiple users with the current `clerkId` field.
                await db.collection('users').dropIndex('ClerkId_1');
                console.log('Dropped legacy index ClerkId_1 on users collection');
            }
        } catch (idxErr) {
            // Ignore if index does not exist; log other issues for visibility.
            if (idxErr?.codeName !== 'IndexNotFound') {
                console.warn('Warning: failed to drop legacy ClerkId_1 index:', idxErr.message || idxErr);
            }
        }
    } catch (error) {
        console.error("Error connecting to the mongodb", error);
        process.exit(1); //note that 0 means success, 1 means failure
    }
};