import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { getStreamToken } from "../controllers/chatController.js";

const router = express.Router();

// Define chat-related routes here
// For example:

// /api/chat/token
router.get("/token",protectRoute, getStreamToken);

 


export default router;
