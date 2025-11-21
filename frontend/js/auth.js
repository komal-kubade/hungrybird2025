// API Configuration
const API_URL = 'http://localhost:5000/api';

// DOM Elements
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const messageDiv = document.getElementById('message');
const loadingOverlay = document.getElementById('loading-overlay');

// Tab switching functionality
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        
        // Update active tab button
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Show corresponding form
        document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
        document.getElementById(`${tab}-form`).classList.add('active');
        
        // Clear message and forms
        hideMessage();
        loginForm?.reset();
        registerForm?.reset();
    });
});

// Login form handler
loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    
    // Validation
    if (!email || !password) {
        showMessage('Please fill in all fields', 'error');
        return;
    }
    
    // Show loading
    setLoading(loginBtn, true);
    showLoadingOverlay();
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            // Store token and user data
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            showMessage('Login successful! Redirecting...', 'success');
            
            // Redirect to main page after short delay
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } else {
            showMessage(data.message || 'Login failed. Please try again.', 'error');
            setLoading(loginBtn, false);
            loginBtn?.blur();
            hideLoadingOverlay();
        }
    } catch (error) {
        console.error('Login error:', error);
        showMessage('Network error. Please check your connection and try again.', 'error');
        setLoading(loginBtn, false);
        loginBtn?.blur();
        hideLoadingOverlay();
    }
});

// Register form handler
registerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('register-username').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm').value;
    
    // Validation
    if (!username || !email || !password || !confirmPassword) {
        showMessage('Please fill in all fields', 'error');
        return;
    }
    
    if (username.length < 3) {
        showMessage('Username must be at least 3 characters long', 'error');
        return;
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        showMessage('Username can only contain letters, numbers, and underscores', 'error');
        return;
    }
    
    if (password.length < 6) {
        showMessage('Password must be at least 6 characters long', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showMessage('Passwords do not match', 'error');
        return;
    }
    
    // Show loading
    setLoading(registerBtn, true);
    showLoadingOverlay();
    
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            // Store token and user data
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            showMessage('Registration successful! Redirecting...', 'success');
            
            // Redirect to main page after short delay
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } else {
            showMessage(data.message || 'Registration failed. Please try again.', 'error');
            setLoading(registerBtn, false);
            registerBtn?.blur();
            hideLoadingOverlay();
        }
    } catch (error) {
        console.error('Register error:', error);
        showMessage('Network error. Please check your connection and try again.', 'error');
        setLoading(registerBtn, false);
        registerBtn?.blur();
        hideLoadingOverlay();
    }
});

// Helper Functions
function showMessage(text, type) {
    if (messageDiv) {
        messageDiv.textContent = text;
        messageDiv.className = `message ${type}`;
        messageDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
        // Fallback to toast if inline message container is missing
        const toastEl = document.getElementById('toast');
        const toastMsg = document.getElementById('toast-message');
        if (toastEl && toastMsg) {
            toastMsg.textContent = text;
            toastEl.classList.remove('hidden');
            setTimeout(() => toastEl.classList.add('hidden'), 4000);
        } else {
            // Last resort: alert
            alert(text);
        }
    }
}

function hideMessage() {
    messageDiv.className = 'message';
    messageDiv.textContent = '';
}

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

function showLoadingOverlay() {
    loadingOverlay?.classList.remove('hidden');
}

function hideLoadingOverlay() {
    loadingOverlay?.classList.add('hidden');
}

// Check if already logged in
const token = localStorage.getItem('token');
if (token) {
    // Verify token is still valid
    fetch(`${API_URL}/auth/verify-token`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(res => res.json())
    .then(data => {
        if (data.success && data.valid) {
            // Token is valid, redirect to main page
            window.location.href = 'index.html';
        } else {
            // Token is invalid, clear storage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
    })
    .catch(err => {
        console.error('Token verification error:', err);
        // On error, clear storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    });
}

// Add input validation feedback
const inputs = document.querySelectorAll('input');
inputs.forEach(input => {
    input.addEventListener('input', () => {
        if (input.validity.valid) {
            input.style.borderColor = 'var(--success-color)';
        } else if (input.value) {
            input.style.borderColor = 'var(--danger-color)';
        } else {
            input.style.borderColor = 'var(--gray-300)';
        }
    });
});