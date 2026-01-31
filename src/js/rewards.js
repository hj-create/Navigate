// Smart Rewards Engine: points, streaks, achievements, tiers, store, rendering.
(() => {
  const LS_KEY_PREFIX = 'navigate_rewards_v1_user_';

  // Get user-specific localStorage key
  function getUserStorageKey() {
    const currentUser = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    if (!currentUser || !currentUser.id) {
      // Fallback for guests or if auth not loaded yet
      return 'navigate_rewards_v1_guest';
    }
    return LS_KEY_PREFIX + currentUser.id;
  }

  const POINTS = {
    lesson: 50,
    lesson_streak_bonus: 10,
    quiz: 30,
    quiz_bonus_highscore: 10,   // score >= 80
    video: 20,
    video_noskip_bonus: 5,
    daily_login: 5,
    weekly_streak_bonus: 50,
    challenge_default: 100
  };

  const TIERS = [
    { id: 'tier1', points: 0, label: 'Stone Tablet Starter' },
    { id: 'tier2', points: 200, label: 'Ancient Archivist' },
    { id: 'tier3', points: 500, label: 'Medieval Mastermind' },
    { id: 'tier4', points: 900, label: 'Age of Exploration Expert' },
    { id: 'tier5', points: 1400, label: 'Revolutionary Scholar' },
    { id: 'tier6', points: 2000, label: 'Historian Supreme 👑' }
  ];

  const STORE = [
    { id: 'hist_timeline_100', type: 'resource', cost: 100, name: 'Interactive History Timeline', url: 'https://www.worldhistory.org/timeline/' },
    { id: 'primary_sources_150', type: 'resource', cost: 150, name: 'Primary Source Document Collection' },
    { id: 'documentary_250', type: 'video', cost: 250, name: 'Premium History Documentary Access', url: 'https://www.youtube.com/watch?v=Yocja_N5s1I' },
    { id: 'virtual_museum_400', type: 'experience', cost: 400, name: 'Virtual Museum Tour Pass', url: 'https://artsandculture.google.com/' },
    { id: 'study_guide_500', type: 'resource', cost: 500, name: 'Comprehensive Exam Study Guide' },
    { id: 'expert_session_700', type: 'session', cost: 700, name: '1-on-1 History Expert Session' },
    { id: 'artifact_analysis_800', type: 'resource', cost: 800, name: 'Historical Artifact Analysis Kit' },
    { id: 'research_access_1000', type: 'resource', cost: 1000, name: 'Academic Research Database Access' }
  ];

  const ACHIEVEMENTS = [
    // Level-based certificates - one for each achievement level
    { id: 'stone_tablet_starter', name: 'Stone Tablet Starter', desc: 'Reaching 0 points - Beginning your history journey', rule: s => s.totalPoints >= 0 },
    { id: 'ancient_archivist', name: 'Ancient Archivist', desc: 'Reaching 200 points - Mastering ancient history', rule: s => s.totalPoints >= 200 },
    { id: 'medieval_mastermind', name: 'Medieval Mastermind', desc: 'Reaching 500 points - Conquering the Middle Ages', rule: s => s.totalPoints >= 500 },
    { id: 'age_exploration_expert', name: 'Age of Exploration Expert', desc: 'Reaching 900 points - Discovering new worlds', rule: s => s.totalPoints >= 900 },
    { id: 'revolutionary_scholar', name: 'Revolutionary Scholar', desc: 'Reaching 1,400 points - Leading historical change', rule: s => s.totalPoints >= 1400 },
    { id: 'historian_supreme', name: 'Historian Supreme', desc: 'Reaching 2,000 points - Achieving the highest honor', rule: s => s.totalPoints >= 2000 }
  ];

  const initial = () => ({
    totalPoints: 0,
    spentPoints: 0,
    counts: { lessons: 0, quizzes: 0, quizzes80: 0, quizzesPassed70: 0, videos: 0 },
    categoryPoints: { usHistory: 0, worldHistory: 0, europeanHistory: 0 },
    categoryCompletion: {
      usHistory: { total: 0 },
      worldHistory: { ancientCivilizations: 0, ancientHistory: 0, total: 0 },
      europeanHistory: { medieval: 0, earlyEuropean: 0, total: 0 }
    },
    streak: { current: 0, lastActiveDate: null, lastWeeklyBonusDate: null },
    lastLessonDate: null,
    activityHistory: [],    // [{type,date,points,meta}]
    achievements: [],
    inventory: []
  });

  function load() {
    try { 
      const key = getUserStorageKey();
      return JSON.parse(localStorage.getItem(key)) || initial(); 
    }
    catch { return initial(); }
  }
  function save(s) { 
    const key = getUserStorageKey();
    localStorage.setItem(key, JSON.stringify(s)); 
  }

  function todayStr(d = new Date()) {
    const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  }
  function daysBetween(a, b) {
    const da = new Date(a + 'T00:00:00'), db = new Date(b + 'T00:00:00');
    return Math.round((db - da) / 86400000);
  }

  function award(core, type, basePts, meta = {}) {
    const date = todayStr();
    // Streak update
    if (!core.streak.lastActiveDate) {
      core.streak.current = 1;
    } else {
      const diff = daysBetween(core.streak.lastActiveDate, date);
      if (diff === 1) core.streak.current += 1;
      else if (diff > 1) core.streak.current = 1;
    }
    core.streak.lastActiveDate = date;

    let points = basePts;

    // Initialize category tracking if missing (for legacy users)
    if (!core.categoryPoints) core.categoryPoints = { usHistory: 0, worldHistory: 0, europeanHistory: 0 };
    if (!core.categoryCompletion) {
      core.categoryCompletion = {
        usHistory: { total: 0 },
        worldHistory: { ancientCivilizations: 0, ancientHistory: 0, total: 0 },
        europeanHistory: { medieval: 0, earlyEuropean: 0, total: 0 }
      };
    }

    // Track category-specific activity
    const category = meta.category; // 'usHistory', 'worldHistory', 'europeanHistory'
    const subcategory = meta.subcategory; // e.g., 'ancientCivilizations', 'medieval', etc.

    if (type === 'lesson') {
      if (core.lastLessonDate === date) points += POINTS.lesson_streak_bonus;
      core.lastLessonDate = date;
      core.counts.lessons += 1;
      
      // Track category completion
      if (category && core.categoryPoints[category] !== undefined) {
        core.categoryPoints[category] += points;
        core.categoryCompletion[category].total += 1;
        if (subcategory && core.categoryCompletion[category][subcategory] !== undefined) {
          core.categoryCompletion[category][subcategory] += 1;
        }
      }
    }

    if (type === 'quiz') {
      core.counts.quizzes += 1;
      const score = Number(meta.score || 0);
      if (score >= 70) core.counts.quizzesPassed70 += 1;
      if (score >= 80) { core.counts.quizzes80 += 1; points += POINTS.quiz_bonus_highscore; }
      
      // Track category points for quizzes
      if (category && core.categoryPoints[category] !== undefined) {
        core.categoryPoints[category] += points;
      }
    }

    if (type === 'video') {
      core.counts.videos += 1;
      if (meta.noSkip) points += POINTS.video_noskip_bonus;
      
      // Track category completion for videos
      if (category && core.categoryPoints[category] !== undefined) {
        core.categoryPoints[category] += points;
        core.categoryCompletion[category].total += 1;
        if (subcategory && core.categoryCompletion[category][subcategory] !== undefined) {
          core.categoryCompletion[category][subcategory] += 1;
        }
      }
    }

    if (type === 'challenge') {
      points = meta.points && meta.points > 0 ? meta.points : POINTS.challenge_default;
    }

    // Weekly streak bonus (once each 7-day window)
    if (core.streak.current >= 7) {
      const last = core.streak.lastWeeklyBonusDate;
      const grant = !last || daysBetween(last, date) >= 7;
      if (grant) { points += POINTS.weekly_streak_bonus; core.streak.lastWeeklyBonusDate = date; }
    }

    // Daily login: avoid duplicate per day
    if (type === 'login') {
      const already = core.activityHistory.some(h => h.type === 'login' && h.date === date);
      if (already) points = 0;
    }

    core.totalPoints += points;
    core.activityHistory.push({ type, date, points, meta });

    // Check and award certificates based on total points earned
    // Certificates are awarded when user reaches each level's point threshold
    for (const a of ACHIEVEMENTS) {
      if (!core.achievements.includes(a.id) && a.rule(core)) {
        core.achievements.push(a.id);
        console.log(`🎉 Certificate earned: ${a.name}`);
      }
    }

    save(core);
    render(core);
    return points;
  }

  function available(core) { return Math.max(0, core.totalPoints - core.spentPoints); }
  function currentTier(core) {
    let cur = { id: 'none', points: 0, label: 'No Tier' };
    for (const t of TIERS) { if (core.totalPoints >= t.points) cur = t; else break; }
    return cur;
  }
  function nextTier(core) { return TIERS.find(t => core.totalPoints < t.points) || null; }

  function redeem(core, itemId) {
    const item = STORE.find(x => x.id === itemId);
    if (!item) return { ok: false, reason: 'not_found' };
    if (available(core) < item.cost) return { ok: false, reason: 'insufficient_points' };
    if (core.inventory.includes(item.id)) return { ok: false, reason: 'already_owned' };
    core.spentPoints += item.cost;
    core.inventory.push(item.id);
    save(core);
    render(core);
    return { ok: true, item };
  }

  function render(core) {
    const byId = (id) => document.getElementById(id);
    const ptsEl = byId('rewards-points');
    const availEl = byId('rewards-points-available');
    const tierEl = byId('rewards-tier');
    const fillEl = byId('rewards-progress-fill');
    const textEl = byId('rewards-progress-text');
    const streakEl = byId('rewards-streak-days');
    const badgesEl = byId('rewards-badges-list');
    const storeEl = byId('rewards-store-list');

    if (ptsEl) ptsEl.textContent = String(core.totalPoints);
    if (availEl) availEl.textContent = String(available(core));

    const cur = currentTier(core);
    const nxt = nextTier(core);
    if (tierEl) tierEl.textContent = cur.label + (nxt ? ` (Next: ${nxt.label} @ ${nxt.points})` : ' (Max)');

    if (fillEl && textEl) {
      const base = cur.points;
      const target = nxt ? nxt.points : cur.points;
      const gained = core.totalPoints - base;
      const span = Math.max(1, target - base);
      const pct = Math.min(100, Math.round((gained / span) * 100));
      fillEl.style.width = pct + '%';
      textEl.textContent = nxt ? `${gained}/${span} to ${nxt.label}` : 'Max tier reached';
    }

    if (streakEl) streakEl.textContent = `${core.streak.current} day${core.streak.current === 1 ? '' : 's'}`;

    if (badgesEl) {
      badgesEl.innerHTML = '';
      if (!core.achievements.length) {
        badgesEl.innerHTML = '<li class="badge-empty">No achievements yet.</li>';
      } else {
        for (const id of core.achievements) {
          const meta = ACHIEVEMENTS.find(a => a.id === id);
          const li = document.createElement('li');
          li.className = 'badge-item';
          li.innerHTML = `<span class="material-icons">military_tech</span><div><strong>${meta?.name || id}</strong><small>${meta?.desc || ''}</small></div>`;
          badgesEl.appendChild(li);
        }
      }
    }

    if (storeEl) {
      storeEl.innerHTML = '';
      for (const item of STORE) {
        const owned = core.inventory.includes(item.id);
        const canBuy = available(core) >= item.cost && !owned;
        const li = document.createElement('li');
        li.className = 'store-item';
        li.innerHTML = `
          <div class="store-text">
            <strong>${item.name}</strong>
            <small>${item.type}${item.url ? ` • <a href="${item.url}" target="_blank" rel="noopener">Preview</a>` : ''}</small>
          </div>
          <div class="store-cta">
            <span class="cost">${item.cost} pts</span>
            <button class="primary-btn redeem-btn" ${!canBuy ? 'disabled' : ''} data-id="${item.id}">${owned ? 'Owned' : 'Redeem'}</button>
          </div>`;
        storeEl.appendChild(li);
      }
      storeEl.querySelectorAll('.redeem-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          const res = redeem(load(), id);
          if (!res.ok && res.reason === 'insufficient_points') alert('Not enough points.');
          else if (!res.ok && res.reason === 'already_owned') alert('Already owned.');
          else if (res.ok) alert(`Redeemed: ${res.item.name}`);
        });
      });
    }
  }

  // Public API
  const Rewards = {
    getState: () => load(),
    record(type, meta = {}) {
      const s = load();
      switch (type) {
        case 'lesson_completed': return award(s, 'lesson', POINTS.lesson, meta);
        case 'quiz_completed': return award(s, 'quiz', POINTS.quiz, meta);
        case 'video_watched': return award(s, 'video', POINTS.video, meta);
        case 'daily_login': return award(s, 'login', POINTS.daily_login, meta);
        case 'challenge_completed': return award(s, 'challenge', POINTS.challenge_default, meta);
        default: return 0;
      }
    },
    // Reload rewards data for current user (called when user changes)
    reload() {
      const state = load();
      // Dispatch event to update UI
      const event = new CustomEvent('rewards:updated', { detail: state });
      document.dispatchEvent(event);
      return state;
    },
    // Clear rewards data (for logout)
    clear() {
      // This will be handled automatically by getUserStorageKey()
      // Each user has their own storage key
      const event = new CustomEvent('rewards:updated', { detail: initial() });
      document.dispatchEvent(event);
    }
  };
  window.Rewards = Rewards;

  // Event bridge
  document.addEventListener('lesson:completed', e => Rewards.record('lesson_completed', e.detail || {}));
  document.addEventListener('quiz:completed', e => Rewards.record('quiz_completed', e.detail || {}));
  document.addEventListener('video:watched', e => Rewards.record('video_watched', e.detail || {}));
  document.addEventListener('user:login', e => Rewards.record('daily_login', e.detail || {}));
  document.addEventListener('challenge:completed', e => Rewards.record('challenge_completed', e.detail || {}));
  
  // Handle item redemption from rewards store
  document.addEventListener('rewards:item-redeemed', e => {
    const { spentPoints, inventory } = e.detail || {};
    const state = load();
    if (spentPoints !== undefined) state.spentPoints = spentPoints;
    if (inventory !== undefined) state.inventory = inventory;
    save(state);
  });

  document.addEventListener('DOMContentLoaded', () => render(load()));
})();