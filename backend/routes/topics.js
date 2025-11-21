const express = require('express');
const router = express.Router();

const Topic = require('../models/Topic');
const Post = require('../models/Post');
const { authMiddleware, moderatorMiddleware, optionalAuth } = require('../middleware/auth');
const { moderationMiddleware } = require('../middleware/moderation');


/*************************************************
 * IMPORTANT FIX: ORDER OF ROUTES
 * Static routes FIRST → Dynamic routes LAST
 *************************************************/


/**
 * @route   GET /api/topics
 * @desc    Get all topics
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const category = req.query.category;
    const search = req.query.search;

    // match documents where isDeleted is not true (covers missing field and explicit false)
    let query = { isDeleted: { $ne: true } };

    if (category && category !== 'All') query.category = category;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const topics = await Topic.find(query)
      .sort({ isPinned: -1, lastActivity: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username role avatar')
      .populate('lastPostBy', 'username')
      .lean();

    const total = await Topic.countDocuments(query);

    res.json({
      success: true,
      topics,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalTopics: total,
      hasMore: page < Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get topics error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching topics' });
  }
});


/**
 * @route   GET /api/topics/category/:category
 * @desc    Get topics by category
 * @access  Public
 */
router.get('/category/:category', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const topics = await Topic.find({
      category: req.params.category,
      isDeleted: { $ne: true }
    })
      .sort({ isPinned: -1, lastActivity: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username role avatar')
      .lean();

    const total = await Topic.countDocuments({
      category: req.params.category,
      isDeleted: { $ne: true }
    });

    res.json({
      success: true,
      topics,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalTopics: total
    });
  } catch (error) {
    console.error('Get category topics error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching topics' });
  }
});


/*************************************************
 * Dynamic route — MUST BE AT THE BOTTOM
 *************************************************/

/**
 * @route   GET /api/topics/:id
 * @desc    Get single topic
 * @access  Public
 */
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id)
      .populate('author', 'username role avatar bio postCount')
      .populate('lastPostBy', 'username')
      .lean();

    if (!topic) {
      return res.status(404).json({ success: false, message: 'Topic not found' });
    }

    if (topic.isDeleted) {
      return res.status(404).json({ success: false, message: 'Topic has been deleted' });
    }

    await Topic.incrementViewCount(req.params.id);
    topic.viewCount += 1;

    res.json({ success: true, topic });
  } catch (error) {
    console.error('Get topic error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching topic' });
  }
});


/**
 * @route POST /api/topics
 */
router.post('/', authMiddleware, moderationMiddleware, async (req, res) => {
  try {
    const { title, description, category, tags } = req.body;
    console.log('POST /api/topics payload:', { title, description, category, tags });
    console.log('Authenticated user id:', req.user && req.user._id);

    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Title and description are required' });
    }

    const topic = new Topic({
      title,
      description,
      category: category || 'General',
      tags: tags || [],
      author: req.user._id,
      isModerated: req.flaggedContent || false,
      moderationReason: req.moderationReason || ''
    });

    await topic.save();
    console.log('Topic saved to DB with id:', topic._id);
    await topic.populate('author', 'username role avatar');

    try {
      req.user.postCount += 1;
      await req.user.save();
      console.log('User postCount updated for user:', req.user._id);
    } catch (userErr) {
      console.error('Failed updating user postCount:', userErr);
    }

    res.status(201).json({
      success: true,
      message: req.flaggedContent ? 'Topic created but flagged for moderation' : 'Topic created successfully',
      topic,
      flagged: req.flaggedContent
    });
  } catch (error) {
    console.error('Create topic error:', error);
    res.status(500).json({ success: false, message: 'Server error creating topic' });
  }
});


/**
 * @route PUT /api/topics/:id
 */
router.put('/:id', authMiddleware, moderationMiddleware, async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id);

    if (!topic) {
      return res.status(404).json({ success: false, message: 'Topic not found' });
    }

    if (!topic.canEdit(req.user._id, req.user.role)) {
      return res.status(403).json({ success: false, message: 'No permission to edit' });
    }

    const { title, description, category, tags } = req.body;

    if (title) topic.title = title;
    if (description) topic.description = description;
    if (category) topic.category = category;
    if (tags) topic.tags = tags;

    if (req.flaggedContent) {
      topic.isModerated = true;
      topic.moderationReason = req.moderationReason;
    }

    await topic.save();
    await topic.populate('author', 'username role avatar');

    res.json({ success: true, message: 'Topic updated', topic });
  } catch (error) {
    console.error('Update topic error:', error);
    res.status(500).json({ success: false, message: 'Server error updating topic' });
  }
});


/**
 * @route DELETE /api/topics/:id
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id);

    if (!topic) {
      return res.status(404).json({ success: false, message: 'Topic not found' });
    }

    if (!topic.canDelete(req.user._id, req.user.role)) {
      return res.status(403).json({ success: false, message: 'No permission to delete' });
    }

    topic.isDeleted = true;
    await topic.save();

    await Post.updateMany(
      { topic: req.params.id },
      { isDeleted: true, deletedAt: Date.now(), deletedBy: req.user._id }
    );

    res.json({ success: true, message: 'Topic deleted' });
  } catch (error) {
    console.error('Delete topic error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting topic' });
  }
});


/**
 * @route PATCH /api/topics/:id/lock
 */
router.patch('/:id/lock', authMiddleware, moderatorMiddleware, async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id);

    if (!topic) {
      return res.status(404).json({ success: false, message: 'Topic not found' });
    }

    topic.isLocked = !topic.isLocked;
    topic.moderatedBy = req.user._id;

    await topic.save();

    res.json({
      success: true,
      message: `Topic ${topic.isLocked ? 'locked' : 'unlocked'}`,
      topic: { isLocked: topic.isLocked }
    });
  } catch (error) {
    console.error('Lock topic error:', error);
    res.status(500).json({ success: false, message: 'Server error locking topic' });
  }
});


/**
 * @route PATCH /api/topics/:id/pin
 */
router.patch('/:id/pin', authMiddleware, moderatorMiddleware, async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id);

    if (!topic) {
      return res.status(404).json({ success: false, message: 'Topic not found' });
    }

    topic.isPinned = !topic.isPinned;
    topic.moderatedBy = req.user._id;

    await topic.save();

    res.json({
      success: true,
      message: `Topic ${topic.isPinned ? 'pinned' : 'unpinned'}`,
      topic: { isPinned: topic.isPinned }
    });
  } catch (error) {
    console.error('Pin topic error:', error);
    res.status(500).json({ success: false, message: 'Server error pinning topic' });
  }
});


module.exports = router;
