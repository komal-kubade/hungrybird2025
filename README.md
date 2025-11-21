# 💬 Forum Discussion Platform

A full-featured forum application built with Node.js, Express, MongoDB, and vanilla JavaScript. This platform includes user authentication, topic management, nested discussions, post moderation, and more.

## ✨ Features

### 1. User Authentication
- ✅ User registration and login
- ✅ JWT-based authentication
- ✅ Role-based access control (User, Moderator, Admin)
- ✅ Secure password hashing with bcrypt

### 2. Topics Management
- ✅ Create, view, edit, and delete topics
- ✅ List topics with pagination (10 per page)
- ✅ Search and filter topics by category
- ✅ Pin important topics (Moderators/Admins)
- ✅ Lock topics to prevent new posts (Moderators/Admins)
- ✅ View count tracking
- ✅ Category-based organization

### 3. Posts & Discussions
- ✅ Create posts under topics
- ✅ **Nested replies** - Reply to posts with unlimited nesting levels
- ✅ **Like/Unlike posts** - Show appreciation for helpful content
- ✅ Edit and delete posts (by author or moderator)
- ✅ List posts with pagination (20 per page)
- ✅ Real-time like count updates

### 4. Moderation System
- ✅ **Report inappropriate posts** - Users can flag content for review
- ✅ **Moderation dashboard** - Dedicated interface for moderators
- ✅ View all reported posts with report reasons
- ✅ Approve or delete reported content
- ✅ Automatic profanity detection and flagging
- ✅ Moderator and Admin badges

### 5. Frontend Features
- ✅ Responsive design with modern UI
- ✅ Homepage with topic list and pagination
- ✅ Topic detail page with nested replies
- ✅ Create post/reply forms
- ✅ Like buttons with visual feedback
- ✅ Moderation dashboard for authorized users
- ✅ Search and category filtering
- ✅ Toast notifications for user actions
- ✅ Character counters on forms

## 🏗️ Project Structure

```
forum-app/
├── backend/
│   ├── config.js                 # Database configuration
│   ├── server.js                 # Express server setup
│   ├── package.json              # Backend dependencies
│   ├── .env                      # Environment variables (create from .env.example)
│   ├── middleware/
│   │   ├── auth.js              # Authentication middleware
│   │   └── moderation.js        # Content moderation middleware
│   ├── models/
│   │   ├── User.js              # User schema with roles
│   │   ├── Topic.js             # Topic schema
│   │   └── Post.js              # Post schema with likes & reports
│   └── routes/
│       ├── auth.js              # Authentication routes
│       ├── topics.js            # Topic CRUD routes
│       └── posts.js             # Post routes with likes & reports
└── frontend/
    ├── index.html               # Main forum page
    ├── login.html               # Login/Register page
    ├── moderation.html          # Moderation dashboard
    ├── css/
    │   └── style.css            # Complete styling
    └── js/
        ├── app.js               # Main application logic
        ├── auth.js              # Authentication logic
        └── moderation.js        # Moderation dashboard logic
```

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account (or local MongoDB)
- A modern web browser

### Step 1: Clone or Download the Project
```bash
cd forum-app
```

### Step 2: Backend Setup

1. Navigate to the backend folder:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
   - The `.env` file already exists with your MongoDB connection
   - Make sure to update `JWT_SECRET` for production:
```bash
# Generate a secure JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

4. Update the `.env` file with the generated secret:
```env
JWT_SECRET=your-generated-secret-here
```

### Step 3: Frontend Setup

1. Navigate to the frontend folder:
```bash
cd ../frontend
```

2. Open `js/app.js`, `js/auth.js`, and `js/moderation.js`
3. Verify the API_URL is set correctly (default: `http://localhost:5000/api`)

### Step 4: Start the Application

1. Start the backend server:
```bash
cd backend
npm start
```

The server will start on http://localhost:5000

2. Serve the frontend (choose one method):

**Option A: Using VS Code Live Server**
- Install the "Live Server" extension in VS Code
- Right-click on `frontend/login.html` and select "Open with Live Server"

**Option B: Using Python HTTP Server**
```bash
cd frontend
python -m http.server 3000
```
Then open http://localhost:3000/login.html

**Option C: Using Node's http-server**
```bash
npm install -g http-server
cd frontend
http-server -p 3000
```

## 📡 API Documentation

### Authentication Routes

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### Topic Routes

#### Get All Topics
```http
GET /api/topics?page=1&limit=10&category=Technology&search=query
```

#### Create Topic
```http
POST /api/topics
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Topic Title",
  "description": "Topic description",
  "category": "Technology"
}
```

#### Get Single Topic
```http
GET /api/topics/:id
```

#### Update Topic
```http
PUT /api/topics/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Title",
  "description": "Updated description"
}
```

#### Delete Topic
```http
DELETE /api/topics/:id
Authorization: Bearer <token>
```

#### Lock/Unlock Topic (Moderators)
```http
PATCH /api/topics/:id/lock
Authorization: Bearer <token>
```

#### Pin/Unpin Topic (Moderators)
```http
PATCH /api/topics/:id/pin
Authorization: Bearer <token>
```

### Post Routes

#### Get Posts for a Topic
```http
GET /api/posts/topic/:topicId?page=1&limit=20
```

#### Create Post or Reply
```http
POST /api/posts
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Post content",
  "topicId": "topic_id",
  "parentPostId": "parent_post_id" // Optional, for replies
}
```

#### Edit Post
```http
PUT /api/posts/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Updated content"
}
```

#### Delete Post
```http
DELETE /api/posts/:id
Authorization: Bearer <token>
```

#### Like/Unlike Post
```http
POST /api/posts/:id/like
Authorization: Bearer <token>
```

#### Report Post
```http
POST /api/posts/:id/report
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Spam or inappropriate content"
}
```

#### Get Reported Posts (Moderators)
```http
GET /api/posts/reported?page=1&limit=20
Authorization: Bearer <token>
```

#### Moderate Post (Moderators)
```http
PATCH /api/posts/:id/moderate
Authorization: Bearer <token>
Content-Type: application/json

{
  "action": "approve" // or "delete"
}
```

## 👥 User Roles

### User (Default)
- Create topics and posts
- Reply to posts
- Like/unlike posts
- Report inappropriate content
- Edit/delete own content

### Moderator
- All user permissions
- View reported posts
- Approve or delete reported content
- Lock/unlock topics
- Pin/unpin topics
- Delete any post or topic

### Admin
- All moderator permissions
- Full system access
- Can manage all content

## 🎨 Frontend Pages

### 1. Login/Register (`login.html`)
- Tab-based interface for login and registration
- Form validation
- Error handling
- Automatic redirect after successful authentication

### 2. Main Forum (`index.html`)
- Topic list with pagination
- Search and category filtering
- Create new topics
- View topic details in modal
- Post and reply functionality
- Like buttons
- Report posts
- Moderation actions (for moderators)

### 3. Moderation Dashboard (`moderation.html`)
- **Moderator/Admin only**
- View all reported posts
- See report reasons and reporters
- Approve or delete reported content
- Pagination for reported posts

## 🔐 Security Features

- Password hashing with bcrypt
- JWT token authentication
- Protected routes with middleware
- Role-based access control
- Input validation and sanitization
- Profanity detection
- XSS protection through HTML escaping

## 🛠️ Technologies Used

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **cors** - Cross-origin resource sharing
- **dotenv** - Environment variables

### Frontend
- **HTML5** - Structure
- **CSS3** - Styling with modern features
- **Vanilla JavaScript** - No frameworks
- **Fetch API** - HTTP requests
- **LocalStorage** - Client-side storage

## 📝 Testing the Application

### 1. Create Test Users

**Regular User:**
```
Username: testuser
Email: test@example.com
Password: test123
```

**Moderator (manual database update required):**
After creating a user, update their role in MongoDB:
```javascript
db.users.updateOne(
  { email: "moderator@example.com" },
  { $set: { role: "moderator" } }
)
```

### 2. Test Workflow

1. **Register** a new user via the registration form
2. **Login** with your credentials
3. **Create a topic** on the main page
4. **Create posts** and **replies** within topics
5. **Like posts** to show appreciation
6. **Report a post** (as a regular user)
7. **Login as moderator** to access the moderation dashboard
8. **Review and moderate** reported content

## 🐛 Troubleshooting

### Backend won't start
- Check if MongoDB URI is correct in `.env`
- Ensure MongoDB Atlas allows connections from your IP
- Verify Node.js and npm are installed

### Frontend can't connect to backend
- Ensure backend server is running on port 5000
- Check CORS settings in backend
- Verify API_URL in frontend JS files

### Authentication issues
- Clear browser localStorage
- Check JWT_SECRET is set in `.env`
- Verify token expiration settings

## 🚀 Deployment

### Backend (Heroku/Render/Railway)
1. Set environment variables
2. Update CORS_ORIGIN to your frontend URL
3. Deploy with `npm start` command

### Frontend (Netlify/Vercel)
1. Update API_URL in JS files to your backend URL
2. Deploy the frontend folder
3. Ensure CORS is configured on backend

## 📄 License

This project is open source and available for educational purposes.

## 👨‍💻 Author

Built with ❤️ for learning and demonstration purposes.

## 🙏 Acknowledgments

- MongoDB Atlas for database hosting
- Express.js community for excellent documentation
- All open-source contributors

---

**Happy Coding! 🎉**

For questions or issues, please create an issue in the repository.
