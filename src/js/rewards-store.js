(function () {
  // Levels and catalog (adjust as needed)
  const LEVELS = [
    { name: 'Stone Tablet Starter', min: 0 },
    { name: 'Ancient Archivist', min: 200 },
    { name: 'Medieval Mastermind', min: 500 },
    { name: 'Age of Exploration Expert', min: 900 },
    { name: 'Revolutionary Scholar', min: 1400 },
    { name: 'Historian Supreme 👑', min: 2000 },
  ];
  const CATALOG = [
    { id: 'hist-timeline-100', title: 'Interactive History Timeline', cost: 100, minLevel: 'Stone Tablet Starter', url: 'https://www.worldhistory.org/timeline/' },
    { id: 'primary-sources-150', title: 'Primary Source Document Collection', cost: 150, minLevel: 'Stone Tablet Starter' },
    { id: 'documentary-250', title: 'Premium History Documentary Access', cost: 250, minLevel: 'Ancient Archivist', url: 'https://www.youtube.com/watch?v=Yocja_N5s1I' },
    { id: 'virtual-museum-400', title: 'Virtual Museum Tour Pass', cost: 400, minLevel: 'Ancient Archivist', url: 'https://artsandculture.google.com/' },
    { id: 'study-guide-500', title: 'Comprehensive Exam Study Guide', cost: 500, minLevel: 'Medieval Mastermind' },
    { id: 'expert-session-700', title: '1-on-1 History Expert Session', cost: 700, minLevel: 'Medieval Mastermind' },
    { id: 'artifact-analysis-800', title: 'Historical Artifact Analysis Kit', cost: 800, minLevel: 'Age of Exploration Expert' },
    { id: 'research-access-1000', title: 'Academic Research Database Access', cost: 1000, minLevel: 'Revolutionary Scholar' }
  ];

  function getState() {
    if (window.Rewards?.getState) return window.Rewards.getState();
    try { return JSON.parse(localStorage.getItem('navigate_rewards_v1')) || {}; } catch { return {}; }
  }
  function getActivity() {
    const s = getState() || {};
    const hist = Array.isArray(s.activityHistory) ? s.activityHistory
               : Array.isArray(s.activities) ? s.activities
               : [];
    return hist.map(h => ({
      type: h.type,
      date: h.date || h.on || (typeof h.timestamp === 'string' ? h.timestamp.split('T')[0] : h.timestamp),
      meta: h.meta || { topic: h.topic, duration: h.duration }
    })).filter(h => !!h.type);
  }
  function pointsFromEngineOrEstimate() {
    const s = getState() || {};
    const direct = s.points ?? s.totalPoints ?? s.balance;
    if (typeof direct === 'number') return direct;
    const hist = getActivity();
    let pts = 0;
    hist.forEach(h => {
      if (h.type === 'lesson') pts += 20;
      else if (h.type === 'video') pts += 15;
      else if (h.type === 'quiz') pts += 30;
      else if (h.type === 'login' || h.type === 'daily') pts += 10;
    });
    // naive streak bonus
    const days = [...new Set(hist.map(h => h.date))].sort();
    let streak = 0, maxStreak = 0;
    for (let i = 0; i < days.length; i++) {
      const d = new Date(days[i] + 'T00:00:00');
      const prev = i ? new Date(days[i - 1] + 'T00:00:00') : null;
      if (prev && (d - prev) === 86400000) streak++; else streak = 1;
      maxStreak = Math.max(maxStreak, streak);
    }
    pts += Math.max(0, maxStreak - 1) * 5;
    return pts;
  }
  function getStreak() {
    const s = getState() || {};
    if (typeof s.streak === 'number') return s.streak;
    const days = [...new Set(getActivity().map(h => h.date))].sort();
    if (!days.length) return 0;
    let streak = 1;
    for (let i = days.length - 1; i > 0; i--) {
      const cur = new Date(days[i] + 'T00:00:00');
      const prev = new Date(days[i - 1] + 'T00:00:00');
      if ((cur - prev) === 86400000) streak++; else break;
    }
    return streak;
  }
  function currentLevel(points) {
    let lvl = LEVELS[0];
    for (const l of LEVELS) { if (points >= l.min) lvl = l; }
    return lvl.name;
  }
  function nextLevelLabel(points) {
    const idx = LEVELS.findIndex(l => points < l.min);
    if (idx === -1) return 'Max level reached';
    const next = LEVELS[idx];
    return `${Math.max(0, next.min - points)} pts to ${next.name}`;
  }

  function canRedeem(item, points, levelName) {
    const levelIndex = LEVELS.findIndex(l => l.name === levelName);
    const reqIndex   = LEVELS.findIndex(l => l.name === item.minLevel);
    return points >= item.cost && levelIndex >= reqIndex;
  }

  function renderStats() {
    const state = getState();
    const totalPoints = pointsFromEngineOrEstimate();
    const spentPoints = state.spentPoints || 0;
    const availablePoints = Math.max(0, totalPoints - spentPoints);
    const levelName = currentLevel(totalPoints); // Level based on total earned, not available
    const streak = getStreak();

    const $pts   = document.getElementById('rewards-points');
    const $lvl   = document.getElementById('rewards-level');
    const $streak= document.getElementById('rewards-streak');
    const $next  = document.getElementById('rewards-next-level');

    if ($pts)   $pts.textContent = String(availablePoints);
    if ($lvl)   $lvl.textContent = levelName;
    if ($streak)$streak.textContent = `${streak} day${streak === 1 ? '' : 's'}`;
    if ($next)  $next.textContent = nextLevelLabel(totalPoints);
  }

  function renderStore() {
    const ul = document.getElementById('reward-items');
    if (!ul) return;
    const state = getState();
    const totalPoints = pointsFromEngineOrEstimate();
    const spentPoints = state.spentPoints || 0;
    const availablePoints = Math.max(0, totalPoints - spentPoints);
    const levelName = currentLevel(totalPoints);
    const inventory = state.inventory || [];

    ul.innerHTML = '';
    CATALOG.forEach(item => {
      const li = document.createElement('li');
      li.className = 'reward-item';
      const owned = inventory.includes(item.id);
      
      li.innerHTML = `
        <div class="reward-info">
          <strong>${item.title}</strong>
          <div class="muted">Cost: ${item.cost} pts · Requires: ${item.minLevel}+</div>
          ${owned ? '<div class="owned-badge"><span class="material-icons">check_circle</span> Owned</div>' : ''}
        </div>
        <button class="btn redeem-btn" data-id="${item.id}">${owned ? 'Owned' : 'Redeem'}</button>
      `;
      const btn = li.querySelector('.redeem-btn');
      const enabled = canRedeem(item, availablePoints, levelName) && !owned;
      if (!enabled) {
        btn.setAttribute('disabled', 'true');
        btn.classList.add('btn-disabled');
      }
      if (!owned) {
        btn.addEventListener('click', () => confirmRedeem(item));
      }
      ul.appendChild(li);
    });
  }

  function toast(msg) {
    // Simple toast notification
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = msg;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  function confirmRedeem(item) {
    const state = getState();
    const totalPoints = pointsFromEngineOrEstimate();
    const spentPoints = state.spentPoints || 0;
    const availablePoints = Math.max(0, totalPoints - spentPoints);
    const levelName = currentLevel(totalPoints);
    
    // Check if user can redeem
    if (!canRedeem(item, availablePoints, levelName)) {
      toast('You do not have enough points or the required level for this reward.');
      return;
    }

    const ok = window.confirm(`Redeem "${item.title}" for ${item.cost} points?\n\nYour current balance: ${availablePoints} points`);
    if (!ok) return;

    // Actually deduct points and add to inventory
    try {
      const state = getState();
      
      // Deduct points
      state.spentPoints = (state.spentPoints || 0) + item.cost;
      
      // Add to inventory if not already there
      if (!state.inventory) state.inventory = [];
      if (!state.inventory.includes(item.id)) {
        state.inventory.push(item.id);
      }
      
      // Save updated state using Rewards API if available
      if (window.Rewards && typeof window.Rewards.getState === 'function') {
        // The rewards system will handle saving with the correct user-specific key
        // We need to trigger a save through the rewards system
        // For now, we'll dispatch an event and let the rewards system handle it
        document.dispatchEvent(new CustomEvent('rewards:item-redeemed', { 
          detail: { item, cost: item.cost, spentPoints: state.spentPoints, inventory: state.inventory } 
        }));
      }
      
      // Dispatch event to update other parts of the UI
      document.dispatchEvent(new CustomEvent('rewards:updated', { detail: { item, cost: item.cost } }));
      
      // Show celebration
      showCelebration(item);
      
      // Update UI after celebration starts
      setTimeout(() => {
        renderStats();
        renderStore();
      }, 100);
      
    } catch (e) {
      console.error('Redemption error:', e);
      toast('Redemption failed. Please try again.');
    }
  }

  function showCelebration(item) {
    // Create celebration overlay
    const overlay = document.createElement('div');
    overlay.className = 'celebration-overlay';
    overlay.innerHTML = `
      <div class="celebration-content">
        <div class="celebration-icon">
          <span class="material-icons">card_giftcard</span>
        </div>
        <h2 class="celebration-title">Congratulations! 🎉</h2>
        <p class="celebration-message">You've successfully redeemed:</p>
        <p class="celebration-item">${item.title}</p>
        <p class="celebration-cost">-${item.cost} points</p>
        <button class="celebration-close" onclick="this.closest('.celebration-overlay').remove()">Awesome!</button>
      </div>
      <div class="confetti-container"></div>
    `;
    
    document.body.appendChild(overlay);
    
    // Create confetti
    createConfetti(overlay.querySelector('.confetti-container'));
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (overlay.parentNode) {
        overlay.classList.add('fade-out');
        setTimeout(() => overlay.remove(), 500);
      }
    }, 5000);
  }

  function createConfetti(container) {
    const colors = ['#ff9800', '#f57c00', '#ff5722', '#ffc107', '#ffb74d'];
    const confettiCount = 50;
    
    for (let i = 0; i < confettiCount; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.left = Math.random() * 100 + '%';
      confetti.style.animationDelay = Math.random() * 3 + 's';
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
      container.appendChild(confetti);
    }
  }

  function render() { renderStats(); renderStore(); }

  document.addEventListener('DOMContentLoaded', render);
  ['user:login', 'lesson:completed', 'video:watched', 'quiz:completed', 'rewards:updated']
    .forEach(ev => document.addEventListener(ev, render));
  window.addEventListener('pageshow', render);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });

  // If engine exposes its own bus
  if (window.Rewards?.on) {
    ['user:login', 'lesson:completed', 'video:watched', 'quiz:completed']
      .forEach(ev => { try { window.Rewards.on(ev, render); } catch {} });
  }
})();