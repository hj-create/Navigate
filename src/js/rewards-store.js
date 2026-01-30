(function () {
  // Levels and catalog (adjust as needed)
  const LEVELS = [
    { name: 'Bronze', min: 0 },
    { name: 'Silver', min: 100 },
    { name: 'Gold', min: 300 },
    { name: 'Platinum', min: 600 },
  ];
  const CATALOG = [
    { id: 'badge-bronze',  title: 'Bronze Study Badge',   cost: 50,  minLevel: 'Bronze' },
    { id: 'pack-silver',   title: 'Silver Study Pack',    cost: 150, minLevel: 'Silver' },
    { id: 'pass-gold',     title: 'Gold Event Pass',      cost: 350, minLevel: 'Gold' },
    { id: 'perk-platinum', title: 'Platinum Perk Bundle', cost: 700, minLevel: 'Platinum' },
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
    const points = pointsFromEngineOrEstimate();
    const levelName = currentLevel(points);
    const streak = getStreak();

    const $pts   = document.getElementById('rewards-points');
    const $lvl   = document.getElementById('rewards-level');
    const $streak= document.getElementById('rewards-streak');
    const $next  = document.getElementById('rewards-next-level');

    if ($pts)   $pts.textContent = String(points);
    if ($lvl)   $lvl.textContent = levelName;
    if ($streak)$streak.textContent = `${streak} day${streak === 1 ? '' : 's'}`;
    if ($next)  $next.textContent = nextLevelLabel(points);
  }

  function renderStore() {
    const ul = document.getElementById('reward-items');
    if (!ul) return;
    const points = pointsFromEngineOrEstimate();
    const levelName = currentLevel(points);

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
      if (!enabled) {
        btn.setAttribute('disabled', 'true');
        btn.classList.add('btn-disabled');
      }
      btn.addEventListener('click', () => confirmRedeem(item));
      ul.appendChild(li);
    });
  }

  function confirmRedeem(item) {
    const ok = window.confirm(`Redeem "${item.title}" for ${item.cost} points?`);
    if (!ok) return;

    // Prefer engine API if available
    try {
      const res = window.Rewards?.redeem
        ? window.Rewards.redeem({ id: item.id, cost: item.cost })
        : null;

      // Handle promise or sync return
      if (res && typeof res.then === 'function') {
        res.then(() => onRedeemed(item)).catch(onRedeemFailed);
      } else if (res) {
        onRedeemed(item);
      } else {
        // Fallback: queue request for the engine to process
        queueRedemption(item);
        onRedeemed(item);
      }
    } catch (e) {
      queueRedemption(item);
      onRedeemed(item);
    }
  }

  function queueRedemption(item) {
    try {
      const key = 'navigate_rewards_redeem_queue';
      const q = JSON.parse(localStorage.getItem(key) || '[]');
      q.push({ id: item.id, cost: item.cost, at: new Date().toISOString() });
      localStorage.setItem(key, JSON.stringify(q));
      document.dispatchEvent(new CustomEvent('rewards:redeem', { detail: item }));
    } catch {}
  }

  function onRedeemed(item) {
    // Let engine update points; we just refresh UI
    document.dispatchEvent(new Event('rewards:updated'));
    renderStats();
    renderStore();
    toast(`Redeemed: ${item.title}`);
  }
  function onRedeemFailed() {
    toast('Redemption failed. Please try again.');
  }
  function toast(msg) {
    try { alert(msg); } catch {}
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