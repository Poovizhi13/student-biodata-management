const express = require('express');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');
const User = require('../models/user'); // Import User model
const StudentDetails = require('../models/studentsDetails');
const userController = require('../controllers/userControllers');
const router = express.Router();

// ---------------------------
// MongoDB Connection Setup (with Mongoose)
// ---------------------------
mongoose.connect(process.env.MONGO_DB_URL || 'mongodb://localhost:27017/student_biodata_system', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB using Mongoose'))
  .catch((err) => console.error('MongoDB connection error:', err));

// ---------------------------
// Multer Setup for File Upload (Student Photo)
// ---------------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// ---------------------------
// User Registration Route
// ---------------------------
router.post('/api/users/register', async (req, res) => {
  const { email, password, role } = req.body;

  try {
    // Check if the email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists. Please login.' });
    }

    // Create a new user and save it to the database
    const newUser = new User({ email, password, role });
    await newUser.save();

    res.status(201).json({ message: 'Registration successful. Please log in.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error registering user' });
  }
});

// ---------------------------
// User Login Route
// ---------------------------
router.post('/login', userController.loginUser);

// ---------------------------
// Get All Users (Admin Access)
// ---------------------------
router.get('/all', userController.getAllUsers);


// ---------------------------
// Submit Student Biodata
// ---------------------------
router.post('/submit-biodata', upload.single('studentPhoto'), async (req, res) => {
  const {
    name, dob, phone, address, regNo, department, umisNumber, mailId,
    religion, community, cast, fatherName, motherName, fatherOccupation,
    fatherIncome, motherOccupation, motherIncome,
  } = req.body;

  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    // Check if biodata already exists and is editable
    const existingDetails = await StudentDetails.findOne({ userId: user._id });
    if (existingDetails && !existingDetails.isEditable) {
      // Check if there's already an edit request
      if (existingDetails.editRequest) {
        return res.status(403).json({ message: 'An edit request has already been sent. Please wait for approval.' });
      } else {
        // Redirect user to send an edit request if not already requested
        return res.status(403).json({ message: 'Biodata is not editable. Please send an edit request to the admin.' });
      }
    }

    // Create or update student details
    const studentDetails = await StudentDetails.findOneAndUpdate(
      { userId: user._id },
      {
        userId: user._id,
        personalDetails: { name, dob, phone, address, regNo, department, umisNumber, mailId },
        academicDetails: { religion, community, cast, fatherName, motherName, fatherOccupation, fatherIncome, motherOccupation, motherIncome },
        studentPhoto: req.file ? req.file.path : undefined, // Store the file path if photo is uploaded
        isEditable: false, // Lock the biodata after submission
      },
      { upsert: true, new: true }
    );

    res.status(200).json({ message: 'Biodata submitted successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error submitting biodata.' });
  }
});

// ---------------------------
// Send Edit Request
// ---------------------------
router.post('/send-edit-request', async (req, res) => {
  const { regNo } = req.body;

  try {
    const studentDetails = await StudentDetails.findOne({ 'personalDetails.regNo': regNo });
    if (!studentDetails) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    // Check if the student already sent an edit request
    if (studentDetails.editRequest) {
      return res.status(400).json({ error: 'Edit request has already been sent.' });
    }

    studentDetails.editRequest = true; // Mark the edit request flag
    await studentDetails.save();

    res.status(200).json({ message: 'Edit request sent to admin.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error sending edit request.' });
  }
});


// ---------------------------
// Admin Update Marks Route
// ---------------------------
router.post('/update-marks', async (req, res) => {
  const { regNo, marks } = req.body;

  try {
    const studentDetails = await StudentDetails.findOne({ 'personalDetails.regNo': regNo });
    if (!studentDetails) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    studentDetails.semesterMarks = marks; // Replace with new marks
    await studentDetails.save();

    res.status(200).json({ message: 'Marks updated successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error updating marks.' });
  }
});

// ---------------------------
// Fetch Student Details by Registration Number
// ---------------------------
router.get('/student/:regNo', async (req, res) => {
  try {
    const student = await StudentDetails.findOne({ 'personalDetails.regNo': req.params.regNo }).populate('userId');
    if (!student) return res.status(404).json({ error: 'Student not found.' });
    res.status(200).json(student);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error retrieving student details.' });
  }
});

// ---------------------------
// Serve index.html with Session Check
// ---------------------------
router.get('/index.html', (req, res) => {
  if (!req.session || !req.session.user) {
    return res
      .status(403)
      .send('<script>alert("Please log in to access this page."); window.location.href = "/login";</script>');
  }

  res.sendFile(path.join(__dirname, '../public/index.html'));
});

module.exports = router;
