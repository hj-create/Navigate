# Automatic Rewards System

## Overview
The Navigate rewards system automatically tracks and awards points as users complete learning activities across the platform. The system updates in real-time without requiring manual intervention.

## How It Works

### Automatic Point Awarding
When a user completes any learning activity, the system automatically:
1. **Tracks the activity** via `user-tracking.js`
2. **Dispatches a custom event** via `rewards-integration.js`
3. **Awards points** via `rewards.js`
4. **Updates the UI** in real-time on the dashboard

### Point Values
- **Complete a lesson**: +50 pts
- **Watch a video**: +20 pts
- **Pass a quiz**: +30 pts
- **Score 80%+ on quiz**: +10 bonus pts
- **Daily login**: +5 pts
- **7-day streak bonus**: +50 pts

### Achievement Tiers

#### Tier 1: 100-300 points
- History Starter Certificate (100 pts)
- Lesson Explorer (5 lessons/videos)
- Quiz Conqueror (3 quizzes at 70%+)
- Rising Historian (250 pts)

#### Tier 2: 300-700 points
- US History Foundations (500 pts in US History)
- World History Foundations Certificate (complete ancient civilizations & history)
- European History Foundations Certificate (complete medieval & early European topics)

#### Tier 3: 700-1200 points
- Critical Thinker Certificate (5 quizzes at 80%+)
- Consistency Champion (7-day learning streak)

#### Tier 4: 1200-2000 points
- Certified Historian (1,500 pts total)
- History Honors (8+ quizzes at 80% + 15 lessons)
- Academic Excellence in History (1,800 pts + 10 quizzes at 80% + 14-day streak)

### Level System
- **Bronze**: 0 pts (beginner level)
- **Silver**: 100 pts (foundations scholar)
- **Gold**: 300 pts (advanced learner)
- **Platinum**: 700 pts (certified historian)
- **Diamond**: 1,200 pts (academic excellence)

## Category Tracking

The system tracks progress in three main categories:
- **US History** (`usHistory`)
- **World History** (`worldHistory`)
- **European History** (`europeanHistory`)

### Subcategories
World History:
- Ancient Civilizations (Mesopotamia, Egypt, India)
- Ancient History (Greece, Rome)

European History:
- Medieval (Feudalism, Manorialism)
- Early European (Fall of Rome, Rise of Christianity)

## Technical Implementation

### Files Involved
1. **`user-tracking.js`** - Tracks user activities (lessons, videos, quizzes)
2. **`rewards.js`** - Core rewards engine with points, achievements, tiers
3. **`rewards-integration.js`** - Bridge that connects tracking to rewards via events
4. **`rewards-overview.js`** - Renders rewards UI on dashboard
5. **`rewards-store.js`** - Handles redemptions

### Event Flow
```
User Action (lesson/video/quiz)
  ↓
trackLessonCompletion() / trackVideoWatched() / trackQuizCompletion()
  ↓
rewards-integration.js intercepts and dispatches custom event
  ↓
'lesson:completed' / 'video:watched' / 'quiz:completed' event
  ↓
rewards.js listens and calls award() function
  ↓
Points awarded, achievements unlocked, state saved
  ↓
UI automatically updates
```

### Custom Events
The integration layer dispatches these events:
- `lesson:completed` - Fired when a lesson is completed
- `video:watched` - Fired when a video is watched
- `quiz:completed` - Fired when a quiz is taken
- `user:login` - Fired once per day for daily login bonus

### Event Detail Structure
Each event includes metadata for category tracking:

```javascript
{
  lessonId: 'lesson-id',
  lessonTitle: 'Lesson Title',
  subject: 'US History',
  category: 'usHistory',  // mapped from subject
  subcategory: 'ancientCivilizations' // mapped from title
}
```

## Integration in Pages

The rewards integration is included in these pages:
- Dashboard (`dashboard.html`)
- Quizzes (`quizzes.html`)
- All lesson pages (US, World, European History)
- All video pages (US, World, European History)

### Script Loading Order
```html
<script src="../../controller/user-tracking.js"></script>
<script src="../../js/rewards.js"></script>
<script src="../../js/rewards-integration.js"></script>
```

## Daily Login Tracking
The system automatically awards a daily login bonus:
- Checks on page load if user is logged in
- Awards +5 points once per day
- Stores last login date in localStorage (`navigate_last_login_reward`)

## Streak Tracking
- Increments streak when user completes any activity on consecutive days
- Resets to 1 if there's a gap of more than 1 day
- Awards +50 bonus points when streak reaches 7 days
- Weekly bonus can be earned repeatedly every 7 days

## Testing the System

### To verify automatic updates:
1. Log in as a user
2. Complete a lesson - check dashboard for +50 pts
3. Watch a video - check for +20 pts
4. Take a quiz - check for +30 pts (+ bonus if 80%+)
5. Check browser console for confirmation messages:
   - "🎓 Lesson completed - Rewards updated"
   - "🎬 Video watched - Rewards updated"
   - "📝 Quiz completed - Rewards updated"
   - "🔑 Daily login - Rewards updated"

### Console Logging
The integration bridge logs all reward events to the console with emoji indicators for easy debugging.

## Data Storage
All rewards data is stored in localStorage:
- Key: `navigate_rewards_v1`
- Contains: points, achievements, streak, category progress, activity history

## Future Enhancements
Potential additions:
- Real-time notifications when achievements are unlocked
- Progress bars for specific certificates
- Social features (leaderboards, peer comparisons)
- Time-limited challenges with bonus points
- Badge display on user profiles
