// Authentication State Management
// Manages UI state based on user authentication status

/**
 * Helper function to get correct path to auth pages
 * Handles both local file system and GitHub Pages deployments
 */
function getAuthPagePath(page) {
    const path = window.location.pathname;
    const href = window.location.href;
    console.log('getAuthPagePath called - current path:', path, 'href:', href, 'page:', page);
    
    // If we're in the pages directory already (src/view/pages/), use relative path
    if (path.includes('/view/pages/')) {
        console.log('In pages directory, returning relative path:', page);
        return page;
    }
    
    // If we're at index.html in src/ directory (local file:// or deployed)
    if (path.includes('/src/index.html') || (href.includes('file://') && path.includes('/src/'))) {
        console.log('At src/index.html, returning:', `view/pages/${page}`);
        return `view/pages/${page}`;
    }
    
    // For GitHub Pages, use absolute path from repository root
    if (href.includes('github.io')) {
        console.log('On GitHub Pages, returning absolute path:', `/Navigate/src/view/pages/${page}`);
        return `/Navigate/src/view/pages/${page}`;
    }
    
    // Default: use full path from repository root (with leading slash for absolute path)
    console.log('Default case - using absolute path:', `/Navigate/src/view/pages/${page}`);
    return `/Navigate/src/view/pages/${page}`;
}

/**
 * Update authentication UI based on login status
 * Shows user info if logged in, shows auth buttons if logged out
 */
function updateAuthUI() {
    const currentUser = getCurrentUser();
    const guestUser = getGuestUser();
    const authButtons = document.querySelector('.auth-buttons');
    
    if (!authButtons) return;
    
    if (currentUser) {
        // Regular user is logged in - show user info and logout button
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
    } else if (guestUser) {
        // Guest user - show guest indicator and option to sign up
        authButtons.innerHTML = `
            <div class="user-info" style="display: flex; align-items: center; gap: 1rem;">
                <span style="color: white; font-size: 0.95rem; font-family: 'Roboto', sans-serif; font-weight: 400; display: flex; align-items: center; gap: 0.5rem;">
                    <span class="material-icons" style="vertical-align: middle; font-size: 1.2rem;">person_outline</span>
                    ${guestUser.username} (Guest)
                </span>
                <a href="${getAuthPagePath('signup.html')}" class="auth-btn" style="background-color: #4caf50; color: white; border: none !important; text-decoration: none; padding: 0.5rem 1rem; border-radius: 5px; display: flex; align-items: center; gap: 0.5rem; font-family: 'Roboto', sans-serif; font-weight: 500;">
                    <span class="material-icons">how_to_reg</span>
                    <span>Sign Up</span>
                </a>
                <button onclick="handleGuestLogout()" class="auth-btn" style="background-color: #dc3545; color: white; border: none !important; cursor: pointer; padding: 0.5rem 1rem; border-radius: 5px; display: flex; align-items: center; gap: 0.5rem; font-family: 'Roboto', sans-serif; font-weight: 500;">
                    <span class="material-icons">logout</span>
                    <span>End Session</span>
                </button>
            </div>
        `;
    } else {
        // User is logged out - show sign in/sign up buttons
        authButtons.innerHTML = `
            <a href="${getAuthPagePath('signin.html')}" class="auth-btn">
                <span class="material-icons">person_outline</span>
                <span>Sign In</span>
            </a>
            <a href="${getAuthPagePath('signup.html')}" class="auth-btn">
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
        // Redirect to home page - works for both local and GitHub Pages
        const currentPath = window.location.pathname;
        if (window.location.href.includes('github.io')) {
            // GitHub Pages - use absolute path
            window.location.href = '/Navigate/src/index.html';
        } else if (currentPath.includes('/view/pages/')) {
            // Local - use relative path from pages directory
            window.location.href = '../../index.html';
        } else {
            // Fallback - try to go to index
            window.location.href = 'index.html';
        }
    }
}

/**
 * Handle guest logout action
 */
function handleGuestLogout() {
    if (confirm('Are you sure you want to end your guest session?')) {
        clearGuestSession();
        // Redirect to home page - works for both local and GitHub Pages
        const currentPath = window.location.pathname;
        if (window.location.href.includes('github.io')) {
            // GitHub Pages - use absolute path
            window.location.href = '/Navigate/src/index.html';
        } else if (currentPath.includes('/view/pages/')) {
            // Local - use relative path from pages directory
            window.location.href = '../../index.html';
        } else {
            // Fallback - try to go to index
            window.location.href = 'index.html';
        }
    }
}

/**
 * Require authentication to access a page
 * Redirects to signin page if not logged in
 * @param {string} redirectPage - Page to redirect to if not authenticated (default: signin.html)
 */
function requireAuth(redirectPage = 'signin.html') {
    const currentUser = getCurrentUser();
    const guestUser = getGuestUser();
    
    console.log('requireAuth called - currentUser:', currentUser, 'guestUser:', guestUser);
    
    // Allow guests for certain pages, but not for dashboard
    const currentPage = window.location.pathname;
    const isDashboard = currentPage.includes('dashboard.html');
    
    console.log('isDashboard:', isDashboard, 'currentPage:', currentPage);
    
    if (!currentUser && isDashboard && guestUser) {
        // Guest trying to access dashboard - show student-centric popup
        console.log('Guest trying to access dashboard - showing modal');
        // Hide the dashboard content
        const mainContent = document.querySelector('main');
        if (mainContent) {
            mainContent.style.display = 'none';
        }
        showDashboardAccessModal();
        return false;
    }
    
    if (!currentUser && isDashboard && !guestUser) {
        // No user trying to access dashboard - show modal
        console.log('No user/guest trying to access dashboard - showing modal');
        const mainContent = document.querySelector('main');
        if (mainContent) {
            mainContent.style.display = 'none';
        }
        showDashboardAccessModal();
        return false;
    }
    
    if (!currentUser && !guestUser && !isDashboard) {
        // No user or guest on other pages - store the current page to redirect back after login
        console.log('Redirecting to signin page');
        sessionStorage.setItem('navigate_redirect_after_login', window.location.href);
        window.location.href = redirectPage;
        return false;
    }
    
    console.log('Auth check passed - user has access');
    return true;
}

/**
 * Show dashboard access modal for non-registered users
 */
function showDashboardAccessModal() {
    console.log('showDashboardAccessModal called');
    
    // Remove any existing modal first
    const existingModal = document.querySelector('.navigate-modal-overlay');
    if (existingModal) {
        console.log('Removing existing modal');
        existingModal.remove();
    }
    
    console.log('Creating new modal');
    const modal = document.createElement('div');
    modal.className = 'navigate-modal-overlay';
    modal.innerHTML = `
        <div class="navigate-modal-content">
            <div class="navigate-modal-header">
                <span class="material-icons navigate-modal-icon">dashboard</span>
                <h2>Unlock Your Personal Learning Dashboard!</h2>
            </div>
            
            <div class="navigate-modal-body">
                <p class="navigate-modal-description">
                    Hey there! The dashboard is your personal learning command center—it's where the magic happens! 
                    This is where you track progress, celebrate wins, and unlock your full learning potential.
                </p>
                
                <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 1rem; border-radius: 0.5rem; margin: 1.5rem 0;">
                    <div style="display: flex; align-items: flex-start; gap: 0.75rem;">
                        <span class="material-icons" style="color: #856404; font-size: 1.5rem;">info</span>
                        <div>
                            <p style="margin: 0; color: #856404; font-weight: 500; margin-bottom: 0.5rem;">Guest Access Limited</p>
                            <p style="margin: 0; color: #856404; font-size: 0.9rem; line-height: 1.5;">
                                As a guest, you can book sessions for today, but the dashboard and progress tracking features 
                                require a free student account. Don't worry—signing up takes less than 30 seconds!
                            </p>
                        </div>
                    </div>
                </div>
                
                <div style="background: linear-gradient(135deg, #f1f8f4, #e8f5e9); border-radius: 0.75rem; padding: 1.25rem; border: 2px solid #4caf50;">
                    <h3 style="display: flex; align-items: center; gap: 0.5rem; margin: 0 0 1rem 0; color: #2e7d32;">
                        <span class="material-icons">star</span>
                        What's Waiting for You in Your Dashboard
                    </h3>
                    <ul class="navigate-feature-list benefits" style="margin: 0; padding: 0; list-style: none;">
                        <li style="display: flex; align-items: flex-start; gap: 0.75rem; margin-bottom: 0.75rem;">
                            <span class="material-icons" style="color: #4caf50; font-size: 1.125rem; flex-shrink: 0; margin-top: 0.125rem;">trending_up</span>
                            <div style="line-height: 1.5;">
                                <strong>Track Your Progress Across All Subjects</strong>
                                <p style="margin: 0.25rem 0 0 0; font-size: 0.9rem; color: #555;">See lessons completed, quizzes aced, and videos watched</p>
                            </div>
                        </li>
                        <li style="display: flex; align-items: flex-start; gap: 0.75rem; margin-bottom: 0.75rem;">
                            <span class="material-icons" style="color: #4caf50; font-size: 1.125rem; flex-shrink: 0; margin-top: 0.125rem;">emoji_events</span>
                            <div style="line-height: 1.5;">
                                <strong>Earn Points, Badges & Rewards</strong>
                                <p style="margin: 0.25rem 0 0 0; font-size: 0.9rem; color: #555;">Level up and unlock achievements as you learn</p>
                            </div>
                        </li>
                        <li style="display: flex; align-items: flex-start; gap: 0.75rem; margin-bottom: 0.75rem;">
                            <span class="material-icons" style="color: #4caf50; font-size: 1.125rem; flex-shrink: 0; margin-top: 0.125rem;">analytics</span>
                            <div style="line-height: 1.5;">
                                <strong>Personal Learning Insights</strong>
                                <p style="margin: 0.25rem 0 0 0; font-size: 0.9rem; color: #555;">Discover your strengths and what to focus on next</p>
                            </div>
                        </li>
                        <li style="display: flex; align-items: flex-start; gap: 0.75rem; margin-bottom: 0.75rem;">
                            <span class="material-icons" style="color: #4caf50; font-size: 1.125rem; flex-shrink: 0; margin-top: 0.125rem;">history</span>
                            <div style="line-height: 1.5;">
                                <strong>Complete Session History</strong>
                                <p style="margin: 0.25rem 0 0 0; font-size: 0.9rem; color: #555;">Review all your live sessions and study time</p>
                            </div>
                        </li>
                        <li style="display: flex; align-items: flex-start; gap: 0.75rem;">
                            <span class="material-icons" style="color: #4caf50; font-size: 1.125rem; flex-shrink: 0; margin-top: 0.125rem;">local_fire_department</span>
                            <div style="line-height: 1.5;">
                                <strong>Build Your Learning Streak</strong>
                                <p style="margin: 0.25rem 0 0 0; font-size: 0.9rem; color: #555;">Stay motivated with daily streaks and bonus rewards</p>
                            </div>
                        </li>
                    </ul>
                </div>
                
                <div style="text-align: center; margin-top: 1.5rem; padding: 1rem; background: #e3f2fd; border-radius: 0.5rem;">
                    <p style="margin: 0; color: #1976d2; font-size: 0.95rem;">
                        <span class="material-icons" style="vertical-align: middle; font-size: 1.125rem;">celebration</span>
                        <strong>100% Free Forever</strong> • No Credit Card • Ready in 30 Seconds
                    </p>
                </div>
            </div>
            
            <div class="navigate-modal-footer center">
                <button type="button" class="navigate-btn navigate-btn-secondary" id="dashboardModalGoBackBtn">
                    <span class="material-icons">home</span>
                    Go to Home Page
                </button>
                <button type="button" class="navigate-btn navigate-btn-primary" id="dashboardModalSignupBtn">
                    <span class="material-icons">rocket_launch</span>
                    Create Free Account
                </button>
            </div>
        </div>
    `;
    
    console.log('Appending modal to body');
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    console.log('Modal appended, adding event listeners');
    
    // Add click handler for go back button - redirect to home page
    document.getElementById('dashboardModalGoBackBtn').addEventListener('click', function() {
        console.log('Go back button clicked');
        closeNavigateModal();
        window.location.href = '../../index.html';
    });
    
    // Add click handler for signup button with proper path
    document.getElementById('dashboardModalSignupBtn').addEventListener('click', function() {
        console.log('Signup button clicked');
        closeNavigateModal();
        window.location.href = getAuthPagePath('signup.html');
    });
    
    console.log('Modal should now be visible');
}

/**
 * Close Navigate modal
 */
function closeNavigateModal() {
    const modal = document.querySelector('.navigate-modal-overlay');
    if (modal) {
        modal.remove();
        document.body.style.overflow = '';
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
