import express from "express";

import { protectRoute } from "../middleware/protectRoute.js";
import { createSession, endSession, getActiveSession, getMyRecentSession, getSessionById, joinSessionById, getHostActiveSessions, createInviteToken } from "../controllers/sessionController.js";


const router = express.Router();

// Example session route: Get all sessions

router.post("/", protectRoute, createSession);
router.get("/active", protectRoute, getActiveSession);
router.get("/my-recent", protectRoute, getMyRecentSession);
router.get("/host-active", protectRoute, getHostActiveSessions);

router.get("/:id", protectRoute, getSessionById);
router.post("/:id/join", protectRoute, joinSessionById);
router.post("/:id/invite", protectRoute, createInviteToken);
router.post("/:id/end", protectRoute, endSession);

// invite redemption route (by token)
import { joinWithInviteToken } from "../controllers/sessionController.js";
router.post("/invite/:token/join", protectRoute, joinWithInviteToken);


// Controller functions (to be implemented)

export default router;