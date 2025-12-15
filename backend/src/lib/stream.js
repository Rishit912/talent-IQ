import pkg from "stream-chat"; // Change 1: Use default import for CommonJS module
const { StreamChat } = pkg;     // Change 1: Destructure the correct export (StreamChat)

import { ENV } from "./env.js";
// import { use } from "react"; // Change 2: REMOVED unnecessary/invalid React hook import


const apiKey = ENV.STREAM_API_KEY;
const apiSecret = ENV.STREAM_API_SECRET;

if(!apiKey || !apiSecret){
    console.error("Stream API key and secret are required");
}

// Change 3: Correctly initialize the client using the StreamChat class
export const chatClient = StreamChat.getInstance(apiKey, apiSecret);

export const upsertStreamUser = async (userData) => {
    try {
        await chatClient.upsertUser([userData ]);
        console.log("stream user upserted successfully ", userData);
    } catch (error) {
        console.error("Error upserting Stream user:", error);
    }
};



export const deleteStreamUser = async (userId) => {
    try {
        await chatClient.deleteUser(userId, { markMessagesDeleted: true });
      console.log("stream user deleted successfully ", userId);
      
    } catch (error) {
        console.error("Error deleting Stream user:", error);
    }

};


//todo : add more stream related functions as needed