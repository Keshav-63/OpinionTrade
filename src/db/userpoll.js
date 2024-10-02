const express = require("express");
const mongoose = require("mongoose");
const collection = require("./conn");
const getPollModel = require("./polldb");
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



const userPollSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Collection123" },

    answeredPolls: [{ 
        pollId: { type: mongoose.Schema.Types.ObjectId, 
        ref: "getPollModel" },
        selectedAnswer: { type: Number } //Array
    }]
});


const UserPoll = mongoose.model('UserPoll123', userPollSchema);
module.exports =  UserPoll ;






