const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    trim: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  topic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic',
    required: true
  },
  parentPost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    default: null
  },
  level: {
    type: Number,
    default: 0
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  likeCount: {
    type: Number,
    default: 0
  },
  isReported: {
    type: Boolean,
    default: false
  },
  reports: [{
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    reportedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isModerated: {
    type: Boolean,
    default: false
  },
  moderationReason: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Instance methods
postSchema.methods.canEdit = function(userId, userRole) {
  return this.author.toString() === userId.toString() || 
         userRole === 'moderator' || 
         userRole === 'admin';
};

postSchema.methods.canDelete = function(userId, userRole) {
  return this.author.toString() === userId.toString() || 
         userRole === 'moderator' || 
         userRole === 'admin';
};

postSchema.methods.hasLiked = function(userId) {
  return this.likes.some(id => id.toString() === userId.toString());
};

module.exports = mongoose.model('Post', postSchema);