const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Simple in-memory stores for mock
const users = new Map();
const topics = new Map();
let idCounter = 1;
let topicIdCounter = 1;

function makeUser(username, email) {
  const id = String(idCounter++);
  const user = {
    id,
    _id: id,
    username,
    email,
    role: 'user',
    avatar: null,
    postCount: 0,
    reputation: 0,
    bio: '',
    createdAt: new Date().toISOString()
  };
  users.set(email, user);
  return user;
}

function makeTokenFor(user) {
  // Issue a real JWT using backend's JWT_SECRET
  const jwtSecret = process.env.JWT_SECRET || 'dev_secret_2b9f3c7d9e1a4b8c6d5e0f1a2b3c4d5e';
  return jwt.sign(
    { userId: user._id },
    jwtSecret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// Register
app.post('/api/auth/register', (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide all required fields' });
  }

  if (users.has(email)) {
    return res.status(400).json({ success: false, message: 'Email already exists' });
  }

  const user = makeUser(username, email);
  const token = makeTokenFor(user);

  return res.status(201).json({ success: true, message: 'User registered (mock)', token, user });
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email and password' });
  }

  const user = users.get(email);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  const token = makeTokenFor(user);
  return res.json({ success: true, message: 'Login successful (mock)', token, user });
});

// Verify token
app.get('/api/auth/verify-token', (req, res) => {
  const auth = req.headers.authorization || '';
  const token = auth.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, valid: false, message: 'No token provided' });

  try {
    const jwtSecret = process.env.JWT_SECRET || 'dev_secret_2b9f3c7d9e1a4b8c6d5e0f1a2b3c4d5e';
    const decoded = jwt.verify(token, jwtSecret);
    const user = Array.from(users.values()).find(u => u._id === decoded.userId);
    if (!user) return res.status(401).json({ success: false, valid: false, message: 'Invalid token' });

    return res.json({ success: true, valid: true, user });
  } catch (err) {
    return res.status(401).json({ success: false, valid: false, message: 'Invalid token' });
  }
});

// Get all topics
app.get('/api/topics', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  
  const allTopics = Array.from(topics.values());
  const paginatedTopics = allTopics.slice(skip, skip + limit);
  
  return res.json({
    success: true,
    topics: paginatedTopics,
    currentPage: page,
    totalPages: Math.ceil(allTopics.length / limit),
    totalTopics: allTopics.length,
    hasMore: page < Math.ceil(allTopics.length / limit)
  });
});

// Create topic
app.post('/api/topics', (req, res) => {
  const auth = req.headers.authorization || '';
  const token = auth.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'Authentication required' });

  try {
    const jwtSecret = process.env.JWT_SECRET || 'dev_secret_2b9f3c7d9e1a4b8c6d5e0f1a2b3c4d5e';
    const decoded = jwt.verify(token, jwtSecret);
    const user = Array.from(users.values()).find(u => u._id === decoded.userId);
    if (!user) return res.status(401).json({ success: false, message: 'User not found' });

    const { title, description, category, tags } = req.body;
    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Title and description are required' });
    }

    const topicId = String(topicIdCounter++);
    const topic = {
      _id: topicId,
      title,
      description,
      category: category || 'General',
      tags: tags || [],
      author: {
        _id: user._id,
        username: user.username,
        role: user.role,
        avatar: user.avatar
      },
      postCount: 0,
      viewCount: 0,
      isPinned: false,
      isLocked: false,
      isDeleted: false,
      isModerated: false,
      moderationReason: '',
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      lastPostBy: null
    };

    topics.set(topicId, topic);
    return res.status(201).json({ success: true, message: 'Topic created successfully', topic, flagged: false });
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
});

// Get single topic
app.get('/api/topics/:id', (req, res) => {
  const topic = topics.get(req.params.id);
  if (!topic) {
    return res.status(404).json({ success: false, message: 'Topic not found' });
  }
  return res.json({ success: true, topic });
});

// Register
app.post('/api/auth/register', (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide all required fields' });
  }

  if (users.has(email)) {
    return res.status(400).json({ success: false, message: 'Email already exists' });
  }

  const user = makeUser(username, email);
  const token = makeTokenFor(user);

  return res.status(201).json({ success: true, message: 'User registered (mock)', token, user });
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email and password' });
  }

  const user = users.get(email);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  const token = makeTokenFor(user);
  return res.json({ success: true, message: 'Login successful (mock)', token, user });
});

// Verify token
app.get('/api/auth/verify-token', (req, res) => {
  const auth = req.headers.authorization || '';
  const token = auth.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, valid: false, message: 'No token provided' });

  try {
    const jwtSecret = process.env.JWT_SECRET || 'dev_secret_2b9f3c7d9e1a4b8c6d5e0f1a2b3c4d5e';
    const decoded = jwt.verify(token, jwtSecret);
    const user = Array.from(users.values()).find(u => u._id === decoded.userId);
    if (!user) return res.status(401).json({ success: false, valid: false, message: 'Invalid token' });

    return res.json({ success: true, valid: true, user });
  } catch (err) {
    return res.status(401).json({ success: false, valid: false, message: 'Invalid token' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Mock backend running on http://localhost:${PORT}`);
});
