const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  userEmail: { type: String, required: true },
  doctor: { type: String, required: true },
  specialty: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  status: { type: String, enum: ['upcoming', 'completed'], default: 'upcoming' },
  avatar: { type: String, default: 'MD' }
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
