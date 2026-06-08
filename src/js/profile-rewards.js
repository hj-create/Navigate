(() => {
  const ready = (fn) => (document.readyState === 'loading') ? document.addEventListener('DOMContentLoaded', fn) : fn();

  const readProgressPercent = () => {
    // Try explicit data attributes or common elements
    const el = document.querySelector('[data-profile-progress], #profileProgress, .profile-progress');
    if (el) {
      // If it's a progress bar style width: "67%"
      const stylePct = (el.style?.width || '').match(/(\d+)\s*%/);
      if (stylePct) return Number(stylePct[1]);

      // If it has text like "Progress: 67%"
      const textPct = (el.textContent || '').match(/(\d+)\s*%/);
      if (textPct) return Number(textPct[1]);

      // If data attribute is numeric
      const dataPct = Number(el.getAttribute('data-profile-progress'));
      if (!Number.isNaN(dataPct)) return dataPct;
    }
    // Fallback to user object
    const u = window.NavigateAuth?.getUser?.();
    if (u && typeof u.profileProgress === 'number') return Number(u.profileProgress);
    return 0;
  };

  ready(() => {
    if (!window.NavigateAuth?.isLoggedIn?.() || !window.NavigateRewards) return;
    const pct = readProgressPercent();
    // Dispatch login event (if not already fired) with progress
    window.dispatchEvent(new CustomEvent('auth:login', { detail: { profileProgress: pct } }));
    // Also sync directly as a safety
    window.NavigateRewards.syncPointsFromProfileProgress(pct, 'max');
    console.info('[ProfileRewards] Synced points from profile progress:', pct);
  });
})();