# The 8Bit Bistro - Retro Arcade Event App

This is a NextJS application built for The 8Bit Bistro to manage high scores, leaderboards, and FIFA match tracking.

## 🚀 Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run the development server**:
   ```bash
   npm run dev
   ```

## 🛠 Project Management

### Push to GitHub
We've added a shortcut script to quickly sync your local changes with your GitHub repository:
```bash
npm run push
```
*Repository URL: https://github.com/Lordvirendrasama/8bit-bistro-app*

### Deployment (Vercel)
The project is set up to deploy automatically via Vercel when you push to the `main` branch. 

**Important**: Vercel does not deploy Firestore Security Rules. If you modify `firestore.rules`, you must manually copy and paste the content into the **Firebase Console > Firestore > Rules** tab and click **Publish**.

## 🎮 Features
- **Tournament Desk**: Register players and submit arcade scores.
- **Live Leaderboard**: Real-time high score updates with "New High Score" announcements.
- **FIFA Match Tracker**: Track 1v1 or 2v2 FIFA matches with automated leaderboard stats.
- **Event Media**: Display a YouTube playlist for the event.
- **Who's That Pokemon?**: A fun interactive video guessing game.
- **Admin Dashboard**: Manage games, events, players, and offers.
