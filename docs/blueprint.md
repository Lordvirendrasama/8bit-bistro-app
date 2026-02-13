# **App Name**: Pixel Podium

## Core Features:

- QR Code Registration & Auth: Allow participants to register via QR code link, entering name, Instagram handle, and group size. Uses Firebase anonymous authentication to create a unique player ID and keep users logged in.
- High Score Submission: Enable participants to select a game, enter a score, take an in-app photo proof using the device camera, and submit it to Firestore with an 'Pending Approval' status. Includes image compression and upload to Firebase Storage.
- Real-time Live Leaderboard: Display top 10 approved scores per game, updated in real-time. Shows player names and Instagram handles.
- Admin Score Management Panel: Password-protected interface for admins to view all score submissions, associated photos, approve or reject scores, edit score values, delete fake entries, and manage the list of available games.
- Event Media Display: Feature a dedicated screen for looping a pre-selected YouTube or video playlist relevant to the event's atmosphere.
- Generative AI Duplicate Submission Tool: An AI tool that evaluates new score submissions for patterns indicating potential spam or duplicate entries beyond simple count-based limits, providing admins with insights to prevent fraudulent activity.
- PWA Capabilities: Ensure the application is installable as a mobile app, providing an 'Add to Home Screen' prompt, offline capability for registration, and a native-like experience when pinned or bookmarked.

## Style Guidelines:

- The app's aesthetic evokes the vibrant, digital glow of a retro arcade, centered around a rich dark purple background. The primary action color, a striking magenta (#FF66FF), draws the eye to key interactive elements with its electrifying pop. For secondary accents and informational elements, a brilliant electric blue (#4D89FF) is used, creating a dynamic interplay of neon hues that enhances the retro arcade feel against the dark canvas.
- Headline font: 'Space Grotesk' (sans-serif) for its techy, condensed retro-futuristic feel, reminiscent of classic arcade displays. Body text font: 'Inter' (sans-serif) for legibility and a modern, neutral balance in a compact event environment.
- All icons should be designed in a pixel-art style, consistent with the retro gaming theme, to further enhance immersion and visual character.
- A mobile-first, extremely simple and readable layout with clear visual hierarchy, utilizing large touch buttons and ample negative space to ensure usability and accessibility in a crowded event setting.
- Subtle, fast animations and transitions should be used for elements like score updates, leaderboard position changes, and successful submissions to provide immediate feedback and enhance the dynamic nature of the event.