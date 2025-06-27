const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs');
const mongoose = require('mongoose');
const multer = require('multer'); // Import multer
const connectDB = require('./db'); // Import the connectDB function
require('dotenv').config(); // Ensure dotenv is loaded before using the variables
const session = require('express-session');
const User = require('./models/user'); // Import the User model
const userRoutes = require('./routes/userRoutes'); // Adjust the path if needed
const editRequestRoutes = require('./routes/editRequestRoutes');
const StudentDetails = require('./models/studentsDetails');

const app = express();
const port = process.env.PORT || 3000; // Use PORT from .env or default to 3000

// Connect to MongoDB
connectDB();

// Ensure 'uploads' folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
  console.log('Uploads folder created.');
}

// Multer storage setup for photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Store uploaded files in the 'uploads' folder
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Use current timestamp for unique filename
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only jpeg, jpg, or png images are allowed'));
    }
  }
});

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Static files
app.use(express.static(path.join(__dirname, '../public'))); // Ensure 'public' path is correct
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve files in 'uploads'

// Session setup
app.use(session({
    secret: 'JWT_SECRET', // Replace with a strong secret key
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to `true` if using HTTPS
}));

// Routes for user API
app.use('/api', userRoutes);
app.use('/api', editRequestRoutes); // Use the edit request route

// Serve login.html from public folder
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/login.html'));
});

// User and Admin Dashboard Routes
app.get('/user-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/user-dashboard.html'));
});

app.get('/admin-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/admin-dashboard.html'));
});

// Registration route
app.post('/api/users/register', async (req, res) => {
  const { email, password, role } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .send('<script>alert("User already exists. Please login."); window.location.href = "/login";</script>');
    }

    const newUser = new User({ email, password, role });
    await newUser.save();

    res.redirect('/login');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error registering user');
  }
});

// Login route
app.post('/api/users/login', async (req, res) => {
  const { email, password } = req.body;

  try {
      // Find the user by email
      const user = await User.findOne({ email });

      if (!user) {
          // If user is not found
          return res.status(401).json({ error: 'User not found' });
      }

      if (user.password !== password) {
          // If password does not match
          return res.status(401).json({ error: 'Incorrect password' });
      }
      const studentDetails = await StudentDetails.findOne({ userId: user._id });

      if (studentDetails) {
          // Redirect to `student-details.html` if details are already submitted
          return res.redirect('/student-details');
      } else {
          // Set session for the logged-in user
          req.session.user = user;

          // Redirect based on user role if details are not submitted
          if (user.role === 'student') {
              return res.redirect('/user-dashboard');
          } else {
              return res.redirect('/admin-dashboard');
          } 
      }
  } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Error logging in' });
  }
});



// Admin Dashboard route
app.get('/admin-dashboard', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).send('Access denied');
  }

  try {
    const users = await User.find();  
    let userHtml = '';
    users.forEach(user => {
      userHtml += `<li>${user.email} - ${user.role}</li>`;
    });

    const adminDashboardHtml = ` 
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Admin Dashboard</title>
      </head>
      <body>
        <h1>Admin Dashboard</h1>
        <p>Welcome Admin!</p>
        <h2>User Management</h2>
        <ul>${userHtml}</ul>
      </body>
      </html>
    `;

    res.send(adminDashboardHtml);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching user data');
  }
});

// User Dashboard route
app.get('/user-dashboard', async (req, res) => {
  if (!req.session.user) {
    return res.status(403).send('Access denied');
  }

  try {
    const user = req.session.user;

    const userDashboardHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>User Dashboard</title>
      </head>
      <body>
        <h1>User Dashboard</h1>
        <p>Welcome, ${user.email}!</p>
        <h2>Your Details</h2>
        <p>Role: ${user.role}</p>
        <p>Email: ${user.email}</p>
        <button id="editRequestBtn">Send Edit Request</button>
        <script>
          document.getElementById('editRequestBtn').addEventListener('click', async () => {
            const response = await fetch('/api/edit-request', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ userId: '${user._id}' })
            });
            const result = await response.json();
            alert(result.message);
          });
        </script>
      </body>
      </html>
    `;

    res.send(userDashboardHtml);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching user details');
  }
});

// Photo upload route for the user dashboard
app.post('/api/upload-photo', upload.single('studentPhoto'), async (req, res) => {
  try {
    const userId = req.session.user._id;
    const photoPath = req.file.path;

    const studentDetails = await User.findByIdAndUpdate(userId, { studentPhoto: photoPath }, { new: true });

    res.status(200).send({ message: 'Photo uploaded successfully', photoPath });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'Error uploading photo' });
  }
});

// Success page for registration
app.get('/success', (req, res) => {
  res.send('<h1>Registration Successful</h1>');
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
