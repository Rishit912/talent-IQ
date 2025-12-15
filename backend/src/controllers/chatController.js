import { chatClient } from "../lib/stream.js";

export async function getStreamToken(req, res) {

    try {

        // use the stream chat client to create a token for the user
        //use clerkid for the stream aa(not mongodb _id) => it should be match the id we have in the stream 
        const token = chatClient.createToken(req.user.clerkid);
        res.status(200).json({ 
            token,
            userId: req.user.clerkid,
            userName: req.user.name,
            userImage: req.user.profileImage,
        });
    }
    catch (error) {
        console.error("Error generating stream token:", error);
        res.status(500).json({ error: "Failed to generate chat token" });
    }

}
