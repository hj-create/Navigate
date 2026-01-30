(() => {
  const STORAGE_KEY = 'navigate_profile_rewards_v1';

  const tiers = [
    { id: 'new', name: 'New', base: 0 },
    { id: 'bronze', name: 'Bronze', base: 100 },
    { id: 'silver', name: 'Silver', base: 300 },
    { id: 'gold', name: 'Gold', base: 600 },
    { id: 'platinum', name: 'Platinum', base: 1000 },
  ];

  const storeItems = [
    { id: 'badge_starter', name: 'Starter Badge', cost: 100 },
    { id: 'avatar_hat', name: 'Historian Hat', cost: 250 },
    { id: 'bonus_video', name: 'Bonus Video Access', cost: 300, url: 'https://www.youtube.com/watch?v=Yocja_N5s1I' },
    { id: 'quiz_pack', name: 'Premium Quiz Pack', cost: 500 },
  ];

  const clamp = (n, min, max) => Math.max(min, Math.min(max, Number(n || 0)));

  const loadUser = () => {
    try { return JSON.parse(localStorage.getItem('navigate_user') || 'null'); } catch { return null; }
  };

  const isLoggedIn = () => {
    const u = loadUser();
    return !!(u && (u.loggedIn === true || u.token));
  };

  const loadState = () => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"points":0,"owned":[]}'); } catch { return { points: 0, owned: [] }; }
  };

  const saveState = (s) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
    window.dispatchEvent(new CustomEvent('profileRewards:update'));
  };

  // Compute points from status + progress + streak + achievements count
  const computePoints = (user) => {
    const status = String(user?.status || 'new').toLowerCase();
    const tier = tiers.find(t => t.id === status) || tiers[0];

    const progressPct = clamp(user?.profileProgress, 0, 100);      // 0–100
    const streakDays = clamp(user?.streakDays, 0, 30);             // cap at 30
    const achievements = clamp(user?.achievementsCount, 0, 20);    // cap at 20

    const base = tier.base;                    // tier base
    const progressPts = Math.round(progressPct * 2);   // 2 pts per 1% progress (max 200)
    const streakPts = streakDays * 5;          // 5 pts per day streak (max 150)
    const achPts = achievements * 25;          // 25 pts per achievement (max 500)

    return base + progressPts + streakPts + achPts;    // e.g., Silver(300) + progress 60%*2 + 10 days*5 + 4*25
  };

  const renderUI = (state) => {
    const panel = document.getElementById('profileRewardsPanel');
    if (!panel) return;

    const pointsEl = panel.querySelector('[data-profile-points]');
    const tierTextEl = panel.querySelector('[data-profile-tier]');
    const storeListEl = panel.querySelector('[data-profile-store]');

    const user = loadUser();
    const status = String(user?.status || 'new').toLowerCase();
    const tier = tiers.find(t => t.id === status) || tiers[0];

    pointsEl.textContent = state.points;
    tierTextEl.textContent = `${tier.name}`;

    storeListEl.innerHTML = storeItems.map(item => {
      const owned = state.owned.includes(item.id);
      return `
        <li class="store-item ${owned ? 'owned' : ''}">
          <div class="store-name">${item.name}</div>
          <div class="store-meta">
            <span class="cost">${item.cost} pts</span>
            ${owned ? '<span class="owned-label">Owned</span>' : `<button class="primary-btn" data-redeem="${item.id}" ${state.points >= item.cost ? '' : 'disabled'}>Redeem</button>`}
            ${item.url ? `<a href="${item.url}" target="_blank" rel="noopener">View</a>` : ''}
          </div>
        </li>
      `;
    }).join('');

    storeListEl.querySelectorAll('[data-redeem]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-redeem');
        const item = storeItems.find(i => i.id === id);
        if (!item) return;
        if (state.owned.includes(id)) return;
        if (state.points < item.cost) return;

        state.points -= item.cost;
        state.owned.push(id);
        saveState(state);
        renderUI(state);

        // Log to NavigateRewards if present
        if (window.NavigateRewards) {
          const s = window.NavigateRewards.state;
          s.points = Math.max(0, s.points - item.cost);
          try { localStorage.setItem('navigate_rewards_full_v1', JSON.stringify(s)); } catch {}
          window.dispatchEvent(new CustomEvent('rewards:update'));
        }
      });
    });
  };

  const syncWithNavigateRewards = (points) => {
    if (!window.NavigateRewards || !window.NavigateRewards.state) return;
    const s = window.NavigateRewards.state;
    s.points = Math.max(s.points, points); // keep the higher of the two
    try { localStorage.setItem('navigate_rewards_full_v1', JSON.stringify(s)); } catch {}
    window.dispatchEvent(new CustomEvent('rewards:update'));
    if (window.NavigateRewards.RewardsUI?.render) window.NavigateRewards.RewardsUI.render();
  };

  const init = () => {
    if (!isLoggedIn()) return; // only after login

    const user = loadUser();
    const computed = computePoints(user);

    const state = loadState();
    // Keep higher of current vs computed
    state.points = Math.max(Number(state.points || 0), computed);
    state.owned = Array.isArray(state.owned) ? state.owned : [];
    saveState(state);

    // Update NavigateRewards, if present
    syncWithNavigateRewards(state.points);

    renderUI(state);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  // Expose API (optional)
  window.ProfileRewards = {
    getState: () => loadState(),
    recompute: () => { init(); },
    computePointsFromUser: computePoints
  };
})();