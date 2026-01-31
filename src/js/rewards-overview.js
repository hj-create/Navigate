// Rewards Overview
// Displays rewards summary on dashboard

/**
 * Get level name based on total points
 */
function getLevelName(points) {
    if (points >= 2000) return 'Historian Supreme 👑';
    if (points >= 1400) return 'Revolutionary Scholar';
    if (points >= 900) return 'Age of Exploration Expert';
    if (points >= 500) return 'Medieval Mastermind';
    if (points >= 200) return 'Ancient Archivist';
    return 'Stone Tablet Starter';
}

/**
 * Render achievement level modules
 */
function renderAchievementLevels() {
    const levelsGrid = document.getElementById('levels-grid');
    if (!levelsGrid) return;
    
    const rewardsState = window.Rewards?.getState ? window.Rewards.getState() : null;
    const earnedAchievements = rewardsState?.achievements || [];
    
    // Define all levels with their metadata
    const levels = [
        { id: 'stone_tablet_starter', icon: '📜', name: 'Stone Tablet Starter', points: 0 },
        { id: 'ancient_archivist', icon: '🏛️', name: 'Ancient Archivist', points: 200 },
        { id: 'medieval_mastermind', icon: '⚔️', name: 'Medieval Mastermind', points: 500 },
        { id: 'age_exploration_expert', icon: '🌍', name: 'Age of Exploration Expert', points: 900 },
        { id: 'revolutionary_scholar', icon: '🗽', name: 'Revolutionary Scholar', points: 1400 },
        { id: 'historian_supreme', icon: '👑', name: 'Historian Supreme', points: 2000 }
    ];
    
    levelsGrid.innerHTML = '';
    
    levels.forEach(level => {
        const isEarned = earnedAchievements.includes(level.id);
        
        const levelModule = document.createElement('div');
        levelModule.className = `level-module ${isEarned ? 'earned' : ''}`;
        
        levelModule.innerHTML = `
            <div class="level-icon">${level.icon}</div>
            <div class="level-name">${level.name}</div>
            <div class="level-points">${level.points.toLocaleString()} pts</div>
            ${isEarned ? '<div class="level-earned-badge">✓ Earned</div>' : ''}
        `;
        
        levelsGrid.appendChild(levelModule);
    });
}

/**
 * Get certificate achievements from the rewards system
 */
function getCertificateAchievements() {
    const rewardsState = window.Rewards?.getState ? window.Rewards.getState() : null;
    if (!rewardsState || !rewardsState.achievements) return [];
    
    // Define which achievements are certificates (all 6 levels)
    const certificateIds = [
        'stone_tablet_starter',
        'ancient_archivist',
        'medieval_mastermind',
        'age_exploration_expert',
        'revolutionary_scholar',
        'historian_supreme'
    ];
    
    // Get achievement metadata with special rewards
    const ACHIEVEMENTS = [
        { 
            id: 'stone_tablet_starter', 
            name: 'Stone Tablet Starter', 
            desc: 'Reaching 0 points - Beginning your history journey',
            reward: {
                type: 'video',
                title: 'Crash Course World History Playlist',
                description: 'Explore the full collection of World History videos',
                icon: '🌍',
                link: 'https://www.youtube.com/playlist?list=PL8dPuuaLjXtNjasccl-WajpONGX3zoY4M'
            }
        },
        { 
            id: 'ancient_archivist', 
            name: 'Ancient Archivist', 
            desc: 'Reaching 200 points - Mastering ancient history',
            reward: {
                type: 'video',
                title: 'Crash Course U.S. History Playlist',
                description: 'Dive into the complete U.S. History video series',
                icon: '🗽',
                link: 'https://www.youtube.com/playlist?list=PL8dPuuaLjXtMwmepBjTSG593eG7ObzO7s'
            }
        },
        { 
            id: 'medieval_mastermind', 
            name: 'Medieval Mastermind', 
            desc: 'Reaching 500 points - Conquering the Middle Ages',
            reward: {
                type: 'video',
                title: 'Crash Course European History Playlist',
                description: 'Access the full European History video collection',
                icon: '⚔️',
                link: 'https://www.youtube.com/playlist?list=PL8dPuuaLjXtMsYzI0C8G6-HXz1U0s3i0z'
            }
        },
        { 
            id: 'age_exploration_expert', 
            name: 'Age of Exploration Expert', 
            desc: 'Reaching 900 points - Discovering new worlds',
            reward: {
                type: 'game',
                title: 'Mission US: Interactive History Games',
                description: 'Play immersive U.S. History missions and adventures',
                icon: '🎮',
                link: 'https://www.mission-us.org'
            }
        },
        { 
            id: 'revolutionary_scholar', 
            name: 'Revolutionary Scholar', 
            desc: 'Reaching 1,400 points - Leading historical change',
            reward: {
                type: 'game',
                title: 'BBC Bitesize History Games',
                description: 'Explore interactive World & European History games',
                icon: '🎯',
                link: 'https://www.bbc.co.uk/bitesize/subjects/z7svr82'
            }
        },
        { 
            id: 'historian_supreme', 
            name: 'Historian Supreme', 
            desc: 'Reaching 2,000 points - Achieving the highest honor',
            reward: {
                type: 'game',
                title: 'National Geographic: Ancient Civilizations',
                description: 'Discover interactive ancient civilization resources',
                icon: '🏛️',
                link: 'https://education.nationalgeographic.org'
            }
        }
    ];
    
    // Filter to get earned certificates
    return rewardsState.achievements
        .filter(id => certificateIds.includes(id))
        .map(id => ACHIEVEMENTS.find(a => a.id === id))
        .filter(a => a !== undefined);
}

/**
 * Render certificates grid
 */
function renderCertificates() {
    const certificatesGrid = document.getElementById('certificates-grid');
    if (!certificatesGrid) return;
    
    const certificates = getCertificateAchievements();
    
    if (certificates.length === 0) {
        certificatesGrid.innerHTML = '<p class="muted" style="text-align: center; padding: 2rem;">No certificates earned yet. Keep learning to unlock your first certificate!</p>';
        return;
    }
    
    certificatesGrid.innerHTML = '';
    
    certificates.forEach(cert => {
        const certCard = document.createElement('div');
        certCard.className = 'certificate-card';
        
        // Get user's name from auth system
        let userName = 'Student';
        if (typeof getCurrentUser === 'function') {
            const user = getCurrentUser();
            userName = user?.name || user?.username || user?.email?.split('@')[0] || 'Student';
        }
        
        const earnedDate = new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        
        certCard.innerHTML = `
            <div class="certificate-flip-container">
                <div class="certificate-flipper">
                    <!-- Front of Certificate -->
                    <div class="certificate-front">
                        <div class="certificate-border">
                            <div class="certificate-header">
                                <span class="material-icons certificate-icon">workspace_premium</span>
                                <h4>Certificate of Achievement</h4>
                            </div>
                            <div class="certificate-body">
                                <p class="certificate-presented">This is presented to</p>
                                <p class="certificate-recipient">${userName}</p>
                                <p class="certificate-for">for earning the</p>
                                <p class="certificate-title">${cert.name}</p>
                                <p class="certificate-desc">${cert.desc}</p>
                            </div>
                            <div class="certificate-footer">
                                <p class="certificate-date">Awarded: ${earnedDate}</p>
                                <div class="certificate-seal">
                                    <span class="material-icons">verified</span>
                                </div>
                            </div>
                            <div class="flip-hint">
                                <span class="material-icons">touch_app</span>
                                <span>Click to reveal your reward</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Back of Certificate -->
                    <div class="certificate-back">
                        <div class="certificate-border">
                            <div class="reward-header">
                                <div class="reward-icon-large">${cert.reward.icon}</div>
                                <h4>Special Reward Unlocked!</h4>
                            </div>
                            <div class="reward-body">
                                <h3 class="reward-title">${cert.reward.title}</h3>
                                <p class="reward-description">${cert.reward.description}</p>
                                <a href="${cert.reward.link}" target="_blank" class="reward-button">
                                    <span class="material-icons">launch</span>
                                    Access Reward
                                </a>
                            </div>
                            <div class="flip-hint">
                                <span class="material-icons">touch_app</span>
                                <span>Click to return to certificate</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add click event to flip the card
        certCard.addEventListener('click', function() {
            this.classList.toggle('flipped');
        });
        
        certificatesGrid.appendChild(certCard);
    });
}

/**
 * Initialize rewards overview on dashboard
 */
function initRewardsOverview() {
    // Get rewards state
    const rewardsState = window.Rewards?.getState ? window.Rewards.getState() : null;
    
    if (!rewardsState) {
        console.log('Rewards state not available');
        return;
    }
    
    // Calculate available points (total - spent)
    const totalPoints = rewardsState.totalPoints || 0;
    const spentPoints = rewardsState.spentPoints || 0;
    const availablePoints = Math.max(0, totalPoints - spentPoints);
    
    // Update points display (show available points)
    const pointsElement = document.getElementById('rewards-points');
    if (pointsElement) {
        pointsElement.textContent = availablePoints;
    }
    
    // Update level display (based on total points earned, not available)
    const levelElement = document.getElementById('rewards-level');
    if (levelElement) {
        const levelName = getLevelName(totalPoints);
        levelElement.textContent = levelName;
    }
    
    // Render achievement level modules
    renderAchievementLevels();
    
    // Render certificates
    renderCertificates();
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRewardsOverview);
} else {
    initRewardsOverview();
}

// Listen for rewards updates
document.addEventListener('lesson:completed', initRewardsOverview);
document.addEventListener('video:watched', initRewardsOverview);
document.addEventListener('quiz:completed', initRewardsOverview);
document.addEventListener('user:login', initRewardsOverview);
document.addEventListener('rewards:updated', initRewardsOverview);
