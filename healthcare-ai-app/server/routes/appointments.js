const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const nodemailer = require('nodemailer');

// Configure SMTP transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: parseInt(process.env.SMTP_PORT || '465') === 465, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

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
    const { userEmail, userName, doctor, specialty, date, time, status, avatar, reason } = req.body;
    if (!userEmail || !doctor || !specialty || !date || !time) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if appointment slot already has 10 appointments booked
    const count = await Appointment.countDocuments({
      doctor,
      date,
      time,
      status: 'upcoming'
    });
    if (count >= 10) {
      return res.status(400).json({ error: 'Sorry, this time slot is fully booked. Please choose another available time.' });
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

    // Send confirmation emails in background
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      const patientMailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: userEmail,
        subject: `Appointment Confirmed - ${doctor}`,
        text: `Dear ${userName || 'Patient'},\n\nYour appointment with ${doctor} has been successfully booked.\n\nDetails:\nDoctor: ${doctor} (${specialty})\nDate: ${date}\nTime: ${time}\nReason: ${reason || 'General consultation'}\n\nThank you for choosing HealFlow.\n\nBest regards,\nHealFlow Team`
      };

      const adminMailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: process.env.ADMIN_EMAIL || process.env.SMTP_USER,
        subject: `New Appointment Booked - ${userName || 'Patient'}`,
        text: `Hello Admin,\n\nA new appointment has been successfully booked.\n\nDetails:\nPatient Name: ${userName || 'Patient'}\nEmail: ${userEmail}\nDoctor: ${doctor} (${specialty})\nDate: ${date}\nTime: ${time}\nReason: ${reason || 'General consultation'}\n\nBest regards,\nHealFlow AI`
      };

      transporter.sendMail(patientMailOptions).catch(err => console.error('Error sending confirmation email to patient:', err));
      transporter.sendMail(adminMailOptions).catch(err => console.error('Error sending notification email to admin:', err));
    } else {
      console.log('SMTP user or password not configured. Skipping email dispatch.');
    }

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
