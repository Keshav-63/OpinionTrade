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


const CustomerSchema = new mongoose.Schema({

    companyname:{
        type:String,
    },
    email:{
        type:String,
    },
    category:{
        type: String,
    },
    dateSubmitted: {
        type: Date,
        default: Date.now 
    }
});

const customer_data = new mongoose.model("Customer123", CustomerSchema)
module.exports=customer_data;

