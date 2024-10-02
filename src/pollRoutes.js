const express = require('express');
const getPollModel = require('./db/polldb');
const userpoll = require('./db/userpoll');
const UserProfile = require("./db/userprofile");
const router = express.Router();

// Route to save a new poll
router.post('/save-poll', async (req, res) => {
    const { category, question, answers, answerWeight, pollCount } = req.body;

    try {
        const PollModel = getPollModel(category);
        const existingPoll = await PollModel.findOne({ question });

        if (existingPoll) {
            return res.json({ success: false, message: 'Poll already exists' });
        }

        const newPoll = new PollModel({ question, answers, answerWeights: answerWeight, pollCount });
        const savedPoll = await newPoll.save();
        res.json({ success: true, message: 'Poll saved successfully', poll: savedPoll });
    } catch (error) {
        console.error('Error saving poll:', error);
        res.json({ success: false, message: 'Database error' });
    }
});



// Route to get polls by category
router.get('/polls/:category', async (req, res) => {
    const { category } = req.params;

    try {
        const PollModel = getPollModel(category);
        const polls = await PollModel.find();
        res.json({ success: true, polls });
    } catch (error) {
        console.error('Error fetching polls:', error);
        res.json({ success: false, message: 'Database error' });
    }
});

// Route to save or update user's poll answer
router.post('/save-user-answer/:category', async (req, res) => {
    const { userId, pollId, selectedAnswer } = req.body;
    const { category } = req.params;
    
    try {
        let userPoll = await userpoll.findOne({ userId });

        if (!userPoll) {
            userPoll = new userpoll({ userId, answeredPolls: [] });
        }

        const existingPoll = userPoll.answeredPolls.find(poll => poll.pollId.equals(pollId));

        if (existingPoll) {
            return res.json({ success: false, message: 'Poll already answered' });
        }

        userPoll.answeredPolls.push({ pollId, selectedAnswer });
        await userPoll.save();

        const PollModel = getPollModel(category); // Modify as needed
        const poll = await PollModel.findById(pollId);

        if (poll) {
            poll.answerWeights[selectedAnswer] += 1;
            poll.pollCount += 1;
            await poll.save();
            await UserProfile.updateOne(
                { createdBy: userId },
                { $inc: { coin: 1 } }
            );
        }

        res.json({ success: true, message: 'Poll answer saved successfully' });
    } catch (error) {
        console.error('Error saving user poll answer:', error);
        res.json({ success: false, message: 'Database error' });
    }
});

// Route to fetch answered polls by a user
router.get('/user-answered-polls/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const userPoll = await userpoll.findOne({ userId });

        if (!userPoll) {
            return res.json({ success: true, answeredPolls: [] });
        }

        res.json({ success: true, answeredPolls: userPoll.answeredPolls });
    } catch (error) {
        console.error('Error fetching user polls:', error);
        res.json({ success: false, message: 'Database error' });
    }
});

module.exports = router;
