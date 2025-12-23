import { clerkClient, requireAuth } from '@clerk/express'
import User from '../models/User.js'

export const protectRoute = [
    // 1. Clerk's built-in middleware to verify the token and populate req.auth
    requireAuth(),

    // 2. Custom middleware to check user in your database and attach to req.user
    async (req, res, next) => {
        try {
            console.log("[protectRoute] req.auth:", req.auth);
            const clerkId = req.auth?.userId;
            console.log("[protectRoute] clerkId:", clerkId);

            if (!clerkId) {
                return res.status(401).json({ message: "Unauthorized - missing or invalid token" });
            }

            let user = await User.findOne({ clerkId });

            // Auto-provision user locally if not found
            if (!user) {
                console.log(`[protectRoute] user not found locally, attempting to provision: ${clerkId}`);

                // Default fallback values in case Clerk API call fails
                let name = 'Unknown';
                let email = `${clerkId}@users.local`;
                let profileImage = '';

                try {
                    const clerkUser = await clerkClient.users.getUser(clerkId);
                    name = clerkUser.fullName || `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'Unknown';
                    email = (clerkUser.emailAddresses && clerkUser.emailAddresses[0] && clerkUser.emailAddresses[0].emailAddress) || email;
                    profileImage = clerkUser.profileImageUrl || clerkUser.imageUrl || '';
                } catch (err) {
                    console.warn('[protectRoute] failed to fetch user details from Clerk, using fallbacks:', err?.message || err);
                }

                try {
                    user = await User.create({ name, email, profileImage, clerkId });
                    console.log('[protectRoute] created local user for clerkId:', clerkId);
                } catch (createErr) {
                    console.warn('[protectRoute] user create failed, attempting to find existing user:', createErr?.message || createErr);
                    // If creation failed due to duplicate key, try to find existing by clerkId or email
                    user = await User.findOne({ $or: [{ clerkId }, { email }] });
                    if (!user) {
                        console.error('[protectRoute] failed to provision user and could not find existing user');
                        return res.status(500).json({ message: 'Failed to provision user from auth provider' });
                    }
                }
            }

            req.user = user; // Attach user to request object
            next(); // Call next to proceed to the route handler
        } catch (error) {
            console.error("Error in protectRoute middleware:", error);
            res.status(500).json({ message: "Server error in authentication" });
        }
    }
];