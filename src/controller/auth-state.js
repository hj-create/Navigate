// Auth State Manager
// Include this script on pages that need to show different UI based on login state

document.addEventListener('DOMContentLoaded', function() {
    checkAuthState();
});

function checkAuthState() {
    const currentUser = getCurrentUser();
    const authButtons = document.querySelector('.auth-buttons');
    
    if (!authButtons) return;
    
    if (currentUser) {
        // User is logged in - show username and logout button
        authButtons.innerHTML = `
            <div class="user-info" style="display: flex; align-items: center; gap: 1rem;">
                <span style="color: var(--text-color); font-weight: 500;">
                    <span class="material-icons" style="vertical-align: middle; font-size: 20px;">account_circle</span>
                    ${currentUser.username}
                </span>
                <button class="auth-btn" onclick="handleLogout()" style="background: #f44336;">
                    <span class="material-icons">logout</span>
                    <span>Logout</span>
                </button>
            </div>
        `;
    } else {
        // User is not logged in - show sign in/up buttons
        // Check if we're on a page that needs relative paths
        const isSubPage = window.location.pathname.includes('/pages/');
        const signinPath = isSubPage ? 'signin.html' : 'view/pages/signin.html';
        const signupPath = isSubPage ? 'signup.html' : 'view/pages/signup.html';
        
        authButtons.innerHTML = `
            <a href="${signinPath}" class="auth-btn">
                <span class="material-icons">person_outline</span>
                <span>Sign In</span>
            </a>
            <a href="${signupPath}" class="auth-btn">
                <span class="material-icons">person_add</span>
                <span>Sign Up</span>
            </a>
        `;
    }
}

function handleLogout() {
    if (confirm('Are you sure you want to log out?')) {
        logout();
        // Redirect to home page
        window.location.href = window.location.pathname.includes('/pages/') 
            ? '../../index.html' 
            : 'index.html';
    }
}

// Function to require authentication for certain pages
function requireAuth(redirectPath = 'signin.html') {
    if (!isLoggedIn()) {
        alert('Please sign in to access this page.');
        window.location.href = redirectPath;
    }
}

// Display user progress on dashboard
function displayUserProgress() {
    const progress = getUserProgress();
    if (!progress) return;
    
    // Update dashboard elements if they exist
    const completedLessonsEl = document.getElementById('completedLessons');
    if (completedLessonsEl) {
        completedLessonsEl.textContent = progress.completedLessons.length;
    }
    
    const quizScoresEl = document.getElementById('quizScores');
    if (quizScoresEl && progress.quizScores.length > 0) {
        const avgScore = progress.quizScores.reduce((sum, quiz) => sum + quiz.score, 0) / progress.quizScores.length;
        quizScoresEl.textContent = Math.round(avgScore) + '%';
    }
    
    const studyTimeEl = document.getElementById('studyTime');
    if (studyTimeEl) {
        const hours = Math.floor(progress.totalStudyTime / 60);
        const minutes = progress.totalStudyTime % 60;
        studyTimeEl.textContent = `${hours}h ${minutes}m`;
    }
    
    const sessionsEl = document.getElementById('sessionsAttended');
    if (sessionsEl) {
        sessionsEl.textContent = progress.sessionsAttended.length;
    }
}
