# API Testing Guide

Test these endpoints using tools like Postman, Insomnia, or curl.

## Base URL
```
http://localhost:5000/api
```

## 1. Authentication Tests

### Register a New User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "test123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "username": "testuser",
    "email": "test@example.com",
    "role": "user"
  }
}
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123"
  }'
```

### Get Current User Profile
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 2. Topic Tests

### Get All Topics (Public)
```bash
curl -X GET "http://localhost:5000/api/topics?page=1&limit=10"
```

### Get Topics by Category
```bash
curl -X GET "http://localhost:5000/api/topics?category=Technology&page=1"
```

### Search Topics
```bash
curl -X GET "http://localhost:5000/api/topics?search=welcome&page=1"
```

### Create a Topic (Authenticated)
```bash
curl -X POST http://localhost:5000/api/topics \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title": "My First Topic",
    "description": "This is a detailed description of my topic",
    "category": "General"
  }'
```

### Get Single Topic
```bash
curl -X GET http://localhost:5000/api/topics/TOPIC_ID_HERE
```

### Update Topic (Authenticated, Author or Moderator)
```bash
curl -X PUT http://localhost:5000/api/topics/TOPIC_ID_HERE \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title": "Updated Topic Title",
    "description": "Updated description"
  }'
```

### Delete Topic (Authenticated, Author or Moderator)
```bash
curl -X DELETE http://localhost:5000/api/topics/TOPIC_ID_HERE \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Lock/Unlock Topic (Moderator Only)
```bash
curl -X PATCH http://localhost:5000/api/topics/TOPIC_ID_HERE/lock \
  -H "Authorization: Bearer MODERATOR_TOKEN_HERE"
```

### Pin/Unpin Topic (Moderator Only)
```bash
curl -X PATCH http://localhost:5000/api/topics/TOPIC_ID_HERE/pin \
  -H "Authorization: Bearer MODERATOR_TOKEN_HERE"
```

## 3. Post Tests

### Get Posts for a Topic (Public)
```bash
curl -X GET "http://localhost:5000/api/posts/topic/TOPIC_ID_HERE?page=1&limit=20"
```

### Create a Post (Authenticated)
```bash
curl -X POST http://localhost:5000/api/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "content": "This is my post content",
    "topicId": "TOPIC_ID_HERE"
  }'
```

### Create a Reply to a Post (Authenticated)
```bash
curl -X POST http://localhost:5000/api/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "content": "This is a reply to the post",
    "topicId": "TOPIC_ID_HERE",
    "parentPostId": "PARENT_POST_ID_HERE"
  }'
```

### Edit Post (Authenticated, Author or Moderator)
```bash
curl -X PUT http://localhost:5000/api/posts/POST_ID_HERE \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "content": "Updated post content"
  }'
```

### Delete Post (Authenticated, Author or Moderator)
```bash
curl -X DELETE http://localhost:5000/api/posts/POST_ID_HERE \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Like a Post (Authenticated)
```bash
curl -X POST http://localhost:5000/api/posts/POST_ID_HERE/like \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Unlike a Post (Same endpoint, toggles)
```bash
curl -X POST http://localhost:5000/api/posts/POST_ID_HERE/like \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Report a Post (Authenticated)
```bash
curl -X POST http://localhost:5000/api/posts/POST_ID_HERE/report \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "reason": "This post contains spam"
  }'
```

## 4. Moderation Tests (Moderator/Admin Only)

### Get All Reported Posts
```bash
curl -X GET "http://localhost:5000/api/posts/reported?page=1&limit=20" \
  -H "Authorization: Bearer MODERATOR_TOKEN_HERE"
```

### Approve a Reported Post (Clear Reports)
```bash
curl -X PATCH http://localhost:5000/api/posts/POST_ID_HERE/moderate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer MODERATOR_TOKEN_HERE" \
  -d '{
    "action": "approve"
  }'
```

### Delete a Reported Post
```bash
curl -X PATCH http://localhost:5000/api/posts/POST_ID_HERE/moderate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer MODERATOR_TOKEN_HERE" \
  -d '{
    "action": "delete"
  }'
```

## 5. Testing Workflow

### Complete Test Scenario

1. **Register two users** (User A and User B)
2. **Login as User A** → Get token A
3. **Create a topic** with User A
4. **Create a post** in that topic with User A
5. **Login as User B** → Get token B
6. **Create a reply** to User A's post with User B
7. **Like the post** with User B
8. **Report the post** with User B (with a reason)
9. **Create a moderator user** (manually in database)
10. **Login as moderator** → Get moderator token
11. **Get reported posts** with moderator token
12. **Approve or delete** the reported post
13. **Lock the topic** with moderator
14. **Pin the topic** with moderator

### Testing Pagination

```bash
# Get first page of topics
curl "http://localhost:5000/api/topics?page=1&limit=5"

# Get second page
curl "http://localhost:5000/api/topics?page=2&limit=5"

# Get first page of posts
curl "http://localhost:5000/api/posts/topic/TOPIC_ID?page=1&limit=10"
```

### Testing Search and Filter

```bash
# Search for topics containing "javascript"
curl "http://localhost:5000/api/topics?search=javascript"

# Filter by category "Technology"
curl "http://localhost:5000/api/topics?category=Technology"

# Combine search and filter
curl "http://localhost:5000/api/topics?search=react&category=Technology"
```

## 6. Error Cases to Test

### Unauthorized Access
```bash
# Try to create a topic without authentication
curl -X POST http://localhost:5000/api/topics \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test",
    "description": "Test"
  }'
# Expected: 401 Unauthorized
```

### Invalid Data
```bash
# Try to create a topic without required fields
curl -X POST http://localhost:5000/api/topics \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": ""
  }'
# Expected: 400 Bad Request
```

### Non-existent Resource
```bash
# Try to get a non-existent topic
curl http://localhost:5000/api/topics/000000000000000000000000
# Expected: 404 Not Found
```

### Forbidden Action
```bash
# Try to delete someone else's topic as a regular user
curl -X DELETE http://localhost:5000/api/topics/SOMEONE_ELSES_TOPIC_ID \
  -H "Authorization: Bearer REGULAR_USER_TOKEN"
# Expected: 403 Forbidden
```

## 7. Postman Collection

Import this JSON into Postman for easy testing:

```json
{
  "info": {
    "name": "Forum API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:5000/api"
    },
    {
      "key": "token",
      "value": ""
    }
  ],
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Register",
          "request": {
            "method": "POST",
            "url": "{{base_url}}/auth/register",
            "body": {
              "mode": "raw",
              "raw": "{\n  \"username\": \"testuser\",\n  \"email\": \"test@example.com\",\n  \"password\": \"test123\"\n}"
            }
          }
        },
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "url": "{{base_url}}/auth/login",
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"test@example.com\",\n  \"password\": \"test123\"\n}"
            }
          }
        }
      ]
    }
  ]
}
```

## 8. Expected Response Formats

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description"
}
```

### Pagination Response
```json
{
  "success": true,
  "topics": [ ... ],
  "currentPage": 1,
  "totalPages": 5,
  "totalTopics": 47,
  "hasMore": true
}
```

---

**Happy Testing! 🧪**

For automated testing, consider using Jest or Mocha with Supertest.
