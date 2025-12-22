import { chatClient } from "../lib/stream.js";

function getClerkId(user) {
    return user?.clerkId || user?.ClerkId || user?.clerkid || null;
}

export async function getStreamToken(req, res) {
    try {
        const clerkId = getClerkId(req.user);
        if (!clerkId) return res.status(400).json({ error: "Missing clerk id" });

        const token = chatClient.createToken(clerkId);
        res.status(200).json({
            token,
            userId: clerkId,
            userName: req.user.name,
            userImage: req.user.profileImage,
        });
    } catch (error) {
        console.error("Error generating stream token:", error);
        res.status(500).json({ error: "Failed to generate chat token" });
    }
}
