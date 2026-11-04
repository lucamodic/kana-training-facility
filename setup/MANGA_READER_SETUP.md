# Kana Training Facility — Manga Reader (v22)

Manga Reader is an optional **online-only** feature. The rest of the PWA continues working offline. It does not create or generate manga images. It accepts real manga images selected by the visitor.

## What it does

- Multiple JPG/PNG/WebP pages in a temporary in-memory list, up to 16 pages per batch (18 MB each).
- Read a whole page or all pages one at a time via Gemini multimodal analysis.
- Left: original uploaded image. Right: scrollable text snippets.
- Each snippet has an answer field for the user's own romaji before showing the correct reading.
- Reveal complete romaji, English sentence translation, individual word definitions, and kanji core meanings/contextual readings.
- Manually correct missing/incorrect transcriptions and reanalyze the corrected text.
- The entire batch disappears on reload or when the browser tab is closed. No image or reading history is saved in Supabase, IndexedDB, localStorage or Storage buckets.

**Privacy:** When Analyze is clicked, the selected page is compressed to JPEG **in the browser** and sent through your protected Supabase Edge Function to **Google Gemini**. Google may process or retain data according to its service terms. Do not upload confidential images. Images are never sent to your own Supabase Storage bucket or database. The only server-side record added by this module is a count of AI requests per account per UTC date.

**Login:** AI requests require a valid Google/Supabase session so a publicly reachable endpoint cannot be used anonymously to run up your costs. Sign in via My Progress **before uploading**. If you sign in during a reading session, Google OAuth redirects/reloads the app, and the temporary pages will need to be uploaded again.

## One-time setup

### 1. Get the Gemini API key

Open https://aistudio.google.com/apikey and create an API key for the Gemini API (this is **NOT** your Google OAuth Client Secret). Check your account's billing and usage settings, as model usage can have quotas and charges.

In your Supabase project (`nkxmsnytchfyjozmqpeg`), open **Edge Functions → Secrets** (or the secrets screen in the dashboard). Add:

- Name: `GEMINI_API_KEY`
- Value: your secret Gemini key

Do not add this key to GitHub Pages, `config.js`, the repo, or messages in chat.

`GEMINI_MODEL` can optionally be set in the same screen (default is `gemini-3.8-flash`).

### 2. Enable a per-account quota

In Supabase → **SQL Editor**, run `setup/manga-quota.sql` from this archive. It adds `ktf_manga_daily_usage` and an authenticated-only RPC with a limit of **30 AI requests per UTC day per user**, including reanalysis after manually editing text. The table has RLS enabled and denies user-facing direct access. This is independent of your existing `ktf_progress_events` table.

### 3. Deploy the Edge Function

#### Supabase CLI (recommended)

From the directory containing `supabase/functions/ktf-manga-analyze/index.ts` and `supabase/config.toml`:

```bash
npx supabase login
npx supabase link --project-ref nkxmsnytchfyjozmqpeg
npx supabase functions deploy ktf-manga-analyze --no-verify-jwt
```

The function uses `withSupabase({ auth: 'user' })` to validate each caller's user JWT; `--no-verify-jwt` only disables the older platform JWT check that can reject the newer Supabase publishable-key projects. **Do not remove the `auth: 'user'` wrapper.**

#### Dashboard editor (alternative)

In Supabase → Edge Functions, create a function named `ktf-manga-analyze`, paste `supabase/functions/ktf-manga-analyze/index.ts` into its editor, and deploy it. Under the function's settings disable the platform's **Verify JWT** setting while keeping the code's `withSupabase({ auth: 'user' })` validation intact.

### 4. Publish the PWA

Upload the web files (`index.html`, `manga-reader.js`, `styles.css`, `app.js`, `cloud-sync.js`, etc., plus icons and manifest) to the **root** of your existing GitHub Pages repository. The `supabase/` and `setup/` directories are configuration/source files and do not need to be served by GitHub Pages. Accept the update notification for v22 when it appears.

### 5. Test

1. Open My Progress → Google sign-in. If Google already works, no changes to OAuth configuration are needed.
2. Open the **Manga Reader** button immediately left of **Word Challenge**.
3. Add 2 PNG/JPG pages, click **Analyze all pages**.
4. Type romaji, click **Check my reading**, then **Show reading & translation** and **Reveal word meanings**.
5. For a bad OCR segment, click **Correct Japanese text**, fix it, and choose **Update explanation**.
6. Reload the page and confirm the uploaded images disappeared. Verify the standard practice and exams still work offline.

If an error says `GEMINI_API_KEY has not been configured`, revisit step 1. If the error mentions quota, run step 2. If you receive 404, the function was not deployed; if you receive 401, sign in and check the function's JWT setting and the `auth: 'user'` wrapper. AI errors about models or quota may require checking your Google AI Studio account and model access.

## Model and answer quality

Google Gemini may misread vertical type, furigana, stylized sound effects or handwritten text. Romanization and translations are AI suggestions; they should not be treated as infallible. The answer checker is based on the model's full romaji and accepts a few common Hepburn romanization variants. It is not a standardized grading engine.

## No other changes

This build is based on **v21 Smooth Selection**, preserving the prior kana/kanji selection performance fix, exam history, Google authentication, nicknames, Word Challenge, global study clock and all themes. It does not reintroduce any bundled manga scans or generated artwork.
