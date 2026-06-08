(function () {
  const LEVELS = [
    { name: 'Stone Tablet Starter', min: 0 },
    { name: 'Ancient Archivist', min: 200 },
    { name: 'Medieval Mastermind', min: 500 },
    { name: 'Age of Exploration Expert', min: 900 },
    { name: 'Revolutionary Scholar', min: 1400 },
    { name: 'Historian Supreme 👑', min: 2000 },
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
    lvlEl.title = 'Stone Tablet Starter (0+), Ancient Archivist (200+), Medieval Mastermind (500+), Age of Exploration Expert (900+), Revolutionary Scholar (1400+), Historian Supreme (2000+)';
  }
  document.addEventListener('DOMContentLoaded', update);
  ['rewards:updated','user:login','lesson:completed','video:watched','quiz:completed','live:attended']
    .forEach(ev => document.addEventListener(ev, update));
  window.addEventListener('pageshow', update);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) update(); });
})();