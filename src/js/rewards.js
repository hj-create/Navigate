/* Hardened rewards engine: stable tiers, duplicate-init guard, cross-tab sync */(() => {  if (window.__NAVIGATE_REWARDS_INIT__) return;  window.__NAVIGATE_REWARDS_INIT__ = true;  const VERSION = '2.3.0';  const STORAGE_KEY = 'navigate_rewards_full_v1';  const UPDATE_EVENT = 'rewards:update';  const tiers = [    { id: 0, name: 'Newcomer', points: 0 },    { id: 1, name: 'Explorer', points: 100 },    { id: 2, name: 'Apprentice Historian', points: 250 },    { id: 3, name: 'Scholar', points: 500 },    { id: 4, name: 'Strategist', points: 750 },    { id: 5, name: 'Master Historian', points: 1000 },    { id: 6, name: 'Historian of Distinction', points: 1500 },    { id: 7, name: 'Grand Historian', points: 2000 },  ];  const storeItems = [    { id: 'hist_hat', type: 'customization', name: 'Historian Hat (Avatar)', cost: 150 },    { id: 'badge_mesopotamia', type: 'badge', name: 'Mesopotamia Master', cost: 200 },    { id: 'badge_roman_explorer', type: 'badge', name: 'Roman Empire Explorer', cost: 500 },    { id: 'video_ag_rev', type: 'content', name: 'Bonus Video: Agricultural Revolution', cost: 250, url: 'https://www.youtube.com/watch?v=Yocja_N5s1I' },    { id: 'game_ancient_mystery', type: 'game', name: 'Ancient History Mystery Game', cost: 300, url: 'https://www.purposegames.com/game/ms-ladues-early-civilizations-quiz?l=21519' },  ];  const initialState = {    points: 0,    lastLoginDate: null,    lastActivityDate: null,    streakDays: 0,    weeklyProgress: 0,    lastWeeklyBonusDate: null,    consecutiveLessonCount: 0,    subjectPoints: { us: 0, world: 0, european: 0 },    activities: {      lessonsCompleted: 0,      quizzesCompleted: 0,      quizzesPassed70: 0,      quizzesAbove80: 0,      videosWatched: 0,      videosWatchedNoSkip: 0,      challengesCompleted: 0,    },    recentActivity: [],    unlockedAchievements: [],    unlockedItems: []  };  const achDefs = [    { id: 'ach_history_starter', name: 'History Starter Certificate (100 pts)', rule: s => s.points >= 100 },    { id: 'ach_lesson_explorer', name: 'Lesson Explorer (5 lessons/videos)', rule: s => (s.activities.lessonsCompleted + s.activities.videosWatched) >= 5 },    { id: 'ach_quiz_conqueror', name: 'Quiz Conqueror (3× ≥70%)', rule: s => s.activities.quizzesPassed70 >= 3 },    { id: 'ach_rising_historian', name: 'Rising Historian (250 pts)', rule: s => s.points >= 250 },    { id: 'ach_us_foundations', name: 'US History Foundations (500 US pts)', rule: s => s.subjectPoints.us >= 500 },    { id: 'ach_world_foundations', name: 'World History Foundations', rule: s => s.subjectPoints.world >= 400 },    { id: 'ach_eu_foundations', name: 'European History Foundations', rule: s => s.subjectPoints.european >= 400 },    { id: 'ach_critical_thinker', name: 'Critical Thinker (5× ≥80%)', rule: s => s.activities.quizzesAbove80 >= 5 },    { id: 'ach_consistency_champion', name: 'Consistency Champion (7‑day streak)', rule: s => s.streakDays >= 7 },    { id: 'ach_certified_historian', name: 'Certified Historian (1500 pts)', rule: s => s.points >= 1500 },    { id: 'ach_history_honors', name: 'History Honors', rule: s => (s.activities.lessonsCompleted >= 10 && s.activities.quizzesAbove80 >= 5) },    { id: 'ach_academic_excellence', name: 'Academic Excellence in History', rule: s => (s.points >= 1800 && s.activities.quizzesAbove80 >= 8) },  ];  const load = () => {    try {      const raw = localStorage.getItem(STORAGE_KEY);      return raw ? { ...initialState, ...JSON.parse(raw) } : { ...initialState };    } catch { return { ...initialState }; }  };  const save = (s) => {    try {      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));      window.dispatchEvent(new CustomEvent(UPDATE_EVENT));    } catch {}  };  const todayStr = () => new Date().toISOString().slice(0, 10);  const addActivity = (s, label, pts) => {    s.recentActivity.unshift({ when: new Date().toLocaleString(), label, pts });    s.recentActivity = s.recentActivity.slice(0, 12);  };  const addPoints = (s, n, label) => { s.points += n; if (label) addActivity(s, label, n); };  const markLogin = (s) => { s.lastLoginDate = todayStr(); };  const markActivityDay = (s) => {    const t = todayStr();    if (s.lastActivityDate !== t) {      const prev = s.lastActivityDate ? new Date(s.lastActivityDate) : null;      const now = new Date(t);      const diff = prev ? Math.round((now - prev) / 86400000) : 0;      s.streakDays = prev ? (diff === 1 ? s.streakDays + 1 : 1) : 1;      s.lastActivityDate = t;      if (s.lastLoginDate === t) {        s.weeklyProgress = Math.min(7, s.weeklyProgress + 1);        if (s.weeklyProgress === 7 && s.lastWeeklyBonusDate !== t) {          s.lastWeeklyBonusDate = t;          addPoints(s, 50, 'Weekly streak bonus');        }      }    }  };  const currentTier = (points) => { let t = tiers[0]; for (const tier of tiers) if (points >= tier.points) t = tier; return t; };  const nextTier = (points) => tiers.find(t => points < t.points) || null;  const Rewards = {    __v: VERSION,    state: load(),    dailyLogin() {      const s = this.state, t = todayStr();      if (s.lastLoginDate === t) return false;      addPoints(s, 5, 'Daily login');      markLogin(s);      save(s); RewardsUI.render(); return true;    },    completeLesson(subject) {      const s = this.state;      s.activities.lessonsCompleted += 1;      s.consecutiveLessonCount += 1;      addPoints(s, 50, 'Lesson completed');      if (s.consecutiveLessonCount > 1) addPoints(s, 10, 'Consecutive lesson bonus');      if (subject && s.subjectPoints[subject] != null) s.subjectPoints[subject] += 50;      markActivityDay(s); maybeUnlock(s); save(s); RewardsUI.render();    },    completeQuiz(score, subject) {      const s = this.state;      s.activities.quizzesCompleted += 1;      addPoints(s, 30, 'Quiz completed');      if (score >= 70) s.activities.quizzesPassed70 += 1;      if (score >= 80) { s.activities.quizzesAbove80 += 1; addPoints(s, 10, 'Quiz ≥80% bonus'); }      s.consecutiveLessonCount = 0;      if (subject && s.subjectPoints[subject] != null) s.subjectPoints[subject] += (score >= 80 ? 40 : 30);      markActivityDay(s); maybeUnlock(s); save(s); RewardsUI.render();    },    watchVideo(noSkip, subject) {      const s = this.state;      s.activities.videosWatched += 1;      addPoints(s, 20, 'Video watched');      if (noSkip) { s.activities.videosWatchedNoSkip += 1; addPoints(s, 5, 'No‑skip bonus'); }      s.consecutive      if (subject && s.subjectPoints[subject] != null) s.subjectPoints[subject] += (noSkip ? 25 : 20);      markActivityDay(s); maybeUnlock(s); save(s); RewardsUI.render();    },    redeemItem(id) {      const s = this.state; const item = storeItems.find(i => i.id === id);      if (!item || s.unlockedItems.includes(id) || s.points < item.cost) return false;      s.points -= item.cost; s.unlockedItems.push(id); addActivity(s, `Redeemed: ${item.name}`, -item.cost);      maybeUnlock(s); save(s); RewardsUI.render(); return true;    },    getTierInfo() {      const s = this.state; const cur = currentTier(s.points); const nxt = nextTier(s.points);      const span = nxt ? (nxt.points - cur.points) : 1;      const progress = nxt ? Math.round((s.points - cur.points) / span * 100) : 100;      return { current: cur, next: nxt, progress: Math.min(100, Math.max(0, progress)) };    },    _debugReset() { this.state = { ...initialState }; save(this.state); RewardsUI.render(); },    // Sync points from profile progress percent (0–100).    // mode 'set' sets points exactly; mode 'max' uses the higher of current vs progress-derived.    syncPointsFromProfileProgress(progressPercent, mode = 'max') {      const s = this.state;      const pct = Math.max(0, Math.min(100, Number(progressPercent || 0)));      const progressPoints = Math.round(pct); // 1 point per 1% progress      const nextPoints = mode === 'set' ? progressPoints : Math.max(s.points, progressPoints);      if (nextPoints !== s.points) {        s.points = nextPoints;        // optional activity log entry        s.recentActivity.unshift({          when: new Date().toLocaleString(),          label: `Profile progress sync (${pct}%)`,          pts: nextPoints - (s.points || 0)        });        s.recentActivity = s.recentActivity.slice(0, 12);        // Save and update UI        try { localStorage.setItem('navigate_rewards_full_v1', JSON.stringify(s)); } catch {}        window.dispatchEvent(new CustomEvent('rewards:update'));      }    },    /**
     * Sync points and activity counts from a history object (per subject).
     * Only use after login. Mode:
     *  - 'set'  : replace totals with computed points
     *  - 'max'  : take the higher of current vs computed
     *
     * Expected history shape:
     * {
     *   us: { lessons: 3, videos: 2, noSkipVideos: 1, quizScores: [85, 72] },
     *   world: { lessons: 1, videos: 0, noSkipVideos: 0, quizScores: [] },
     *   european: { lessons: 0, videos: 1, noSkipVideos: 1, quizScores: [90] }
     * }
     */
    syncFromHistory(history, mode = 'set') {
      if (!history || typeof history !== 'object') return false;
      const s = this.state;

      const subjects = ['us', 'world', 'european'];
      const totals = { points: 0, lessons: 0, videos: 0, noSkipVideos: 0, quizzes: 0, pass70: 0, above80: 0 };
      const subjPts = { us: 0, world: 0, european: 0 };

      const addQuiz = (score, subj) => {
        totals.quizzes += 1;
        totals.points += 30;            // quiz base
        subjPts[subj] += (score >= 80 ? 40 : 30);
        if (score >= 70) totals.pass70 += 1;
        if (score >= 80) { totals.above80 += 1; totals.points += 10; } // >=80 bonus
      };

      for (const subj of subjects) {
        const h = history[subj] || {};
        const lessons = Number(h.lessons || 0);
        const videos = Number(h.videos || 0);
        const noSkip = Number(h.noSkipVideos || 0);
        const quizScores = Array.isArray(h.quizScores) ? h.quizScores : [];

        // Lessons
        totals.lessons += lessons;
        totals.points += lessons * 50;
        subjPts[subj] += lessons * 50;

        // Videos
        totals.videos += videos;
        totals.noSkipVideos += Math.min(noSkip, videos);
        totals.points += videos * 20 + Math.min(noSkip, videos) * 5;
        subjPts[subj] += videos * 20 + Math.min(noSkip, videos) * 5;

        // Quizzes
        quizScores.forEach(sc => addQuiz(Number(sc) || 0, subj));
      }

      // Decide final points
      const newPoints = mode === 'max' ? Math.max(s.points, totals.points) : totals.points;

      // Apply to state
      s.points = newPoints;
      s.activities.lessonsCompleted = totals.lessons;
      s.activities.videosWatched = totals.videos;
      s.activities.videosWatchedNoSkip = totals.noSkipVideos;
      s.activities.quizzesCompleted = totals.quizzes;
      s.activities.quizzesPassed70 = totals.pass70;
      s.activities.quizzesAbove80 = totals.above80;

      s.subjectPoints.us = subjPts.us;
      s.subjectPoints.world = subjPts.world;
      s.subjectPoints.european = subjPts.european;

      // Log entry
      s.recentActivity.unshift({
        when: new Date().toLocaleString(),
        label: `Synced from history (mode: ${mode})`,
        pts: 0
      });
      s.recentActivity = s.recentActivity.slice(0, 12);

      // Re-evaluate achievements and persist
      maybeUnlock(s);
      try { localStorage.setItem('navigate_rewards_full_v1', JSON.stringify(s)); } catch {}
      window.dispatchEvent(new CustomEvent('rewards:update'));
      return true;
    },
  };  // Listen for login and apply profile progress once  document.addEventListener('DOMContentLoaded', () => {    window.addEventListener('auth:login', (e) => {      // Only update when logged-in      if (!window.NavigateAuth || !window.NavigateAuth.isLoggedIn()) return;      const detail = e?.detail || {};      const pct = Number(detail.profileProgress ?? detail.progress ?? 0);      window.NavigateRewards.syncPointsFromProfileProgress(pct, 'max');    });  });  const maybeUnlock = (s) => {    for (const a of achDefs) if (a.rule(s) && !s.unlockedAchievements.includes(a.id)) {      s.unlockedAchievements.push(a.id);      addActivity(s, `Achievement: ${a.name}`, 0);    }  };  const RewardsUI = {
    els: null,
    init() {
      const panel = document.getElementById('rewardsPanel');
      if (!panel) return;
      this.els = {
        panel,
        points: panel.querySelector('[data-points]'),
        progressBar: panel.querySelector('.rewards-progress-bar'),
        progressText: panel.querySelector('[data-progress-text]'),
        progressPercent: panel.querySelector('.progress-percent'),
        progressRole: panel.querySelector('.progress-track'),
        streakDays: panel.querySelector('[data-streak-days]'),
        weeklyProgress: panel.querySelector('[data-weekly-progress]'),
        achList: panel.querySelector('[data-achievements]'),
        storeList: panel.querySelector('[data-store]'),
        activityLog: panel.querySelector('[data-activity-log]')
      };
      panel.querySelector('#claimDaily')?.addEventListener('click', () => Rewards.dailyLogin());
      this.render();
    },
    render() {
      if (!this.els) return;
      const s = Rewards.state;
      const info = Rewards.getTierInfo();

      this.els.points.textContent = s.points;

      this.els.progressBar.style.width = `${info.progress}%`;
      this.els.progressText.textContent = info.next
        ? `${s.points}/${info.next.points} → ${info.next.name}`
        : `${s.points} (Max tier reached)`;
      if (this.els.progressPercent) this.els.progressPercent.textContent = `${info.progress}%`;
      if (this.els.progressRole) this.els.progressRole.setAttribute('aria-valuenow', String(info.progress));

      this.els.streakDays.textContent = s.streakDays || 0;
      this.els.weeklyProgress.textContent = `${s.weeklyProgress}/7`;
      this.els.achList.innerHTML = [        ...achDefs.map(a => `          <li class="${s.unlockedAchievements.includes(a.id) ? 'unlocked' : ''}">            <span class="material-icons" aria-hidden="true">${s.unlockedAchievements.includes(a.id) ? 'emoji_events' : 'lock'}</span>            ${a.name}          </li>        `)      ].join('');      this.els.storeList.innerHTML = storeItems.map(item => {        const owned = s.unlockedItems.includes(item.id);        const afford = s.points >= item.cost;        const icon = item.type === 'badge' ? 'military_tech' : item.type === 'game' ? 'sports_esports' : item.type === 'content' ? 'ondemand_video' : 'style';
        return `
          <li class="store-item ${owned ? 'owned' : ''}">
            <div class="store-name"><span class="material-icons">${icon}</span>${item.name}</div>
            <div class="store-meta">
              <span class="cost">${item.cost} pts</span>
              ${owned ? '<span class="owned-label">Owned</span>' : `<button class="primary-btn" ${afford ? '' : 'disabled'} data-redeem="${item.id}">Redeem</button>`}
              ${item.url ? `<a href="${item.url}" target="_blank" rel="noopener">View</a>` : ''}
            </div>
          </li>
        `;
      }).join('');
      this.els.storeList.querySelectorAll('[data-redeem]').forEach(btn => {
        btn.addEventListener('click', () => Rewards.redeemItem(btn.getAttribute('data-redeem')));
      });

      this.els.activityLog.innerHTML = s.recentActivity.length
        ? s.recentActivity.map(e => `<li><span class="material-icons" aria-hidden="true">check_circle</span><strong>${e.label}</strong> • ${e.pts > 0 ? '+' : ''}${e.pts} pts • <span style="color:#666">${e.when}</span></li>`).join('')
        : `<li><span class="material-icons" aria-hidden="true">info</span>No recent activity yet.</li>`;
    }
  };

  document.addEventListener('DOMContentLoaded', () => RewardsUI.init());
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') { Rewards.state = load(); RewardsUI.render(); }
  });
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) { Rewards.state = load(); RewardsUI.render(); }
  });
  window.addEventListener(UPDATE_EVENT, () => RewardsUI.render());

  window.NavigateRewards = window.NavigateRewards || Rewards;
  if (!window.NavigateRewards.__v) window.NavigateRewards.__v = VERSION;
})();
(function () {
  const LS_KEY = 'navigate_rewards_v1';

  const POINTS = {
    lesson: 50,
    lesson_streak_bonus: 10,          // multiple lessons in a row
    quiz: 30,
    quiz_bonus_highscore: 10,         // >= 80%
    video: 20,
    video_noskip_bonus: 5,            // watched without skipping
    daily_login: 5,
    weekly_streak_bonus: 50,          // 7-day active streak
    challenge_default: 100
  };

  const TIERS = [
    { id: 'tier1', points: 100, label: 'Explorer' },
    { id: 'tier2', points: 250, label: 'Apprentice Historian' },
    { id: 'tier3', points: 500, label: 'Scholar' },
    { id: 'tier4', points: 750, label: 'Strategist' },
    { id: 'tier5', points: 1000, label: 'Master Historian' },
    { id: 'tier6', points: 1500, label: 'Historian of Distinction' },
    { id: 'tier7', points: 2000, label: 'Grand Historian' }
  ];

  // Reward store examples (videos/games/avatar/themes)
  const STORE = [
    { id: 'badge_custom_100', type: 'badge', cost: 100, name: 'Custom Avatar Badge' },
    { id: 'bonus_video_250', type: 'video', cost: 250, name: 'Bonus Video (Unit 1)', url: 'https://www.youtube.com/watch?v=Yocja_N5s1I' },
    { id: 'profile_theme_500', type: 'theme', cost: 500, name: 'Special Profile Theme' },
    { id: 'minigame_1000', type: 'game', cost: 1000, name: 'Mini‑Game Unlock', url: 'https://www.mission-us.org/games/spirit-of-a-nation/' },
    { id: 'exclusive_pack_2000', type: 'pack', cost: 2000, name: 'Exclusive Content Pack' }
  ];

  // Bonus resources for quick linking (used in UI hints)
  const BONUS_RESOURCES = {
    videos: {
      us: 'https://www.youtube.com/watch?v=o69TvQqyGdg',
      world: 'https://www.youtube.com/watch?v=Yocja_N5s1I',
      eu: 'https://www.youtube.com/watch?v=EuzAbE-kPkM'
    },
    games: {
      us: 'https://www.mission-us.org/games/spirit-of-a-nation/',
      world: 'https://www.purposegames.com/game/ms-ladues-early-civilizations-quiz?l=21519',
      eu: 'https://www.purposegames.com/game/map-of-medieval-europe'
    }
  };

  const ACHIEVEMENTS = [
    // 100–300
    { id: 'starter_100', name: 'History Starter Certificate', desc: 'Earn first 100 points', rule: s => s.totalPoints >= 100 },
    { id: 'lesson_explorer', name: 'Lesson Explorer', desc: 'Complete 5 lessons or videos', rule: s => (s.counts.lessons + s.counts.videos) >= 5 },
    { id: 'quiz_conqueror', name: 'Quiz Conqueror', desc: 'Pass 3 quizzes (70%+)', rule: s => s.counts.quizzesPassed70 >= 3 },
    { id: 'rising_historian_250', name: 'Rising Historian', desc: 'Reach 250 points', rule: s => s.totalPoints >= 250 },

    // 300–700
    { id: 'us_foundations_500', name: 'US History Foundations', desc: 'Earn 500 points in US content', rule: s => s.topicPoints.us >= 500 },
    { id: 'world_foundations', name: 'World History Foundations Certificate', desc: 'Complete early civilizations & ancient history content', rule: s => s.topicFlags.worldEarlyAncient === true },
    { id: 'eu_foundations', name: 'European History Foundations', desc: 'Master Medieval & early European topics', rule: s => s.topicFlags.euMedievalMastery === true },

    // 700–1200
    { id: 'critical_thinker', name: 'Critical Thinker', desc: 'Score 80%+ on 5 quizzes', rule: s => s.counts.quizzes80 >= 5 },
    { id: 'consistency_champion', name: 'Consistency Champion', desc: 'Maintain a 7‑day learning streak', rule: s => s.streak.current >= 7 },

    // 1200–2000
    { id: 'certified_historian', name: 'Certified Historian', desc: '1,500 total points', rule: s => s.totalPoints >= 1500 },
    { id: 'history_honors', name: 'History Honors', desc: 'High quiz scores + lessons across topics', rule: s => (s.counts.quizzes80 >= 10 && s.counts.lessons >= 10 && s.topicSpread >= 2) },
    { id: 'academic_excellence', name: 'Academic Excellence in History', desc: 'Consistent high performance across units', rule: s => (s.counts.quizzes80 >= 15 && s.counts.lessons >= 20) }
  ];

  const initialState = () => ({
    totalPoints: 0,         // lifetime earned
    spentPoints: 0,         // redeemed
    counts: { lessons: 0, quizzes: 0, quizzes80: 0, quizzesPassed70: 0, videos: 0 },
    streak: { current: 0, lastActiveDate: null, lastWeeklyBonusDate: null },
    lastLessonDate: null,
    activityHistory: [],    // [{type,date,points,meta}]
    achievements: [],       // ids
    inventory: [],          // redeemed item ids
    topicPoints: { us: 0, world: 0, eu: 0 },
    topicFlags: { worldEarlyAncient: false, euMedievalMastery: false },
    topicSpread: 0,         // #topics with >= N points
  });

  function load() {
    try { return JSON.parse(localStorage.getItem(LS_KEY)) || initialState(); }
    catch { return initialState(); }
  }
  function save(state) { localStorage.setItem(LS_KEY, JSON.stringify(state)); }
  function todayStr(d = new Date()) {
    const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  }
  function daysBetween(a, b) {
    const da = new Date(a + 'T00:00:00'), db = new Date(b + 'T00:00:00');
    return Math.round((db - da) / 86400000);
  }

  function award(state, type, basePts, meta = {}) {
    const date = todayStr();
    // Streak (daily)
    if (!state.streak.lastActiveDate) {
      state.streak.current = 1;
    } else {
      const diff = daysBetween(state.streak.lastActiveDate, date);
      if (diff === 0) {
        // same day – keep streak as is
      } else if (diff === 1) {
        state.streak.current += 1;
      } else {
        state.streak.current = 1;
      }
    }
    state.streak.lastActiveDate = date;

    let points = basePts;

    // Activity-specific bonuses
    if (type === 'lesson') {
      const last = state.lastLessonDate;
      if (last === date) {
        points += POINTS.lesson_streak_bonus;
      }
      state.lastLessonDate = date;
      state.counts.lessons += 1;
    }

    if (type === 'quiz') {
      state.counts.quizzes += 1;
      if (meta.score >= 70) state.counts.quizzesPassed70 += 1;
      if (meta.score >= 80) { state.counts.quizzes80 += 1; points += POINTS.quiz_bonus_highscore; }
    }

    if (type === 'video') {
      state.counts.videos += 1;
      if (meta.noSkip) points += POINTS.video_noskip_bonus;
    }

    if (type === 'challenge') {
      // meta.points can override
      points = meta.points && meta.points > 0 ? meta.points : POINTS.challenge_default;
    }

    // Topic accumulation (optional meta.topic: 'us'|'world'|'eu')
    if (meta.topic && state.topicPoints.hasOwnProperty(meta.topic)) {
      state.topicPoints[meta.topic] += points;
      const topicsWith200 = Object.values(state.topicPoints).filter(v => v >= 200).length;
      state.topicSpread = topicsWith200;
    }

    // Weekly streak bonus (7 consecutive days), once per 7-day window
    if (state.streak.current >= 7) {
      const lastBonus = state.streak.lastWeeklyBonusDate;
      const shouldBonus = !lastBonus || daysBetween(lastBonus, date) >= 7;
      if (shouldBonus) {
        points += POINTS.weekly_streak_bonus;
        state.streak.lastWeeklyBonusDate = date;
      }
    }

    // Daily login points safeguard: award once per day via explicit 'login' type
    if (type === 'login') {
      // prevent duplicate daily login
      const already = state.activityHistory.some(h => h.type === 'login' && h.date === date);
      if (already) points = 0;
    }

    // Apply points
    state.totalPoints += points;
    state.activityHistory.push({ type, date, points, meta });

    // Topic flags for achievements (approximation hooks)
    if (meta.topic === 'world' && meta.tag === 'early_ancient_complete') state.topicFlags.worldEarlyAncient = true;
    if (meta.topic === 'eu' && meta.tag === 'medieval_mastery') state.topicFlags.euMedievalMastery = true;

    // Recalc achievements
    for (const a of ACHIEVEMENTS) {
      if (!state.achievements.includes(a.id) && a.rule(state)) {
        state.achievements.push(a.id);
      }
    }

    save(state);
    render(state);
    return points;
  }

  function availablePoints(state) {
    return Math.max(0, state.totalPoints - state.spentPoints);
  }

  function currentTier(state) {
    let current = { id: 'none', points: 0, label: 'No Tier' };
    for (const t of TIERS) {
      if (state.totalPoints >= t.points) current = t; else break;
    }
    return current;
  }
  function nextTier(state) {
    for (const t of TIERS) {
      if (state.totalPoints < t.points) return t;
    }
    return null;
  }

  function redeem(state, itemId) {
    const item = STORE.find(x => x.id === itemId);
    if (!item) return { ok: false, reason: 'not_found' };
    const avail = availablePoints(state);
    if (avail < item.cost) return { ok: false, reason: 'insufficient_points' };
    if (state.inventory.includes(item.id)) return { ok: false, reason: 'already_owned' };

    state.spentPoints += item.cost;
    state.inventory.push(item.id);
    save(state);
    render(state);
    return { ok: true, item };
  }

  // UI
  function render(state) {
    // points + progress
    const ptsEl = document.getElementById('rewards-points');
    const availEl = document.getElementById('rewards-points-available');
    const tierEl = document.getElementById('rewards-tier');
    const progFill = document.getElementById('rewards-progress-fill');
    const progText = document.getElementById('rewards-progress-text');
    const streakEl = document.getElementById('rewards-streak-days');
    const badgesEl = document.getElementById('rewards-badges-list');
    const storeEl = document.getElementById('rewards-store-list');

    if (ptsEl) ptsEl.textContent = state.totalPoints.toString();
    if (availEl) availEl.textContent = availablePoints(state).toString();

    const cur = currentTier(state);
    const nxt = nextTier(state);
    if (tierEl) tierEl.textContent = cur.label + (nxt ? ` (Next: ${nxt.label} @ ${nxt.points})` : ' (Max)');

    if (progFill && progText) {
      const base = cur.points;
      const target = nxt ? nxt.points : cur.points;
      const inTier = state.totalPoints - base;
      const span = Math.max(1, target - base);
      const pct = Math.min(100, Math.round((inTier / span) * 100));
      progFill.style.width = pct + '%';
      progText.textContent = nxt ? `${inTier}/${span} to ${nxt.label}` : 'Max tier reached';
    }

    if (streakEl) streakEl.textContent = state.streak.current + ' day' + (state.streak.current === 1 ? '' : 's');

    if (badgesEl) {
      badgesEl.innerHTML = '';
      for (const id of state.achievements) {
        const meta = ACHIEVEMENTS.find(a => a.id === id);
        const li = document.createElement('li');
        li.className = 'badge-item';
        li.innerHTML = `<span class="material-icons">military_tech</span><div><strong>${meta?.name || id}</strong><small>${meta?.desc || ''}</small></div>`;
        badgesEl.appendChild(li);
      }
      if (!state.achievements.length) {
        badgesEl.innerHTML = '<li class="badge-empty">No achievements yet. Keep learning!</li>';
      }
    }

    if (storeEl) {
      storeEl.innerHTML = '';
      for (const item of STORE) {
        const owned = state.inventory.includes(item.id);
        const canBuy = availablePoints(state) >= item.cost && !owned;
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
          const res = redeem(state, id);
          if (!res.ok && res.reason === 'insufficient_points') {
            alert('Not enough points.');
          } else if (!res.ok && res.reason === 'already_owned') {
            alert('Already owned.');
          } else if (res.ok) {
            alert(`Redeemed: ${res.item.name}`);
          }
        });
      });
    }
  }

  // Public API
  const Rewards = {
    getState() { return load(); },
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
    redeem(itemId) { const s = load(); return redeem(s, itemId); },
    tiers: TIERS,
    store: STORE,
    resources: BONUS_RESOURCES
  };
  window.Rewards = Rewards;

  // Auto-bind to CustomEvents
  document.addEventListener('lesson:completed', e => Rewards.record('lesson_completed', e.detail || {}));
  document.addEventListener('quiz:completed', e => Rewards.record('quiz_completed', e.detail || {}));
  document.addEventListener('video:watched', e => Rewards.record('video_watched', e.detail || {}));
  document.addEventListener('user:login', e => Rewards.record('daily_login', e.detail || {}));
  document.addEventListener('challenge:completed', e => Rewards.record('challenge_completed', e.detail || {}));

  // Initial render on pages that include the rewards panel
  document.addEventListener('DOMContentLoaded', () => render(load()));
})();