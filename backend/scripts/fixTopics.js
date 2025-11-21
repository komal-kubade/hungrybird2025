require('dotenv').config();
const mongoose = require('mongoose');
const Topic = require('../models/Topic');

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB, updating topics...');
    const res = await Topic.updateMany({ isDeleted: { $exists: false } }, { $set: { isDeleted: false } });
    console.log('Update result:', res);
    process.exit(0);
  } catch (err) {
    console.error('Error updating topics:', err);
    process.exit(1);
  }
}

run();
