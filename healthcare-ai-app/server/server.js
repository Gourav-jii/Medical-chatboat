const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Import Routes
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chats');
const doctorRoutes = require('./routes/doctors');
const appointmentRoutes = require('./routes/appointments');

app.use('/api/auth', authRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);

// Database Seeding for Doctors
const Doctor = require('./models/Doctor');
const seedDoctors = async () => {
  try {
    const count = await Doctor.countDocuments();
    if (count === 0) {
      console.log('Seeding doctors...');
      // const DOCTORS = [
      //   { name: 'Dr. Rajesh Sharma', specialty: 'Cardiologist', avatar: 'RS', rating: '4.9', exp: '15 years', clinic: 'Metro Hospital, Cardiology Dept', available: 'Today' },
      //   { name: 'Dr. Priya Verma', specialty: 'Endocrinologist', avatar: 'PV', rating: '4.8', exp: '12 years', clinic: 'Fortis Clinic, Endocrinology Dept', available: 'Tomorrow' },
      //   { name: 'Dr. Amit Kumar', specialty: 'Pulmonologist', avatar: 'AK', rating: '4.7', exp: '10 years', clinic: 'Apollo Hospital, Pulmonology Dept', available: 'Wednesday' },
      //   { name: 'Dr. Neha Singh', specialty: 'Neurologist', avatar: 'NS', rating: '4.9', exp: '14 years', clinic: 'Max Hospital, Neurology Dept', available: 'Tomorrow' },
      //   { name: 'Dr. Vikram Patel', specialty: 'Gastroenterologist', avatar: 'VP', rating: '4.8', exp: '13 years', clinic: 'Care Hospital, Gastroenterology Dept', available: 'Today' },
      //   { name: 'Dr. Sneha Gupta', specialty: 'Dermatologist', avatar: 'SG', rating: '4.8', exp: '8 years', clinic: 'Skin & Care Clinic', available: 'Today' },
      //   { name: 'Dr. Rohan Mehta', specialty: 'Orthopedic', avatar: 'RM', rating: '4.6', exp: '12 years', clinic: 'Bone Health Center', available: 'Tomorrow' },
      //   { name: 'Dr. Anjali Desai', specialty: 'Pediatrician', avatar: 'AD', rating: '4.9', exp: '10 years', clinic: 'Little Smiles Care', available: 'Today' },
      //   { name: 'Dr. Karan Kapoor', specialty: 'Psychiatrist', avatar: 'KK', rating: '4.7', exp: '9 years', clinic: 'Mind Wellness Center', available: 'Friday' },
      //   { name: 'Dr. Pooja Reddy', specialty: 'Gynecologist', avatar: 'PR', rating: '4.8', exp: '14 years', clinic: 'Womens Health Clinic', available: 'Tomorrow' },
      //   { name: 'Dr. Manish Tiwari', specialty: 'General Physician', avatar: 'MT', rating: '4.5', exp: '6 years', clinic: 'City Care Clinic', available: 'Today' },
      //   { name: 'Dr. Swati Joshi', specialty: 'Ophthalmologist', avatar: 'SJ', rating: '4.7', exp: '11 years', clinic: 'Clear Vision Eye Center', available: 'Wednesday' },
      //   { name: 'Dr. Arjun Nair', specialty: 'ENT Specialist', avatar: 'AN', rating: '4.6', exp: '13 years', clinic: 'Hear & Speak Clinic', available: 'Today' },
      //   { name: 'Dr. Kavita Sharma', specialty: 'Dentist', avatar: 'KS', rating: '4.9', exp: '7 years', clinic: 'Bright Teeth Dental', available: 'Tomorrow' },
      //   { name: 'Dr. Siddharth Rao', specialty: 'Oncologist', avatar: 'SR', rating: '4.8', exp: '16 years', clinic: 'Hope Cancer Institute', available: 'Monday' }
      // ];
      // await Doctor.insertMany(DOCTORS);
      // console.log('Doctors seeded successfully.');
    }
  } catch (err) {
    console.error('Error seeding doctors:', err);
  }
};

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    seedDoctors();
  })
  .catch(err => console.error('MongoDB connection error:', err));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
