# Music Profile

A Spotify-style web app that displays your personalized music stats — top tracks and top artists across different time ranges. Built with Next.js and the Spotify Web API.

## Features

- View your top tracks and artists for the last 4 weeks, 6 months, or all time
- Spotify-style dark UI with your profile info, follower count, and avatar
- Secure OAuth 2.0 login via the PKCE flow (no client secret required)
- Silent token refresh — sessions survive access token expiry without re-login
- Rate limit handling with automatic retry on 429 responses
- Log out button that clears all stored tokens

## Tech Stack

- [Next.js 16](https://nextjs.org/) (Pages Router)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Spotify Web API](https://developer.spotify.com/documentation/web-api)

## Requirements

- Node.js 20 or later

## Getting Started

### 1. Create a Spotify App

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Under **Settings**, add the following Redirect URI:
   ```
   http://127.0.0.1:3000/profile
   ```
4. Copy your **Client ID**

### 2. Configure Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=your_client_id_here
```

### 3. Install Dependencies and Run

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000) in your browser.

> **Note:** Use `127.0.0.1` instead of `localhost` — Spotify's redirect URI policy requires it.

## Deployment

This project is deployed on [Vercel](https://vercel.com). To deploy your own:

1. Push the repo to GitHub
2. Import it in Vercel
3. Add `NEXT_PUBLIC_SPOTIFY_CLIENT_ID` to your project's **Environment Variables** in Vercel settings
4. Add your production URL as a Redirect URI in the Spotify Developer Dashboard:
   ```
   https://your-app.vercel.app/profile
   ```

Vercel auto-deploys on every push to `main`.

> **Node.js version:** In your Vercel project settings, set the Node.js version to **22.x** or later under **Settings → General → Node.js Version**.

## Project Structure

```
├── pages/
│   ├── index.tsx        # Landing page
│   └── profile.tsx      # Authenticated profile page
├── lib/
│   ├── spotify.ts       # Spotify API helpers and PKCE auth utilities
│   └── useSpotifyAuth.ts # Custom hook for auth state management
└── styles/
    └── globals.css      # Global styles and CSS variables
```

## Running Tests

```bash
npm test
```
