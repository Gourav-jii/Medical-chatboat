const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  id: { type: String, required: true },
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  time: { type: String, required: true }
});

const chatSessionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  userEmail: { type: String, required: true },
  title: { type: String, required: true },
  preview: { type: String, required: true },
  time: { type: String, required: true },
  icon: { type: String, default: 'chat' },
  messages: [messageSchema]
}, { timestamps: true });

module.exports = mongoose.model('ChatSession', chatSessionSchema);
