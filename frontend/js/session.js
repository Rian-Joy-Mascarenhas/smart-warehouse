/**
 * Session Management Module
 * Handles token storage, retrieval, and validation
 */

class SessionManager {
    constructor() {
        this.tokenKey = 'smart_warehouse_token';
        this.userKey = 'smart_warehouse_user';
        this.apiUrl = 'http://localhost:5000/api';
    }

    /**
     * Save token to localStorage
     * @param {string} token - JWT token
     */
    setToken(token) {
        localStorage.setItem(this.tokenKey, token);
    }

    /**
     * Get token from localStorage
     * @returns {string|null} JWT token
     */
    getToken() {
        return localStorage.getItem(this.tokenKey);
    }

    /**
     * Remove token from localStorage
     */
    removeToken() {
        localStorage.removeItem(this.tokenKey);
    }

    /**
     * Check if user is authenticated
     * @returns {boolean} True if token exists
     */
    isAuthenticated() {
        return this.getToken() !== null;
    }

    /**
     * Save user data to localStorage
     * @param {object} user - User object
     */
    setUser(user) {
        localStorage.setItem(this.userKey, JSON.stringify(user));
    }

    /**
     * Get user data from localStorage
     * @returns {object|null} User object
     */
    getUser() {
        const user = localStorage.getItem(this.userKey);
        return user ? JSON.parse(user) : null;
    }

    /**
     * Remove user data from localStorage
     */
    removeUser() {
        localStorage.removeItem(this.userKey);
    }

    /**
     * Clear all session data
     */
    clearSession() {
        this.removeToken();
        this.removeUser();
    }

    /**
     * Get authorization header
     * @returns {object} Headers object with authorization
     */
    getAuthHeaders() {
        const token = this.getToken();
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    }

    /**
     * Verify token with server
     * @returns {Promise<boolean>} True if token is valid
     */
    async verifyToken() {
        try {
            const token = this.getToken();
            if (!token) return false;

            const response = await fetch(`${this.apiUrl}/auth/verify-token`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });

            return response.ok;
        } catch (error) {
            console.error('Token verification error:', error);
            return false;
        }
    }

    /**
     * Check authentication and redirect if needed
     * @param {string} redirectUrl - URL to redirect if not authenticated
     * @returns {boolean} True if authenticated
     */
    checkAuth(redirectUrl = '/index.html') {
        if (!this.isAuthenticated()) {
            window.location.href = redirectUrl;
            return false;
        }
        return true;
    }
}

// Create global session manager instance
const sessionManager = new SessionManager();