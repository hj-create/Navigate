// User Activity Tracking Module
// Tracks lessons completed, videos watched, quizzes taken, and other user statistics

/**
 * Initialize user statistics if they don't exist
 * @param {string} userId - The user's ID
 */
function initializeUserStats(userId) {
    const users = getAllUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex !== -1 && !users[userIndex].stats) {
        users[userIndex].stats = {
            lessonsCompleted: 0,
            lessonsStarted: 0,
            videosWatched: 0,
            quizzesTaken: 0,
            quizAvgScore: 0,
            totalStudyTime: 0,
            sessionsAttended: 0,
            downloadsAccessed: 0,
            lastActive: new Date().toISOString(),
            completedLessonsList: [],
            watchedVideosList: [],
            quizResults: [],
            activityLog: []
        };
        saveUsers(users);
    }
}

/**
 * Get user statistics
 * @param {string} userId - The user's ID
 * @returns {Object} User statistics object
 */
function getUserStats(userId) {
    const users = getAllUsers();
    const user = users.find(u => u.id === userId);
    
    if (!user) return null;
    
    // Initialize stats if they don't exist
    if (!user.stats) {
        initializeUserStats(userId);
        return getUserStats(userId); // Recursive call to get initialized stats
    }
    
    return user.stats;
}

/**
 * Update user statistics
 * @param {string} userId - The user's ID
 * @param {Object} updates - Object containing stat updates
 */
function updateUserStats(userId, updates) {
    const users = getAllUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex !== -1) {
        // Initialize stats if they don't exist
        if (!users[userIndex].stats) {
            initializeUserStats(userId);
        }
        
        // Update stats
        users[userIndex].stats = {
            ...users[userIndex].stats,
            ...updates,
            lastActive: new Date().toISOString()
        };
        
        saveUsers(users);
        
        // Update current user if it's the logged-in user
        const currentUser = getCurrentUser();
        if (currentUser && currentUser.id === userId) {
            setCurrentUser(users[userIndex]);
        }
    }
}

/**
 * Track lesson completion
 * @param {string} lessonId - The lesson identifier
 * @param {string} lessonTitle - The lesson title
 * @param {string} subject - The subject (us-history, world-history, european-history)
 */
function trackLessonCompletion(lessonId, lessonTitle, subject) {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    const stats = getUserStats(currentUser.id);
    
    // Check if lesson already completed
    if (!stats.completedLessonsList.includes(lessonId)) {
        const updatedStats = {
            lessonsCompleted: stats.lessonsCompleted + 1,
            completedLessonsList: [...stats.completedLessonsList, lessonId],
            activityLog: [
                ...stats.activityLog,
                {
                    type: 'lesson',
                    action: 'completed',
                    title: lessonTitle,
                    subject: subject,
                    timestamp: new Date().toISOString()
                }
            ]
        };
        
        updateUserStats(currentUser.id, updatedStats);
    }
}

/**
 * Track lesson started (not completed)
 * @param {string} lessonId - The lesson identifier
 * @param {string} lessonTitle - The lesson title
 * @param {string} subject - The subject
 */
function trackLessonStarted(lessonId, lessonTitle, subject) {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    const stats = getUserStats(currentUser.id);
    
    // Only increment if not already completed or started
    if (!stats.completedLessonsList.includes(lessonId) && 
        !stats.activityLog.find(log => log.type === 'lesson' && log.action === 'started' && log.title === lessonTitle)) {
        
        const updatedStats = {
            lessonsStarted: stats.lessonsStarted + 1,
            activityLog: [
                ...stats.activityLog,
                {
                    type: 'lesson',
                    action: 'started',
                    title: lessonTitle,
                    subject: subject,
                    timestamp: new Date().toISOString()
                }
            ]
        };
        
        updateUserStats(currentUser.id, updatedStats);
    }
}

/**
 * Track video watched
 * @param {string} videoId - The video identifier
 * @param {string} videoTitle - The video title
 * @param {string} subject - The subject
 */
function trackVideoWatched(videoId, videoTitle, subject) {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    const stats = getUserStats(currentUser.id);
    
    // Check if video already watched
    if (!stats.watchedVideosList.includes(videoId)) {
        const updatedStats = {
            videosWatched: stats.videosWatched + 1,
            watchedVideosList: [...stats.watchedVideosList, videoId],
            activityLog: [
                ...stats.activityLog,
                {
                    type: 'video',
                    action: 'watched',
                    title: videoTitle,
                    subject: subject,
                    timestamp: new Date().toISOString()
                }
            ]
        };
        
        updateUserStats(currentUser.id, updatedStats);
    }
}

/**
 * Track quiz completion
 * @param {string} quizId - The quiz identifier
 * @param {string} quizTitle - The quiz title
 * @param {number} score - The score achieved (0-100)
 * @param {number} totalQuestions - Total number of questions
 */
function trackQuizCompletion(quizId, quizTitle, score, totalQuestions) {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    const stats = getUserStats(currentUser.id);
    
    const quizResult = {
        quizId: quizId,
        title: quizTitle,
        score: score,
        totalQuestions: totalQuestions,
        timestamp: new Date().toISOString()
    };
    
    const newQuizResults = [...stats.quizResults, quizResult];
    
    // Calculate new average score
    const totalScore = newQuizResults.reduce((sum, result) => sum + result.score, 0);
    const avgScore = Math.round(totalScore / newQuizResults.length);
    
    const updatedStats = {
        quizzesTaken: stats.quizzesTaken + 1,
        quizAvgScore: avgScore,
        quizResults: newQuizResults,
        activityLog: [
            ...stats.activityLog,
            {
                type: 'quiz',
                action: 'completed',
                title: quizTitle,
                score: score,
                timestamp: new Date().toISOString()
            }
        ]
    };
    
    updateUserStats(currentUser.id, updatedStats);
}

/**
 * Track download accessed
 * @param {string} downloadTitle - The download title
 */
function trackDownloadAccessed(downloadTitle) {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    const stats = getUserStats(currentUser.id);
    
    const updatedStats = {
        downloadsAccessed: stats.downloadsAccessed + 1,
        activityLog: [
            ...stats.activityLog,
            {
                type: 'download',
                action: 'accessed',
                title: downloadTitle,
                timestamp: new Date().toISOString()
            }
        ]
    };
    
    updateUserStats(currentUser.id, updatedStats);
}

/**
 * Track session attendance
 * @param {string} sessionTitle - The session title
 * @param {number} duration - Duration in minutes
 */
function trackSessionAttendance(sessionTitle, duration) {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    const stats = getUserStats(currentUser.id);
    
    const updatedStats = {
        sessionsAttended: stats.sessionsAttended + 1,
        totalStudyTime: stats.totalStudyTime + duration,
        activityLog: [
            ...stats.activityLog,
            {
                type: 'session',
                action: 'attended',
                title: sessionTitle,
                duration: duration,
                timestamp: new Date().toISOString()
            }
        ]
    };
    
    updateUserStats(currentUser.id, updatedStats);
}

/**
 * Add study time
 * @param {number} minutes - Minutes of study time to add
 */
function addStudyTime(minutes) {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    const stats = getUserStats(currentUser.id);
    
    const updatedStats = {
        totalStudyTime: stats.totalStudyTime + minutes
    };
    
    updateUserStats(currentUser.id, updatedStats);
}

/**
 * Get recent activity
 * @param {string} userId - The user's ID
 * @param {number} limit - Number of recent activities to return
 * @returns {Array} Array of recent activities
 */
function getRecentActivity(userId, limit = 10) {
    const stats = getUserStats(userId);
    if (!stats || !stats.activityLog) return [];
    
    return stats.activityLog
        .slice(-limit)
        .reverse();
}

/**
 * Calculate overall progress percentage
 * @param {string} userId - The user's ID
 * @returns {number} Progress percentage (0-100)
 */
function calculateOverallProgress(userId) {
    const stats = getUserStats(userId);
    if (!stats) return 0;
    
    // Define targets for 100% progress
    const targets = {
        lessons: 9, // 3 lessons per subject * 3 subjects
        videos: 9,  // 3 videos per subject * 3 subjects
        quizzes: 3  // 3 quizzes total
    };
    
    const lessonProgress = Math.min((stats.lessonsCompleted / targets.lessons) * 100, 100);
    const videoProgress = Math.min((stats.videosWatched / targets.videos) * 100, 100);
    const quizProgress = Math.min((stats.quizzesTaken / targets.quizzes) * 100, 100);
    
    // Weighted average: 40% lessons, 30% videos, 30% quizzes
    const overallProgress = (lessonProgress * 0.4) + (videoProgress * 0.3) + (quizProgress * 0.3);
    
    return Math.round(overallProgress);
}
