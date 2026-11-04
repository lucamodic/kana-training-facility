# Kana Training Facility — Manga Reader (v23 two-stage)

Manga Reader is an optional **online-only** feature. The rest of the PWA continues working offline. It does not create or generate manga images. It accepts real manga images selected by the visitor.

## What it does

- Multiple JPG/PNG/WebP pages in a temporary in-memory list, up to 16 pages per batch (18 MB each).
- Transcribe each page first, then request readings, romaji, vocabulary and English translations in separate text-only requests.
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

In Supabase → **SQL Editor**, run `setup/manga-quota.sql` from this archive. It adds `ktf_manga_daily_usage` and an authenticated-only RPC with a limit of **30 AI requests per UTC day per user**. A page now uses **one OCR request plus at least one explanation request**, one for every group of up to 12 dialogues. Failed attempts also count. For example, a page with 8 bubbles consumes 2 requests if both succeed. The table has RLS enabled and denies user-facing direct access. This is independent of your existing `ktf_progress_events` table.

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

Upload the **v23 web files together** (`index.html`, `manga-reader.js`, `styles.css`, `app.js`, `cloud-sync.js`, etc., plus icons and manifest) to the **root** of your existing GitHub Pages repository. The `supabase/` and `setup/` directories are configuration/source files and do not need to be served by GitHub Pages. Accept the update notification for v22 when it appears.

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

## v23 deployment note

Replace both the Supabase Edge Function code and the PWA files. The v23 frontend uses a new `mode: explain` request; it will not work with the old v22 function. Conversely, the v22 frontend expects all explanations in the first response. Do not mix versions.

After changing GitHub Pages files, approve the PWA update prompt. Analyze a single page first. Recognized Japanese appears as soon as OCR completes, even if explanation fails later; select **Retry explanations** to resume without uploading that image again. This reader only holds page data in the current browser tab.

If Gemini returns HTTP 503 even for a one-stage OCR request, this can be a genuine API availability issue distinct from Google AI Studio. A successful AI Studio chat does not guarantee API-key requests from this project will succeed. Review the exact API key project and Google AI Studio rate limits. Do not put the Gemini secret in the webpage.

## Testing the two-stage workflow

When the image OCR call succeeds, Japanese text appears immediately. The interface then sends a text-only analysis request (one per 12 dialogues). Until an item has a reading, the Check / Reveal buttons are disabled so you are never graded against an empty answer. If the later request fails, the Japanese transcription stays on screen; choose **Retry explanations**. The app does not store this page or its text after reload.

Both API calls use `gemini-3.8-flash` by default, a concise prompt and `thinkingLevel: low`. The Edge Function logs whether the failure happened at `ocr` or `explain`, without logging images, Japanese sentences or keys. This cannot guarantee Gemini API uptime: Google AI Studio and requests made using your own project API key may behave differently.
