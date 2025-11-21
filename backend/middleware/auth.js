const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

const moderatorMiddleware = (req, res, next) => {
  if (req.user.role === 'moderator' || req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Moderator access required' });
  }
};

// Optional auth: if a valid token is present, attach `req.user`, otherwise continue unauthenticated
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return next();

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    if (user) req.user = user;
  } catch (err) {
    // Ignore token errors for optional authentication
  }
  next();
};

module.exports = { authMiddleware, moderatorMiddleware, optionalAuth };