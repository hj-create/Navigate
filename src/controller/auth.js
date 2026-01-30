// Authentication module for Navigate
// Manages user registration, login, and session management using localStorage

/**
 * Get all users from localStorage
 * @returns {Array} Array of user objects
 */
function getAllUsers() {
    const users = localStorage.getItem('navigate_users');
    return users ? JSON.parse(users) : [];
}

/**
 * Save users array to localStorage
 * @param {Array} users - Array of user objects
 */
function saveUsers(users) {
    localStorage.setItem('navigate_users', JSON.stringify(users));
}

/**
 * Get current logged-in user
 * @returns {Object|null} Current user object or null
 */
function getCurrentUser() {
    const currentUser = localStorage.getItem('navigate_current_user');
    return currentUser ? JSON.parse(currentUser) : null;
}

/**
 * Set current user in localStorage
 * @param {Object} user - User object to set as current
 */
function setCurrentUser(user) {
    // Remove password before storing in current user
    const userWithoutPassword = { ...user };
    delete userWithoutPassword.password;
    localStorage.setItem('navigate_current_user', JSON.stringify(userWithoutPassword));
}

/**
 * Sign up a new user
 * @param {string} username - User's username
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Object} Result object with success status and error if any
 */
function signup(username, email, password) {
    const users = getAllUsers();
    
    // Check if username already exists
    if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
        return { success: false, error: 'USER_EXISTS' };
    }
    
    // Check if email already exists
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
        return { success: false, error: 'EMAIL_EXISTS' };
    }
    
    // Create new user object
    const newUser = {
        id: Date.now().toString(),
        username: username,
        email: email,
        password: password, // In production, this should be hashed
        createdAt: new Date().toISOString(),
        progress: {
            completedLessons: [],
            quizScores: [],
            totalStudyTime: 0,
            sessionsAttended: []
        }
    };
    
    // Add user to users array
    users.push(newUser);
    saveUsers(users);
    
    // Set as current user
    setCurrentUser(newUser);
    
    return { success: true, user: newUser };
}

/**
 * Sign in an existing user
 * @param {string} usernameOrEmail - User's username or email
 * @param {string} password - User's password
 * @param {boolean} rememberMe - Whether to remember the login
 * @returns {Object} Result object with success status
 */
function signin(usernameOrEmail, password, rememberMe = false) {
    const users = getAllUsers();
    
    // Find user by username or email
    const user = users.find(u => 
        u.username.toLowerCase() === usernameOrEmail.toLowerCase() || 
        u.email.toLowerCase() === usernameOrEmail.toLowerCase()
    );
    
    // Check if user exists and password matches
    if (!user || user.password !== password) {
        return { success: false, error: 'INVALID_CREDENTIALS' };
    }
    
    // Update last login
    user.lastLogin = new Date().toISOString();
    
    // Update users array
    const userIndex = users.findIndex(u => u.id === user.id);
    users[userIndex] = user;
    saveUsers(users);
    
    // Set as current user
    setCurrentUser(user);
    
    // Set remember me flag
    if (rememberMe) {
        localStorage.setItem('navigate_remember_me', 'true');
    } else {
        localStorage.removeItem('navigate_remember_me');
    }
    
    return { success: true, user: user };
}

/**
 * Log out current user
 */
function logout() {
    localStorage.removeItem('navigate_current_user');
    localStorage.removeItem('navigate_remember_me');
}

/**
 * Check if user is logged in
 * @returns {boolean} True if user is logged in
 */
function isLoggedIn() {
    return getCurrentUser() !== null;
}

/**
 * Update user progress
 * @param {string} type - Type of progress (lesson, quiz, session, studytime)
 * @param {Object} data - Progress data
 */
function updateUserProgress(type, data) {
    const currentUser = getCurrentUser();
    if (!currentUser) return false;
    
    const users = getAllUsers();
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    
    if (userIndex === -1) return false;
    
    const user = users[userIndex];
    
    switch(type) {
        case 'lesson':
            if (!user.progress.completedLessons.includes(data.lessonId)) {
                user.progress.completedLessons.push(data.lessonId);
            }
            break;
        case 'quiz':
            user.progress.quizScores.push({
                quizId: data.quizId,
                score: data.score,
                completedAt: new Date().toISOString()
            });
            break;
        case 'session':
            user.progress.sessionsAttended.push({
                sessionId: data.sessionId,
                subject: data.subject,
                date: data.date,
                attendedAt: new Date().toISOString()
            });
            break;
        case 'studytime':
            user.progress.totalStudyTime += data.minutes;
            break;
    }
    
    users[userIndex] = user;
    saveUsers(users);
    setCurrentUser(user);
    
    return true;
}

/**
 * Get user progress
 * @returns {Object|null} User progress object or null
 */
function getUserProgress() {
    const currentUser = getCurrentUser();
    return currentUser ? currentUser.progress : null;
}

/**
 * Create guest user session
 * @param {string} name - Guest's name
 * @param {string} email - Guest's email
 * @returns {Object} Guest user object
 */
function createGuestUser(name, email) {
    const guestUser = {
        id: 'guest_' + Date.now().toString(),
        username: name || 'Guest',
        email: email,
        isGuest: true,
        createdAt: new Date().toISOString(),
        sessions: []
    };
    
    localStorage.setItem('navigate_guest_user', JSON.stringify(guestUser));
    return guestUser;
}

/**
 * Get current guest user
 * @returns {Object|null} Guest user object or null
 */
function getGuestUser() {
    const guestUser = localStorage.getItem('navigate_guest_user');
    return guestUser ? JSON.parse(guestUser) : null;
}

/**
 * Check if current user is a guest
 * @returns {boolean} True if user is a guest
 */
function isGuestUser() {
    const user = getCurrentUser();
    const guest = getGuestUser();
    return guest !== null || (user && user.isGuest);
}

/**
 * Get current user or guest
 * @returns {Object|null} Current user, guest, or null
 */
function getCurrentUserOrGuest() {
    return getCurrentUser() || getGuestUser();
}

/**
 * Book session for guest
 * @param {Object} sessionData - Session booking data
 * @returns {boolean} True if booking successful
 */
function bookGuestSession(sessionData) {
    const guest = getGuestUser();
    if (!guest) return false;
    
    // Guests can only book sessions for today
    const today = new Date().toDateString();
    const sessionDate = new Date(sessionData.date).toDateString();
    
    if (today !== sessionDate) {
        return false;
    }
    
    guest.sessions.push({
        ...sessionData,
        bookedAt: new Date().toISOString()
    });
    
    localStorage.setItem('navigate_guest_user', JSON.stringify(guest));
    return true;
}

/**
 * Clear guest session
 */
function clearGuestSession() {
    localStorage.removeItem('navigate_guest_user');
}

/**
 * Logout user or guest
 */
function logoutAll() {
    logout();
    clearGuestSession();
}

/**
 * Update user profile
 * @param {Object} updates - Object containing fields to update
 * @returns {boolean} True if update successful
 */
function updateUserProfile(updates) {
    const currentUser = getCurrentUser();
    if (!currentUser) return false;
    
    const users = getAllUsers();
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    
    if (userIndex === -1) return false;
    
    // Merge updates (except password which requires separate method)
    const allowedUpdates = ['username', 'email'];
    allowedUpdates.forEach(field => {
        if (updates[field] !== undefined) {
            users[userIndex][field] = updates[field];
        }
    });
    
    saveUsers(users);
    setCurrentUser(users[userIndex]);
    
    return true;
}

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        signup,
        signin,
        logout,
        isLoggedIn,
        getCurrentUser,
        updateUserProgress,
        getUserProgress,
        updateUserProfile
    };
}
