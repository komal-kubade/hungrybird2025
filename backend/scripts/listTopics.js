require('dotenv').config();
const mongoose = require('mongoose');
const Topic = require('../models/Topic');

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB, fetching topics...');
    const topics = await Topic.find({}).limit(20).lean();
    console.log('Topics count:', topics.length);
    topics.forEach(t => console.log(JSON.stringify({ _id: t._id, title: t.title, isDeleted: t.isDeleted, category: t.category }, null, 2)));
    process.exit(0);
  } catch (err) {
    console.error('Error fetching topics:', err);
    process.exit(1);
  }
}

run();
