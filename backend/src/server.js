// const express = require("express")

import express from "express";
import path from "path";
import {ENV} from "./lib/env.js";
import { connectDB } from "./lib/db.js";
import cors from "cors";''

import { serve  } from "inngest/express";
import { inngest , functions } from "./lib/inngest.js"; 

const app = express()

const __dirname = path.resolve()

//middleware to parse json data

app.use(express.json());

//credentials true means to allow cookies to be sent along with requests

app.use(cors({origin:ENV.CLIENT_URL,Credentials:true}));

//test api endpoint


app.use("api/inngest",serve({client : inngest , functions }));


app.get("/health",(req,res) => {
res.status(200).json({msg: "api is up and running" });
});



app.get("/books",(req,res) => {
res.status(200).json({msg: "this is the books endpoint" });
});


app.get("/video-calls",protectRoute , (req,res) => {
res.status(200).json({msg: "this is the video calls endpoint" });
});


//make our app ready for the deployment 

if(ENV.NODE_ENV === "production"){
app.use(express.static(path.join(__dirname,"../frontend/dist")));

app.get("/{*any}",(req,res)=>{
    res.sendFile(path.join(__dirname,"../frontend","dist","index.html"));
})  

}

const startServer = async () => {
    try {
        await connectDB();  
        app.listen(ENV.PORT, () => {
            console.log("server is running on the port number:",ENV.PORT);
        });
    } catch (error) {
        console.error("Failed to start the server", error);
    }   
};

startServer();

