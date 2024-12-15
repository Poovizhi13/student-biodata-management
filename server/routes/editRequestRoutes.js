const express = require('express');
const router = express.Router();

// Import the StudentDetails model
const StudentDetails = require('../models/studentsDetails');

// Endpoint to send edit request
router.post('/send-edit-request', async (req, res) => {
  const { regNo } = req.body;  // Get the registration number from the request body
  try {
    // Find the student by regNo
    const student = await StudentDetails.findOne({ 'personalDetails.regNo': regNo });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Add the edit request to the student's record
    student.editRequest = true;  // Set the editRequest flag to true

    // Save the student record with the updated editRequest flag
    await student.save();

    res.json({ success: true, message: 'Edit request sent to admin' });
  } catch (error) {
    console.error('Error sending edit request:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
