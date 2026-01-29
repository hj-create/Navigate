(function () {
  const LS_COUNTS = 'navigate_counts_v1';
  const LS_DOWNLOADS = 'navigate_downloads_v1';

  function getCounts() {
    try { return JSON.parse(localStorage.getItem(LS_COUNTS) || '{}'); } catch { return {}; }
  }
  function setCounts(obj) {
    try { localStorage.setItem(LS_COUNTS, JSON.stringify(obj)); } catch {}
  }
  function bump(topicKey, kind) {
    const counts = getCounts();
    counts[topicKey] = counts[topicKey] || { lessons: 0, videos: 0, quizzes: 0, downloads: 0 };
    counts[topicKey][kind] = (counts[topicKey][kind] || 0) + 1;
    setCounts(counts);
    renderCounts(); // reflect immediately
  }

  function addDownloadLog(topicKey, filename) {
    try {
      const log = JSON.parse(localStorage.getItem(LS_DOWNLOADS) || '[]');
      log.push({
        type: 'download',
        date: new Date().toISOString().split('T')[0],
        meta: { topic: topicKey, filename, duration: '—' }
      });
      localStorage.setItem(LS_DOWNLOADS, JSON.stringify(log));
    } catch {}
  }

  function inferTopicKey(href) {
    const h = (href || '').toLowerCase();
    if (h.includes('us-history')) return 'us';
    if (h.includes('world-history')) return 'world';
    if (h.includes('european-history') || h.includes('europe')) return 'eu';
    return 'us'; // default to US if ambiguous
  }

  function renderCounts() {
    const c = getCounts();
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = String(val || 0); };

    set('us-count-lessons',  c.us?.lessons || 0);
    set('us-count-videos',   c.us?.videos  || 0);
    set('us-count-quizzes',  c.us?.quizzes || 0);
    set('us-count-downloads',c.us?.downloads || 0);

    set('world-count-lessons',   c.world?.lessons || 0);
    set('world-count-videos',    c.world?.videos  || 0);
    set('world-count-quizzes',   c.world?.quizzes || 0);
    set('world-count-downloads', c.world?.downloads || 0);

    set('eu-count-lessons',   c.eu?.lessons || 0);
    set('eu-count-videos',    c.eu?.videos  || 0);
    set('eu-count-quizzes',   c.eu?.quizzes || 0);
    set('eu-count-downloads', c.eu?.downloads || 0);

    // Notify dashboard listeners
    document.dispatchEvent(new Event('dashboard:refresh'));
  }

  function isFile(href) {
    return /\.(pdf|docx?|pptx?|xlsx?|csv|zip|rar|7z|txt)$/i.test(href || '');
  }

  document.addEventListener('DOMContentLoaded', () => {
    // Initial render
    renderCounts();

    // Roadmap resource link clicks (view/read, watch, quiz, downloads page)
    document.querySelectorAll('.resource-link[href]').forEach(a => {
      a.addEventListener('click', () => {
        const href = a.getAttribute('href') || a.href || '';
        const topicKey = inferTopicKey(href);

        if (/lessons/i.test(href)) {
          bump(topicKey, 'lessons');
          document.dispatchEvent(new CustomEvent('lesson:viewed', { detail: { topic: topicKey } }));
        } else if (/videos/i.test(href)) {
          bump(topicKey, 'videos');
          document.dispatchEvent(new CustomEvent('video:watched', { detail: { topic: topicKey } }));
        } else if (/quizzes/i.test(href) || /quiz=/.test(href)) {
          bump(topicKey, 'quizzes');
          document.dispatchEvent(new CustomEvent('quiz:viewed', { detail: { topic: topicKey } }));
        } else if (/downloads/i.test(href)) {
          // Count downloads page access
          bump(topicKey, 'downloads');
          document.dispatchEvent(new CustomEvent('download:accessed', { detail: { topic: topicKey } }));
        }
        // Never preventDefault; navigation remains native.
      }, { passive: true });
    });

    // Direct file links (if any are present on this page)
    document.querySelectorAll('a[href]').forEach(a => {
      const href = a.getAttribute('href') || a.href || '';
      if (!isFile(href)) return;
      a.addEventListener('click', () => {
        const topicKey = inferTopicKey(href);
        const filename = href.split('?')[0].split('#')[0].split('/').pop() || '';
        bump(topicKey, 'downloads');
        addDownloadLog(topicKey, filename);
        document.dispatchEvent(new CustomEvent('download:downloaded', { detail: { topic: topicKey, filename } }));
      }, { passive: true });
    });
  });
})();