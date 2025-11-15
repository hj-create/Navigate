# Navigate — FBLA Web Design Project (2025)

Navigate is a comprehensive web-based history education platform providing structured learning through interactive lessons, video content, quizzes, live tutoring sessions, and personalized student progress tracking. Built as a 501(c)(3) nonprofit initiative to make quality history education accessible to all students.

## 🌐 Live Website

**[Visit Navigate →](https://hj-create.github.io/Navigate/src/)**

Experience the full Navigate platform with interactive lessons, video content, quizzes, and personalized progress tracking.

## Features

### Core Learning Resources
- **Interactive Lessons**: Canva-based lessons covering US History, World History, and European History
- **Video Library**: Curated CrashCourse YouTube videos organized by subject with full MLA citations
- **Quiz System**: Interactive quizzes with instant feedback and score tracking
- **Downloadable Materials**: Study guides and supplementary resources
- **Live Tutoring Sessions**: Bookable one-on-one and group tutoring with Google Meet integration

### User Features
- **Authentication System**: Secure sign-up/sign-in with localStorage-based user management
- **Personal Dashboard**: Real-time progress tracking with activity history and statistics
- **Progress Analytics**: Tracks lessons completed, videos watched, quizzes taken, and overall progress percentage
- **Activity Logging**: Complete history of user interactions with date/time stamps
- **Responsive Design**: Mobile-friendly interface with intuitive navigation

## Project Structure

```
Navigate/
├── README.md
├── src/
│   ├── index.html                 # Landing page
│   ├── controller/
│   │   ├── main.js               # Application bootstrap
│   │   ├── router.js             # Client-side routing
│   │   ├── auth.js               # User authentication logic
│   │   ├── auth-state.js         # Authentication state management
│   │   ├── user-tracking.js      # User activity tracking & analytics
│   │   └── dashboard.js          # Dashboard display logic
│   ├── js/
│   │   ├── live-sessions.js      # Live session booking & management
│   │   ├── chatbot.js            # AI chatbot integration
│   │   └── messenger.js          # Messaging functionality
│   ├── css/
│   │   ├── styles.css            # Global styles & CSS variables
│   │   ├── dashboard.css         # Dashboard-specific styles
│   │   └── live-sessions.css     # Live sessions page styles
│   └── view/
│       ├── sample.html
│       └── pages/
│           ├── about.html
│           ├── chatbotservices.html
│           ├── dashboard.html
│           ├── downloads.html
│           ├── join-session.html
│           ├── lessons.html
│           ├── live-sessions.html
│           ├── quizzes.html
│           ├── resources.html
│           ├── schedule.html
│           ├── services.html
│           ├── signin.html
│           ├── signup.html
│           ├── videos.html
│           ├── us-history-lessons.html
│           ├── us-history-videos.html
│           ├── world-history-lessons.html
│           ├── world-history-videos.html
│           ├── european-history-lessons.html
│           └── european-history-videos.html
```

## Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Python 3 (for local development server) OR VS Code Live Server extension

### Local Development Setup

1. **Clone the repository**
   ```sh
   git clone https://github.com/hj-create/Navigate.git
   cd Navigate
   ```

2. **Start a local server**
   
   **Option A: Python HTTP Server**
   ```sh
   python -m http.server 8000 --directory src
   ```
   Then open http://localhost:8000 in your browser
   
   **Option B: VS Code Live Server**
   - Install the Live Server extension in VS Code
   - Right-click on `src/index.html` and select "Open with Live Server"

3. **Create an account**
   - Navigate to the Sign Up page
   - Create a test account (data stored in localStorage)
   - Sign in to access personalized features

## Pages & Content

### Landing & Navigation
- **index.html**: Main landing page with site overview and navigation to all sections
- **about.html**: Information about Navigate as a 501(c)(3) nonprofit organization
- **services.html**: Overview of tutoring services and learning offerings
- **resources.html**: Central hub with clickable cards linking to Lessons, Videos, Quizzes, and Downloads

### Authentication
- **signin.html**: User login interface with credential validation
- **signup.html**: New user registration with account creation

### Dashboard & Analytics
- **dashboard.html**: Personalized student dashboard displaying:
  - Total sessions attended
  - Videos watched count
  - Lessons completed count
  - Overall progress percentage
  - Recent activity log with date range filtering
  - Activity type badges (lesson/video/quiz/session/download)

### Lessons
- **lessons.html**: Navigation hub with three clickable subject cards (US History, World History, European History)
- **us-history-lessons.html**: Three Canva-based interactive lessons:
  - Spanish Colonization of the Americas
  - Indigenous Americans Before Contact
  - The Columbian Exchange
- **world-history-lessons.html**: Three Canva-based interactive lessons:
  - Ancient India
  - Ancient Egypt
  - Ancient Mesopotamia
- **european-history-lessons.html**: Three Canva-based interactive lessons:
  - The Fall of the Roman Empire
  - The Rise of Christianity
  - Feudalism and Manorialism
- **Works Cited**: Comprehensive MLA bibliography with 16 sources including AP College Board, Khan Academy, library institutions, and textbooks

### Videos
- **videos.html**: Navigation hub with three clickable subject cards (US History, World History, European History)
- **us-history-videos.html**: Three CrashCourse YouTube videos with MLA citations:
  - Indigenous America (CrashCourse)
  - The Columbian Exchange (CrashCourse)
  - Spanish Colonization in the Americas (CrashCourse)
- **world-history-videos.html**: Three CrashCourse YouTube videos with MLA citations:
  - Ancient Mesopotamia (CrashCourse)
  - Ancient Egypt (CrashCourse)
  - Ancient India (CrashCourse)
- **european-history-videos.html**: Three CrashCourse YouTube videos with MLA citations:
  - The Fall of the Roman Empire (CrashCourse)
  - The Rise of Christianity (CrashCourse)
  - Feudalism and Manorialism (CrashCourse)

### Quizzes
- **quizzes.html**: Three interactive subject-based quizzes with instant feedback:
  - **World History Quiz**: Multiple choice questions covering ancient civilizations
  - **US History Quiz**: Multiple choice questions covering early American history
  - **European History Quiz**: Multiple choice questions covering medieval and early modern Europe
  - Each quiz displays score percentage and tracks performance in user analytics

### Downloads
- **downloads.html**: Downloadable study materials and supplementary resources
  - PDF study guides
  - Reference materials
  - All downloads tracked in user activity log

### Live Tutoring
- **schedule.html**: Overview of available tutoring schedules
- **live-sessions.html**: Session catalog with booking interface featuring:
  - Session type (1-on-1 or group)
  - Subject area
  - Instructor information
  - Time slots
  - Booking buttons
  - Google Meet link generation
- **join-session.html**: Confirmation page with meeting access link and session details

### Additional Features
- **chatbotservices.html**: AI-powered chatbot for student questions and support
- **messenger.js**: Messaging functionality for communication

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Custom CSS with CSS variables for theming, Material Icons
- **Data Persistence**: localStorage for user data, authentication, and activity tracking
- **External Integrations**:
  - YouTube (CrashCourse videos)
  - Canva (interactive lessons)
  - Google Meet (live tutoring sessions)

## Technical Features

### User Tracking System
All user interactions are tracked and stored per-user in localStorage:
- **Lessons**: Tracks completion with deduplication (9 total lessons)
- **Videos**: Records views with deduplication (9 total videos)
- **Quizzes**: Stores scores and calculates running average (3 quizzes)
- **Downloads**: Logs accessed materials
- **Sessions**: Records live tutoring attendance

**Core Tracking Functions**:
- `trackLessonCompletion()`: Records completed lessons
- `trackVideoWatched()`: Tracks video views with deduplication
- `trackQuizCompletion()`: Records quiz scores and calculates averages
- `trackDownloadAccessed()`: Logs download activity
- `trackSessionAttendance()`: Records live session participation
- `calculateOverallProgress()`: Weighted progress calculation (40% lessons, 30% videos, 30% quizzes)

### Progress Calculation
Overall progress is calculated using weighted targets:
- 40% Lessons (target: 9 lessons)
- 30% Videos (target: 9 videos)
- 30% Quizzes (target: 3 quizzes)

Formula: `(lessonsWeight + videosWeight + quizzesWeight) / 3`

## Design & UI

### Clickable Cards
All resource cards are fully clickable (not just buttons):
```html
<a href="destination.html" class="resource-card" data-tracking-id="...">
  <!-- Card content -->
</a>
```
- Hover effects: `transform: translateY(-4px)` with enhanced shadow
- Consistent across all pages (lessons, videos, resources, etc.)
- Material Icons for visual clarity

### Navigation
Enhanced navigation menu with larger touch targets:
- Menu padding: 12px vertical
- Item padding: 16px vertical, 32px horizontal
- Icon size: 24px
- Font size: 1.05rem
- Gap between items: 12px

### Styling
- CSS variables for consistent theming (`--primary-color`, `--accent-color`, etc.)
- Responsive design with mobile-first approach
- Consistent card layouts across all pages
- Material Icons for consistent iconography

## Testing

### Manual Testing Checklist
- [ ] Sign up creates new user account
- [ ] Sign in validates credentials correctly
- [ ] Dashboard displays accurate user statistics
- [ ] Lesson clicks tracked and increment counter
- [ ] Video clicks tracked and increment counter
- [ ] Quiz completion updates score and average
- [ ] Download clicks logged in activity
- [ ] Session booking creates meeting link
- [ ] Activity log filters by date range
- [ ] Progress percentage calculates correctly
- [ ] All cards clickable site-wide
- [ ] Navigation menu functional on all pages
- [ ] Responsive design works on mobile

### Browser Compatibility
Test on: Chrome/Chromium, Firefox, Safari, Edge

## Known Limitations

- Data persistence limited to localStorage (no server-side database)
- No multi-device sync (data tied to single browser)
- Live sessions require manual Google Meet link generation
- Quiz grading is client-side only
- No password encryption (demo project only)

## Nonprofit Information

Navigate is a registered 501(c)(3) nonprofit organization dedicated to providing accessible history education. Contributions are tax-deductible to the extent permitted by law.

## License

This project is maintained by Navigate. For licensing information, please contact the project maintainers.

## Support

For questions, issues, or contributions:
- GitHub: [hj-create/Navigate](https://github.com/hj-create/Navigate)
- Report issues via GitHub Issues

---

Built with ❤️ by the Navigate team for accessible history education.