const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');

// Get all appointments for a user
router.get('/', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    const appointments = await Appointment.find({ userEmail: email }).sort({ createdAt: -1 });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create/Book a new appointment
router.post('/', async (req, res) => {
  try {
    const { userEmail, doctor, specialty, date, time, status, avatar } = req.body;
    if (!userEmail || !doctor || !specialty || !date || !time) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if appointment already exists for the same doctor, date, and time
    const existingAppointment = await Appointment.findOne({
      doctor,
      date,
      time,
      status: 'upcoming'
    });
    if (existingAppointment) {
      return res.status(400).json({ error: 'This appointment slot is already booked.' });
    }

    const newAppointment = new Appointment({
      userEmail,
      doctor,
      specialty,
      date,
      time,
      status: status || 'upcoming',
      avatar: avatar || 'MD'
    });
    await newAppointment.save();
    res.status(201).json(newAppointment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update/Cancel appointment (mark as completed or cancelled)
router.patch('/cancel', async (req, res) => {
  try {
    const { userEmail, doctor, date } = req.body;
    const appointment = await Appointment.findOneAndUpdate(
      { userEmail, doctor, date, status: 'upcoming' },
      { status: 'completed' }, // Cancellation in mock marks status as completed in front-end
      { new: true }
    );
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
