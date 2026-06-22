const express = require('express');
const router = express.Router();
const ChatSession = require('../models/ChatSession');

// Get all chat sessions for a user
router.get('/', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    const sessions = await ChatSession.find({ userEmail: email }).sort({ updatedAt: -1 });
    res.status(200).json(sessions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Save or update a chat session
router.post('/', async (req, res) => {
  try {
    const { id, userEmail, title, preview, time, icon, messages } = req.body;
    
    if (!userEmail || !id) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    let session = await ChatSession.findOne({ id, userEmail });
    if (session) {
      // Update existing
      session.title = title;
      session.preview = preview;
      session.time = time;
      session.icon = icon;
      session.messages = messages;
      await session.save();
    } else {
      // Create new
      session = new ChatSession({ id, userEmail, title, preview, time, icon, messages });
      await session.save();
    }
    
    res.status(200).json(session);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Save multiple chat sessions (bulk replace/update)
router.post('/bulk', async (req, res) => {
  try {
    const { userEmail, sessions } = req.body;
    if (!userEmail || !Array.isArray(sessions)) {
      return res.status(400).json({ message: 'Invalid data format' });
    }

    const bulkOps = sessions.map(s => {
      const { _id, __v, ...updateData } = s;
      updateData.userEmail = userEmail;
      
      return {
        updateOne: {
          filter: { id: s.id, userEmail: userEmail },
          update: { $set: updateData },
          upsert: true
        }
      };
    });

    if (bulkOps.length > 0) {
      await ChatSession.bulkWrite(bulkOps);
    }

    res.status(200).json({ message: 'Chats synced successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
