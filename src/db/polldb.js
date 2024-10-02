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

const pollSchema = new mongoose.Schema({
    question: { type: String, required: true }, 
    answers: { type: [String], required: true }, 
    answerWeights: { type: [Number], required: true }, 
    pollCount: { type: Number, default: 0 }, 
    selectedAnswer: { type: Number, default: -1}
});





// Function to get a poll model dynamically based on the category
function getPollModel(category) {
    const collectionName = category + 'Polls'; 
    return mongoose.model(collectionName, pollSchema, collectionName);
}

module.exports = getPollModel;