
# The 8Bit Bistro - Retro Arcade Event App

This is a NextJS application built for The 8Bit Bistro to manage high scores, leaderboards, and FIFA match tracking.

## 🚀 Version Information
- **Current Version**: v1.1.1
- **Features**: Tournament Desk, FIFA Match Tracker (2v2 supported), Live Leaderboards, Session Management, Admin Controls.

## 🛠 GitHub Management

### Relink & Push
If you need to connect your local environment to your GitHub repository:

1. **Link the repository**:
   ```bash
   git remote remove origin
   git remote add origin https://github.com/Lordvirendrasama/8bit-bistro-app.git
   ```

2. **Sync your changes**:
   ```bash
   npm run push
   ```

### Deployment (Vercel)
The project is set up to deploy automatically via Vercel when you push to the `main` branch. 

**Important**: Vercel does not deploy Firestore Security Rules. If you modify `firestore.rules`, you must manually copy and paste the content into the **Firebase Console > Firestore > Rules** tab and click **Publish**.

## 🎮 Features
- **Tournament Desk**: Register players and submit arcade scores.
- **Live Leaderboard**: Real-time high score updates with "New High Score" announcements.
- **FIFA Match Tracker**: Track 1v1 or 2v2 FIFA matches with automated leaderboard stats and session management.
- **Event Media**: Display a YouTube playlist for the event.
- **Who's That Pokemon?**: A fun interactive video guessing game.
- **Admin Dashboard**: Manage games, events, players, scores, FIFA matches, and sessions.
