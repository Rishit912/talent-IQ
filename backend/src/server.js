import express from "express";
import path from "path";
import { ENV } from "./lib/env.js";
import { connectDB } from "./lib/db.js";
import cors from "cors";
import { serve } from "inngest/express";
import { inngest, functions } from "./lib/inngest.js";
import { clerkMiddleware } from "@clerk/express";
import { protectRoute } from "./middleware/protectRoute.js";
import chatRoutes from "./routers/chatRoutes.js";
import sessionRoutes from "./routers/sessionRoutes.js";

const app = express();
const __dirname = path.resolve();

// middleware
app.use(express.json());

// CORS: allow credentials and specific origin
const corsOptions = {
    origin: ENV.CLIENT_URL || "http://localhost:5173",
    credentials: true,
};
app.use(cors(corsOptions));

// authentication
app.use(clerkMiddleware()); // adds req.auth

// inngest
app.use("/api/inngest", serve({ client: inngest, functions }));
app.use("/api/chat", chatRoutes);
// add a small request logger for session routes to assist debugging
app.use("/api/sessions", (req, res, next) => {
    try {
        console.log('[sessions] route hit', { path: req.path, method: req.method, auth: req.auth ? true : false });
        console.log('[sessions] req.user present:', !!req.user);
    } catch (err) {
        console.error('[sessions] logger error:', err);
    }
    next();
}, sessionRoutes);

// health
app.get("/health", (req, res) => {
    res.status(200).json({ message: "api is up and running" });
});

app.get("/video-calls", protectRoute, (req, res) => {
    res.status(200).json({ message: "this is the protected video calls endpoint" });
});

// static for production
if (ENV.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "../frontend/dist")));
    app.get(/.*/, (req, res) => {
        res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
    });
}

const startServer = async () => {
    try {
        await connectDB();
        const port = ENV.PORT || 3000;
        // development error handler to return stack traces for debugging
        app.use((err, req, res, next) => {
            console.error('[errorHandler]', err);
            if (ENV.NODE_ENV !== 'production') {
                return res.status(500).json({ message: err.message, stack: err.stack });
            }
            return res.status(500).json({ message: 'Internal server error' });
        });

        app.listen(port, () => {
            console.log("server is running on the port number:", port);
            console.log("CORS origin:", corsOptions.origin, "credentials:", corsOptions.credentials);
        });
    } catch (error) {
        console.error("Failed to start the server", error);
    }
};

startServer();