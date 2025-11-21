const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const Topic = require('../models/Topic');
const { authMiddleware, moderatorMiddleware, optionalAuth } = require('../middleware/auth');
const { moderationMiddleware } = require('../middleware/moderation');

/**
 * @route   GET /api/posts/topic/:topicId
 * @desc    Get posts for a topic with nested replies
 * @access  Public
 */
router.get('/topic/:topicId', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Get top-level posts (no parent)
    const posts = await Post.find({
      topic: req.params.topicId,
      parentPost: null,
      isDeleted: false
    })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username role avatarUrl')
      .lean();

    // Get all replies for these posts
    const postIds = posts.map(p => p._id);
    const replies = await Post.find({
      parentPost: { $in: postIds },
      isDeleted: false
    })
      .populate('author', 'username role avatarUrl')
      .lean();

    // Organize replies into nested structure
    const postsWithReplies = posts.map(post => {
      const postReplies = replies.filter(r => 
        r.parentPost && r.parentPost.toString() === post._id.toString()
      );
      return { ...post, replies: postReplies };
    });

    const total = await Post.countDocuments({
      topic: req.params.topicId,
      parentPost: null,
      isDeleted: false
    });

    res.json({
      success: true,
      posts: postsWithReplies,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPosts: total
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching posts'
    });
  }
});

/**
 * @route   POST /api/posts
 * @desc    Create new post or reply
 * @access  Private
 */
router.post('/', authMiddleware, moderationMiddleware, async (req, res) => {
  try {
    const { content, topicId, parentPostId } = req.body;

    if (!content || !topicId) {
      return res.status(400).json({
        success: false,
        message: 'Content and topic ID are required'
      });
    }

    // Check if topic exists and is not locked
    const topic = await Topic.findById(topicId);
    if (!topic) {
      return res.status(404).json({
        success: false,
        message: 'Topic not found'
      });
    }

    if (topic.isLocked) {
      return res.status(403).json({
        success: false,
        message: 'This topic is locked and cannot be replied to'
      });
    }

    // If it's a reply, check parent post exists
    let level = 0;
    if (parentPostId) {
      const parentPost = await Post.findById(parentPostId);
      if (!parentPost) {
        return res.status(404).json({
          success: false,
          message: 'Parent post not found'
        });
      }
      level = parentPost.level + 1;
    }

    const post = new Post({
      content,
      topic: topicId,
      author: req.user._id,
      parentPost: parentPostId || null,
      level,
      isModerated: req.flaggedContent || false,
      moderationReason: req.moderationReason || ''
    });

    await post.save();
    await post.populate('author', 'username role avatarUrl');

    // Update topic's last activity and post count
    topic.lastActivity = new Date();
    topic.lastPostBy = req.user._id;
    topic.postCount += 1;
    await topic.save();

    // Increment user post count
    req.user.postCount += 1;
    await req.user.save();

    res.status(201).json({
      success: true,
      message: req.flaggedContent ? 'Post created but flagged for moderation' : 'Post created successfully',
      post,
      flagged: req.flaggedContent
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating post'
    });
  }
});

/**
 * @route   PUT /api/posts/:id
 * @desc    Edit post
 * @access  Private
 */
router.put('/:id', authMiddleware, moderationMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    if (!post.canEdit(req.user._id, req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'No permission to edit this post'
      });
    }

    const { content } = req.body;
    if (content) post.content = content;
    
    if (req.flaggedContent) {
      post.isModerated = true;
      post.moderationReason = req.moderationReason;
    }
    
    post.updatedAt = Date.now();
    await post.save();
    await post.populate('author', 'username role avatarUrl');

    res.json({
      success: true,
      message: 'Post updated successfully',
      post
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating post'
    });
  }
});

/**
 * @route   DELETE /api/posts/:id
 * @desc    Delete post
 * @access  Private
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    if (!post.canDelete(req.user._id, req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'No permission to delete this post'
      });
    }

    post.isDeleted = true;
    post.deletedAt = Date.now();
    post.deletedBy = req.user._id;
    await post.save();

    // Update topic post count
    await Topic.findByIdAndUpdate(post.topic, { $inc: { postCount: -1 } });

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting post'
    });
  }
});

/**
 * @route   POST /api/posts/:id/like
 * @desc    Like/unlike a post
 * @access  Private
 */
router.post('/:id/like', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const hasLiked = post.hasLiked(req.user._id);

    if (hasLiked) {
      // Unlike
      post.likes = post.likes.filter(id => id.toString() !== req.user._id.toString());
      post.likeCount = post.likes.length;
      await post.save();

      res.json({
        success: true,
        message: 'Post unliked',
        liked: false,
        likeCount: post.likeCount
      });
    } else {
      // Like
      post.likes.push(req.user._id);
      post.likeCount = post.likes.length;
      await post.save();

      res.json({
        success: true,
        message: 'Post liked',
        liked: true,
        likeCount: post.likeCount
      });
    }
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error liking post'
    });
  }
});

/**
 * @route   POST /api/posts/:id/report
 * @desc    Report a post
 * @access  Private
 */
router.post('/:id/report', authMiddleware, async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Report reason is required'
      });
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if user already reported this post
    const alreadyReported = post.reports.some(
      report => report.reportedBy.toString() === req.user._id.toString()
    );

    if (alreadyReported) {
      return res.status(400).json({
        success: false,
        message: 'You have already reported this post'
      });
    }

    post.reports.push({
      reportedBy: req.user._id,
      reason,
      reportedAt: Date.now()
    });
    post.isReported = true;
    await post.save();

    res.json({
      success: true,
      message: 'Post reported successfully. Moderators will review it.'
    });
  } catch (error) {
    console.error('Report post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error reporting post'
    });
  }
});

/**
 * @route   GET /api/posts/reported
 * @desc    Get all reported posts (moderators only)
 * @access  Private (Moderator/Admin)
 */
router.get('/reported', authMiddleware, moderatorMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const posts = await Post.find({
      isReported: true,
      isDeleted: false
    })
      .sort({ 'reports.0.reportedAt': -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username role avatarUrl')
      .populate('topic', 'title')
      .populate('reports.reportedBy', 'username')
      .lean();

    const total = await Post.countDocuments({
      isReported: true,
      isDeleted: false
    });

    res.json({
      success: true,
      posts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalReports: total
    });
  } catch (error) {
    console.error('Get reported posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching reported posts'
    });
  }
});

/**
 * @route   PATCH /api/posts/:id/moderate
 * @desc    Moderate a post (approve/reject reports)
 * @access  Private (Moderator/Admin)
 */
router.patch('/:id/moderate', authMiddleware, moderatorMiddleware, async (req, res) => {
  try {
    const { action } = req.body; // 'approve' or 'delete'

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    if (action === 'approve') {
      // Clear reports and moderation flags
      post.isReported = false;
      post.reports = [];
      post.isModerated = false;
      post.moderationReason = '';
      await post.save();

      res.json({
        success: true,
        message: 'Post approved successfully'
      });
    } else if (action === 'delete') {
      // Delete the post
      post.isDeleted = true;
      post.deletedAt = Date.now();
      post.deletedBy = req.user._id;
      await post.save();

      // Update topic post count
      await Topic.findByIdAndUpdate(post.topic, { $inc: { postCount: -1 } });

      res.json({
        success: true,
        message: 'Post deleted successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid action'
      });
    }
  } catch (error) {
    console.error('Moderate post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error moderating post'
    });
  }
});

module.exports = router;