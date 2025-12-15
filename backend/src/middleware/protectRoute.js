import { clerkClient, requireAuth, getAuth } from '@clerk/express'
import User from '../models/User.js'

export const protectRoute = [
    // 1. Clerk's built-in middleware to verify the token and populate req.auth
    requireAuth({signeInUrl : '/sign-in'}),
    
    // 2. Custom middleware to check user in your database and attach to req.user
    async (req, res, next) => {
        try {
             const clerkId = req.auth.userId;

             if (!clerkId) {
                // This correctly handles the case where requireAuth failed
                return res.status(401).json({ msg: "Unauthorized - missing or invalid token" });
             }

             // --- FIX APPLIED HERE ---
             // This logic now runs ONLY if clerkId exists, and is outside the 'if' block.
             const user = await User.findOne({ clerkId });

             if (!user) {
                 return res.status(404).json({ msg: "User not found in database" });
             }

             req.user = user; // Attach user to request object
             next(); // Call next to proceed to the route handler
             
        } catch (error) {
            console.error("Error in protectRoute middleware:", error);
            res.status(500).json({ msg: "Server error in authentication" });
        }
    }
];