/**
 * Rewards Integration Bridge
 * Automatically triggers rewards system when user completes activities
 * Connects user-tracking.js to rewards.js via custom events
 */

(function() {
  'use strict';

  /**
   * Map subject names to category keys for rewards system
   */
  function mapSubjectToCategory(subject) {
    if (!subject) return null;
    
    const subjectLower = subject.toLowerCase();
    if (subjectLower.includes('us') || subjectLower.includes('u.s.') || subjectLower.includes('american')) {
      return 'usHistory';
    } else if (subjectLower.includes('world')) {
      return 'worldHistory';
    } else if (subjectLower.includes('european') || subjectLower.includes('europe')) {
      return 'europeanHistory';
    }
    return null;
  }

  /**
   * Map lesson/video titles to subcategories
   */
  function mapToSubcategory(title, category) {
    if (!title) return null;
    
    const titleLower = title.toLowerCase();
    
    if (category === 'worldHistory') {
      // Ancient civilizations
      if (titleLower.includes('mesopotamia') || titleLower.includes('egypt') || 
          titleLower.includes('india') || titleLower.includes('indus valley')) {
        return 'ancientCivilizations';
      }
      // Ancient history
      if (titleLower.includes('ancient') || titleLower.includes('classical') || 
          titleLower.includes('greece') || titleLower.includes('rome')) {
        return 'ancientHistory';
      }
    } else if (category === 'europeanHistory') {
      // Medieval
      if (titleLower.includes('medieval') || titleLower.includes('feudalism') || 
          titleLower.includes('manorialism') || titleLower.includes('middle ages')) {
        return 'medieval';
      }
      // Early European
      if (titleLower.includes('fall of rome') || titleLower.includes('roman empire') || 
          titleLower.includes('christianity') || titleLower.includes('renaissance')) {
        return 'earlyEuropean';
      }
    }
    
    return null;
  }

  /**
   * Override trackLessonCompletion to trigger rewards
   */
  const originalTrackLessonCompletion = window.trackLessonCompletion;
  if (typeof originalTrackLessonCompletion === 'function') {
    window.trackLessonCompletion = function(lessonId, lessonTitle, subject) {
      // Call original tracking function
      originalTrackLessonCompletion.call(this, lessonId, lessonTitle, subject);
      
      // Trigger rewards event with category metadata
      const category = mapSubjectToCategory(subject);
      const subcategory = mapToSubcategory(lessonTitle, category);
      
      const eventDetail = {
        lessonId,
        lessonTitle,
        subject,
        category,
        subcategory
      };
      
      document.dispatchEvent(new CustomEvent('lesson:completed', { 
        detail: eventDetail 
      }));
      
      console.log('🎓 Lesson completed - Rewards updated:', eventDetail);
    };
  }

  /**
   * Override trackVideoWatched to trigger rewards
   */
  const originalTrackVideoWatched = window.trackVideoWatched;
  if (typeof originalTrackVideoWatched === 'function') {
    window.trackVideoWatched = function(videoId, videoTitle, subject) {
      // Call original tracking function
      originalTrackVideoWatched.call(this, videoId, videoTitle, subject);
      
      // Trigger rewards event with category metadata
      const category = mapSubjectToCategory(subject);
      const subcategory = mapToSubcategory(videoTitle, category);
      
      const eventDetail = {
        videoId,
        videoTitle,
        subject,
        category,
        subcategory
      };
      
      document.dispatchEvent(new CustomEvent('video:watched', { 
        detail: eventDetail 
      }));
      
      console.log('🎬 Video watched - Rewards updated:', eventDetail);
    };
  }

  /**
   * Override trackQuizCompletion to trigger rewards
   */
  const originalTrackQuizCompletion = window.trackQuizCompletion;
  if (typeof originalTrackQuizCompletion === 'function') {
    window.trackQuizCompletion = function(quizId, quizTitle, score, totalQuestions) {
      // Call original tracking function
      originalTrackQuizCompletion.call(this, quizId, quizTitle, score, totalQuestions);
      
      // Extract subject from quiz title
      let subject = '';
      if (quizTitle.toLowerCase().includes('us') || quizTitle.toLowerCase().includes('american')) {
        subject = 'US History';
      } else if (quizTitle.toLowerCase().includes('world')) {
        subject = 'World History';
      } else if (quizTitle.toLowerCase().includes('european')) {
        subject = 'European History';
      }
      
      const category = mapSubjectToCategory(subject);
      
      const eventDetail = {
        quizId,
        quizTitle,
        score,
        totalQuestions,
        subject,
        category
      };
      
      document.dispatchEvent(new CustomEvent('quiz:completed', { 
        detail: eventDetail 
      }));
      
      console.log('📝 Quiz completed - Rewards updated:', eventDetail);
    };
  }

  /**
   * Trigger daily login reward when user is detected as logged in
   */
  function checkDailyLogin() {
    // Check if user is logged in
    const currentUser = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    if (!currentUser) return;

    // Check if we've already awarded today's login (user-specific)
    const today = new Date().toISOString().split('T')[0];
    const loginKey = 'navigate_last_login_reward_user_' + currentUser.id;
    const lastLogin = localStorage.getItem(loginKey);
    
    if (lastLogin !== today) {
      localStorage.setItem(loginKey, today);
      
      document.dispatchEvent(new CustomEvent('user:login', { 
        detail: { date: today, userId: currentUser.id } 
      }));
      
      console.log('🔑 Daily login - Rewards updated');
    }
  }

  /**
   * Monitor for session attendance (if live sessions are tracked)
   */
  const originalTrackSessionAttendance = window.trackSessionAttendance;
  if (typeof originalTrackSessionAttendance === 'function') {
    window.trackSessionAttendance = function(sessionTitle, duration) {
      // Call original tracking function
      originalTrackSessionAttendance.call(this, sessionTitle, duration);
      
      // You can add a custom event here if you want to reward session attendance
      console.log('📅 Session attended:', sessionTitle);
    };
  }

  // Check for daily login on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkDailyLogin);
  } else {
    checkDailyLogin();
  }

  // Re-check when page becomes visible (tab switching)
  document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
      checkDailyLogin();
    }
  });

  console.log('✅ Rewards integration bridge loaded');
})();
