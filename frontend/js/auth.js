/**
 * Authentication Module
 * Handles user registration, login, and profile management
 */

class AuthManager {
    constructor() {
        this.apiUrl = 'http://localhost:5000/api';
        this.setupEventListeners();
    }

    /**
     * Setup event listeners for authentication forms
     */
    setupEventListeners() {
        // Register form
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => this.handleLogout(e));
        }

        // Profile form
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => this.handleUpdateProfile(e));
        }

        // Change password form
        const passwordForm = document.getElementById('passwordForm');
        if (passwordForm) {
            passwordForm.addEventListener('submit', (e) => this.handleChangePassword(e));
        }

        // Toggle password visibility
        const togglePasswordBtns = document.querySelectorAll('.toggle-password');
        togglePasswordBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.togglePasswordVisibility(e));
        });

        // Form link navigation
        const formLinks = document.querySelectorAll('.form-link a');
        formLinks.forEach(link => {
            link.addEventListener('click', (e) => this.handleFormNavigation(e));
        });
    }

    /**
     * Handle user registration
     * @param {Event} e - Form submit event
     */
    async handleRegister(e) {
        e.preventDefault();

        const username = document.getElementById('username')?.value.trim();
        const email = document.getElementById('email')?.value.trim();
        const password = document.getElementById('password')?.value;
        const mobile = document.getElementById('mobile')?.value.trim();

        // Validation
        if (!this.validateRegisterForm(username, email, password, mobile)) {
            return;
        }

        try {
            this.showLoading('registerForm');

            const response = await fetch(`${this.apiUrl}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username,
                    email,
                    password,
                    mobile
                })
            });

            const data = await response.json();

            if (response.ok) {
                this.showAlert('success', data.message, 'registerForm');
                document.getElementById('registerForm').reset();
                
                // Redirect to login after 2 seconds
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            } else {
                this.showAlert('error', data.message, 'registerForm');
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showAlert('error', 'An error occurred during registration', 'registerForm');
        } finally {
            this.hideLoading('registerForm');
        }
    }

    /**
     * Handle user login
     * @param {Event} e - Form submit event
     */
    async handleLogin(e) {
        e.preventDefault();

        const email = document.getElementById('email')?.value.trim();
        const password = document.getElementById('password')?.value;

        if (!email || !password) {
            this.showAlert('error', 'Email and password are required', 'loginForm');
            return;
        }

        try {
            this.showLoading('loginForm');

            const response = await fetch(`${this.apiUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    password
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Store token and user data
                sessionManager.setToken(data.data.access_token);
                sessionManager.setUser(data.data.user);

                this.showAlert('success', 'Login successful!', 'loginForm');

                // Redirect to dashboard after 1.5 seconds
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            } else {
                this.showAlert('error', data.message, 'loginForm');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showAlert('error', 'An error occurred during login', 'loginForm');
        } finally {
            this.hideLoading('loginForm');
        }
    }

    /**
     * Handle user logout
     * @param {Event} e - Click event
     */
    async handleLogout(e) {
        e.preventDefault();

        try {
            const response = await fetch(`${this.apiUrl}/auth/logout`, {
                method: 'POST',
                headers: sessionManager.getAuthHeaders()
            });

            if (response.ok) {
                sessionManager.clearSession();
                window.location.href = 'login.html';
            }
        } catch (error) {
            console.error('Logout error:', error);
            // Clear session anyway
            sessionManager.clearSession();
            window.location.href = 'login.html';
        }
    }

    /**
     * Handle profile update
     * @param {Event} e - Form submit event
     */
    async handleUpdateProfile(e) {
        e.preventDefault();

        const mobile = document.getElementById('profileMobile')?.value.trim();
        const email = document.getElementById('profileEmail')?.value.trim();

        if (!mobile || !email) {
            this.showAlert('error', 'All fields are required', 'profileForm');
            return;
        }

        try {
            this.showLoading('profileForm');

            const response = await fetch(`${this.apiUrl}/auth/update-profile`, {
                method: 'PUT',
                headers: sessionManager.getAuthHeaders(),
                body: JSON.stringify({
                    mobile,
                    email
                })
            });

            const data = await response.json();

            if (response.ok) {
                sessionManager.setUser(data.data.user);
                this.showAlert('success', data.message, 'profileForm');
                this.loadUserProfile();
            } else {
                this.showAlert('error', data.message, 'profileForm');
            }
        } catch (error) {
            console.error('Profile update error:', error);
            this.showAlert('error', 'An error occurred while updating profile', 'profileForm');
        } finally {
            this.hideLoading('profileForm');
        }
    }

    /**
     * Handle password change
     * @param {Event} e - Form submit event
     */
    async handleChangePassword(e) {
        e.preventDefault();

        const oldPassword = document.getElementById('oldPassword')?.value;
        const newPassword = document.getElementById('newPassword')?.value;
        const confirmPassword = document.getElementById('confirmPassword')?.value;

        if (!oldPassword || !newPassword || !confirmPassword) {
            this.showAlert('error', 'All fields are required', 'passwordForm');
            return;
        }

        if (newPassword !== confirmPassword) {
            this.showAlert('error', 'New passwords do not match', 'passwordForm');
            return;
        }

        try {
            this.showLoading('passwordForm');

            const response = await fetch(`${this.apiUrl}/auth/change-password`, {
                method: 'POST',
                headers: sessionManager.getAuthHeaders(),
                body: JSON.stringify({
                    old_password: oldPassword,
                    new_password: newPassword,
                    confirm_password: confirmPassword
                })
            });

            const data = await response.json();

            if (response.ok) {
                this.showAlert('success', data.message, 'passwordForm');
                document.getElementById('passwordForm').reset();
            } else {
                this.showAlert('error', data.message, 'passwordForm');
            }
        } catch (error) {
            console.error('Password change error:', error);
            this.showAlert('error', 'An error occurred while changing password', 'passwordForm');
        } finally {
            this.hideLoading('passwordForm');
        }
    }

    /**
     * Load user profile
     */
    async loadUserProfile() {
        try {
            const response = await fetch(`${this.apiUrl}/auth/profile`, {
                method: 'GET',
                headers: sessionManager.getAuthHeaders()
            });

            const data = await response.json();

            if (response.ok) {
                const user = data.data.user;
                
                // Update profile form if exists
                const profileMobile = document.getElementById('profileMobile');
                const profileEmail = document.getElementById('profileEmail');
                const profileUsername = document.getElementById('profileUsername');
                const profileCreatedAt = document.getElementById('profileCreatedAt');

                if (profileMobile) profileMobile.value = user.mobile;
                if (profileEmail) profileEmail.value = user.email;
                if (profileUsername) profileUsername.value = user.username;
                if (profileCreatedAt) profileCreatedAt.textContent = new Date(user.created_at).toLocaleDateString();

                // Update navbar
                this.updateNavbar(user);
            }
        } catch (error) {
            console.error('Load profile error:', error);
        }
    }

    /**
     * Update navbar with user info
     * @param {object} user - User object
     */
    updateNavbar(user) {
        const userInfo = document.querySelector('.user-info');
        if (userInfo) {
            userInfo.textContent = `Welcome, ${user.mobile || user.username}`;
        }
    }

    /**
     * Validate registration form
     * @returns {boolean} True if valid
     */
    validateRegisterForm(username, email, password, mobile) {
        const errors = {};

        if (!username) errors.username = 'Username is required';
        if (username && username.length < 3) errors.username = 'Username must be at least 3 characters';

        if (!email) errors.email = 'Email is required';
        if (email && !this.isValidEmail(email)) errors.email = 'Invalid email format';

        if (!password) errors.password = 'Password is required';
        if (password && password.length < 8) errors.password = 'Password must be at least 8 characters';

        if (!mobile) errors.mobile = 'Mobile number is required';
        if (mobile && mobile.length < 10) errors.mobile = 'Mobile number must be at least 10 characters';

        if (Object.keys(errors).length > 0) {
            this.displayFormErrors(errors);
            return false;
        }

        this.clearFormErrors();
        return true;
    }

    /**
     * Validate email format
     * @param {string} email - Email to validate
     * @returns {boolean} True if valid
     */
    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    /**
     * Display form errors
     * @param {object} errors - Error messages
     */
    displayFormErrors(errors) {
        this.clearFormErrors();

        Object.keys(errors).forEach(field => {
            const input = document.getElementById(field);
            if (input) {
                input.classList.add('error');
                const errorElement = input.nextElementSibling;
                if (errorElement && errorElement.classList.contains('form-error')) {
                    errorElement.textContent = errors[field];
                    errorElement.classList.add('show');
                }
            }
        });
    }

    /**
     * Clear form errors
     */
    clearFormErrors() {
        document.querySelectorAll('input.error').forEach(input => {
            input.classList.remove('error');
        });

        document.querySelectorAll('.form-error.show').forEach(error => {
            error.classList.remove('show');
        });
    }

    /**
     * Show loading state
     * @param {string} formId - Form ID
     */
    showLoading(formId) {
        const form = document.getElementById(formId);
        if (form) {
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="spinner"></span> Loading...';
            }
        }
    }

    /**
     * Hide loading state
     * @param {string} formId - Form ID
     */
    hideLoading(formId) {
        const form = document.getElementById(formId);
        if (form) {
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = submitBtn.textContent.replace('Loading...', 'Submit').trim();
            }
        }
    }

    /**
     * Show alert message
     * @param {string} type - Alert type ('success', 'error', 'warning', 'info')
     * @param {string} message - Alert message
     * @param {string} formId - Form ID
     */
    showAlert(type, message, formId) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} show`;
        alertDiv.textContent = message;

        const form = document.getElementById(formId);
        if (form) {
            form.insertBefore(alertDiv, form.firstChild);

            // Auto-hide alert after 5 seconds
            setTimeout(() => {
                alertDiv.remove();
            }, 5000);
        }
    }

    /**
     * Toggle password visibility
     * @param {Event} e - Click event
     */
    togglePasswordVisibility(e) {
        e.preventDefault();
        const input = e.target.previousElementSibling;
        if (input && (input.type === 'password' || input.type === 'text')) {
            input.type = input.type === 'password' ? 'text' : 'password';
            e.target.textContent = input.type === 'password' ? '👁️' : '👁️‍🗨️';
        }
    }

    /**
     * Handle form navigation
     * @param {Event} e - Click event
     */
    handleFormNavigation(e) {
        const href = e.target.getAttribute('href');
        if (href) {
            window.location.href = href;
        }
    }
}

// Initialize auth manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const authManager = new AuthManager();
    
    // Load user profile if on dashboard
    if (window.location.pathname.includes('dashboard')) {
        if (sessionManager.isAuthenticated()) {
            authManager.loadUserProfile();
        } else {
            window.location.href = 'login.html';
        }
    }
});