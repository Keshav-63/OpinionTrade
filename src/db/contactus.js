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


const ContactUs = new mongoose.Schema({

    first_name:{
        type:String,
        required:true,
    },
    last_name:{
        type:String,
        required:true,
    },
    email:{
        type: String,
        required: true,
    },
    message:{
        type: String,
        required: true,
    },
},{ timestamps: true });

const Contact = new mongoose.model("ContactUs123", ContactUs)
module.exports=Contact;

