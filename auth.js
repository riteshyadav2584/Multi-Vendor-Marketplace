// ===================== API CONFIGURATION =====================

const API_BASE_URL = 'http://localhost:5000/api';
const TOKEN_KEY = 'authToken';
const USER_KEY = 'currentUser';

// ===================== UTILITY FUNCTIONS =====================

function setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
}

function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

function setCurrentUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function getCurrentUser() {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
}

async function fetchAPI(endpoint, method = 'GET', body = null) {
    const headers = {
        'Content-Type': 'application/json',
    };

    const options = {
        method,
        headers,
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        console.log(`Fetching: ${API_BASE_URL}${endpoint}`, { method, body });
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        
        let data;
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            data = await response.text();
            console.warn('Response is not JSON:', data);
        }

        console.log('Response:', { status: response.status, ok: response.ok, data });

        if (!response.ok) {
            const errorMessage = data.message || data || 'API request failed';
            throw new Error(errorMessage);
        }

        return data;
    } catch (error) {
        console.error('API Error:', error.message || error, { endpoint, method });
        throw error;
    }
}

function showError(elementId, message) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.style.display = 'block';
}

function hideError(elementId) {
    const element = document.getElementById(elementId);
    element.style.display = 'none';
}

function showSuccess(elementId, message) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.style.display = 'block';
}

function hideSuccess(elementId) {
    const element = document.getElementById(elementId);
    element.style.display = 'none';
}

// ===================== FORM SWITCHING =====================

function switchToRegister(e) {
    e.preventDefault();
    document.getElementById('loginForm').classList.remove('active');
    document.getElementById('registerForm').classList.add('active');
}

function switchToLogin(e) {
    e.preventDefault();
    document.getElementById('registerForm').classList.remove('active');
    document.getElementById('loginForm').classList.add('active');
}

// ===================== ROLE MANAGEMENT =====================

function handleRoleChange(role) {
    const vendorDetails = document.getElementById('vendorDetails');
    if (role === 'vendor') {
        vendorDetails.style.display = 'block';
    } else {
        vendorDetails.style.display = 'none';
    }
}

// ===================== LOGIN FUNCTION =====================

async function handleLogin(e) {
    e.preventDefault();
    hideError('loginError');
    hideSuccess('loginSuccess');

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetchAPI('/auth/login', 'POST', { email, password });

        setToken(response.data.token);
        setCurrentUser(response.data.user);

        const user = response.data.user;
        const roleDisplay = user.role.charAt(0).toUpperCase() + user.role.slice(1);
        showSuccess('loginSuccess', `Login successful! Logging in as ${roleDisplay}. Redirecting...`);

        setTimeout(() => {
            if (user.role === 'vendor') {
                window.location.href = 'vendor-dashboard.html';
            } else if (user.role === 'admin') {
                window.location.href = 'admin-dashboard.html';
            } else if (user.role === 'customer') {
                window.location.href = 'index.html';
            } else {
                window.location.href = 'index.html';
            }
        }, 1500);
    } catch (error) {
        console.error('Login error:', error);
        let errorMessage = error.message || 'Login failed.';
        
        // Check if it's a network error
        if (!error.message || error.message.includes('Failed to fetch')) {
            errorMessage = 'Cannot connect to server. Make sure the backend is running on port 5000.';
        }
        
        showError('loginError', errorMessage);
    }
}

// ===================== REGISTER FUNCTION =====================

async function handleRegister(e) {
    e.preventDefault();
    hideError('registerError');
    hideSuccess('registerSuccess');

    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const role = document.querySelector('input[name="role"]:checked').value;

    // Validate password
    if (password.length < 6) {
        showError('registerError', 'Password must be at least 6 characters long');
        return;
    }

    const userData = {
        name,
        email,
        password,
        role,
    };

    // Add vendor details if registering as vendor
    if (role === 'vendor') {
        const storeName = document.getElementById('storeName').value;
        const storeDescription = document.getElementById('storeDescription').value;
        const storeLogo = document.getElementById('storeLogo').value;

        if (!storeName) {
            showError('registerError', 'Please provide a store name');
            return;
        }

        userData.vendorDetails = {
            companyName: storeName,
            companyDescription: storeDescription,
            businessLicense: storeLogo,
        };
    }

    try {
        const response = await fetchAPI('/auth/register', 'POST', userData);

        showSuccess('registerSuccess', response.message || 'Verification link sent to your email. Please verify before logging in.');
        document.getElementById('registerFormElement').reset();
        handleRoleChange(document.querySelector('input[name="role"]:checked').value);

        setTimeout(() => {
            switchToLogin(new Event('click'));
        }, 1200);
    } catch (error) {
        console.error('Registration error:', error);
        let errorMessage = error.message || 'Registration failed. Please try again.';
        
        // Check if it's a network error
        if (!error.message || error.message.includes('Failed to fetch')) {
            errorMessage = 'Cannot connect to server. Make sure the backend is running on port 5000.';
        }
        
        showError('registerError', errorMessage);
    }
}

// ===================== EVENT LISTENERS =====================

document.addEventListener('DOMContentLoaded', () => {
    // Check if user is already logged in
    const token = getToken();
    const user = getCurrentUser();

    if (token && user) {
        // User is already logged in, redirect to appropriate page
        if (user.role === 'vendor') {
            window.location.href = 'vendor-dashboard.html';
        } else if (user.role === 'admin') {
            window.location.href = 'admin-dashboard.html';
        } else if (user.role === 'customer') {
            window.location.href = 'index.html';
        } else {
            window.location.href = 'index.html';
        }
        return; // Exit early to prevent loading login form
    }

    // Form switching
    document.getElementById('switchToRegister').addEventListener('click', switchToRegister);
    document.getElementById('switchToLogin').addEventListener('click', switchToLogin);

    // Login form
    document.getElementById('loginFormElement').addEventListener('submit', handleLogin);

    // Register form
    document.getElementById('registerFormElement').addEventListener('submit', handleRegister);

    // Role change handling
    document.querySelectorAll('input[name="role"]').forEach((radio) => {
        radio.addEventListener('change', (e) => {
            handleRoleChange(e.target.value);
        });
    });

    // Initialize vendor details visibility
    handleRoleChange(document.querySelector('input[name="role"]:checked').value);
});
