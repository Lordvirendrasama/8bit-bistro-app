
# The 8Bit Bistro - Retro Arcade Event App

This is a NextJS application built for The 8Bit Bistro to manage high scores, leaderboards, and FIFA match tracking.

## 🚀 Version Information
- **Current Version**: v1.1.2
- **Features**: Tournament Desk, FIFA Match Tracker (2v2 supported), Live Leaderboards, Session Management, Admin Controls.

## 🛠 GitHub & Vercel Management

### Relink & Push
If you need to connect your local environment to your specific GitHub repository:

1. **Link the repository**:
   ```bash
   git remote remove origin
   git remote add origin https://github.com/Lordvirendrasama/8bit-bistro-apps.git
   ```

2. **Sync your changes**:
   ```bash
   npm run push
   ```

### ⚠️ Vercel Deployment Troubleshooting
If Vercel is not picking up your builds automatically:

1. **Check the Remote**: Ensure `git remote -v` shows the plural `8bit-bistro-apps` URL.
2. **Check the Branch**: Vercel usually watches the `main` branch. The `npm run push` script is configured for `main`.
3. **Re-connect on Vercel**: 
   - Go to your Vercel Project Dashboard.
   - Go to **Settings > Git**.
   - Ensure the repository `Lordvirendrasama/8bit-bistro-apps` is connected. If it is, try "Disconnect" and then "Connect" again to refresh the webhook.
4. **Permissions**: Ensure the Vercel GitHub App has permission to access the `8bit-bistro-apps` repository.

**Important**: Vercel does not deploy Firestore Security Rules. If you modify `firestore.rules`, you must manually copy and paste the content into the **Firebase Console > Firestore > Rules** tab and click **Publish**.

## 🎮 Features
- **Tournament Desk**: Register players and submit arcade scores.
- **Live Leaderboard**: Real-time high score updates with "New High Score" announcements.
- **FIFA Match Tracker**: Track 1v1 or 2v2 FIFA matches with automated leaderboard stats and session management.
- **Event Media**: Display a YouTube playlist for the event.
- **Who's That Pokemon?**: A fun interactive video guessing game.
- **Admin Dashboard**: Manage games, events, players, scores, FIFA matches, and sessions.
