# Navigate Authentication System

## Overview
Your Sign In and Sign Up buttons are now fully functional with localStorage-based authentication!

## What Was Created

### 1. **Authentication Pages**
- **signup.html** - User registration form with validation
- **signin.html** - User login form

### 2. **Authentication Logic** (`controller/auth.js`)
- `signup(username, email, password)` - Register new users
- `signin(usernameOrEmail, password, rememberMe)` - Login existing users
- `logout()` - Clear user session
- `isLoggedIn()` - Check authentication status
- `getCurrentUser()` - Get logged-in user data
- `updateUserProgress()` - Track user progress (lessons, quizzes, sessions)

### 3. **Auth State Manager** (`controller/auth-state.js`)
- Automatically updates header UI based on login state
- Shows username and Logout button when logged in
- Shows Sign In/Sign Up buttons when logged out
- Requires authentication for protected pages (like dashboard)

## Features

### User Registration (Sign Up)
- ✅ Username validation (minimum 3 characters)
- ✅ Email validation (proper format required)
- ✅ Password validation (minimum 6 characters)
- ✅ Password confirmation match
- ✅ Duplicate username/email detection
- ✅ Auto-redirect to dashboard after successful signup

### User Login (Sign In)
- ✅ Login with username OR email
- ✅ Password verification
- ✅ "Remember me" option
- ✅ Invalid credentials error handling
- ✅ Auto-redirect to dashboard after successful login

### User Progress Tracking
Each user has a progress object that tracks:
- **Completed Lessons** - Array of lesson IDs completed
- **Quiz Scores** - Array of quiz results with scores and timestamps
- **Study Time** - Total minutes spent studying
- **Sessions Attended** - Array of live session attendance records

### Protected Pages
- **Dashboard** - Requires authentication
- Automatically redirects to sign-in if not logged in

## How It Works

### 1. Data Storage
All user data is stored in `localStorage` under:
- `navigate_users` - Array of all registered users
- `navigate_current_user` - Currently logged-in user (without password)
- `navigate_remember_me` - Remember me flag

### 2. User Object Structure
```javascript
{
  id: "unique_timestamp_id",
  username: "john_doe",
  email: "john@example.com",
  password: "user_password",
  createdAt: "2025-11-11T...",
  lastLogin: "2025-11-11T...",
  progress: {
    completedLessons: ["lesson1", "lesson2"],
    quizScores: [{quizId: "quiz1", score: 85, completedAt: "..."}],
    totalStudyTime: 120,
    sessionsAttended: [{sessionId: "...", subject: "...", date: "..."}]
  }
}
```

### 3. Error Handling
- **Sign Up Errors:**
  - Username already exists
  - Email already registered
  - Invalid email format
  - Password too short
  - Passwords don't match

- **Sign In Errors:**
  - Invalid username/email or password
  - Empty fields

## Testing Instructions

### Test Sign Up:
1. Click "Sign Up" button
2. Enter username (min 3 chars): `testuser`
3. Enter email: `test@example.com`
4. Enter password (min 6 chars): `password123`
5. Confirm password: `password123`
6. Click "Sign Up"
7. Should redirect to dashboard with welcome message

### Test Sign In:
1. Click "Sign In" button
2. Enter username or email: `testuser` or `test@example.com`
3. Enter password: `password123`
4. Optionally check "Remember me"
5. Click "Sign In"
6. Should redirect to dashboard

### Test Logout:
1. When logged in, click the "Logout" button in header
2. Confirm logout
3. Should redirect to home page
4. Header should show Sign In/Sign Up buttons again

### Test Protected Page:
1. Logout (if logged in)
2. Try to access dashboard directly
3. Should be redirected to sign-in page with alert

## Integration with Existing Features

### Live Sessions
When a user books a session, you can track it:
```javascript
updateUserProgress('session', {
  sessionId: 'session123',
  subject: 'World History',
  date: '2025-11-15'
});
```

### Lessons
When a user completes a lesson:
```javascript
updateUserProgress('lesson', {
  lessonId: 'lesson_ancient_greece'
});
```

### Quizzes
When a user completes a quiz:
```javascript
updateUserProgress('quiz', {
  quizId: 'quiz_roman_empire',
  score: 85
});
```

### Study Time
Track study time:
```javascript
updateUserProgress('studytime', {
  minutes: 30
});
```

## Security Notes

⚠️ **Important:** This is a client-side authentication system for educational purposes.

For production use:
- Passwords should be hashed (use bcrypt or similar)
- User data should be stored on a server, not in localStorage
- Implement proper session management with tokens
- Add HTTPS encryption
- Implement rate limiting for login attempts
- Add email verification
- Add password reset functionality

## Pages Updated

All pages now have auth state management:
- ✅ index.html
- ✅ dashboard.html (requires authentication)
- ✅ services.html
- ✅ schedule.html
- ✅ resources.html
- ✅ about.html
- ✅ join-session.html
- ✅ live-sessions.html
- ✅ lessons.html
- ✅ videos.html
- ✅ quizzes.html
- ✅ downloads.html

## Viewing User Data

To view all users in browser console:
```javascript
JSON.parse(localStorage.getItem('navigate_users'))
```

To view current user:
```javascript
JSON.parse(localStorage.getItem('navigate_current_user'))
```

To clear all auth data (reset):
```javascript
localStorage.removeItem('navigate_users')
localStorage.removeItem('navigate_current_user')
localStorage.removeItem('navigate_remember_me')
```

---

**Your authentication system is now fully functional!** Users can sign up, sign in, and their progress will be tracked automatically. The UI updates dynamically based on login state across all pages.
