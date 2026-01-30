// Rewards Overview
// Displays rewards summary on dashboard

/**
 * Initialize rewards overview on dashboard
 */
function initRewardsOverview() {
    const rewardsData = getRewardsData();
    
    // Update points display
    const pointsElement = document.querySelector('[data-dashboard-points]');
    if (pointsElement) {
        pointsElement.textContent = rewardsData.totalPoints - rewardsData.spentPoints;
    }
    
    // Update streak display
    const streakElement = document.querySelector('[data-dashboard-streak]');
    if (streakElement) {
        streakElement.textContent = rewardsData.streakDays || 0;
    }
    
    // Update badges count
    const badgesElement = document.querySelector('[data-dashboard-badges]');
    if (badgesElement) {
        const ownedBadges = rewardsData.inventory ? rewardsData.inventory.length : 0;
        badgesElement.textContent = ownedBadges;
    }
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRewardsOverview);
} else {
    initRewardsOverview();
}
