(function () {
  const LEVELS = [
    { name: 'Bronze', min: 0 },
    { name: 'Silver', min: 100 },
    { name: 'Gold', min: 300 },
    { name: 'Platinum', min: 700 },
    { name: 'Diamond', min: 1200 },
  ];
  function currentLevel(points) {
    let lvl = LEVELS[0];
    for (const l of LEVELS) if (points >= l.min) lvl = l;
    return lvl.name;
  }
  function readNum(id) {
    const el = document.getElementById(id);
    const n = Number((el?.textContent || '0').replace(/[^\d.-]/g, ''));
    return Number.isFinite(n) ? n : 0;
  }
  function update() {
    const lvlEl = document.getElementById('rewards-level');
    if (!lvlEl) return;
    const txt = (lvlEl.textContent || '').trim();
    if (!txt || txt === '—' || txt === '-') {
      const pts = readNum('rewards-points');
      lvlEl.textContent = currentLevel(pts);
    }
    // Always set a helpful tooltip
    lvlEl.title = 'Bronze (0+), Silver (100+), Gold (300+), Platinum (700+), Diamond (1200+)';
  }
  document.addEventListener('DOMContentLoaded', update);
  ['rewards:updated','user:login','lesson:completed','video:watched','quiz:completed','live:attended']
    .forEach(ev => document.addEventListener(ev, update));
  window.addEventListener('pageshow', update);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) update(); });
})();