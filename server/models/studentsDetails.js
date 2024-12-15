const mongoose = require('mongoose');

// Define the schema for student details
const studentDetailsSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',  // Reference to the User model
    required: true 
  },
  personalDetails: {
    name: { 
      type: String, 
      required: true 
    },
    dob: { 
      type: Date, 
      required: true,
      validate: {
        validator: (value) => value < Date.now(),
        message: 'Date of birth must be in the past.',
      },
    },
    phone: { 
      type: String, 
      required: true,
      match: /^[0-9]{10}$/,  // Validates phone number as a 10-digit number
    },
    address: { 
      type: String, 
      required: true 
    },
    regNo: { 
      type: String, 
      unique: true, 
      required: true 
    },
    department: { 
      type: String, 
      required: true 
    },
    umisNumber: { 
      type: String, 
      unique: true, 
      required: true 
    },
    mailId: { 
      type: String, 
      required: true,
      match: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,  // Email validation
    },
  },
  academicDetails: {
    religion: { 
      type: String, 
      required: true 
    },
    community: { 
      type: String, 
      required: true 
    },
    cast: { 
      type: String 
    },
    fatherName: { 
      type: String, 
      required: true 
    },
    motherName: { 
      type: String, 
      required: true 
    },
    fatherOccupation: { 
      type: String, 
      required: true 
    },
    fatherIncome: { 
      type: String, 
      required: true 
    },
    motherOccupation: { 
      type: String, 
      required: true 
    },
    motherIncome: { 
      type: String, 
      required: true 
    },
  },
  studentPhoto: { 
    type: String  // Stores the path to the student's photo
  },
  semesterMarks: { 
    type: [Number], 
    validate: [arrayLimit, 'Semester marks array exceeds limit'],
    default: [] 
  },
  isEditable: { 
    type: Boolean, 
    default: true  // Allows editing initially
  },
  editRequest: { 
    type: Boolean, 
    default: false  // Flag to mark edit requests
  },
}, {
  timestamps: true,  // Automatically adds createdAt and updatedAt fields
});

// Validation for the semesterMarks array length
function arrayLimit(val) {
  return val.length <= 10;  // Limit the number of semester marks to 10
}

// Pre-save hook to handle editRequest flag and isEditable field
studentDetailsSchema.pre('save', function(next) {
  if (this.editRequest && this.isEditable) {
    this.isEditable = false;  // Disallow further editing once an edit request is made
  }
  next();
});

// Indexes for faster queries
studentDetailsSchema.index({ regNo: 1, umisNumber: 1 });

module.exports = mongoose.model('StudentDetails', studentDetailsSchema);
