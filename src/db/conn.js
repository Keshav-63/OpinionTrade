const express = require("express");
const mongoose = require("mongoose");
const app = express();
const port = process.env.PORT || 3000;
require('dotenv').config();

const dbHost = process.env.DB_HOST;

mongoose.connect(`${dbHost}`)
.then(() => {
    console.log("Database connection successful");


}).catch((e) => {
    console.error("Database connection error:", e);
});


const LogInSchema = new mongoose.Schema({

    username:{
        type:String,
        required:true,
    },
    password:{
        type:String,
        required:true,
    },
    refercode:{
        type: String,
        
        default: null,
    },
},{ timestamps: true });

const collection = new mongoose.model("Collection123", LogInSchema)

module.exports=collection;

