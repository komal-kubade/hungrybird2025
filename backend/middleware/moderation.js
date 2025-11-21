const profanityList = ['badword1', 'badword2', 'spam', 'offensive'];

const checkProfanity = (text) => {
  const lowerText = text.toLowerCase();
  return profanityList.some(word => lowerText.includes(word));
};

const moderationMiddleware = (req, res, next) => {
  const { content, title, description } = req.body;
  const textToCheck = content || title || description || '';

  if (checkProfanity(textToCheck)) {
    req.flaggedContent = true;
    req.moderationReason = 'Content contains inappropriate language';
  }

  next();
};

module.exports = { moderationMiddleware, checkProfanity };