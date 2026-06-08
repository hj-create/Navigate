document.addEventListener('DOMContentLoaded', function () {
  const subjectItems = document.querySelectorAll('.subject-item, .subject-button, .subject-option');
  const calendar = document.getElementById('sessionCalendar');
  const timeSlots = document.getElementById('timeSlots');
  const upcomingSessionsContainer = document.getElementById('upcomingSessionsContainer');
  const bookNewBtn = document.getElementById('bookNewBtn');
  const bookingContainer = document.getElementById('bookingContainer');
  const backToSessions = document.getElementById('backToSessions');

  let selectedSubject = '', selectedDate = '', selectedTime = '';

  function blurActiveSoon() {
    requestAnimationFrame(() => document.activeElement?.blur?.());
  }
  // gentle animated scroll helper to reduce jarring jumps
  function gentleAnimateScrollTo(startY, endY, duration = 560) {
    const startTime = performance.now();
    const easeInOutCubic = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    function step(now) {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = easeInOutCubic(t);
      const current = Math.round(startY + (endY - startY) * eased);
      window.scrollTo(0, current);
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function gentleScrollToElement(el, offsetExtra = 8, duration = 560) {
    if (!el) return;
    const header = document.querySelector('.header');
    const offset = header ? header.offsetHeight : 64;
    const targetY = el.getBoundingClientRect().top + window.pageYOffset - offset - offsetExtra;
    const startY = window.scrollY || window.pageYOffset;
    gentleAnimateScrollTo(startY, Math.max(0, targetY), duration);
  }

  function handleSubjectSelection(e) {
    e?.preventDefault();
    subjectItems.forEach(si => si.classList.remove('active', 'selected'));
    this.classList.add('active');
    selectedSubject = this.dataset.subject || this.getAttribute('data-subject') || '';

    if (calendar) { calendar.style.display = 'block'; calendar.classList.add('active'); }
    if (timeSlots) { timeSlots.style.display = 'none'; timeSlots.classList.remove('active'); }

    if (typeof generateCalendar === 'function') { try { generateCalendar(); } catch {} }
  gentleScrollToElement(calendar, 12, 520);
    blurActiveSoon();
  }

  function handleBookNewSession() {
    const user = getCurrentUser();
    const guest = getGuestUser();
    
    // If not logged in and not a guest, show guest booking modal
    if (!user && !guest) {
      if (typeof showGuestBookingModal === 'function') {
        showGuestBookingModal(
          function(guestUser) {
            // Guest created successfully, show booking form
            upcomingSessionsContainer && (upcomingSessionsContainer.style.display = 'none');
            if (bookingContainer) { bookingContainer.style.display = 'block'; bookingContainer.classList.add('active'); }
            resetBookingForm();
            document.querySelector('.subject-selection')?.setAttribute('style', 'display:block');
            calendar && (calendar.style.display = 'none');
            timeSlots && (timeSlots.style.display = 'none');
          },
          function() {
            // User chose to sign up
            window.location.href = 'signup.html';
          }
        );
      }
      return;
    }
    
    // User or guest is already logged in
    upcomingSessionsContainer && (upcomingSessionsContainer.style.display = 'none');
    if (bookingContainer) { bookingContainer.style.display = 'block'; bookingContainer.classList.add('active'); }
    resetBookingForm();
    document.querySelector('.subject-selection')?.setAttribute('style', 'display:block');
    calendar && (calendar.style.display = 'none');
    timeSlots && (timeSlots.style.display = 'none');
  }
  function handleBackToSessions() {
    if (bookingContainer) { bookingContainer.style.display = 'none'; bookingContainer.classList.remove('active'); }
    upcomingSessionsContainer && (upcomingSessionsContainer.style.display = 'block');
    resetBookingForm();
  }

  function resetBookingForm() {
    selectedSubject = selectedDate = selectedTime = '';
    document.querySelectorAll('.subject-item.active,.subject-item.selected').forEach(i => i.classList.remove('active','selected'));
    calendar?.classList.remove('active');
    timeSlots?.classList.remove('active');
  }

  // Wire listeners
  subjectItems.forEach(item => {
    item.addEventListener('mousedown', e => e.preventDefault(), { passive: false });
    item.addEventListener('click', handleSubjectSelection);
    item.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSubjectSelection.call(item, e); }
    });
  });
  bookNewBtn?.addEventListener('click', handleBookNewSession);
  backToSessions?.addEventListener('click', handleBackToSessions);
});