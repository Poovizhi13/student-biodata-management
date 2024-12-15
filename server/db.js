const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_DB_URL; // Ensure this is the correct variable
    if (!uri) {
      console.error('MongoDB URI is undefined.');
      return;
    }
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully!');
  } catch (err) {
    console.error('MongoDB connection error:', err);
  }
};

module.exports = connectDB;
