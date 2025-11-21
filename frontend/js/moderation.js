// API Configuration
const API_URL = 'http://localhost:5000/api';

// Global State
let currentUser = null;
let currentPage = 1;

// DOM Elements
const usernameDisplay = document.getElementById('username-display');
const userRoleBadge = document.getElementById('user-role-badge');
const logoutBtn = document.getElementById('logout-btn');
const reportedPostsList = document.getElementById('reported-posts-list');
const reportsCount = document.getElementById('reports-count');
const toast = document.getElementById('toast');

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    if (checkAuth()) {
        loadReportedPosts(1);
        setupEventListeners();
    }
});

// Check Authentication and Moderator Role
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
        window.location.href = 'login.html';
        return false;
    }
    
    try {
        currentUser = JSON.parse(user);
        
        // Check if user is moderator or admin
        if (currentUser.role !== 'moderator' && currentUser.role !== 'admin') {
            alert('Access denied. This page is only for moderators and admins.');
            window.location.href = 'index.html';
            return false;
        }
        
        usernameDisplay.textContent = `${currentUser.username}`;
        userRoleBadge.textContent = currentUser.role.toUpperCase();
        userRoleBadge.className = `role-badge ${currentUser.role}`;
        
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
    logoutBtn?.addEventListener('click', handleLogout);
}

// Logout Handler
function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    }
}

// Load Reported Posts
async function loadReportedPosts(page = 1) {
    currentPage = page;
    reportedPostsList.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading reported posts...</p></div>';
    
    try {
        const response = await fetch(`${API_URL}/posts/reported?page=${page}&limit=20`, {
            headers: getAuthHeaders()
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            displayReportedPosts(data.posts);
            displayPagination(data.currentPage, data.totalPages);
            
            if (reportsCount) {
                reportsCount.textContent = `${data.totalReports} reported post${data.totalReports !== 1 ? 's' : ''}`;
            }
        } else {
            reportedPostsList.innerHTML = '<p class="error-message">Failed to load reported posts. Please try again.</p>';
        }
    } catch (error) {
        console.error('Load reported posts error:', error);
        reportedPostsList.innerHTML = '<p class="error-message">Network error. Please check your connection.</p>';
    }
}

// Display Reported Posts
function displayReportedPosts(posts) {
    if (posts.length === 0) {
        reportedPostsList.innerHTML = `
            <div style="text-align: center; padding: 3rem;">
                <h3>✅ No reported posts</h3>
                <p style="color: var(--gray-600); margin-top: 0.5rem;">
                    All posts have been reviewed!
                </p>
            </div>
        `;
        return;
    }
    
    reportedPostsList.innerHTML = posts.map(post => {
        const authorBadge = post.author?.role === 'admin' ? '<span class="badge badge-admin">ADMIN</span>' : 
                            post.author?.role === 'moderator' ? '<span class="badge badge-moderator">MOD</span>' : '';
        
        const reportsHtml = post.reports.map(report => `
            <div style="background: var(--gray-100); padding: 0.5rem; border-radius: 5px; margin-top: 0.5rem;">
                <strong>👤 ${escapeHtml(report.reportedBy?.username || 'Unknown')}</strong>
                <span style="color: var(--gray-600); font-size: 0.85rem;"> - ${formatTimeAgo(report.reportedAt)}</span>
                <p style="margin-top: 0.3rem; color: var(--gray-700);">${escapeHtml(report.reason)}</p>
            </div>
        `).join('');
        
        return `
            <div class="post moderated" data-post-id="${post._id}">
                <div style="background: #fff3cd; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                    <strong>📋 Topic:</strong> <a href="index.html" style="color: var(--primary-color);">${escapeHtml(post.topic?.title || 'Unknown Topic')}</a>
                </div>
                
                <div class="post-header">
                    <span class="post-author">
                        👤 <strong>${escapeHtml(post.author?.username || 'Unknown')}</strong> ${authorBadge}
                    </span>
                    <span class="post-date">${formatTimeAgo(post.createdAt)}</span>
                </div>
                
                <div class="post-content">${escapeHtml(post.content)}</div>
                
                <div style="margin: 1rem 0;">
                    <strong style="color: var(--danger-color);">🚨 Reports (${post.reports.length}):</strong>
                    ${reportsHtml}
                </div>
                
                <div class="post-actions">
                    <button class="btn btn-small btn-success" onclick="moderatePost('${post._id}', 'approve')">
                        ✓ Approve Post
                    </button>
                    <button class="btn btn-small btn-danger" onclick="moderatePost('${post._id}', 'delete')">
                        🗑️ Delete Post
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Moderate Post
async function moderatePost(postId, action) {
    const confirmMessage = action === 'approve' 
        ? 'Are you sure you want to approve this post and clear all reports?' 
        : 'Are you sure you want to delete this post?';
    
    if (!confirm(confirmMessage)) return;
    
    try {
        const response = await fetch(`${API_URL}/posts/${postId}/moderate`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify({ action })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            showToast(data.message, 'success');
            loadReportedPosts(currentPage);
        } else {
            showToast(data.message || 'Failed to moderate post', 'error');
        }
    } catch (error) {
        console.error('Moderate post error:', error);
        showToast('Network error. Please try again.', 'error');
    }
}

// Display Pagination
function displayPagination(currentPage, totalPages) {
    const pagination = document.getElementById('pagination');
    
    if (!pagination || totalPages <= 1) {
        if (pagination) pagination.innerHTML = '';
        return;
    }
    
    let html = `
        <button ${currentPage === 1 ? 'disabled' : ''} onclick="loadReportedPosts(${currentPage - 1})">
            ← Previous
        </button>
        <span>Page ${currentPage} of ${totalPages}</span>
        <button ${currentPage === totalPages ? 'disabled' : ''} onclick="loadReportedPosts(${currentPage + 1})">
            Next →
        </button>
    `;
    
    pagination.innerHTML = html;
}

// Utility Functions
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
