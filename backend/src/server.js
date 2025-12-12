// const express = require("express")

import express from "express";
import {ENV} from "./lib/env.js";

const app = express()

console.log(ENV.PORT);
console.log(ENV.DB_URL);



app.get("/health",(req,res) => {

res.status(200).json({msg: "api is up and running" })
})

app.listen(ENV.PORT, () => console.log("server is running on the port number:",ENV.PORT));
