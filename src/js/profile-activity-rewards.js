(() => {
  const ready = (fn) => (document.readyState === 'loading') ? document.addEventListener('DOMContentLoaded', fn) : fn();

  const isLoggedIn = () => {
    const u = (() => { try { return JSON.parse(localStorage.getItem('navigate_user') || 'null'); } catch { return null; } })();
    return !!(u && (u.loggedIn === true || u.token));
  };

  const getActivities = () => {
    // Prefer NavigateRewards live state if present
    const a = window.NavigateRewards?.state?.activities;
    if (a) return {
      lessonsCompleted: Number(a.lessonsCompleted || 0),
      videosWatched: Number(a.videosWatched || 0),
      videosWatchedNoSkip: Number(a.videosWatchedNoSkip || 0),
      quizzesCompleted: Number(a.quizzesCompleted || 0),
      quizzesAbove80: Number(a.quizzesAbove80 || 0)
    };
    // Fallback: user.activity in navigate_user
    try {
      const u = JSON.parse(localStorage.getItem('navigate_user') || '{}');
      const b = u.activity || {};
      return {
        lessonsCompleted: Number(b.lessonsCompleted || 0),
        videosWatched: Number(b.videosWatched || 0),
        videosWatchedNoSkip: Number(b.videosWatchedNoSkip || 0),
        quizzesCompleted: Number(b.quizzesCompleted || 0),
        quizzesAbove80: Number(b.quizzesAbove80 || 0)
      };
    } catch { return { lessonsCompleted: 0, videosWatched: 0, videosWatchedNoSkip: 0, quizzesCompleted: 0, quizzesAbove80: 0 }; }
  };

  const computePointsFromActivities = (act) => {
    const lessonsPts = act.lessonsCompleted * 50;
    const videosPts = act.videosWatched * 20;
    const noSkipBonus = act.videosWatchedNoSkip * 5;
    const quizzesPts = act.quizzesCompleted * 30;
    const quiz80Bonus = act.quizzesAbove80 * 10;
    return lessonsPts + videosPts + noSkipBonus + quizzesPts + quiz80Bonus;
  };

  const saveNavigateRewardsPoints = (newPoints) => {
    // Keep the higher of current vs computed
    if (!window.NavigateRewards || !window.NavigateRewards.state) return;
    const s = window.NavigateRewards.state;
    const prev = Number(s.points || 0);
    if (newPoints > prev) {
      s.points = newPoints;
      try { localStorage.setItem('navigate_rewards_full_v1', JSON.stringify(s)); } catch {}
      window.dispatchEvent(new CustomEvent('rewards:update'));
      if (window.NavigateRewards?.RewardsUI?.render) window.NavigateRewards.RewardsUI.render();
    }
  };

  const renderProfilePanel = (points, act) => {
    const panel = document.getElementById('profileRewardsPanel');
    if (!panel) return;
    const pointsEl = panel.querySelector('[data-profile-points]');
    const listEl = panel.querySelector('[data-activity-breakdown]');
    if (pointsEl) pointsEl.textContent = String(points);
    if (listEl) {
      listEl.innerHTML = `
        <li>Lessons: ${act.lessonsCompleted} × 50</li>
        <li>Videos: ${act.videosWatched} × 20</li>
        <li>No‑skip bonus: ${act.videosWatchedNoSkip} × 5</li>
        <li>Quizzes: ${act.quizzesCompleted} × 30</li>
        <li>≥80% bonus: ${act.quizzesAbove80} × 10</li>
      `;
    }
  };

  const applyAfterLogin = () => {
    if (!isLoggedIn()) return;
    const activities = getActivities();
    const computed = computePointsFromActivities(activities);
    saveNavigateRewardsPoints(computed);
    renderProfilePanel(computed, activities);
  };

  // Run on load and on explicit login events
  ready(applyAfterLogin);
  window.addEventListener('auth:login', applyAfterLogin);

  // Test user data - REMOVE BEFORE PRODUCTION
  localStorage.setItem('navigate_user', JSON.stringify({
    id: 'u1', name: 'Test', loggedIn: true,
    activity: { lessonsCompleted: 3, videosWatched: 2, videosWatchedNoSkip: 1, quizzesCompleted: 4, quizzesAbove80: 2 }
  }));
})();