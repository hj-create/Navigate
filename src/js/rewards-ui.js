(function () {  const LEVELS = [    { name: 'Bronze', min: 0 },    { name: 'Silver', min: 100 },    { name: 'Gold', min: 300 },    { name: 'Platinum', min: 600 },  ];  const CATALOG = [    { id: 'badge-bronze',  title: 'Bronze Study Badge',   cost: 50,  minLevel: 'Bronze' },    { id: 'pack-silver',   title: 'Silver Study Pack',    cost: 150, minLevel: 'Silver' },    { id: 'pass-gold',     title: 'Gold Event Pass',      cost: 350, minLevel: 'Gold' },    { id: 'perk-platinum', title: 'Platinum Perk Bundle', cost: 700, minLevel: 'Platinum' },  ];  // State helpers  function getState() {    if (window.Rewards?.getState) return window.Rewards.getState();    try { return JSON.parse(localStorage.getItem('navigate_rewards_v1')) || {}; } catch { return {}; }  }  function savePoints(newPoints) {    // Prefer engine API    if (window.Rewards?.setPoints) { try { window.Rewards.setPoints(newPoints); return; } catch {} }    // Fallback: persist to localStorage    try {      const key = 'navigate_rewards_v1';      const s = JSON.parse(localStorage.getItem(key) || '{}');      const val = Math.max(0, Number(newPoints) || 0);      if (typeof s.points === 'number') s.points = val;      else if (typeof s.totalPoints === 'number') s.totalPoints = val;      else s.points = val; // create points if missing      localStorage.setItem(key, JSON.stringify(s));    } catch {}  }  function getActivity() {    const s = getState() || {};    const raw = Array.isArray(s.activityHistory) ? s.activityHistory              : Array.isArray(s.activities) ? s.activities              : [];    return raw.map(h => ({      type: h.type,      date: h.date || h.on || (typeof h.timestamp === 'string' ? h.timestamp.split('T')[0] : h.timestamp),      meta: h.meta || { topic: h.topic, duration: h.duration }    }));  }  function getRedemptionsTotal() {    try {      const q = JSON.parse(localStorage.getItem('navigate_rewards_redemptions_v1') || '[]');      return q.reduce((sum, r) => sum + (r.cost || 0), 0);    } catch { return 0; }  }  function getPoints() {    const s = getState() || {};    const direct = s.points ?? s.totalPoints ?? s.balance;    let pts;    if (typeof direct === 'number') pts = direct;    else {      pts = 0;      getActivity().forEach(h => {        if (h.type === 'lesson') pts += 20;        else if (h.type === 'video') pts += 15;        else if (h.type === 'quiz') pts += 30;        else if (h.type === 'login' || h.type === 'daily') pts += 10;      });      // naive streak bonus      const days = [...new Set(getActivity().map(h => h.date))].sort();      let streak = 0, maxStreak = 0;      for (let i = 0; i < days.length; i++) {        const d = new Date(days[i] + 'T00:00:00');        const prev = i ? new Date(days[i - 1] + 'T00:00:00') : null;        if (prev && (d - prev) === 86400000) streak++; else streak = 1;        maxStreak = Math.max(maxStreak, streak);      }      pts += Math.max(0, maxStreak - 1) * 5;    }    // Subtract any queued redemptions    pts = Math.max(0, pts - getRedemptionsTotal());    return pts;  }  function getStreak() {    const s = getState() || {};    if (typeof s.streak === 'number') return s.streak;    const days = [...new Set(getActivity().map(h => h.date))].sort();    if (!days.length) return 0;    let streak = 1;    for (let i = days.length - 1; i > 0; i--) {      const cur = new Date(days[i] + 'T00:00:00');      const prev = new Date(days[i - 1] + 'T00:00:00');      if ((cur - prev) === 86400000) streak++; else break;    }    return streak;  }  function currentLevel(points) {    let lvl = LEVELS[0];    for (const l of LEVELS) { if (points >= l.min) lvl = l; }    return lvl;  }  function nextLevelLabel(points) {    const cur = currentLevel(points);    const idx = LEVELS.findIndex(l => l.name === cur.name);    const next = LEVELS[idx + 1];    return next ? `${next.min - points} pts to ${next.name}` : 'Max level reached';  }  function renderStats() {    const points = getPoints();    const lvl = currentLevel(points).name;    const streak = getStreak();    const next = nextLevelLabel(points);    const $pts = document.getElementById('rewards-points');    const $lvl = document.getElementById('rewards-level');    const $streak = document.getElementById('rewards-streak');    const $next = document.getElementById('rewards-next-level');    if ($pts) $pts.textContent = String(points);    if ($lvl) $lvl.textContent = lvl;    if ($streak) $streak.textContent = `${streak} day${streak === 1 ? '' : 's'}`;    if ($next) $next.textContent = next;  }  function canRedeem(item, points, levelName) {    const levelIndex = LEVELS.findIndex(l => l.name === levelName);    const reqIndex = LEVELS.findIndex(l => l.name === item.minLevel);    return points >= item.cost && levelIndex >= reqIndex;  }  function renderStore() {    const ul = document.getElementById('reward-items');    if (!ul) return;    const points = getPoints();    const levelName = currentLevel(points).name;

    ul.innerHTML = '';
    CATALOG.forEach(item => {
      const li = document.createElement('li');
      li.className = 'reward-item';
      li.innerHTML = `
        <div class="reward-info">
          <strong>${item.title}</strong>
          <div class="muted">Cost: ${item.cost} pts · Requires: ${item.minLevel}+</div>
        </div>
        <button class="btn redeem-btn" data-id="${item.id}">Redeem</button>
      `;
      const btn = li.querySelector('.redeem-btn');
      const enabled = canRedeem(item, points, levelName);
      if (!enabled) { btn.setAttribute('disabled', 'true'); btn.classList.add('btn-disabled'); }
      btn.addEventListener('click', () => redeem(item));
      ul.appendChild(li);
    });
  }

  // Guide: awards details + how to redeem
  function renderGuide() {
    const host = document.getElementById('rewards-guide');
    if (!host) return;
    const points = getPoints();
    const levelName = currentLevel(points).name;

    const itemsHtml = CATALOG.map(i => {
      const available = canRedeem(i, points, levelName);
      return `
        <div class="award-item">
          <div class="award-meta">
            <strong>${i.title}</strong>
            <span class="muted">Cost: ${i.cost} pts · Level: ${i.minLevel}+</span>
          </div>
          <span class="badge ${available ? 'available' : 'locked'}">${available ? 'Available' : 'Locked'}</span>
        </div>
      `;
    }).join('');

    host.innerHTML = `
      <div class="guide-card">
        <h4>Awards & Redeem Guide</h4>
        <ol class="redeem-steps">
          <li>Open the list below and pick an available perk.</li>
          <li>Click "Redeem" and confirm.</li>
          <li>Points are deducted; some rewards require higher levels.</li>
        </ol>
        <div class="award-list">
          ${itemsHtml}
        </div>
      </div>
    `;
  }

  function render() { renderStats(); renderStore(); renderGuide(); }  document.addEventListener('DOMContentLoaded', render);  ['user:login', 'lesson:completed', 'video:watched', 'quiz:completed', 'rewards:updated']    .forEach(ev => document.addEventListener(ev, render));
  window.addEventListener('pageshow', render);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });
})();