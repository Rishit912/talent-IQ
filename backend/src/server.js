


// backend/src/server.js

// const express = require("express")

import express from "express";
import path from "path";
import {ENV} from "./lib/env.js";

const app = express()

// You might need to add other middleware here like:
// app.use(express.json()); 
// app.use(cors());

const __dirname = path.resolve()


// --- Health and API Routes ---
app.get("/health",(req,res) => {
    res.status(200).json({msg: "api is up and running" });
});

app.get("/books",(req,res) => {
    res.status(200).json({msg: "this is the books endpoint" });
});

// IMPORTANT: Add all your other app.use('/api/...') or app.get/post(...) routes here


// --- Static Serving (Optional but Recommended) ---
// This block is used for Vercel to efficiently serve your frontend files, 
// ensuring the correct HTML file is returned for all non-API routes.
if(ENV.NODE_ENV === "production"){
    // This tells Express where to find your built frontend assets
    app.use(express.static(path.join(__dirname,"../frontend/dist"))); 

    
    app.get("/health",(req,res) => {
    res.status(200).json({msg: "api is up and running" });
    });



    app.get("/books",(req,res) => {
        res.status(200).json({msg: "this is the books endpoint" });
    });

    // This catches all non-API routes and serves the main index.html file (for client-side routing)
    app.get("/{*any}",(req,res)=>{
        res.sendFile(path.join(__dirname,"../frontend","dist","index.html"));
    })  
}

// ❌ REMOVED: The local app.listen(...) command, as Vercel handles the listener.
// app.listen(ENV.PORT, () => console.log("server is running on the port number:",ENV.PORT));

// ✅ CRUCIAL: Export the Express app instance so Vercel can run it as a Serverless Function.
module.exports = app;

