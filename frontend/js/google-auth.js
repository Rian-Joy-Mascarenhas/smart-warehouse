/**
 * Google OAuth Handler
 * Handles Google Sign-In integration
 */

class GoogleAuthHandler {
    constructor() {
        this.apiUrl = 'http://localhost:5000/api';
        this.clientId = '319201634147-8h6fv2l011ke40l2k173nq70b1pjrq0e.apps.googleusercontent.com';
        this.googleInitialized = false;
        this.setupGoogleSignIn();
    }

    /**
     * Setup Google Sign-In
     */
    setupGoogleSignIn() {
        // Wait for Google API to load
        if (window.google && window.google.accounts) {
            this.initializeGoogle();
        } else {
            // Retry if Google API not loaded yet
            setTimeout(() => this.setupGoogleSignIn(), 500);
        }
    }

    /**
     * Initialize Google Sign-In
     */
    initializeGoogle() {
        if (this.googleInitialized) return;

        google.accounts.id.initialize({
            client_id: this.clientId,
            callback: (response) => this.handleGoogleResponse(response),
            auto_select: false
        });

        this.googleInitialized = true;
        this.setupGoogleButton();
        this.tryShowOneTap();
    }

    /**
     * Setup Google Sign-In button
     */
    setupGoogleButton() {
        const googleBtn = document.querySelector('.social-btn[title="Google"]');
        if (!googleBtn) return;

        googleBtn.id = 'googleSignInButton';

        // Create hidden container for Google's button
        const hiddenContainer = document.createElement('div');
        hiddenContainer.id = 'hidden-google-button';
        hiddenContainer.style.display = 'none';
        document.body.appendChild(hiddenContainer);

        // Render Google's button into hidden container
        google.accounts.id.renderButton(hiddenContainer, {
            theme: 'outline',
            size: 'large',
            text: 'signin_with'
        });

        // Add click handler to custom button
        googleBtn.style.cursor = 'pointer';
        googleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            // Find and click the hidden Google button
            const hiddenBtn = hiddenContainer.querySelector('div[role="button"]');
            if (hiddenBtn) {
                hiddenBtn.click();
            }
        });
    }

    /**
     * Try to show One-Tap UI
     */
    tryShowOneTap() {
        google.accounts.id.prompt((notification) => {
            if (notification.isDisplayed()) {
                console.log('One-Tap UI displayed');
            } else if (notification.isNotDisplayed()) {
                console.log('One-Tap UI not displayed - button fallback is ready');
            } else if (notification.isSkippedMoment()) {
                console.log('One-Tap UI skipped');
            }
        });
    }

    /**
     * Handle Google Sign-In response
     * @param {Object} response - Google Sign-In response
     */
    async handleGoogleResponse(response) {
        if (!response.credential) {
            console.error('No credential received');
            this.showAlert('error', 'Google authentication failed - no credential received');
            return;
        }

        try {
            console.log('Google credential received, sending to backend...');
            this.showLoading(true);

            const res = await fetch(`${this.apiUrl}/auth/google-login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id_token: response.credential
                })
            });

            const data = await res.json();
            console.log('Backend response:', data);

            if (res.ok && data.data && data.data.access_token) {
                // Store token and user data
                sessionManager.setToken(data.data.access_token);
                sessionManager.setUser(data.data.user);

                this.showAlert('success', 'Google login successful!');

                // Redirect to dashboard after 1.5 seconds
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            } else {
                const errorMsg = data.message || 'Google login failed - please try again';
                console.error('Login failed:', errorMsg);
                this.showAlert('error', errorMsg);
                this.showLoading(false);
            }
        } catch (error) {
            console.error('Google login error:', error);
            this.showAlert('error', 'Network error during Google login - ' + error.message);
            this.showLoading(false);
        }
    }

    /**
     * Show/hide loading state
     * @param {boolean} show - Whether to show loading
     */
    showLoading(show) {
        const googleBtn = document.getElementById('googleSignInButton');
        if (!googleBtn) return;

        if (show) {
            googleBtn.disabled = true;
            googleBtn.style.opacity = '0.6';
            googleBtn.style.pointerEvents = 'none';
        } else {
            googleBtn.disabled = false;
            googleBtn.style.opacity = '1';
            googleBtn.style.pointerEvents = 'auto';
        }
    }

    /**
     * Show alert message
     * @param {string} type - Alert type ('success', 'error', 'info')
     * @param {string} message - Alert message
     */
    showAlert(type, message) {
        // Try to find form on current page
        const form = document.getElementById('loginForm') || document.getElementById('registerForm');
        if (!form) {
            console.log(`Alert [${type}]: ${message}`);
            return;
        }

        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} show`;
        alertDiv.textContent = message;
        alertDiv.style.marginBottom = '1rem';

        form.insertBefore(alertDiv, form.firstChild);

        // Auto-hide alert after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }
}

// Initialize Google Auth Handler when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const pathname = window.location.pathname.toLowerCase();
    if (pathname.includes('login') || pathname.includes('register')) {
        const googleAuthHandler = new GoogleAuthHandler();
    }
});
