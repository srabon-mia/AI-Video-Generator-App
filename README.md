# AI Video Generator — React Native + Expo

A mobile app that generates AI videos from text prompts using Kling v1.6 via fal.ai.

## What's included

```
ai-video-gen/          ← Mobile app (Expo / React Native)
  app/
    _layout.tsx        ← Tab navigator
    index.tsx          ← Generate screen
    history.tsx        ← History screen
    settings.tsx       ← Settings screen
  hooks/
    useVideoJob.ts     ← Generation + polling logic
  lib/
    usage.ts           ← Daily cap (3/day) with AsyncStorage
    storage.ts         ← History persistence

  backend/             ← Next.js proxy (deploy to Vercel)
    api/
      generate/route.ts       ← Submits job to fal.ai
      status/[requestId]/     ← Polls job status
    package.json
    next.config.js
```

---

## Step 1 — Get a fal.ai API key

1. Sign up at https://fal.ai
2. Go to Dashboard → API Keys → Create new key
3. Copy the key — you'll need it for the backend

---

## Step 2 — Deploy the backend to Vercel

The backend proxies fal.ai so your API key never lives in the mobile app.

```bash
cd backend
npm install

# Install Vercel CLI if you don't have it
npm install -g vercel

vercel deploy
```

During deployment:
- Add environment variable: `FAL_KEY` = your fal.ai key
- Note the deployed URL (e.g. `https://ai-video-gen-backend.vercel.app`)

Alternatively, push `backend/` to a GitHub repo and connect it to Vercel via the dashboard.

---

## Step 3 — Set up the mobile app

```bash
# From the root ai-video-gen/ directory (not backend/)
npm install

# Install Expo CLI if you don't have it
npm install -g expo-cli
```

---

## Step 4 — Run on your phone

```bash
npx expo start
```

1. Install **Expo Go** on your iPhone or Android
2. Scan the QR code that appears in your terminal
3. The app loads instantly — no Xcode or Android Studio needed

---

## Step 5 — Connect to your backend

In the app, go to **Settings → Backend URL** and enter your Vercel URL:
```
https://your-backend.vercel.app
```

---

## How it works

```
User types prompt
       ↓
App POSTs to /api/generate (your Vercel backend)
       ↓
Backend submits job to fal.ai (API key stays secret)
       ↓
Backend returns requestId to app
       ↓
App polls /api/status/:requestId every 4 seconds
       ↓
When COMPLETED, backend returns video URL
       ↓
App plays video inline, offers Save + Share
```

---

## Customization

### Change the daily limit
In `lib/usage.ts`, change:
```ts
const DAILY_LIMIT = 3;
```

### Change the model
In `backend/api/generate/route.ts`, the `MODEL_MAP` maps quality → fal.ai model:
```ts
const MODEL_MAP = {
  fast: "fal-ai/kling-video/v1.6/standard/text-to-video",
  standard: "fal-ai/kling-video/v1.6/pro/text-to-video",
};
```
Browse other models at https://fal.ai/models?category=video

### Change video defaults
In `app/index.tsx`, change the default state values for `ratio`, `duration`, `quality`.

---

## Building for the App Store / Play Store

```bash
npm install -g eas-cli
eas login
eas build --platform ios     # or android
```

Update `app.json` first:
- `ios.bundleIdentifier` → your unique bundle ID
- `android.package` → your unique package name
- Replace placeholder icon files in `assets/`

---

## Troubleshooting

**"Failed to fetch" errors**
- Make sure your backend URL in Settings doesn't have a trailing slash
- Check that your Vercel deployment is live and `FAL_KEY` is set

**Videos not saving**
- iOS: Allow photo library access when prompted
- Android: Grant storage permissions in device settings

**Generation times out**
- Kling v1.6 takes 30–90s — the app polls every 4s automatically
- If it errors, try a simpler prompt or switch to "Fast" quality

---

## Tech stack

| Layer | Tech |
|---|---|
| Mobile | React Native + Expo SDK 51 |
| Routing | Expo Router (file-based, like Next.js) |
| Storage | AsyncStorage (on-device) |
| Video playback | expo-av |
| Save to library | expo-media-library |
| Backend | Next.js 14 on Vercel |
| AI video API | fal.ai → Kling v1.6 |
