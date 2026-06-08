(function () {
  function rewardsState() {
    if (window.Rewards?.getState) return window.Rewards.getState();
    try { return JSON.parse(localStorage.getItem('navigate_rewards_v1')) || {}; } catch { return {}; }
  }
  function activity() {
    const s = rewardsState() || {};
    const raw = Array.isArray(s.activityHistory) ? s.activityHistory
             : Array.isArray(s.activities) ? s.activities
             : [];
    return raw.map(h => ({ type: h.type, date: h.date || h.on, meta: h.meta || {} }));
  }
  function countOf(types) {
    const tset = new Set(types);
    return activity().filter(h => tset.has(h.type)).length;
  }
  function update() {
    const live    = countOf(['live', 'session', 'live:attended', 'session:attended']);
    const videos  = countOf(['video', 'video:watched']);
    const lessons = countOf(['lesson', 'lesson:viewed', 'lesson:read', 'lesson:completed']);
    const quizzes = countOf(['quiz', 'quiz:viewed', 'quiz:completed']);

    const set = (id, n) => { const el = document.getElementById(id); if (el) el.textContent = String(n || 0); };
    set('summary-live-count',    live);
    set('summary-videos-count',  videos);
    set('summary-lessons-count', lessons);
    set('summary-quizzes-count', quizzes);
  }
  document.addEventListener('DOMContentLoaded', update);
  ['user:login','live:attended','session:attended','video:watched','lesson:viewed','lesson:read','lesson:completed','quiz:viewed','quiz:completed','rewards:updated']
    .forEach(ev => document.addEventListener(ev, update));
  window.addEventListener('pageshow', update);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) update(); });
})();