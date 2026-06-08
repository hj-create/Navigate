document.addEventListener('DOMContentLoaded', () => {
  const anchors = document.querySelectorAll('a[href]');
  anchors.forEach(a => {
    const href = a.getAttribute('href');
    if (!href || href === '#' || href.startsWith('javascript:')) return;

    // Capture on the anchor: stop other click handlers from blocking navigation.
    a.addEventListener('click', (e) => {
      // Do not call preventDefault; let the browser navigate.
      e.stopImmediatePropagation();
      // If navigation still gets blocked by earlier capture handlers, schedule a fallback.
      const abs = a.href;
      const tgt = a.target;
      setTimeout(() => {
        if (document.visibilityState === 'visible') {
          try { tgt === '_blank' ? window.open(abs, '_blank') : window.location.assign(abs); } catch {}
        }
      }, 0);
    }, true);
  });

  // Make common card containers act like links when no anchor is clicked
  const navigateCard = (el) => {
    const link = el.querySelector('a[href]');
    if (link) { try { link.click(); } catch {} return; }
    const targetHref = el.dataset.href || el.dataset.navigate;
    if (!targetHref) return;
    const tgt = el.dataset.target || '_self';
    try { tgt === '_blank' ? window.open(targetHref, '_blank') : window.location.assign(targetHref); } catch {}
  };
  document.addEventListener('click', (e) => {
    const card = e.target.closest('.resource-card, .course-card, .card, [data-href], [data-navigate]');
    if (!card || e.target.closest('a[href]')) return;
    navigateCard(card);
  }, { passive: true });
});