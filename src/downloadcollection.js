const express = require('express');
const fs = require('fs').promises; 
const path = require('path');
const { MongoClient } = require('mongodb');
const customerdata = require('./db/customerdata');
const session = require('express-session');
const router = express.Router();

require('dotenv').config();

const dbHost = process.env.DB_HOST;

const url = dbHost;
const dbName = 'OPINION_TRADE';

router.post('/downloadcollection', async (req, res) => {
    try {
        const { companyname, email, category } = req.body;
        console.log("customer data recevied", { companyname, email, category });

        
        await customerdata.insertMany({
            companyname,
            email,
            category,
            dateSubmitted: new Date(),
        });

        
        const collectionMap = {
            'consumer': 'consumerPolls',
            'allevent': 'alleventPolls',
            'cricket': 'cricketPolls',
            'tech': 'techPolls',
            'sustain': 'sustainPolls',
            'health': 'healthPolls',
            'education': 'educationPolls',
            'entertainment': 'entertainmentPolls',
            'sports': 'sportsPolls',
            'gadgets': 'gadgetsPolls',
            'tour': 'tourPolls',
            'economy': 'economyPolls',
            'sharemarket': 'sharemarketPolls',
            'gaming': 'gamingPolls',
            'food': 'foodPolls'
        };

        
        const collectionName = collectionMap[category];
        if (!collectionName) {
            return res.status(400).send('Invalid category selected');
        }

        
        const client = await MongoClient.connect(url);
        const db = client.db(dbName);
        const collection = db.collection(collectionName);

        
        const data = await collection.find({}, { projection: { _id: 0, selectedAnswer: 0, __v: 0 } }).toArray();

        
        const jsonData = JSON.stringify(data, null, 2);

        
        const fileName = `${category}_Polls.json`; 
        const filePath = path.join(__dirname, fileName);

        
        await fs.writeFile(filePath, jsonData);

        
        res.download(filePath, fileName, async (err) => {
            if (err) {
                console.error('Error during file download:', err);
                return res.status(500).send('Error downloading the file');
            }

            
            await fs.unlink(filePath);
        });
           
        await client.close();
        
    } catch (err) {
        console.error('Error fetching collection:', err);
        return res.status(500).send('Error fetching collection');
    }
});

module.exports = router;

