// Authentication State Management
// Manages UI state based on user authentication status

/**
 * Update authentication UI based on login status
 * Shows user info if logged in, shows auth buttons if logged out
 */
function updateAuthUI() {
    const currentUser = getCurrentUser();
    const authButtons = document.querySelector('.auth-buttons');
    
    if (!authButtons) return;
    
    if (currentUser) {
        // User is logged in - show user info and logout button
        authButtons.innerHTML = `
            <div class="user-info" style="display: flex; align-items: center; gap: 1rem;">
                <span style="color: white; font-size: 0.95rem; font-family: 'Roboto', sans-serif; font-weight: 400; display: flex; align-items: center; gap: 0.5rem;">
                    <span class="material-icons" style="vertical-align: middle; font-size: 1.2rem;">person</span>
                    ${currentUser.username}
                </span>
                <button onclick="handleLogout()" class="auth-btn" style="background-color: #dc3545; color: white; border: none !important; cursor: pointer; padding: 0.5rem 1rem; border-radius: 5px; display: flex; align-items: center; gap: 0.5rem; font-family: 'Roboto', sans-serif; font-weight: 500;">
                    <span class="material-icons">logout</span>
                    <span>Logout</span>
                </button>
            </div>
        `;
    } else {
        // User is logged out - show sign in/sign up buttons
        authButtons.innerHTML = `
            <a href="signin.html" class="auth-btn">
                <span class="material-icons">person_outline</span>
                <span>Sign In</span>
            </a>
            <a href="signup.html" class="auth-btn">
                <span class="material-icons">person_add</span>
                <span>Sign Up</span>
            </a>
        `;
    }
}

/**
 * Handle logout action
 */
function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        logout();
        window.location.href = '../../index.html';
    }
}

/**
 * Require authentication to access a page
 * Redirects to signin page if not logged in
 * @param {string} redirectPage - Page to redirect to if not authenticated (default: signin.html)
 */
function requireAuth(redirectPage = 'signin.html') {
    const currentUser = getCurrentUser();
    
    if (!currentUser) {
        // Store the current page to redirect back after login
        sessionStorage.setItem('navigate_redirect_after_login', window.location.href);
        window.location.href = redirectPage;
    }
}

/**
 * Check if user should be redirected after successful login
 */
function checkRedirectAfterLogin() {
    const redirectUrl = sessionStorage.getItem('navigate_redirect_after_login');
    
    if (redirectUrl) {
        sessionStorage.removeItem('navigate_redirect_after_login');
        window.location.href = redirectUrl;
        return true;
    }
    
    return false;
}

// Update auth UI when page loads
document.addEventListener('DOMContentLoaded', function() {
    updateAuthUI();
});
