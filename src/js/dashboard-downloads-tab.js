(function () {
  // Get user-specific downloads key
  function getDownloadsKey() {
    const currentUser = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    if (!currentUser || !currentUser.id) {
      return 'navigate_downloads_v1_guest';
    }
    return 'navigate_downloads_v1_user_' + currentUser.id;
  }
  
  // Update Downloads summary count and render table when "Downloads" tab is active
  function getDownloads() {
    try { 
      const key = getDownloadsKey();
      return JSON.parse(localStorage.getItem(key) || '[]'); 
    }
    catch { return []; }
  }
  function fmtDate(iso) {
    if (!iso) return '—';
    try { return new Date(iso + (iso.includes('T') ? '' : 'T00:00:00')).toLocaleDateString(); } catch { return iso; }
  }
  function topicLabel(t) {
    return t === 'us' ? 'United States History'
      : t === 'world' ? 'World History'
      : t === 'eu' ? 'European History'
      : (t || '—');
  }
  function updateSummary() {
    const el = document.getElementById('summary-downloads-count');
    if (el) el.textContent = String(getDownloads().length);
  }
  function renderDownloadsTable() {
    const tbody = document.getElementById('activity-table-body');
    const activeTab = document.querySelector('.activity-tabs .tab-btn.active');
    if (!tbody || !activeTab || activeTab.dataset.filter !== 'download') return;

    const rows = getDownloads().slice().reverse().slice(0, 10);
    tbody.innerHTML = '';
    if (!rows.length) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;opacity:.7">No downloads</td></tr>`;
      return;
    }
    rows.forEach(h => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${fmtDate(h.date)}</td>
        <td>${topicLabel(h.meta?.topic)}</td>
        <td><span class="badge reading">Download</span></td>
        <td>${h.meta?.duration ?? '—'}</td>
        <td><span class="status completed">Saved</span></td>
        <td><div class="progress-bar"><div class="progress" style="width:100%"></div></div></td>
      `;
      tbody.appendChild(tr);
    });
  }

  function render() { updateSummary(); renderDownloadsTable(); }

  document.addEventListener('DOMContentLoaded', render);
  ['download:downloaded', 'download:accessed', 'dashboard:refresh'].forEach(ev => document.addEventListener(ev, render));
  window.addEventListener('pageshow', render);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });

  // Also react to tab clicks
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.activity-tabs .tab-btn').forEach(btn => {
      btn.addEventListener('click', () => setTimeout(render, 0), { passive: true });
    });
  });
})();