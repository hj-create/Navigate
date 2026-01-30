(function () {
  const LEVELS = [
    { name: 'Bronze', min: 0 },
    { name: 'Silver', min: 100 },
    { name: 'Gold', min: 300 },
    { name: 'Platinum', min: 600 },
  ];

  function getState() {
    if (window.Rewards?.getState) return window.Rewards.getState();
    try { return JSON.parse(localStorage.getItem('navigate_rewards_v1')) || {}; } catch { return {}; }
  }
  function getPointsSafe() {
    const s = getState() || {};
    const direct = s.points ?? s.totalPoints ?? s.balance;
    if (typeof direct === 'number' && !Number.isNaN(direct)) return direct;

    let pts = 0;
    const hist = Array.isArray(s.activityHistory) ? s.activityHistory
              : Array.isArray(s.activities) ? s.activities : [];
    hist.forEach(h => {
      const t = h.type;
      if (t === 'lesson' || t === 'lesson:completed' || t === 'lesson:read' || t === 'lesson:viewed') pts += 20;
      else if (t === 'video' || t === 'video:watched') pts += 15;
      else if (t === 'quiz' || t === 'quiz:viewed' || t === 'quiz:completed') pts += 30;
      else if (t === 'user:login' || t === 'daily' || t === 'login' || t === 'live:attended') pts += 10;
    });
    try {
      const reds = JSON.parse(localStorage.getItem('navigate_rewards_redemptions_v1') || '[]');
      pts = Math.max(0, pts - reds.reduce((sum, r) => sum + (r.cost || 0), 0));
    } catch {}
    return pts;
  }
  function currentLevel(points) {
    let lvl = LEVELS[0];
    for (const l of LEVELS) if (points >= l.min) lvl = l;
    return lvl;
  }
  function nextLevel(points) {
    const cur = currentLevel(points);
    const i = LEVELS.findIndex(l => l.name === cur.name);
    return LEVELS[i + 1] || null;
  }
  function percent(points) {
    const cur = currentLevel(points);
    const nxt = nextLevel(points);
    if (!nxt) return 100;
    const span = nxt.min - cur.min;
    const done = points - cur.min;
    return Math.max(0, Math.min(100, Math.round((done / span) * 100)));
  }
  function title(points) {
    const nxt = nextLevel(points);
    if (!nxt) return 'Maximum level reached';
    const remain = Math.max(0, nxt.min - points);
    return `${remain} pts to ${nxt.name}`;
  }
  function bind() {
    const pts = getPointsSafe();
    const pct = percent(pts);

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = String(val); };
    set('rt-points', pts);
    set('rt-title', title(pts));
    const caption = document.getElementById('rt-caption');
    if (caption) caption.textContent = 'Earn by reading chapters (+20), watching videos (+15), taking quizzes (+30), daily logins (+10), attending live sessions.';

    const fill = document.getElementById('rt-fill');
    const mark = document.getElementById('rt-marker');
    if (fill) fill.style.width = `${pct}%`;
    if (mark) mark.style.left = `${pct}%`;
  }

  document.addEventListener('DOMContentLoaded', bind);
  ['rewards:updated','lesson:completed','video:watched','quiz:completed','live:attended','user:login']
    .forEach(ev => document.addEventListener(ev, bind));
  window.addEventListener('pageshow', bind);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) bind(); });
})();