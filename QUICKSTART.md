# 🚀 Quick Start Guide

## Prerequisites Check
- ✅ Node.js installed (check: `node --version`)
- ✅ MongoDB Atlas account setup
- ✅ Git (optional, for cloning)

## 5-Minute Setup

### 1. Backend Setup (2 minutes)
```bash
# Navigate to backend
cd backend

# Install dependencies (if not already done)
npm install

# Verify .env file exists and has MongoDB URI
# File: backend/.env
# Make sure MONGODB_URI is set correctly

# Start the server
npm start
```

**Expected Output:**
```
🚀 Server running on port 5000
📡 Environment: development
🌐 API URL: http://localhost:5000
MongoDB Atlas connected successfully
```

### 2. Frontend Setup (1 minute)

**Option A: Using VS Code Live Server (Recommended)**
1. Install "Live Server" extension in VS Code
2. Right-click `frontend/login.html`
3. Select "Open with Live Server"
4. Browser opens automatically

**Option B: Using Python**
```bash
cd frontend
python -m http.server 3000
# Open http://localhost:3000/login.html
```

**Option C: Using Node http-server**
```bash
npm install -g http-server
cd frontend
http-server -p 3000
# Open http://localhost:3000/login.html
```

### 3. Test the Application (2 minutes)

#### Create Your First User
1. Open the frontend in your browser
2. Click "Register" tab
3. Fill in:
   - Username: `testuser`
   - Email: `test@example.com`
   - Password: `test123`
4. Click "Register"
5. You'll be automatically logged in and redirected to the forum

#### Create Your First Topic
1. Click "➕ Create New Topic"
2. Fill in:
   - Title: "Welcome to the Forum!"
   - Category: "General"
   - Description: "This is my first topic"
3. Click "✓ Create Topic"

#### Create Your First Post
1. Click on your newly created topic
2. In the "Add Your Post" section:
   - Type: "Hello everyone! This is my first post."
3. Click "📤 Post"

#### Test Features
- ✅ **Like a post**: Click the 🤍 button on any post
- ✅ **Reply to a post**: Click "💬 Reply" and write a response
- ✅ **Report a post**: Click "🚩 Report" (as a different user)
- ✅ **Search topics**: Use the search bar at the top
- ✅ **Filter by category**: Select a category from the dropdown

## Create a Moderator Account

### Option 1: Using MongoDB Compass/Atlas
1. Login to MongoDB Atlas
2. Go to your database → `users` collection
3. Find the user you want to make a moderator
4. Edit the document and change:
   ```json
   "role": "moderator"
   ```
5. Save changes
6. Logout and login again to see moderator features

### Option 2: Using MongoDB Shell
```javascript
// Connect to your database
use forum-app

// Update a user to moderator
db.users.updateOne(
  { email: "test@example.com" },
  { $set: { role: "moderator" } }
)
```

After becoming a moderator, you'll see:
- 🚨 **Moderation** button in the navigation bar
- Access to lock/unlock and pin/unpin topics
- Ability to delete any post/topic
- Access to the moderation dashboard

## Access the Moderation Dashboard

1. Login as a moderator or admin
2. Click the "🚨 Moderation" button in the top navigation
3. View all reported posts
4. Approve or delete reported content

## Troubleshooting

### Backend Issues

**Error: MongoDB connection failed**
```bash
# Solution 1: Check your MongoDB URI in .env file
# Solution 2: Whitelist your IP in MongoDB Atlas
# Solution 3: Check if MongoDB Atlas cluster is running
```

**Error: Port 5000 already in use**
```bash
# Solution: Change PORT in .env file
PORT=5001
```

### Frontend Issues

**Error: Failed to fetch**
```bash
# Solution 1: Make sure backend is running on port 5000
# Solution 2: Check API_URL in frontend JS files
# Solution 3: Clear browser cache and localStorage
```

**Error: Unauthorized**
```bash
# Solution: Clear localStorage and login again
# Open browser console and run:
localStorage.clear()
# Then reload the page
```

## Features to Test

### As a Regular User:
- [x] Register and login
- [x] Create topics
- [x] Create posts and replies
- [x] Like/unlike posts
- [x] Report inappropriate posts
- [x] Edit/delete own content
- [x] Search and filter topics

### As a Moderator:
- [x] All user features
- [x] Lock/unlock topics
- [x] Pin/unpin topics
- [x] Delete any post or topic
- [x] View reported posts
- [x] Approve or delete reported content
- [x] Access moderation dashboard

### System Features:
- [x] Pagination (10 topics per page, 20 posts per page)
- [x] Nested replies (unlimited depth)
- [x] Real-time like counts
- [x] Search by title/description
- [x] Filter by category
- [x] Role badges (Moderator/Admin)
- [x] Automatic profanity detection
- [x] View counters
- [x] Toast notifications

## Production Deployment Checklist

Before deploying to production:

1. **Security**
   - [ ] Generate a strong JWT_SECRET
   - [ ] Set NODE_ENV=production
   - [ ] Update CORS_ORIGIN to your frontend URL
   - [ ] Enable MongoDB authentication
   - [ ] Use HTTPS for all connections

2. **Environment Variables**
   - [ ] Update all .env values
   - [ ] Never commit .env to Git
   - [ ] Use platform environment variables

3. **Frontend**
   - [ ] Update API_URL to production backend URL
   - [ ] Minify CSS and JavaScript
   - [ ] Optimize images
   - [ ] Enable caching

4. **Backend**
   - [ ] Add rate limiting
   - [ ] Add request logging
   - [ ] Set up error monitoring
   - [ ] Configure backups for MongoDB

## Need Help?

- Check the main README.md for detailed documentation
- Review the API documentation section
- Check browser console for errors
- Review backend logs for issues

---

**You're all set! Enjoy using the forum! 🎉**
