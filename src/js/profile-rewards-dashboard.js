(() => {
  const STORE_KEY = 'navigate_profile_store_v1';
  const REWARDS_KEY = 'navigate_rewards_full_v1';

  const storeItems = [
    { id: 'badge_starter', name: 'Starter Badge', cost: 100 },
    { id: 'avatar_hat', name: 'Historian Hat', cost: 250 },
    { id: 'bonus_video', name: 'Bonus Video', cost: 300, url: 'https://www.youtube.com/watch?v=Yocja_N5s1I' },
    { id: 'quiz_pack', name: 'Premium Quiz Pack', cost: 500 },
  ];

  const ready = (fn) => (document.readyState === 'loading') ? document.addEventListener('DOMContentLoaded', fn) : fn();
  const getUser = () => { try { return JSON.parse(localStorage.getItem('navigate_user') || 'null'); } catch { return null; } };
  const isLoggedIn = () => { const u = getUser(); return !!(u && (u.loggedIn === true || u.token)); };

  const getActivities = () => {
    const a = window.NavigateRewards?.state?.activities;
    if (a) return {
      lessonsCompleted: Number(a.lessonsCompleted || 0),
      videosWatched: Number(a.videosWatched || 0),
      videosWatchedNoSkip: Number(a.videosWatchedNoSkip || 0),
      quizzesCompleted: Number(a.quizzesCompleted || 0),
      quizzesAbove80: Number(a.quizzesAbove80 || 0)
    };
    const u = getUser(); const b = (u && u.activity) || {};
    return {
      lessonsCompleted: Number(b.lessonsCompleted || 0),
      videosWatched: Number(b.videosWatched || 0),
      videosWatchedNoSkip: Number(b.videosWatchedNoSkip || 0),
      quizzesCompleted: Number(b.quizzesCompleted || 0),
      quizzesAbove80: Number(b.quizzesAbove80 || 0)
    };
  };

  const computePoints = (act) => (
    act.lessonsCompleted * 50 +
    act.videosWatched * 20 +
    act.videosWatchedNoSkip * 5 +
    act.quizzesCompleted * 30 +
    act.quizzesAbove80 * 10
  );

  const saveNavigateRewardsPoints = (newPoints) => {
    if (!window.NavigateRewards || !window.NavigateRewards.state) return;
    const s = window.NavigateRewards.state;
    if (newPoints > Number(s.points || 0)) {
      s.points = newPoints;
      try { localStorage.setItem(REWARDS_KEY, JSON.stringify(s)); } catch {}
      window.dispatchEvent(new CustomEvent('rewards:update'));
      window.NavigateRewards?.RewardsUI?.render?.();
    }
  };

  const loadStore = () => { try { return JSON.parse(localStorage.getItem(STORE_KEY) || '{"owned":[]}'); } catch { return { owned: [] }; } };
  const saveStore = (st) => { try { localStorage.setItem(STORE_KEY, JSON.stringify(st)); } catch {} };

  const renderPanel = (points, act, store) => {
    const panel = document.getElementById('profileRewardsPanel');
    if (!panel) return;
    panel.querySelector('[data-profile-points]')?.replaceChildren(document.createTextNode(String(points)));

    const breakdown = panel.querySelector('[data-activity-breakdown]');
    if (breakdown) breakdown.innerHTML = `
      <li>Lessons: ${act.lessonsCompleted} × 50</li>
      <li>Videos: ${act.videosWatched} × 20</li>
      <li>No‑skip bonus: ${act.videosWatchedNoSkip} × 5</li>
      <li>Quizzes: ${act.quizzesCompleted} × 30</li>
      <li>≥80% bonus: ${act.quizzesAbove80} × 10</li>
    `;

    const list = panel.querySelector('[data-profile-store]');
    if (list) {
      list.innerHTML = storeItems.map(item => {
        const owned = store.owned.includes(item.id);
        return `
          <li class="store-item ${owned ? 'owned' : ''}" style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #eee">
            <div>
              <div class="store-name" style="font-weight:600">${item.name}</div>
              <div class="store-meta" style="font-size:12px;color:#666">${item.cost} pts</div>
            </div>
            <div>
              ${owned ? '<span class="owned-label">Owned</span>' : `<button class="primary-btn" data-redeem="${item.id}" ${points >= item.cost ? '' : 'disabled'}>Redeem</button>`}
              ${item.url ? `<a href="${item.url}" target="_blank" rel="noopener" style="margin-left:8px">View</a>` : ''}
            </div>
          </li>
        `;
      }).join('');

      list.querySelectorAll('[data-redeem]').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-redeem');
          const item = storeItems.find(i => i.id === id);
          if (!item || store.owned.includes(id)) return;

          // Use NavigateRewards points as the source of truth if available
          const s = window.NavigateRewards?.state;
          const current = s ? Number(s.points || 0) : points;
          if (current < item.cost) return;

          // Deduct and mark owned
          if (s) {
            s.points = current - item.cost;
            try { localStorage.setItem(REWARDS_KEY, JSON.stringify(s)); } catch {}
            window.dispatchEvent(new CustomEvent('rewards:update'));
            window.NavigateRewards?.RewardsUI?.render?.();
          }
          store.owned.push(id);
          saveStore(store);
          renderPanel(s ? s.points : (points - item.cost), act, store);
        });
      });
    }
  };

  const apply = () => {
    if (!isLoggedIn()) return;
    const activities = getActivities();
    const computed = computePoints(activities);
    saveNavigateRewardsPoints(computed);

    const currentPoints = window.NavigateRewards?.state?.points ?? computed;
    const storeState = loadStore();
    renderPanel(Number(currentPoints), activities, storeState);
  };

  ready(apply);
  window.addEventListener('auth:login', apply);
})();