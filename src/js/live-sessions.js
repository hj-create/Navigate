document.addEventListener('DOMContentLoaded', function () {
  // DOM Elements
  const subjectItems = document.querySelectorAll('.subject-item');
  const calendar = document.getElementById('sessionCalendar');
  const timeSlots = document.getElementById('timeSlots');
  const calendarGrid = document.querySelector('.calendar-grid');
  const upcomingSessionsContainer = document.getElementById('upcomingSessionsContainer');
  const bookNewBtn = document.getElementById('bookNewBtn');
  const bookingContainer = document.getElementById('bookingContainer');
  const backToSessions = document.getElementById('backToSessions');
  const subscribeBtn = document.createElement('button');
  subscribeBtn.className = 'subscribe-btn';

  // Pagination setup
  const sessionsPerPage = 5;
  let currentPage = 1;
  const prevPageBtn = document.getElementById('prevPage');
  const nextPageBtn = document.getElementById('nextPage');
  const pageInfo = document.getElementById('pageInfo');
  const upcomingSessions = document.querySelector('.upcoming-sessions');

  // State
  let selectedSubject = '';
  let selectedDate = '';
  let selectedTime = '';
  let isUpcomingMinimized = false;

  // Utility: blur active element to avoid focus flash
  function blurActiveSoon() {
    requestAnimationFrame(() => {
      const ae = document.activeElement;
      if (ae && typeof ae.blur === 'function') ae.blur();
    });
  }

  // Utility: instant scroll with header offset (no smooth)
  function scrollIntoViewNoSmooth(el, extraOffset = 8) {
    if (!el) return;
    const header = document.querySelector('.header');
    const offset = header ? header.offsetHeight : 64;
    const top = el.getBoundingClientRect().top + window.scrollY - offset - extraOffset;
    window.scrollTo({ top: Math.max(0, top), behavior: 'auto' });
  }

  function updatePagination() {
    const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
    const totalPages = Math.ceil(Math.max(1, sessions.length) / sessionsPerPage);

    if (pageInfo) pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    if (prevPageBtn) prevPageBtn.disabled = currentPage === 1;
    if (nextPageBtn) nextPageBtn.disabled = currentPage === totalPages;

    if (!upcomingSessions) return;

    const start = (currentPage - 1) * sessionsPerPage;
    const end = start + sessionsPerPage;
    const currentSessions = sessions.slice(start, end);

    upcomingSessions.innerHTML = '';
    currentSessions.forEach(session => {
      const sessionCard = createSessionCard(session);
      upcomingSessions.appendChild(sessionCard);
    });
  }

  function createSessionCard(session) {
    const card = document.createElement('div');
    card.className = 'session-card';
    card.innerHTML = `
      <div class="session-info">
        <h4>${session.subject.charAt(0).toUpperCase() + session.subject.slice(1)}</h4>
        <p class="session-date">${session.date} - ${session.time}</p>
      </div>
      <button class="join-session-btn">
        <span class="material-icons">video_call</span>
        Join
      </button>
    `;

    card.querySelector('.join-session-btn')?.addEventListener('click', function () {
      const joinUrl = new URL('../pages/join-session.html', window.location.href);
      joinUrl.searchParams.set('subject', session.subject);
      joinUrl.searchParams.set('date', session.date);
      joinUrl.searchParams.set('time', session.time);
      joinUrl.searchParams.set('meetLink', session.meetLink);
      window.location.href = joinUrl.toString();
    });

    return card;
  }

  function initializeEventListeners() {
    // Pagination
    prevPageBtn?.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        updatePagination();
      }
    });

    nextPageBtn?.addEventListener('click', () => {
      const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
      const totalPages = Math.ceil(Math.max(1, sessions.length) / sessionsPerPage);
      if (currentPage < totalPages) {
        currentPage++;
        updatePagination();
      }
    });

    // Subject selection: prevent focus on mousedown; blur after click
    subjectItems.forEach(item => {
      item.addEventListener('mousedown', e => e.preventDefault(), { passive: false });
      item.addEventListener('click', handleSubjectSelection);
      item.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleSubjectSelection.call(item, e);
        }
      });
    });

    // Book / Back
    bookNewBtn?.addEventListener('click', handleBookNewSession);
    backToSessions?.addEventListener('click', handleBackToSessions);

    // Time slots
    document.querySelectorAll('.time-slot').forEach(slot => {
      slot.addEventListener('click', handleTimeSlotSelection);
    });

    // Subscribe
    subscribeBtn.addEventListener('click', handleSubscribe);
  }

  // Event handlers
  function handleSubjectSelection(e) {
    if (e) e.preventDefault();

    subjectItems.forEach(si => si.classList.remove('active'));
    this.classList.add('active');
    selectedSubject = this.dataset.subject || '';

    if (calendar) {
      calendar.style.display = 'block';
      calendar.classList.add('active');
    }
    if (timeSlots) {
      timeSlots.classList.remove('active');
      timeSlots.style.display = 'none';
    }

    // If the project defines generateCalendar(), call it
    if (typeof generateCalendar === 'function') {
      try { generateCalendar(); } catch (_) {}
    }

    // Instant scroll (no smooth) to avoid header repaint artifact
    scrollIntoViewNoSmooth(calendar, 8);
    blurActiveSoon();
  }

  function handleBookNewSession() {
    if (upcomingSessionsContainer) upcomingSessionsContainer.style.display = 'none';
    if (bookingContainer) {
      bookingContainer.style.display = 'block';
      bookingContainer.classList.add('active');
    }

    resetBookingForm();
    const subjectSel = document.querySelector('.subject-selection');
    if (subjectSel) subjectSel.style.display = 'block';
    if (calendar) calendar.style.display = 'none';
    if (timeSlots) timeSlots.style.display = 'none';
  }

  function handleBackToSessions() {
    if (bookingContainer) {
      bookingContainer.style.display = 'none';
      bookingContainer.classList.remove('active');
    }
    if (upcomingSessionsContainer) upcomingSessionsContainer.style.display = 'block';
    resetBookingForm();
  }

  function handleTimeSlotSelection() {
    if (!selectedSubject || !selectedDate) return;

    document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
    this.classList.add('selected');
    selectedTime = this.textContent.trim();

    showConfirmationMessage();
  }

  function showConfirmationMessage() {
    if (!timeSlots) return;

    const confirmationDiv = document.createElement('div');
    confirmationDiv.className = 'confirmation-message';
    confirmationDiv.innerHTML = `
      <div class="confirmation-content">
        <h3>Confirm Your Live Session</h3>
        <div class="session-details">
          <p><strong>Subject:</strong> ${selectedSubject}</p>
          <p><strong>Date:</strong> ${selectedDate}</p>
          <p><strong>Time:</strong> ${selectedTime}</p>
        </div>
        <div class="confirmation-buttons">
          <button class="confirm-btn" id="confirmSession">
            <span class="material-icons">check_circle</span>
            Confirm Session
          </button>
          <button class="cancel-btn" id="cancelSession">
            <span class="material-icons">cancel</span>
            Cancel
          </button>
        </div>
      </div>
    `;

    const existingMessage = document.querySelector('.confirmation-message');
    if (existingMessage) existingMessage.remove();

    timeSlots.appendChild(confirmationDiv);

    document.getElementById('confirmSession')?.addEventListener('click', function () {
      const meetLink = generateMeetLink();
      saveSession(meetLink);

      confirmationDiv.innerHTML = `
        <div class="confirmation-content success">
          <span class="material-icons success-icon">check_circle</span>
          <h3>Session Booked Successfully!</h3>
          <p>Your live session has been confirmed.</p>
          <div class="confirmation-buttons">
            <button class="join-btn" onclick="navigateToJoinSession('${meetLink}')">
              <span class="material-icons">video_call</span>
              Join Session
            </button>
          </div>
        </div>
      `;
    });

    document.getElementById('cancelSession')?.addEventListener('click', function () {
      confirmationDiv.remove();
      const selectedSlot = document.querySelector('.time-slot.selected');
      if (selectedSlot) selectedSlot.classList.remove('selected');
      selectedTime = '';
    });

    // No smooth scrolling here either
    scrollIntoViewNoSmooth(confirmationDiv, 16);
  }

  function showBookingMessage() {
    const bookingMessageDiv = document.querySelector('.booking-message') || createBookingMessageDiv();
    bookingMessageDiv.innerHTML = generateBookingMessageHTML();
    bookingMessageDiv.style.display = 'block';

    setTimeout(() => {
      scrollIntoViewNoSmooth(bookingMessageDiv, 12);
    }, 50);

    const confirmBtn = bookingMessageDiv.querySelector('.confirm-booking-btn');
    confirmBtn.addEventListener('click', handleConfirmBooking);
  }

  function createBookingMessageDiv() {
    const div = document.createElement('div');
    div.className = 'booking-message';
    timeSlots?.appendChild(div);
    return div;
  }

  function generateBookingMessageHTML() {
    return `
      <div class="booking-summary">
        <h3>Booking Summary</h3>
        <div>
          <p><strong>Subject:</strong> ${selectedSubject}</p>
          <p><strong>Date:</strong> ${selectedDate}</p>
          <p><strong>Time:</strong> ${selectedTime}</p>
        </div>
        <button class="confirm-booking-btn">
          <span class="material-icons">check_circle</span>
          Confirm Booking
        </button>
      </div>
    `;
  }

  function handleConfirmBooking() {
    const meetLink = generateMeetLink();
    saveSession(meetLink);
    navigateToJoinSession(meetLink);
  }

  function generateMeetLink() {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    let link = 'meet.google.com/';
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3 + Math.floor(Math.random() * 2); j++) {
        link += chars[Math.floor(Math.random() * chars.length)];
      }
      if (i < 2) link += '-';
    }
    return link;
  }

  function saveSession(meetLink) {
    const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
    sessions.push({
      subject: selectedSubject,
      date: selectedDate,
      time: selectedTime,
      meetLink: meetLink
    });
    localStorage.setItem('sessions', JSON.stringify(sessions));
  }

  function navigateToJoinSession(meetLink) {
    const joinUrl = new URL('../pages/join-session.html', window.location.href);
    joinUrl.searchParams.set('subject', selectedSubject);
    joinUrl.searchParams.set('date', selectedDate);
    joinUrl.searchParams.set('time', selectedTime);
    joinUrl.searchParams.set('meetLink', meetLink);
    window.location.href = joinUrl.toString();
  }

  function resetBookingForm() {
    selectedSubject = '';
    selectedDate = '';
    selectedTime = '';
    document.querySelectorAll('.subject-item.selected, .subject-item.active')
      .forEach(i => i.classList.remove('selected', 'active'));
    calendar?.classList.remove('active');
    timeSlots?.classList.remove('active');
    subscribeBtn.classList.remove('active');
    document.querySelector('.success-message')?.classList.remove('active');
    document.querySelector('.success-actions')?.classList.remove('active');
  }

  function init() {
    updatePagination();
    initializeEventListeners();
    if (bookingContainer) bookingContainer.style.display = 'none';
  }

  init();
});