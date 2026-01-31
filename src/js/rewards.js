// Smart Rewards Engine: points, streaks, achievements, tiers, store, rendering.
(() => {
  const LS_KEY = 'navigate_rewards_v1';

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
    { id: 'tier1', points: 100, label: 'History Starter' },
    { id: 'tier2', points: 300, label: 'Foundations Scholar' },
    { id: 'tier3', points: 700, label: 'Advanced Learner' },
    { id: 'tier4', points: 1200, label: 'Certified Historian' },
    { id: 'tier5', points: 2000, label: 'Academic Excellence' }
  ];

  const STORE = [
    { id: 'badge_custom_100', type: 'badge', cost: 100, name: 'Custom Avatar Badge' },
    { id: 'bonus_video_250', type: 'video', cost: 250, name: 'Bonus Video (Unit 1)', url: 'https://www.youtube.com/watch?v=Yocja_N5s1I' },
    { id: 'profile_theme_500', type: 'theme', cost: 500, name: 'Special Profile Theme' },
    { id: 'minigame_1000', type: 'game', cost: 1000, name: 'Mini‑Game Unlock', url: 'https://www.mission-us.org/games/spirit-of-a-nation/' },
    { id: 'exclusive_pack_2000', type: 'pack', cost: 2000, name: 'Exclusive Content Pack' }
  ];

  const ACHIEVEMENTS = [
    // 100-300 points tier
    { id: 'starter_100', name: 'History Starter Certificate', desc: 'Earning the first 100 points', rule: s => s.totalPoints >= 100 },
    { id: 'lesson_explorer', name: 'Lesson Explorer', desc: 'Complete 5 lessons or videos', rule: s => (s.counts.lessons + s.counts.videos) >= 5 },
    { id: 'quiz_conqueror', name: 'Quiz Conqueror', desc: 'Pass 3 quizzes with 70%+', rule: s => s.counts.quizzesPassed70 >= 3 },
    { id: 'rising_historian_250', name: 'Rising Historian', desc: '250 points earned', rule: s => s.totalPoints >= 250 },
    
    // 300-700 points tier
    { id: 'us_history_foundations', name: 'US History Foundations', desc: 'Earn 500 points in U.S. History content', rule: s => (s.categoryPoints?.usHistory || 0) >= 500 },
    { id: 'world_history_foundations', name: 'World History Foundations Certificate', desc: 'Complete early civilizations & ancient history content', rule: s => (s.categoryCompletion?.worldHistory?.ancientCivilizations || 0) >= 3 && (s.categoryCompletion?.worldHistory?.ancientHistory || 0) >= 3 },
    { id: 'european_history_foundations', name: 'European History Foundations Certificate', desc: 'Master Medieval & early European topics', rule: s => (s.categoryCompletion?.europeanHistory?.medieval || 0) >= 3 && (s.categoryCompletion?.europeanHistory?.earlyEuropean || 0) >= 3 },
    
    // 700-1200 points tier
    { id: 'critical_thinker', name: 'Critical Thinker Certificate', desc: 'Score 80%+ on 5 quizzes', rule: s => s.counts.quizzes80 >= 5 },
    { id: 'consistency_champion', name: 'Consistency Champion', desc: 'Maintain a 7‑day learning streak', rule: s => s.streak.current >= 7 },
    
    // 1200-2000 points tier
    { id: 'certified_historian', name: 'Certified Historian', desc: '1,500 total points earned', rule: s => s.totalPoints >= 1500 },
    { id: 'history_honors', name: 'History Honors', desc: 'High quiz scores + lesson completion across topics', rule: s => s.counts.quizzes80 >= 8 && s.counts.lessons >= 15 },
    { id: 'academic_excellence', name: 'Academic Excellence in History', desc: 'Consistent high performance across units', rule: s => s.totalPoints >= 1800 && s.counts.quizzes80 >= 10 && s.streak.current >= 14 }
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
    try { return JSON.parse(localStorage.getItem(LS_KEY)) || initial(); }
    catch { return initial(); }
  }
  function save(s) { localStorage.setItem(LS_KEY, JSON.stringify(s)); }

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

    // Achievements
    for (const a of ACHIEVEMENTS) {
      if (!core.achievements.includes(a.id) && a.rule(core)) core.achievements.push(a.id);
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
    }
  };
  window.Rewards = Rewards;

  // Event bridge
  document.addEventListener('lesson:completed', e => Rewards.record('lesson_completed', e.detail || {}));
  document.addEventListener('quiz:completed', e => Rewards.record('quiz_completed', e.detail || {}));
  document.addEventListener('video:watched', e => Rewards.record('video_watched', e.detail || {}));
  document.addEventListener('user:login', e => Rewards.record('daily_login', e.detail || {}));
  document.addEventListener('challenge:completed', e => Rewards.record('challenge_completed', e.detail || {}));

  document.addEventListener('DOMContentLoaded', () => render(load()));
})();