// Dashboard module for displaying user statistics and progress

/**
 * Display user progress on dashboard
 */
function displayUserProgress() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        window.location.href = 'signin.html';
        return;
    }
    
    // Initialize stats if they don't exist
    initializeUserStats(currentUser.id);
    
    const stats = getUserStats(currentUser.id);
    const overallProgress = calculateOverallProgress(currentUser.id);
    
    // Update summary cards
    updateSummaryCards(stats, overallProgress);
    
    // Update activity table
    updateActivityTable(stats);
    
    // Update welcome message
    updateWelcomeMessage(currentUser);
}

/**
 * Update summary cards with user statistics
 */
function updateSummaryCards(stats, overallProgress) {
    // Update Live Sessions card
    const sessionsCard = document.querySelector('.summary-card:nth-child(1) .summary-info p');
    if (sessionsCard) {
        sessionsCard.textContent = `${stats.sessionsAttended} Attended`;
    }
    
    // Update Videos card
    const videosCard = document.querySelector('.summary-card:nth-child(2) .summary-info p');
    if (videosCard) {
        videosCard.textContent = `${stats.videosWatched} Watched`;
    }
    
    // Update Lessons card
    const lessonsCard = document.querySelector('.summary-card:nth-child(3) .summary-info p');
    if (lessonsCard) {
        lessonsCard.textContent = `${stats.lessonsCompleted} Completed`;
    }
    
    // Update Overall Progress card
    const progressCard = document.querySelector('.summary-card:nth-child(4) .summary-info p');
    if (progressCard) {
        progressCard.textContent = `${overallProgress}% Complete`;
    }
}

/**
 * Update activity table with recent user activity
 */
function updateActivityTable(stats) {
    const tbody = document.querySelector('.progress-table tbody');
    if (!tbody) return;
    
    // Clear existing rows
    tbody.innerHTML = '';
    
    // Get recent activity (last 10 items)
    const recentActivity = stats.activityLog.slice(-10).reverse();
    
    if (recentActivity.length === 0) {
        // Show empty state
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 2rem; color: #666;">
                    <span class="material-icons" style="font-size: 48px; display: block; margin-bottom: 1rem;">inbox</span>
                    No activity yet. Start exploring lessons and videos!
                </td>
            </tr>
        `;
        return;
    }
    
    // Populate table with activity
    recentActivity.forEach(activity => {
        const row = createActivityRow(activity);
        tbody.appendChild(row);
    });
}

/**
 * Create a table row for an activity
 */
function createActivityRow(activity) {
    const row = document.createElement('tr');
    
    // Format date
    const date = new Date(activity.timestamp);
    const formattedDate = date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
    });
    
    // Determine badge type and label
    let badgeClass = '';
    let badgeLabel = '';
    let duration = '';
    let status = 'completed';
    let progress = 100;
    
    switch(activity.type) {
        case 'lesson':
            badgeClass = 'reading';
            badgeLabel = 'Lesson';
            duration = '30 mins';
            if (activity.action === 'started') {
                status = 'in-progress';
                progress = 50;
            }
            break;
        case 'video':
            badgeClass = 'recorded';
            badgeLabel = 'Video';
            duration = '15 mins';
            break;
        case 'quiz':
            badgeClass = 'live';
            badgeLabel = 'Quiz';
            duration = '20 mins';
            break;
        case 'session':
            badgeClass = 'live';
            badgeLabel = 'Live Session';
            duration = `${activity.duration || 60} mins`;
            break;
        case 'download':
            badgeClass = 'reading';
            badgeLabel = 'Download';
            duration = '—';
            break;
        default:
            badgeClass = 'recorded';
            badgeLabel = 'Activity';
            duration = '—';
    }
    
    // Build row HTML
    row.innerHTML = `
        <td>${formattedDate}</td>
        <td>${activity.title}</td>
        <td><span class="badge ${badgeClass}">${badgeLabel}</span></td>
        <td>${duration}</td>
        <td><span class="status ${status}">${status === 'in-progress' ? 'In Progress' : 'Completed'}</span></td>
        <td>
            <div class="progress-bar">
                <div class="progress" style="width: ${progress}%"></div>
            </div>
        </td>
    `;
    
    return row;
}

/**
 * Update welcome message with username
 */
function updateWelcomeMessage(user) {
    const dashboardHeader = document.querySelector('.dashboard-header h1');
    if (dashboardHeader) {
        dashboardHeader.textContent = `Welcome back, ${user.username}!`;
    }
}

/**
 * Update dashboard date range
 */
function updateDateRange() {
    const fromDate = document.getElementById('fromDate');
    const toDate = document.getElementById('toDate');
    
    if (fromDate && toDate) {
        // Set default dates (last 30 days)
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        
        toDate.valueAsDate = today;
        fromDate.valueAsDate = thirtyDaysAgo;
    }
}

/**
 * Filter activity by date range
 */
function filterActivityByDateRange() {
    const fromDate = document.getElementById('fromDate')?.value;
    const toDate = document.getElementById('toDate')?.value;
    
    if (!fromDate || !toDate) return;
    
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    
    const stats = getUserStats(currentUser.id);
    
    // Filter activity log by date range
    const filteredActivity = stats.activityLog.filter(activity => {
        const activityDate = new Date(activity.timestamp);
        const from = new Date(fromDate);
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999); // Include entire end date
        
        return activityDate >= from && activityDate <= to;
    });
    
    // Update table with filtered data
    const tbody = document.querySelector('.progress-table tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (filteredActivity.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 2rem; color: #666;">
                    No activity found in the selected date range.
                </td>
            </tr>
        `;
        return;
    }
    
    filteredActivity.slice(-10).reverse().forEach(activity => {
        const row = createActivityRow(activity);
        tbody.appendChild(row);
    });
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Set up date range
    updateDateRange();
    
    // Set up update button
    const updateBtn = document.querySelector('.update-btn');
    if (updateBtn) {
        updateBtn.addEventListener('click', filterActivityByDateRange);
    }
});
