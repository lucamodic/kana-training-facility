# Kana Training Facility — Google login & offline learning progress

## Before deploying

1. In your Supabase project, open **SQL Editor** and run `supabase-schema.sql` once. This creates an append-only event table with row-level security for each signed-in user.
2. In **Authentication → Providers → Google**, verify Google is enabled and its Client ID and Client Secret are stored there, never in GitHub.
3. In **Authentication → URL Configuration**, set **Site URL** to `https://lucamodic.github.io/kana-training-facility/` and add the same URL under **Redirect URLs**.
4. In Google Cloud OAuth **Authorized redirect URIs**, use `https://nkxmsnytchfyjozmqpeg.supabase.co/auth/v1/callback` (not the GitHub Pages URL). If Google OAuth is still in *Testing*, add each test account.
5. Upload the static files to the GitHub Pages repository, preserving the directory structure. The `setup` directory is documentation only and does not need to be uploaded.
6. Open the public HTTPS page while connected and sign in under **My Progress**. Login and sync require internet; studying and exams can still run offline.

## Public vs private configuration

`config.js` intentionally contains only the public project URL and Supabase publishable key. This is safe for a public static site only with the RLS policies above. Do **not** put the Google Client Secret, Supabase secret key, or service_role key into client files.

## How exams vary

There are six exams. The generator chooses 25–30 questions from larger skill-specific banks and shuffles the order. On retakes it prioritizes questions that were not in the previous attempt. Kanji and vocabulary have separate reading and meaning variants. If a bank is smaller than the exam length, repeated attempts can necessarily overlap. No answer is revealed until the results screen. Passing threshold is 90%.

## Offline data and cross-device syncing

- Core study data stays local and the service worker makes the static app available offline after the first online load.
- Exam results are immutable records, with unique IDs stored in IndexedDB (localStorage fallback) and sent to Supabase whenever online and signed in.
- Selected characters and settings are recorded as saved snapshots, with newest-snapshot behavior on sync. On first sign-in to a device, local selections are merged into the cloud selections; this may re-add an old selection, but never deletes exam history.
- Local tests performed before login are attached to the account on first login.
- Sessions and settings do not sync while the site is closed. Open both devices online to transfer recent changes.
- The Google login library loads on demand from a CDN when online. If blocked, offline lessons still work; login will report an error.
- If the cloud has no table yet, login may succeed but sync reports an error until the schema has been applied.
- Device-specific privacy: stored offline records are not encrypted. Don't use shared devices for sensitive personal data.

## Testing checklist

1. Select ten hiragana and complete an exam offline, then reconnect and sign in. Verify My Progress displays the attempt.
2. Take Kana Fundamentals twice. Questions and order should differ; the history should show two attempts.
3. Open the app on a second device, sign into the same Google account and run Sync now. The exam attempts should appear.
4. Make a new exam attempt offline on device B, reconnect and sync. On device A, run Sync now; both attempts should appear.
5. Confirm another Google account cannot read the first account's rows (RLS).
6. Check English and Spanish, desktop and mobile, and PWA after cache update.

The optional Google login has not been exercised against the user's actual cloud project in the build environment. Authentication and RLS must be tested on the deployed site after applying SQL.

## Personal nickname

After Google sign-in, open **My Progress → Set nickname**. The greeting uses your chosen nickname instead of Google's full name. Your Google email is shown only inside **Account details**. The nickname is stored in Supabase Auth `user_metadata.ktf_nickname`; no extra SQL migration or `public.profiles` table is required. When changed offline, the update stays in localStorage for that signed-in user and is synced by calling Supabase `auth.updateUser` when connectivity returns. Nicknames are for display only and must never be used as authorization claims.
