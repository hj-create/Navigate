(() => {
  const ready = (fn) => (document.readyState === 'loading') ? document.addEventListener('DOMContentLoaded', fn) : fn();
  const log = (...a) => console.info('[RewardsHub]', ...a);
  const warn = (...a) => console.warn('[RewardsHub]', ...a);

  const detectSubject = () => {
    const qs = new URLSearchParams(location.search).get('quiz');
    if (['us','world','european'].includes(qs)) return qs;

    const p = location.pathname.toLowerCase();
    if (p.includes('us-history')) return 'us';
    if (p.includes('world-history')) return 'world';
    if (p.includes('european-history')) return 'european';

    const bodySubj = document.body?.dataset?.subject;
    if (['us','world','european'].includes(bodySubj)) return bodySubj;

    const txt = (document.body.textContent || '').toLowerCase();
    if (txt.includes('u.s. history') || txt.includes('us history')) return 'us';
    if (txt.includes('world history')) return 'world';
    if (txt.includes('european history')) return 'european';

    warn('Subject not detected. Defaulting to "us". Set <body data-subject="us|world|european"> for accuracy.');
    return 'us';
  };

  const hasRewards = () => typeof window.NavigateRewards === 'object'
    && typeof window.NavigateRewards.completeLesson === 'function';

  let awarded = { lesson:false, video:false, quiz:false };

  const wireLessons = (subject) => {
    const targets = new Set();
    document.querySelectorAll('[data-complete-lesson], .complete-lesson, #completeLesson').forEach(el => targets.add(el));
    document.querySelectorAll('button, a').forEach(el => {
      const t = (el.textContent || '').trim().toLowerCase();
      if (t.includes('complete') || t.includes('mark as done') || t.includes('finish')) targets.add(el);
    });
    targets.forEach(el => el.addEventListener('click', () => {
      if (awarded.lesson) return;
      awarded.lesson = true;
      window.NavigateRewards.completeLesson(subject);
      log('Lesson awarded via click target');
    }));
    log('Lessons wired. Targets:', targets.size);
  };

  const wireVideos = (subject) => {
    const vids = document.querySelectorAll('video');
    vids.forEach(v => v.addEventListener('ended', () => {
      if (awarded.video) return;
      awarded.video = true;
      window.NavigateRewards.watchVideo(true, subject);
      log('Video awarded via <video> ended');
    }));
    log('HTML5 videos:', vids.length);

    const ytFrames = document.querySelectorAll('iframe[src*="youtube.com"], iframe[src*="youtu.be"]');
    if (ytFrames.length) {
      const ensureYT = () => (window.YT && window.YT.Player) ? initYT() : setTimeout(ensureYT, 300);
      const initYT = () => ytFrames.forEach(frame => {
        if (frame.dataset.rewardsYtBound) return;
        frame.dataset.rewardsYtBound = '1';
        try {
          new YT.Player(frame, {
            events: { onStateChange: (e) => {
              if (e.data === YT.PlayerState.ENDED && !awarded.video) {
                awarded.video = true;
                window.NavigateRewards.watchVideo(true, subject);
                log('Video awarded via YouTube ended');
              }
            }}
          });
        } catch {}
      });
      if (!window.YT) { const s = document.createElement('script'); s.src = 'https://www.youtube.com/iframe_api'; document.head.appendChild(s); }
      ensureYT();
      log('YouTube iframes:', ytFrames.length);
    }
  };

  const wireQuizzes = (subject) => {
    const awardQuiz = (score) => {
      if (awarded.quiz) return;
      awarded.quiz = true;
      window.NavigateRewards.completeQuiz(Number(score), subject);
      log('Quiz awarded. Score:', score);
    };

    const orig = window.reportQuizScore;
    window.reportQuizScore = function(score) {
      try { if (typeof orig === 'function') orig.apply(this, arguments); } catch {}
      awardQuiz(score);
    };

    window.addEventListener('quiz:completed', (e) => {
      const s = e?.detail?.score;
      if (s != null) awardQuiz(s);
    });

    const candidates = ['#quizScore', '.quiz-score', '[data-quiz-score]', '.result-score', '#result', '.score', '[aria-live="polite"]'];
    const target = document.querySelector(candidates.join(','));
    if (target) {
      const obs = new MutationObserver(() => {
        const text = (target.textContent || '').toLowerCase();
        const m = text.match(/(\d+)\s*%/) || text.match(/score[:\s]+(\d+)/);
        if (m) { const val = Number(m[1]); if (!Number.isNaN(val)) { awardQuiz(val); obs.disconnect(); } }
      });
      obs.observe(target, { childList: true, subtree: true, characterData: true });
      log('Quiz observer attached to', target);
    } else {
      log('Quiz observer not attached (no score element found). Use window.reportQuizScore(finalScore).');
    }
  };

  ready(() => {
    if (location.protocol === 'file:') warn('Running from file://. Use a local server to keep localStorage consistent.');
    if (!hasRewards()) return warn('NavigateRewards not available. Ensure rewards.js is loaded before rewards-hub.js');

    const subject = detectSubject();
    log('Detected subject:', subject);

    // Wire based on DOM presence (no path assumptions)
    if (document.querySelector('video, iframe[src*="youtube.com"], iframe[src*="youtu.be"]')) wireVideos(subject);
    if (document.querySelector('form, [data-quiz], .quiz, [data-quiz-score], #quizScore')) wireQuizzes(subject);
    wireLessons(subject); // safe to always wire

    // Keyboard quick tests
    document.addEventListener('keydown', (e) => {
      if (e.altKey && e.shiftKey && e.code === 'KeyL') { window.NavigateRewards.completeLesson(subject); log('Test: lesson via Alt+Shift+L'); }
      if (e.altKey && e.shiftKey && e.code === 'KeyV') { window.NavigateRewards.watchVideo(true, subject); log('Test: video via Alt+Shift+V'); }
      if (e.altKey && e.shiftKey && e.code === 'KeyQ') { window.NavigateRewards.completeQuiz(85, subject); log('Test: quiz via Alt+Shift+Q'); }
    });
  });
})();