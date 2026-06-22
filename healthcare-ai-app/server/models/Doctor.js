const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  specialty: { type: String, required: true },
  avatar: { type: String, required: true },
  rating: { type: String, required: true },
  exp: { type: String, required: true },
  clinic: { type: String, required: true },
  available: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Doctor', doctorSchema);
