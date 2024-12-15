const mongoose = require('mongoose');

// User schema for registration and authentication
const userSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true,  // Store email in lowercase to ensure case-insensitive matching
    trim: true        // Remove any leading or trailing spaces
  },
  password: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    required: true, 
    enum: ['student', 'admin'],  // Only allow 'student' or 'admin' roles
    default: 'student'           // Default role is 'student'
  },
  personalDetails: {  // Personal details section
    name: { type: String, required: true },
    dob: { type: Date, required: true },
    phoneNumber: { type: String, required: true },
    address: { type: String, required: true },
    regNo: { type: String, required: true },
    department: { type: String, required: true },
    umisNumber: { type: String, required: true },
    mailID: { type: String, required: true }
  },
  academicDetails: {  // Academic details section
    religion: { type: String, required: true },
    community: { type: String, required: true },
    cast: { type: String, required: true },
    fatherName: { type: String, required: true },
    motherName: { type: String, required: true },
    fatherOccupation: { type: String, required: true },
    fatherAnnualIncome: { type: Number, required: true },
    motherOccupation: { type: String, required: true },
    motherAnnualIncome: { type: Number, required: true }
  },
  studentPhoto: { type: String },  // File path for the student photo
  isEditable: { type: Boolean, default: true },  // Flag to control whether biodata is editable
  editRequest: { type: Boolean, default: false }, // Flag for edit request
  semesterMarks: { type: [Number], default: [] }  // Array to store semester marks
}, { timestamps: true });  // Automatically add createdAt and updatedAt fields

// Create and export the User model
const User = mongoose.model('User', userSchema);

module.exports = User;
