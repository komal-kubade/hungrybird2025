// API Configuration
const API_URL = 'http://localhost:5000/api';

// Global State
let currentUser = null;
let currentPage = 1;
let currentTopicId = null;
let currentPostsPage = 1;
let currentCategory = '';
let currentSearch = '';

// DOM Elements
const usernameDisplay = document.getElementById('username-display');
const userRoleBadge = document.getElementById('user-role-badge');
const logoutBtn = document.getElementById('logout-btn');
const toggleCreateFormBtn = document.getElementById('toggle-create-form');
const cancelTopicBtn = document.getElementById('cancel-topic');
const topicForm = document.getElementById('topicForm');
const postForm = document.getElementById('postForm');
const topicsList = document.getElementById('topics-list');
const topicsCount = document.getElementById('topics-count');
const searchBtn = document.getElementById('search-btn');
const searchInput = document.getElementById('search-input');
const categoryFilter = document.getElementById('category-filter');
const modal = document.getElementById('topic-modal');
const closeModalBtn = document.querySelector('.close-modal');
const toast = document.getElementById('toast');

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    if (checkAuth()) {
        loadTopics(1);
        setupEventListeners();
        setupCharacterCounters();
    }
});

// Check Authentication
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
        window.location.href = 'login.html';
        return false;
    }
    
    try {
        currentUser = JSON.parse(user);
        usernameDisplay.textContent = `${currentUser.username}`;
        
        // Show role badge for moderators and admins
        if (currentUser.role === 'moderator' || currentUser.role === 'admin') {
            userRoleBadge.textContent = currentUser.role.toUpperCase();
            userRoleBadge.className = `role-badge ${currentUser.role}`;
            
            // Show moderation link
            const moderationLink = document.getElementById('moderation-link');
            if (moderationLink) {
                moderationLink.style.display = 'inline-flex';
            }
        }
        
        return true;
    } catch (error) {
        console.error('Auth error:', error);
        localStorage.clear();
        window.location.href = 'login.html';
        return false;
    }
}

// Get Auth Headers
function getAuthHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
    };
}

// Setup Event Listeners
function setupEventListeners() {
    // Logout
    logoutBtn?.addEventListener('click', handleLogout);
    
    // Toggle create form
    toggleCreateFormBtn?.addEventListener('click', toggleCreateTopicForm);
    cancelTopicBtn?.addEventListener('click', () => {
        document.getElementById('create-topic-form').classList.add('hidden');
        topicForm.reset();
    });
    
    // Forms
    topicForm?.addEventListener('submit', handleCreateTopic);
    postForm?.addEventListener('submit', handleCreatePost);
    
    // Search and filter
    searchBtn?.addEventListener('click', handleSearch);
    searchInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    categoryFilter?.addEventListener('change', handleCategoryFilter);
    
    // Modal
    closeModalBtn?.addEventListener('click', closeModal);
    modal?.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) closeModal();
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });
}

// Setup Character Counters
function setupCharacterCounters() {
    const counters = [
        { input: 'topic-title', counter: 'title-count' },
        { input: 'topic-description', counter: 'desc-count' },
        { input: 'post-content', counter: 'post-count' }
    ];
    
    counters.forEach(({ input, counter }) => {
        const inputEl = document.getElementById(input);
        const counterEl = document.getElementById(counter);
        
        if (inputEl && counterEl) {
            inputEl.addEventListener('input', () => {
                counterEl.textContent = inputEl.value.length;
            });
        }
    });
}

// Logout Handler
function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    }
}

// Toggle Create Topic Form
function toggleCreateTopicForm() {
    const form = document.getElementById('create-topic-form');
    form.classList.toggle('hidden');
    if (!form.classList.contains('hidden')) {
        document.getElementById('topic-title').focus();
    }
}

// Handle Create Topic
async function handleCreateTopic(e) {
    e.preventDefault();
    const createBtn = document.getElementById('create-topic-btn');

    const title = document.getElementById('topic-title').value.trim();
    const category = document.getElementById('topic-category').value;
    const description = document.getElementById('topic-description').value.trim();

    if (!title || !description) {
        showToast('Please fill in all required fields', 'error');
        return;
    }

    // Show loading state on the create button
    setLoading(createBtn, true);

    try {
        const response = await fetch(`${API_URL}/topics`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ title, category, description })
        });

        let data = {};
        try {
            data = await response.json();
        } catch (jsonErr) {
            // ignore JSON parse errors
        }

        if (response.ok && data.success) {
            showToast(data.flagged ? 'Topic created but flagged for review' : 'Topic created successfully!', 'success');
            topicForm.reset();
            document.getElementById('create-topic-form').classList.add('hidden');
            loadTopics(1);
        } else {
            // Show explicit network error message for failures
            showToast('Network error. Please check your connection and try again.', 'error');
            setLoading(createBtn, false);
            createBtn?.blur();
        }
    } catch (error) {
        console.error('Create topic error:', error);
        showToast('Network error. Please check your connection and try again.', 'error');
        setLoading(createBtn, false);
        createBtn?.blur();
    }
}

// Handle Search
function handleSearch() {
    currentSearch = searchInput.value.trim();
    currentPage = 1;
    loadTopics(1);
}

// Handle Category Filter
function handleCategoryFilter() {
    currentCategory = categoryFilter.value;
    currentPage = 1;
    loadTopics(1);
}

// Load Topics
async function loadTopics(page = 1) {
    currentPage = page;
    topicsList.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading topics...</p></div>';
    
    try {
        let url = `${API_URL}/topics?page=${page}&limit=10`;
        if (currentCategory) url += `&category=${currentCategory}`;
        if (currentSearch) url += `&search=${encodeURIComponent(currentSearch)}`;
        
        const response = await fetch(url, {
            headers: getAuthHeaders()
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            displayTopics(data.topics);
            displayPagination(data.currentPage, data.totalPages, 'pagination', loadTopics);
            
            if (topicsCount) {
                topicsCount.textContent = `${data.totalTopics} topic${data.totalTopics !== 1 ? 's' : ''}`;
            }
        } else {
            topicsList.innerHTML = '<p class="error-message">Failed to load topics. Please try again.</p>';
        }
    } catch (error) {
        console.error('Load topics error:', error);
        topicsList.innerHTML = '<p class="error-message">Network error. Please check your connection.</p>';
    }
}

// Display Topics
function displayTopics(topics) {
    if (topics.length === 0) {
        topicsList.innerHTML = `
            <div style="text-align: center; padding: 3rem;">
                <h3>📭 No topics found</h3>
                <p style="color: var(--gray-600); margin-top: 0.5rem;">
                    ${currentSearch || currentCategory ? 'Try adjusting your filters' : 'Be the first to create one!'}
                </p>
            </div>
        `;
        return;
    }
    
    topicsList.innerHTML = topics.map(topic => {
        const isPinned = topic.isPinned ? '<span class="badge badge-pinned">📌 PINNED</span>' : '';
        const isLocked = topic.isLocked ? '<span class="badge badge-locked">🔒 LOCKED</span>' : '';
        const cardClass = `topic-card ${topic.isPinned ? 'pinned' : ''} ${topic.isLocked ? 'locked' : ''}`;
        
        const author = topic.author?.username || 'Unknown';
        const lastPostBy = topic.lastPostBy?.username || 'No posts yet';
        
        return `
            <div class="${cardClass}" data-topic-id="${topic._id}" onclick="openTopicModal('${topic._id}')">
                <h3>${escapeHtml(topic.title)} ${isPinned} ${isLocked}</h3>
                <p>${escapeHtml(truncate(topic.description, 150))}</p>
                <div class="topic-meta">
                    <span class="meta-item">👤 ${escapeHtml(author)}</span>
                    <span class="meta-item">📅 ${formatDate(topic.createdAt)}</span>
                    <span class="category-badge">${escapeHtml(topic.category)}</span>
                </div>
                <div class="topic-stats">
                    <span>💬 ${topic.postCount} post${topic.postCount !== 1 ? 's' : ''}</span>
                    <span>👁️ ${topic.viewCount || 0} view${topic.viewCount !== 1 ? 's' : ''}</span>
                    <span>⏰ ${formatTimeAgo(topic.lastActivity)}</span>
                </div>
            </div>
        `;
    }).join('');
}

// Open Topic Modal
async function openTopicModal(topicId) {
    currentTopicId = topicId;
    currentPostsPage = 1;
    
    modal.classList.remove('hidden');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    try {
        const response = await fetch(`${API_URL}/topics/${topicId}`, {
            headers: getAuthHeaders()
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            displayTopicDetail(data.topic);
            loadPosts(topicId, 1);
        } else {
            showToast('Failed to load topic details', 'error');
        }
    } catch (error) {
        console.error('Load topic error:', error);
        showToast('Network error loading topic', 'error');
    }
}

// Display Topic Detail
function displayTopicDetail(topic) {
    document.getElementById('modal-topic-title').textContent = topic.title;
    document.getElementById('modal-topic-author').innerHTML = `👤 <strong>${escapeHtml(topic.author?.username || 'Unknown')}</strong>`;
    document.getElementById('modal-topic-date').textContent = `📅 ${formatDate(topic.createdAt)}`;
    document.getElementById('modal-topic-category').textContent = topic.category;
    document.getElementById('modal-topic-views').textContent = `👁️ ${topic.viewCount || 0} views`;
    document.getElementById('modal-topic-description').textContent = topic.description;
    
    // Display action buttons
    const actionsDiv = document.getElementById('topic-actions');
    actionsDiv.innerHTML = '';
    
    const isModerator = currentUser.role === 'moderator' || currentUser.role === 'admin';
    const isAuthor = topic.author?._id === currentUser.id;
    
    if (isModerator) {
        actionsDiv.innerHTML += `
            <button class="btn btn-small btn-secondary" onclick="toggleLockTopic('${topic._id}', ${topic.isLocked})">
                ${topic.isLocked ? '🔓 Unlock' : '🔒 Lock'} Topic
            </button>
            <button class="btn btn-small btn-warning" onclick="togglePinTopic('${topic._id}', ${topic.isPinned})">
                ${topic.isPinned ? '📌 Unpin' : '📌 Pin'} Topic
            </button>
        `;
    }
    
    if (isAuthor || isModerator) {
        actionsDiv.innerHTML += `
            <button class="btn btn-small btn-danger" onclick="deleteTopic('${topic._id}')">
                🗑️ Delete Topic
            </button>
        `;
    }
    
    // Handle post form based on topic status
    const postSection = document.getElementById('create-post-section');
    const postContent = document.getElementById('post-content');
    const postButton = postForm.querySelector('button[type="submit"]');
    
    if (topic.isLocked && !isModerator) {
        postContent.disabled = true;
        postContent.placeholder = '🔒 This topic is locked';
        postButton.disabled = true;
        postSection.style.opacity = '0.6';
    } else {
        postContent.disabled = false;
        postContent.placeholder = 'Share your thoughts...';
        postButton.disabled = false;
        postSection.style.opacity = '1';
    }
}

// Load Posts
async function loadPosts(topicId, page = 1) {
    currentPostsPage = page;
    const postsList = document.getElementById('posts-list');
    postsList.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading posts...</p></div>';
    
    try {
        const response = await fetch(`${API_URL}/posts/topic/${topicId}?page=${page}&limit=20`, {
            headers: getAuthHeaders()
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            displayPosts(data.posts);
            displayPagination(data.currentPage, data.totalPages, 'posts-pagination', (p) => loadPosts(topicId, p));
            
            const sectionTitle = document.getElementById('posts-section-title');
            if (sectionTitle) {
                sectionTitle.textContent = `💬 Discussion (${data.totalPosts} post${data.totalPosts !== 1 ? 's' : ''})`;
            }
        } else {
            postsList.innerHTML = '<p class="error-message">Failed to load posts</p>';
        }
    } catch (error) {
        console.error('Load posts error:', error);
        postsList.innerHTML = '<p class="error-message">Network error loading posts</p>';
    }
}

// Display Posts
function displayPosts(posts) {
    const postsList = document.getElementById('posts-list');
    
    if (posts.length === 0) {
        postsList.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <p style="color: var(--gray-600);">No posts yet. Be the first to share your thoughts!</p>
            </div>
        `;
        return;
    }
    
    postsList.innerHTML = posts.map(post => renderPost(post)).join('');
}

// Render Post with Replies
function renderPost(post, isReply = false) {
    const isModerator = currentUser.role === 'moderator' || currentUser.role === 'admin';
    const isAuthor = post.author?._id === currentUser.id;
    const postClass = post.isModerated ? 'post moderated' : 'post';
    
    const authorBadge = post.author?.role === 'admin' ? '<span class="badge badge-admin">ADMIN</span>' : 
                        post.author?.role === 'moderator' ? '<span class="badge badge-moderator">MOD</span>' : '';
    
    const moderationNotice = post.isModerated ? 
        `<div class="moderation-notice">⚠️ <strong>Flagged:</strong> ${escapeHtml(post.moderationReason || 'Pending review')}</div>` : '';
    
    // Check if current user has liked this post
    const hasLiked = post.likes && post.likes.includes(currentUser.id);
    const likeButtonClass = hasLiked ? 'btn btn-small btn-warning' : 'btn btn-small btn-secondary';
    const likeIcon = hasLiked ? '❤️' : '🤍';
    const likeCount = post.likeCount || 0;
    
    let actions = `
        <button class="${likeButtonClass}" onclick="toggleLike('${post._id}')">
            ${likeIcon} <span id="like-count-${post._id}">${likeCount}</span>
        </button>
        <button class="btn btn-small btn-primary" onclick="toggleReplyForm('${post._id}')">💬 Reply</button>
    `;
    
    if (!isAuthor) {
        actions += `<button class="btn btn-small btn-secondary" onclick="reportPost('${post._id}')">🚩 Report</button>`;
    }
    
    if (isAuthor || isModerator) {
        actions += `<button class="btn btn-small btn-danger" onclick="deletePost('${post._id}')">🗑️ Delete</button>`;
    }
    
    if (isModerator && post.isModerated) {
        actions += `<button class="btn btn-small btn-success" onclick="approvePost('${post._id}')">✓ Approve</button>`;
    }
    
    const repliesHtml = post.replies && post.replies.length > 0 ? 
        `<div class="replies">${post.replies.map(reply => renderPost(reply, true)).join('')}</div>` : '';
    
    return `
        <div class="${postClass}" data-post-id="${post._id}">
            ${moderationNotice}
            <div class="post-header">
                <span class="post-author">
                    👤 <strong>${escapeHtml(post.author?.username || 'Unknown')}</strong> ${authorBadge}
                </span>
                <span class="post-date">${formatTimeAgo(post.createdAt)}</span>
            </div>
            <div class="post-content">${escapeHtml(post.content)}</div>
            <div class="post-actions">${actions}</div>
            <div id="reply-form-${post._id}" class="reply-form hidden">
                <textarea id="reply-content-${post._id}" rows="3" placeholder="Write your reply..." maxlength="5000"></textarea>
                <button class="btn btn-small btn-primary" onclick="submitReply('${post._id}')">📤 Post Reply</button>
                <button class="btn btn-small btn-secondary" onclick="toggleReplyForm('${post._id}')">✗ Cancel</button>
            </div>
            ${repliesHtml}
        </div>
    `;
}

// Handle Create Post
async function handleCreatePost(e) {
    e.preventDefault();
    
    const content = document.getElementById('post-content').value.trim();
    
    if (!content) {
        showToast('Please enter your post content', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/posts`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ 
                content, 
                topicId: currentTopicId 
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            document.getElementById('post-content').value = '';
            document.getElementById('post-count').textContent = '0';
            loadPosts(currentTopicId, currentPostsPage);
            
            if (data.flagged) {
                showToast('Post created but flagged for review', 'warning');
            } else {
                showToast('Post created successfully!', 'success');
            }
        } else {
            showToast(data.message || 'Failed to create post', 'error');
        }
    } catch (error) {
        console.error('Create post error:', error);
        showToast('Network error. Please try again.', 'error');
    }
}

// Toggle Reply Form
function toggleReplyForm(postId) {
    const form = document.getElementById(`reply-form-${postId}`);
    form.classList.toggle('hidden');
    
    if (!form.classList.contains('hidden')) {
        document.getElementById(`reply-content-${postId}`).focus();
    }
}

// Submit Reply
async function submitReply(parentPostId) {
    const content = document.getElementById(`reply-content-${parentPostId}`).value.trim();
    
    if (!content) {
        showToast('Please enter your reply', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/posts`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ 
                content, 
                topicId: currentTopicId,
                parentPostId 
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            loadPosts(currentTopicId, currentPostsPage);
            
            if (data.flagged) {
                showToast('Reply posted but flagged for review', 'warning');
            } else {
                showToast('Reply posted successfully!', 'success');
            }
        } else {
            showToast(data.message || 'Failed to post reply', 'error');
        }
    } catch (error) {
        console.error('Reply error:', error);
        showToast('Network error. Please try again.', 'error');
    }
}

// Delete Post
async function deletePost(postId) {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    try {
        const response = await fetch(`${API_URL}/posts/${postId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            showToast('Post deleted successfully', 'success');
            loadPosts(currentTopicId, currentPostsPage);
        } else {
            showToast(data.message || 'Failed to delete post', 'error');
        }
    } catch (error) {
        console.error('Delete post error:', error);
        showToast('Network error. Please try again.', 'error');
    }
}

// Toggle Like on Post
async function toggleLike(postId) {
    try {
        const response = await fetch(`${API_URL}/posts/${postId}/like`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            // Update like count in UI
            const likeCountEl = document.getElementById(`like-count-${postId}`);
            if (likeCountEl) {
                likeCountEl.textContent = data.likeCount;
            }
            
            // Update button appearance
            const postEl = document.querySelector(`[data-post-id="${postId}"]`);
            if (postEl) {
                loadPosts(currentTopicId, currentPostsPage);
            }
        } else {
            showToast(data.message || 'Failed to update like', 'error');
        }
    } catch (error) {
        console.error('Toggle like error:', error);
        showToast('Network error. Please try again.', 'error');
    }
}

// Report Post
async function reportPost(postId) {
    const reason = prompt('Please enter the reason for reporting this post:');
    
    if (!reason || reason.trim() === '') {
        showToast('Report reason is required', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/posts/${postId}/report`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ reason: reason.trim() })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            showToast('Post reported successfully. Moderators will review it.', 'success');
        } else {
            showToast(data.message || 'Failed to report post', 'error');
        }
    } catch (error) {
        console.error('Report post error:', error);
        showToast('Network error. Please try again.', 'error');
    }
}

// Approve Post (Moderators)
async function approvePost(postId) {
    try {
        const response = await fetch(`${API_URL}/posts/${postId}/moderate`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify({ action: 'approve' })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            showToast('Post approved successfully', 'success');
            loadPosts(currentTopicId, currentPostsPage);
        } else {
            showToast(data.message || 'Failed to approve post', 'error');
        }
    } catch (error) {
        console.error('Approve post error:', error);
        showToast('Network error. Please try again.', 'error');
    }
}

// Delete Topic
async function deleteTopic(topicId) {
    if (!confirm('Are you sure you want to delete this topic? All posts will be deleted.')) return;
    
    try {
        const response = await fetch(`${API_URL}/topics/${topicId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            showToast('Topic deleted successfully', 'success');
            closeModal();
            loadTopics(currentPage);
        } else {
            showToast(data.message || 'Failed to delete topic', 'error');
        }
    } catch (error) {
        console.error('Delete topic error:', error);
        showToast('Network error. Please try again.', 'error');
    }
}

// Toggle Lock Topic
async function toggleLockTopic(topicId, currentState) {
    try {
        const response = await fetch(`${API_URL}/topics/${topicId}/lock`, {
            method: 'PATCH',
            headers: getAuthHeaders()
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            showToast(`Topic ${currentState ? 'unlocked' : 'locked'} successfully`, 'success');
            openTopicModal(topicId);
            loadTopics(currentPage);
        } else {
            showToast(data.message || 'Failed to update topic', 'error');
        }
    } catch (error) {
        console.error('Lock topic error:', error);
        showToast('Network error. Please try again.', 'error');
    }
}

// Toggle Pin Topic
async function togglePinTopic(topicId, currentState) {
    try {
        const response = await fetch(`${API_URL}/topics/${topicId}/pin`, {
            method: 'PATCH',
            headers: getAuthHeaders()
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            showToast(`Topic ${currentState ? 'unpinned' : 'pinned'} successfully`, 'success');
            openTopicModal(topicId);
            loadTopics(currentPage);
        } else {
            showToast(data.message || 'Failed to update topic', 'error');
        }
    } catch (error) {
        console.error('Pin topic error:', error);
        showToast('Network error. Please try again.', 'error');
    }
}

// Close Modal
function closeModal() {
    modal.classList.remove('active');
    modal.classList.add('hidden');
    document.body.style.overflow = '';
    currentTopicId = null;
    postForm.reset();
    document.getElementById('post-count').textContent = '0';
}

// Display Pagination
function displayPagination(currentPage, totalPages, elementId, callback) {
    const pagination = document.getElementById(elementId);
    
    if (!pagination || totalPages <= 1) {
        if (pagination) pagination.innerHTML = '';
        return;
    }
    
    let html = `
        <button ${currentPage === 1 ? 'disabled' : ''} onclick="${callback.name}(${currentPage - 1})">
            ← Previous
        </button>
        <span>Page ${currentPage} of ${totalPages}</span>
        <button ${currentPage === totalPages ? 'disabled' : ''} onclick="${callback.name}(${currentPage + 1})">
            Next →
        </button>
    `;
    
    pagination.innerHTML = html;
}

// Utility Functions
function setLoading(button, isLoading) {
    if (!button) return;
    
    if (isLoading) {
        button.disabled = true;
        button.dataset.originalText = button.innerHTML;
        button.innerHTML = '<span>⏳</span> Please wait...';
    } else {
        button.disabled = false;
        button.innerHTML = button.dataset.originalText || button.innerHTML;
    }
}

function showToast(message, type = 'info') {
    const toastMessage = document.getElementById('toast-message');
    toast.classList.remove('hidden');
    toastMessage.textContent = message;
    
    // Auto hide after 3 seconds
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function truncate(text, length) {
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatTimeAgo(dateString) {
    const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
    
    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60
    };
    
    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInUnit);
        if (interval >= 1) {
            return `${interval} ${unit}${interval !== 1 ? 's' : ''} ago`;
        }
    }
    
    return 'Just now';
}