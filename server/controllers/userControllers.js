const { User } = require('../models/user');  // Import User model
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');

// Multer setup for photo upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Specify the upload folder
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname); // Specify the filename format
    }
});
const upload = multer({ storage: storage });

// Register a new user
exports.registerUser = async (req, res) => {
    const { email, password, role } = req.body;

    try {
        // Validate password strength (basic check)
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }

        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({ email, password: hashedPassword, role });  // Store hashed password
        await newUser.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to register user' });
    }
};

// Login user
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).send('User not found.');
        }

        // Compare the entered password with the stored password (hashed)
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).send('Invalid password.');
        }

        // Generate a JWT token
        const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });

        res.status(200).json({ message: 'Login successful', token });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error logging in.');
    }
};

// Get all users (admin access)
exports.getAllUsers = async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(403).json({ error: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        if (decoded.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }

        const users = await User.find();
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ error: 'Failed to retrieve users' });
    }
};

// Submit biodata
exports.submitBiodata = async (req, res) => {
    const { userId, personalDetails, academicDetails } = req.body;
    const studentPhoto = req.file;  // Assuming 'studentPhoto' is the key in the form

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.isEditable === false) {
            return res.status(403).json({ error: 'Biodata cannot be edited once submitted' });
        }

        user.personalDetails = personalDetails;
        user.academicDetails = academicDetails;
        user.studentPhoto = studentPhoto ? studentPhoto.path : user.studentPhoto;  // Store file path if a new photo is uploaded
        user.isEditable = false; // Lock the details after submission

        await user.save();
        res.status(200).json({ message: 'Biodata submitted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to submit biodata' });
    }
};

// Send edit request
exports.sendEditRequest = async (req, res) => {
    const { userId } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.isEditable) {
            return res.status(403).json({ error: 'Biodata is still editable. No edit request needed.' });
        }

        user.editRequest = true; // Mark the edit request flag
        await user.save();
        res.status(200).json({ message: 'Edit request sent to admin' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to send edit request' });
    }
};

// Admin: Update semester marks
exports.updateMarks = async (req, res) => {
    const { userId, semesterMarks } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.semesterMarks = semesterMarks;
        await user.save();
        res.status(200).json({ message: 'Semester marks updated successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update semester marks' });
    }
};

// Upload middleware for bio data photo
exports.uploadPhoto = upload.single('studentPhoto');
