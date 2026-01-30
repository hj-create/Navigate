// Simple auth utility reading localStorage `navigate_user`
(() => {
  const KEY = 'navigate_user';

  const load = () => {
    try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; }
  };
  const isLoggedIn = () => {
    const u = load();
    return !!(u && (u.loggedIn === true || u.token));
  };
  const getUser = () => load();

  window.NavigateAuth = { isLoggedIn, getUser };
})();