const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    default: 'General'
  },
  tags: [{
    type: String,
    trim: true
  }],
  viewCount: {
    type: Number,
    default: 0
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  isModerated: {
    type: Boolean,
    default: false
  },
  moderationReason: {
    type: String,
    default: ''
  },
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  postCount: {
    type: Number,
    default: 0
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  lastPostBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Instance methods
topicSchema.methods.canEdit = function(userId, userRole) {
  return this.author.toString() === userId.toString() || 
         userRole === 'moderator' || 
         userRole === 'admin';
};

topicSchema.methods.canDelete = function(userId, userRole) {
  return this.author.toString() === userId.toString() || 
         userRole === 'moderator' || 
         userRole === 'admin';
};

// Static methods
topicSchema.statics.incrementViewCount = async function(topicId) {
  return this.findByIdAndUpdate(topicId, { $inc: { viewCount: 1 } });
};

module.exports = mongoose.model('Topic', topicSchema);