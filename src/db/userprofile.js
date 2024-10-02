const express = require("express");
const mongoose = require("mongoose");
const app = express();
const collection = require("./conn");
const port = process.env.PORT || 3000;
require('dotenv').config();

const dbHost = process.env.DB_HOST;

mongoose.connect(`${dbHost}`)


.then(() => {
    console.log("Database connection successful");


}).catch((e) => {
    console.error("Database connection error:", e);
});



const UserProfileSchema = new mongoose.Schema({
    first_name: {
        type: String,
        required: true,
    },
    last_name: {
        type: String,
        required: true,
    },
    phone_number: {
        type: String,
        required: true,
        unique: true, 
    },
    email: {
        type: String,
        required: true,
        unique: true, 
        match: [/.+@.+\..+/, 'Please enter a valid email address'], 
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'], 
        required: true,
    },
    age: {
        type: Number,
        min: 0, 
        required: true,
    },
    coin: {
        type: Number,
        default: 0,
        require: false,

    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Collection123",
    },
    referralBy:{
        type: String,
        default: null,
    },
    couponCodesUsed: {
        type: [String], 
        default: []
    },
    profileImage: { 
    type: String,
    default: null
    }

}, { timestamps: true }); 


const User_Profile = mongoose.model("UserProfile123", UserProfileSchema);

module.exports = User_Profile

