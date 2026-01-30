// Guest Booking System
// Handles session booking for guest users

/**
 * Show guest booking modal
 * @param {Function} onConfirm - Callback when guest confirms booking
 * @param {Function} onSignup - Callback when guest chooses to sign up instead
 */
function showGuestBookingModal(onConfirm, onSignup) {
    // Remove any existing modal first
    const existingModal = document.querySelector('.navigate-modal-overlay');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.className = 'navigate-modal-overlay';
    modal.innerHTML = `
        <div class="navigate-modal-content booking-modal">
            <div class="navigate-modal-header">
                <span class="material-icons navigate-modal-icon">event_available</span>
                <h2>Ready to Book Your Learning Session?</h2>
            </div>
            
            <div class="navigate-modal-body">
                <p class="navigate-modal-intro">
                    Awesome! You're taking the next step in your history learning journey. You have two ways to book your session:
                </p>
                
                <div class="booking-options">
                    <div class="booking-option guest-option">
                        <div class="option-header">
                            <span class="material-icons">directions_run</span>
                            <h3>Quick Guest Booking</h3>
                            <span class="option-badge">Fast</span>
                        </div>
                        <p class="option-description">Perfect if you just want to try out a session today!</p>
                        <ul class="option-features">
                            <li><span class="material-icons check">check_circle</span> Book a session for <strong>today</strong></li>
                            <li><span class="material-icons check">check_circle</span> No account needed</li>
                            <li><span class="material-icons check">check_circle</span> Join via email link</li>
                        </ul>
                        <div class="option-limitations">
                            <p><strong>Heads up:</strong></p>
                            <ul>
                                <li><span class="material-icons">event_busy</span> Can't book future sessions</li>
                                <li><span class="material-icons">trending_flat</span> No progress tracking</li>
                                <li><span class="material-icons">stars</span> No rewards or badges</li>
                            </ul>
                        </div>
                    </div>
                    
                    <div class="booking-option account-option recommended">
                        <div class="option-header">
                            <span class="material-icons">workspace_premium</span>
                            <h3>Free Student Account</h3>
                            <span class="option-badge recommended-badge">Recommended</span>
                        </div>
                        <p class="option-description">Get the full learning experience—it's free and takes 30 seconds!</p>
                        <ul class="option-features">
                            <li><span class="material-icons check">check_circle</span> Book sessions <strong>anytime</strong></li>
                            <li><span class="material-icons check">check_circle</span> Track your progress</li>
                            <li><span class="material-icons check">check_circle</span> Earn points & badges</li>
                            <li><span class="material-icons check">check_circle</span> Access your dashboard</li>
                            <li><span class="material-icons check">check_circle</span> Build learning streaks</li>
                            <li><span class="material-icons check">check_circle</span> Personalized insights</li>
                        </ul>
                    </div>
                </div>
                
                <div class="guest-form-section" id="guestFormSection" style="display: none;">
                    <h3><span class="material-icons">edit</span> Guest Information</h3>
                    <p>Just need a couple details to send you the session link:</p>
                    <form id="guestBookingForm" class="guest-form">
                        <div class="form-group">
                            <label for="guestName">
                                <span class="material-icons">person</span>
                                What should we call you?
                            </label>
                            <input type="text" id="guestName" name="guestName" required placeholder="Your name">
                        </div>
                        
                        <div class="form-group">
                            <label for="guestEmail">
                                <span class="material-icons">email</span>
                                Where should we send session details?
                            </label>
                            <input type="email" id="guestEmail" name="guestEmail" required placeholder="your.email@example.com">
                        </div>
                        
                        <p class="guest-note">
                            <span class="material-icons">lock</span>
                            We'll only use this for today's session. Your info won't be saved.
                        </p>
                    </form>
                </div>
            </div>
            
            <div class="navigate-modal-footer">
                <button type="button" class="navigate-btn navigate-btn-accent" id="guestContinueBtn">
                    <span class="material-icons">event</span>
                    Continue as Guest
                </button>
                <button type="button" class="navigate-btn navigate-btn-primary" onclick="handleGuestSignup()">
                    <span class="material-icons">rocket_launch</span>
                    Create Free Account
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Store callbacks for button handlers
    window._guestModalCallbacks = { onConfirm, onSignup };
    
    // Add event listener to Continue as Guest button
    const guestContinueBtn = document.getElementById('guestContinueBtn');
    console.log('Continue as Guest button found:', guestContinueBtn);
    if (guestContinueBtn) {
        console.log('Adding click listener to Continue as Guest button');
        guestContinueBtn.addEventListener('click', function() {
            console.log('Continue as Guest button clicked!');
            showGuestForm();
        });
    } else {
        console.error('Could not find guestContinueBtn element');
    }
    
    // Prevent scrolling on body
    document.body.style.overflow = 'hidden';
}

/**
 * Show guest form section
 */
function showGuestForm() {
    console.log('showGuestForm called');
    const formSection = document.getElementById('guestFormSection');
    const optionsSection = document.querySelector('.booking-options');
    const guestBtn = document.getElementById('guestContinueBtn');
    const footer = document.querySelector('.navigate-modal-footer');
    
    console.log('Form section:', formSection);
    console.log('Options section:', optionsSection);
    
    if (formSection && optionsSection) {
        optionsSection.style.display = 'none';
        formSection.style.display = 'block';
        
        // Update footer buttons
        if (guestBtn) guestBtn.style.display = 'none';
        const primaryBtn = footer.querySelector('.navigate-btn-primary');
        if (primaryBtn) primaryBtn.style.display = 'none';
        
        // Add submit button for form
        const existingSubmit = footer.querySelector('.btn-guest-submit');
        if (!existingSubmit) {
            const submitBtn = document.createElement('button');
            submitBtn.type = 'button'; // Changed from 'submit' to 'button'
            submitBtn.className = 'navigate-btn navigate-btn-primary btn-guest-submit';
            submitBtn.innerHTML = '<span class="material-icons">check_circle</span> Book as Guest';
            
            // Add click handler to submit button
            submitBtn.addEventListener('click', function() {
                console.log('Submit button clicked');
                const form = document.getElementById('guestBookingForm');
                const name = document.getElementById('guestName').value.trim();
                const email = document.getElementById('guestEmail').value.trim();
                
                console.log('Name:', name, 'Email:', email);
                
                if (name && email) {
                    const guest = createGuestUser(name, email);
                    console.log('Guest created:', guest);
                    closeGuestBookingModal();
                    
                    const callbacks = window._guestModalCallbacks;
                    console.log('Callbacks:', callbacks);
                    if (callbacks && callbacks.onConfirm) {
                        console.log('Calling onConfirm callback');
                        callbacks.onConfirm(guest);
                    }
                    
                    if (typeof updateAuthUI === 'function') {
                        updateAuthUI();
                    }
                } else {
                    alert('Please enter both name and email');
                }
            });
            
            footer.appendChild(submitBtn);
        }
        
        formSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

/**
 * Close guest modal
 */
function closeGuestBookingModal() {
    const modal = document.querySelector('.navigate-modal-overlay');
    if (modal) {
        modal.remove();
        document.body.style.overflow = '';
    }
    window._guestModalCallbacks = null;
}

// Keep old function name for compatibility
function closeGuestModal() {
    closeGuestBookingModal();
}

/**
 * Handle guest choosing to sign up instead
 */
function handleGuestSignup() {
    const callbacks = window._guestModalCallbacks;
    closeGuestModal();
    
    if (callbacks && callbacks.onSignup) {
        callbacks.onSignup();
    } else {
        // Default: redirect to signup page
        window.location.href = 'signup.html';
    }
}

/**
 * Show guest date restriction modal
 * Shown when a guest tries to book a session for a future date
 */
function showGuestDateRestrictionModal() {
    // Remove any existing modal first
    const existingModal = document.querySelector('.navigate-modal-overlay');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.className = 'navigate-modal-overlay';
    modal.innerHTML = `
        <div class="navigate-modal-content">
            <div class="navigate-modal-header">
                <span class="material-icons navigate-modal-icon">event_busy</span>
                <h2>Oops! Future Sessions Need an Account</h2>
            </div>
            
            <div class="navigate-modal-body">
                <p class="navigate-modal-description">
                    Hey there! We noticed you're trying to book a session for a future date. 
                    As a guest, you can only book sessions for <strong>today</strong>.
                </p>
                
                <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 1rem; border-radius: 0.5rem; margin: 1.5rem 0;">
                    <div style="display: flex; align-items: flex-start; gap: 0.75rem;">
                        <span class="material-icons" style="color: #856404; font-size: 1.5rem;">info</span>
                        <div>
                            <p style="margin: 0; color: #856404; font-weight: 500; margin-bottom: 0.5rem;">Why the limitation?</p>
                            <p style="margin: 0; color: #856404; font-size: 0.9rem; line-height: 1.5;">
                                Guest accounts are designed for quick, same-day sessions. To book future sessions and unlock all features, 
                                you'll need a free student account—it only takes 30 seconds!
                            </p>
                        </div>
                    </div>
                </div>
                
                <div style="background: linear-gradient(135deg, #f1f8f4, #e8f5e9); border-radius: 0.75rem; padding: 1.25rem; border: 2px solid #4caf50;">
                    <h3 style="display: flex; align-items: center; gap: 0.5rem; margin: 0 0 1rem 0; color: #2e7d32;">
                        <span class="material-icons">workspace_premium</span>
                        What You'll Get With a Free Account
                    </h3>
                    <ul class="navigate-feature-list benefits" style="margin: 0; padding: 0; list-style: none;">
                        <li style="display: flex; align-items: flex-start; gap: 0.75rem; margin-bottom: 0.75rem;">
                            <span class="material-icons" style="color: #4caf50; font-size: 1.125rem; flex-shrink: 0; margin-top: 0.125rem;">check_circle</span>
                            <span>Book sessions <strong>anytime</strong>—today, tomorrow, or next week!</span>
                        </li>
                        <li style="display: flex; align-items: flex-start; gap: 0.75rem; margin-bottom: 0.75rem;">
                            <span class="material-icons" style="color: #4caf50; font-size: 1.125rem; flex-shrink: 0; margin-top: 0.125rem;">check_circle</span>
                            <span>Track your learning progress across all subjects</span>
                        </li>
                        <li style="display: flex; align-items: flex-start; gap: 0.75rem; margin-bottom: 0.75rem;">
                            <span class="material-icons" style="color: #4caf50; font-size: 1.125rem; flex-shrink: 0; margin-top: 0.125rem;">check_circle</span>
                            <span>Earn points, badges, and unlock rewards</span>
                        </li>
                        <li style="display: flex; align-items: flex-start; gap: 0.75rem; margin-bottom: 0.75rem;">
                            <span class="material-icons" style="color: #4caf50; font-size: 1.125rem; flex-shrink: 0; margin-top: 0.125rem;">check_circle</span>
                            <span>Access your personalized dashboard</span>
                        </li>
                        <li style="display: flex; align-items: flex-start; gap: 0.75rem;">
                            <span class="material-icons" style="color: #4caf50; font-size: 1.125rem; flex-shrink: 0; margin-top: 0.125rem;">check_circle</span>
                            <span>Build your learning streak and stay motivated!</span>
                        </li>
                    </ul>
                </div>
            </div>
            
            <div class="navigate-modal-footer center">
                <button type="button" class="navigate-btn navigate-btn-secondary" onclick="closeGuestDateRestrictionModal()">
                    <span class="material-icons">arrow_back</span>
                    Go Back
                </button>
                <button type="button" class="navigate-btn navigate-btn-primary" onclick="redirectToSignup()">
                    <span class="material-icons">rocket_launch</span>
                    Create Free Account
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
}

/**
 * Close guest date restriction modal
 */
function closeGuestDateRestrictionModal() {
    const modal = document.querySelector('.navigate-modal-overlay');
    if (modal) {
        modal.remove();
        document.body.style.overflow = '';
    }
}

/**
 * Redirect to signup page
 */
function redirectToSignup() {
    window.location.href = 'signup.html';
}


/**
 * Check if user can book session
 * @param {string} sessionDate - Date of the session
 * @returns {Object} Result with canBook boolean and reason
 */
function canBookSession(sessionDate) {
    const user = getCurrentUser();
    const guest = getGuestUser();
    
    if (user) {
        // Regular users can book any session
        return { canBook: true, isGuest: false };
    }
    
    if (guest) {
        // Guests can only book sessions for today
        const today = new Date().toDateString();
        const bookingDate = new Date(sessionDate).toDateString();
        
        if (today === bookingDate) {
            return { canBook: true, isGuest: true };
        } else {
            return { 
                canBook: false, 
                isGuest: true, 
                reason: 'Guests can only book sessions for today. Please sign up to book future sessions.' 
            };
        }
    }
    
    // Not logged in at all
    return { canBook: false, isGuest: false, reason: 'Please log in or continue as guest to book a session.' };
}

/**
 * Attempt to book a session with guest support
 * @param {Object} sessionData - Session booking data
 * @param {Function} onSuccess - Callback on successful booking
 */
function attemptSessionBooking(sessionData, onSuccess) {
    const user = getCurrentUser();
    const guest = getGuestUser();
    
    if (user) {
        // Regular user - book normally
        if (updateUserProgress('session', sessionData)) {
            if (onSuccess) onSuccess(false); // false = not guest
        }
        return;
    }
    
    if (guest) {
        // Guest user - check date restriction
        const result = canBookSession(sessionData.date);
        
        if (result.canBook) {
            if (bookGuestSession(sessionData)) {
                if (onSuccess) onSuccess(true); // true = guest
            }
        }
        // If guest can't book (future date), silently prevent booking
        return;
    }
    
    // No user - show guest booking modal
    showGuestBookingModal(
        function(guestUser) {
            // Guest confirmed - try booking again
            const result = canBookSession(sessionData.date);
            if (result.canBook) {
                if (bookGuestSession(sessionData)) {
                    if (onSuccess) onSuccess(true);
                }
            }
            // If guest can't book (future date), silently prevent booking
        },
        function() {
            // User chose to sign up
            sessionStorage.setItem('navigate_pending_booking', JSON.stringify(sessionData));
            window.location.href = 'signup.html';
        }
    );
}
