# Kana Training Facility v26 — Private Manga Reader with OpenAI GPT-6 Luna

This is the complete v23 application with the Manga Reader migrated from Gemini to OpenAI. The entire Manga Reader is hidden from guests and every account other than the single authorized account. Hiragana, katakana, kanji, exercises, exam history, Word Challenge, nickname, themes, Google sign-in, cloud sync and offline PWA support remain available to everyone as before.

## 1. Configure OpenAI

- Open https://platform.openai.com/api-keys and create a project API key. API billing is separate from ChatGPT Plus.
- Set a project budget/alerts in the OpenAI Platform to limit surprise spending.
- Never put the OpenAI API key in GitHub, `config.js`, client JavaScript, or an HTML file.

## 2. Identify your account

In Supabase Dashboard, select this application's project and go to **Authentication → Users**. Find the exact **User UID** and **Email** of the Google account that should have Manga Reader access. Nickname is not used to authorize AI access and may change freely.

## 3. Set Supabase Edge Function Secrets

Open **Edge Functions → Secrets** and set these four server-side values:

| Secret | Example value |
|---|---|
| `OPENAI_API_KEY` | `sk-...` |
| `OPENAI_MODEL` | `gpt-6-luna` |
| `KTF_AI_ALLOWED_EMAIL` | `your-google-address@example.com` |
| `KTF_AI_ALLOWED_USER_ID` | `your-user-uid-from-supabase` |

Email comparison is case-insensitive. User ID comparison is exact. Both must match the *authenticated Supabase account*, not values supplied by the browser. If either Secret is absent, the function denies access. **Do not set `KTF_AI_ALLOWED_NICKNAME`: it is no longer needed.** These Secrets cannot be read from GitHub Pages.

Do not put these server-only values in GitHub Actions secrets unless you plan automated Edge Function deployment. Supabase Secrets are the runtime configuration. The `SUPABASE_URL` and Supabase publishable key already present in `config.js` are public, as intended for browser use.

## 4. Install or keep the daily quota

From Supabase **SQL Editor**, run `setup/manga-quota.sql` once if you have not done so in v23. It implements an RLS-protected, per-account limit of **30 AI requests per UTC day**. Each page normally needs 1 OCR request plus 1 explanation request per 12 detected dialogues. Failed upstream API requests also consume quota. Preserve the current SQL function if already installed.

## 5. Deploy the function

Using the Supabase CLI from the repository root:

```bash
npx supabase login
npx supabase link --project-ref nkxmsnytchfyjozmqpeg
npx supabase functions deploy ktf-manga-analyze
```

The included `supabase/config.toml` sets `verify_jwt = true`, and the function additionally verifies a signed-in user with `withSupabase({ auth: 'user' })`, checks the fresh Supabase user profile and compares both ID and email against Secrets. If your specific Supabase project uses an auth configuration incompatible with platform-level JWT verification, investigate its Authorization headers before changing it; **never remove the `auth: 'user'` wrapper or the identity checks**.

Alternatively replace the existing Edge Function's code in the Supabase Dashboard with `supabase/functions/ktf-manga-analyze/index.ts`, and ensure JWT verification is enabled for the function.

## 6. Publish GitHub Pages

Upload the entire repository content (including `index.html`, `manga-reader.js`, `sw.js`, `cloud-sync.js`, `styles.css`, `app.js`, assets and manifest) to the same GitHub Pages repository root. The PWA uses a new service-worker cache ID in `sw.js`: `v26-page-order-ocr-1`. Accept the app's update prompt or hard refresh if a previous cached version is still displayed.

The Manga Reader launch button is initially marked `hidden` in the HTML. When a user signs in, `manga-reader.js` makes an authenticated GET request to the Edge Function. Only a `{ "allowed": true }` response with HTTP 200 reveals the button. Other users never see the button, and direct attempts to open the reader or invoke AI are also rejected. The authorization result is rechecked when the page regains focus, and every analysis request is authorized again by the server.

## 7. Run optional automated tests

Install the dev-only test dependency with `npm install` and run `npm test`. These tests mock Supabase and OpenAI to check that other emails and IDs receive HTTP 403 and that the reader is hidden for unauthorized users. The application itself does not require npm to run on GitHub Pages.

## 8. Test the result

1. As a guest, confirm the Manga Reader button is absent but Word Challenge remains visible.
2. Sign in as a different Google user and confirm Manga Reader remains hidden.
3. Sign in as the allowed account and confirm Manga Reader appears to the left of Word Challenge.
4. Select a manga page and analyze it. Check both OCR output and the romaji, English translation and word explanations.
5. Modify `KTF_AI_ALLOWED_EMAIL` temporarily to a different value, reload and confirm Manga Reader disappears; restore the correct value.
6. Use Developer Tools / Network as the different Google user to call `GET /functions/v1/ktf-manga-analyze`: expect HTTP 403, and POST also must return 403. When not signed in, expect HTTP 401.
7. Log out while the reader is open: its session is closed and its temporary pages are cleared.
8. Verify kana practice and other content still works offline.

If you receive 401 for an otherwise valid owner session, inspect the actual Supabase Auth access JWT and your project's Edge Function JWT setting. If you receive 403, check both Secrets and the exact Supabase Authentication User UID/email, and redeploy if needed. If you receive a quota error, confirm the `setup/manga-quota.sql` function has been installed. If you receive 404, deploy the Edge Function. If OpenAI returns 401 or 429 upstream, verify your OpenAI API key, model access and project billing/rate limits.

## Privacy and limitations

The app sends only the page actively selected for analysis, compressed to JPEG, through the function to OpenAI. It does not upload or store manga images in Supabase Storage. Pages, compressed previews, OCR and explanations are stored locally in IndexedDB per authorized Supabase User ID. They can be reopened by chapter. The local browser database is not encrypted or synced and can be cleared or evicted. Server-side quota counters are persisted. OpenAI handles submitted images and text under its API terms. OCR and translations may have errors, and no manga images are bundled or generated.

The web application's source files remain publicly readable because it is hosted on GitHub Pages. Hiding the button prevents ordinary access to the UI, **not** inspection of the static HTML/JS; server-side authorization protects the private API operations and billing keys. `KTF_AI_ALLOWED_EMAIL` and `KTF_AI_ALLOWED_USER_ID` are never shipped to the browser.


## v25 — Manga chapter library (preserved)

- The chapter library was introduced in v25. The footer now displays `v26.0`.
- While authorized, open Manga Reader and enter a **Manga title** and a **Chapter / batch** title (for example `Capítulo #1`). Then upload 1–16 PNG/JPEG/WebP pages, usually four at a time.
- The app creates a chapter in IndexedDB and retains the order of uploaded pages. It also stores compressed JPEG previews so saved chapters can be reopened without selecting files again.
- Press **View analyzed manga** to see chapters grouped under their manga title and sorted numerically (`#1`, `#2`, `#10`). Click a chapter to reopen all stored pages without paid requests.
- Press **New chapter** to prepare a new batch; it keeps the manga name and proposes the next chapter number. Existing names can be edited and are saved on change.
- Exact duplicate original image bytes are recognized by SHA-256 and restored from cache, including OCR and explanations. If explanations failed, retrying reuses saved OCR. Press **Reanalyze with AI** only when you intentionally want to pay for a fresh reading.
- **Clear pages** empties the open view only. **Delete chapter** removes its grouping, retaining the cached image analyses as ungrouped pages to avoid paying for the same image again. **Delete all local manga** clears pages, explanations and chapters.
- All manga history is local to the browser profile and keyed by the authorized account's User ID. It is neither synchronized with Google/Supabase nor encrypted, and is subject to browser storage limits or deletion. To preserve the library, keep the browser's site data.
- This update changes the static frontend and PWA cache. If the already deployed Edge Function contains both JSON-input corrections, it does not require a new deploy; the ZIP includes the current function for reference.


## v26 — OCR coverage, reanalysis and page ordering

**Deployment needs both pieces:** publish the whole ZIP to GitHub Pages **and** redeploy `supabase/functions/ktf-manga-analyze/index.ts` in Supabase. The enhanced OCR is a backend change; uploading only the static files does not activate it. Existing `KTF_AI_ALLOWED_EMAIL`, `KTF_AI_ALLOWED_USER_ID`, and `OPENAI_API_KEY` stay the same. No SQL or secret migration is required.

1. In Manga Reader, select the saved chapter. Drag the page thumbnails into reading order on desktop, or use the left/right arrow buttons below each thumbnail on touch devices. The order is saved automatically in IndexedDB and retained after reopening the chapter.
2. If a page has missed text, open that page and choose **Reanalyze with AI / Volver a analizar con IA**, then confirm. This intentionally costs OpenAI usage and runs two image OCR stages: exhaustive first pass and a second independent check for missing Japanese dialogue. Existing recognized text and cached explanations are reused where possible, so the process does not need to re-explain unchanged text. If the initial image OCR request fails, the old displayed results remain intact. It may still miss or misread a bubble; correct any remaining text manually.
3. For freshly uploaded high-resolution images, the browser attempts up to 3000px long edge, retrying lower quality/resolution when needed to satisfy the backend size limit. Images reopened *solely from the previous local cache* may contain only the old compressed preview; reupload the original photo for the clearest OCR if necessary.
4. Optional: Set `OPENAI_OCR_MODEL` to another image-capable Responses API model in **Supabase → Edge Functions → Secrets** if you want to try a more expensive OCR model while keeping `OPENAI_MODEL=gpt-6-luna` for explanations. The default remains GPT-6 Luna for both tasks and requires no new secret. Verify model availability/permissions in your OpenAI project before changing it.
5. The daily Supabase quota counts each authenticated function POST once; the **thorough reanalysis makes two OpenAI OCR calls inside one POST**, so the actual token cost is higher than the quota unit count suggests.

**Existing analyses are deliberately preserved.** `manga-cache.js` keeps the same IndexedDB name, object stores, `DB_VERSION=2`, OCR version, explanation version and User ID partition as v25. Existing chapters and images remain available, and reordering only writes the chapter page-order metadata. The new PWA service worker changes the static file cache, not your IndexedDB data. Avoid clearing site storage or using the **Delete all local manga** action.
