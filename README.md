# Kana Training Facility

A retro-inspired Japanese study website. Everything runs in your browser, with **no accounts, analytics, external libraries, server, or build tools**.

## Features

- **Global study clock:** restored full-size study timer on the home screen, with description, custom hours and minutes, a large countdown and visible controls. When a running or paused clock is active during a lesson, it becomes a floating, non-blocking widget. Minimize it to a title bar or close the floating view to dock the clock inside the lesson; use the ↗ button to float it again. On small screens the widget starts minimized to avoid covering answer fields. The countdown and study summary continue uninterrupted when moved or minimized.


- **Hiragana, katakana, and beginner kanji** with individual selection, group selection, and click-and-drag painting to select or deselect multiple characters at once (mouse, pen, or finger). Touch taps and keyboard selection also work.
- **Learn mode**: three guided passes (answers visible) and three memory-test passes.
- **Infinite character practice** for the selected script.
- **One Pass / Una pasada (daily review):** a single shuffled run through **every selected Hiragana, Katakana, and Kanji tile across all three tabs**. Each appears exactly once; after the final answer, see your results and review mistakes. No countdown or global guess limit interrupts this mode; optional Rapid Fire still applies per answer.
- **Word challenge**: open the dedicated Word Challenge dialog from the tab bar to guess an English/Spanish meaning (depending on your language) or a romaji reading. In Romaji Reading mode, the English meaning appears after every answer, whether correct or incorrect. Word eligibility combines **all three tabs** (not just the tab you currently have open), and the vocabulary includes mixed-script words and short expressions. Only words made entirely from your selected written characters appear. The word list also includes **334 additional hiragana-only entries** (people, animals, food, nature, home, travel, verbs, adjectives, and useful expressions), plus **184 additional katakana-only entries**, all with English and Spanish meanings. Some hiragana vocabulary is deliberately written without its usual kanji to support beginner reading practice. It is a curated offline vocabulary list, not an online dictionary.
- **Practice by guess count**: choose Guess limit and enter any number from 1 to 10,000 (default 200). Each checked answer or “I don’t know” counts; the session ends automatically at the target and shows your full results. The current count is visible while practicing. This can also apply to Word Challenge, learning memory rounds, and focused review.
- **Practice limit**: three options in order: **No limit** (default; **Sin límite** in Spanish), **Timer** (custom hours and minutes, 00:01 to 99:59; **Temporizador** in Spanish), or **Guess limit** (**Límite de respuestas**). Infinite Practice shows an optional running clock in No limit mode. It can be hidden and shown without resetting. Timer ends the session when it reaches zero; Guess limit ends after the chosen number of attempts. Old 5/10/15-minute preferences migrate to an equivalent custom Timer value. The old count-up mode maps to No limit.
- **Results and mistake review**: after finishing, see your accuracy and hardest items. Choose which missed items to review in a modal.
- **English and Spanish** interface: detects the browser’s preferred language on the first visit (Spanish if the browser prefers Spanish, English otherwise), with a header language selector. Word-meaning questions, accepted answers, and kanji glosses change with the selected language. A manual choice overrides browser detection and is saved locally.
- **Ten editable themes**: Lavender, Mint, Peach, Sky, Burgundy, Midnight, Trans Pride, Bi Pride, Nonbinary Pride, and Lesbian Pride, available through a compact theme menu in the header.
- **Saved preferences** via localStorage (no visible backup controls).
- **Favicon and installable app icon** displaying the hiragana あ.
- **PWA installation, offline cache, and updates**: Android/desktop install prompts, iOS home-screen guidance, offline study after the first online load, and a bilingual Update now / Later banner when a new release is ready.

## Word Library and kanji explanations

- **Browse unlocked vocabulary:** Open Word Challenge and choose **Browse unlocked vocabulary** before starting. Search and filter every unlocked word across Hiragana, Katakana, Kanji, and mixed scripts. Each entry includes Japanese, romaji and **English meaning**, even when the interface language is set to Spanish.
- **Kanji breakdown after answers:** Whenever a word contains kanji, its result shows the contextual reading for each kanji or (for irregular compounds such as 今日, 明日 and 大人) the inseparable whole-word reading. Notes explain relevant sound changes such as rendaku and the doubled consonant in 学校. These are curated explanations, not an automatic phonetic decomposition.
- The word list respects the selected tiles on all three tabs. Your saved selections, study progress, PWA, themes and lesson modes are not changed. The private Manga Reader is restricted to an allowed Supabase account.

## Install as a phone/desktop app (PWA)

This project is also a **Progressive Web App**. No app store, server, build tool, or third-party service is necessary.

- **Android / Chrome:** Open the published GitHub Pages HTTPS address. Choose **Install app** from Chrome (or use the site's **Install** button when Chrome makes the install prompt available). Depending on Chrome, it may say **Add to Home screen**.
- **iPhone / iPad:** In Safari, tap **Share → Add to Home Screen** (choose **Open as Web App** when shown). Chrome on iOS also has Share → Add to Home Screen on supported versions.
- **Desktop Chrome / Edge:** Use the Install icon or Install menu option for the page.
- **Offline:** Visit the site online once and allow it to load fully, then use it offline from the installed icon. Selected characters and settings remain in the device's localStorage. When an update is ready, an English/Spanish banner offers **Update now** or **Later**. Updates are applied only when confirmed; doing so reloads the app. Finish an active practice session first if you want to keep its current results.

The PWA works with both `https://username.github.io/repo/` and custom domains because the manifest, icons, and service worker use **relative paths**. Keep `manifest.webmanifest`, `sw.js`, and the `icons/` folder with the original files. A `file://` URL cannot install the app or register the offline service worker; GitHub Pages or a localhost server is required.

## Run locally

Open `index.html` in a modern browser. No internet or installation needed. `index.html`, `styles.css`, `app.js`, `favicon.svg`, and `favicon.png` must stay together. You can test the content as a file, but install/offline features need GitHub Pages or localhost.

## Publish to GitHub Pages

1. Create a GitHub repository and copy the project files into the repository's root.
2. Open **Settings → Pages** in your repository.
3. Under **Build and deployment**, choose **Deploy from a branch** and select your default branch and `/ (root)`.
4. Save, then open your GitHub Pages URL once it is published.

**Privacy:** Standard GitHub Pages sites are public even if the repository is private. Don't put secrets or passwords in any of these frontend files. If you need to prevent public access, put the site behind an authentication gateway (for example, Cloudflare Access) instead.

## Customize

- **Colors:** Each theme is a `html[data-theme="..."]` CSS block in `styles.css`. Theme-menu buttons are in `index.html`, and accepted theme identifiers are in `app.js` (`PALETTES`).
- **Kanji:** Edit `kanjiRows` in `app.js`. Fields are `character|comma-separated readings|meaning|category`.
- **Words:** Edit `wordRows` (`Japanese|romaji|English`) or `extraHiraganaRows`, `extraKatakanaRows` and `mixedWordRows` (`Japanese|romaji|English|Spanish`) in `app.js`. Separate alternative meanings with semicolons and alternative readings with commas.

### How word unlocking works

Every written kana and kanji in a word must be selected in the respective tab, **even when the word combines hiragana, katakana, and kanji**. You do not need to switch to a specific tab to start Word Challenge. Small kana can be represented by their normal-size counterparts; the katakana long vowel mark `ー` is accepted automatically. For example, selecting `ね` and `こ` unlocks `ねこ` (cat). Selecting the kanji `日` and `本` unlocks `日本` (Japan). You can open the Word Challenge dialog at any time; the Start button is disabled until at least one word is unlocked.

## Important details

- Romaji entry uses an exact match after normalizing whitespace and basic punctuation. Kanji often have many context-dependent readings; this is a beginner study aid, not a full dictionary.
- Settings are stored in **this browser and this site origin**, not in a GitHub repository. Moving to a different device or URL will not carry them over.
- On first use, Spanish-language browsers get Spanish, and all other languages fall back to English. The header selector can override this; an explicit selection remains saved across updates. Existing users keep their prior choice.

## Session navigation

- Practice, Learn, One Pass, Word Challenge and focused-review sessions automatically scroll to the exercise card, centered when it fits the screen.
- The page respects reduced-motion preferences. The exercise input remains keyboard-focused without causing a second scroll.

## Mobile character selection

The session card appears first on small screens, followed by the full-width Word Challenge button, then the Hiragana/Katakana/Kanji tabs and character grid. You can tap tiles or hold and drag your finger across tiles to select or deselect in bulk. While finger-painting, staying near the top/bottom edge scrolls through longer character grids. To scroll normally, swipe from a section heading or the space outside the tiles.

### Mixed-script vocabulary examples

- `このケーキ` → `kono keeki` (this cake): hiragana + katakana.
- `本を読む` → `hon o yomu` (read a book): kanji + hiragana.
- `コーヒー店` → `koohii ten` (coffee shop): katakana + kanji.
- `私はパンを食べる` → `watashi wa pan o taberu` (I eat bread): all three scripts.

Word Challenge counts and examples update instantly as you choose or clear characters in any tab. Longer samples can be called short expressions rather than standalone dictionary words.

## Publishing updates to the installed PWA

1. Make changes to `index.html`, `styles.css`, `app.js`, or other assets.
2. **Increase the cache version string in `sw.js`** (e.g. change `offline-v3` to `offline-v4`). This is required to reliably announce a new release.
3. Push all files to GitHub Pages. People who reopen or foreground the installed app while online are prompted when the new version finishes downloading.
4. **Update now / Actualizar ahora** activates the new service worker and reloads the page. **Later / Más tarde** leaves the current version running.

The update notice uses the currently selected interface language. New visitors start in the browser's preferred language (Spanish if the primary language starts with `es`, English fallback); a previous manually selected language takes precedence. This mechanism does not require a backend or external libraries. Updates aren't fetched while offline and may require a fresh visit / background-to-foreground cycle to be detected.


## Rapid Fire / Ráfaga

Enable **Rapid Fire** from Your Session to set a separate time limit for **each answer** (1–300 seconds, default 10). It works alongside No limit, Timer, and Guess limit, including Word Challenge. An unanswered question is counted as incorrect, briefly shows the correct answer, then automatically advances. The guided learning passes are not timed; the 3 memory passes are. Pausing freezes both countdowns. Preferences persist locally; the PWA offline cache was updated.



## Global study timer / Temporizador general

The study clock is at the top of the page and is independent of the lesson timer.
Choose **any custom time** using the Hours and Minutes fields (no preset duration).
Allowed range: 00:01 through 99:59. The chosen duration is remembered locally.

Start, pause/resume or finish early at any time. The clock keeps counting across
Hiragana, Katakana, Kanji, One Pass, Word Challenge, and lesson/result screens.
Progress and the deadline are stored in the browser. After a page reload, the
countdown and collected study metrics can resume. Browser background throttling
does not change the deadline.

At zero, a summary modal appears with study duration, total answers, accuracy,
words, character answers, guided cards, lessons finished, unique items, and the
most-missed items recorded **while the global study timer was running**.
When the study countdown reaches zero, the app plays a gentle two-note chime generated
locally with Web Audio (no audio files or network requests), then shows the study
summary. There is no Japanese message playback button and no speech synthesis.
The written Japanese congratulatory message remains visible in the modal.
Sound is initialized when the user starts or resumes the timer. Some browsers may
suppress audio when the page is suspended, the device is muted, or the app has been
closed; the summary still appears when the page resumes.

The interface automatically follows English/Spanish preference. All study
metrics stay in localStorage and are not uploaded to a server.

New source file: `study-clock.js`; include it in the GitHub Pages deployment.
Also deploy the updated `sw.js`, which caches this new file as part of the PWA.

Español: el reloj global solo ofrece duración personalizada, se pausa o
reanuda de forma independiente de las lecciones y al terminar reproduce una campanita suave y muestra el
resumen de las actividades. No hay botón de audio japonés.


## Draggable floating study clock

While studying, the active global clock floats above the lesson. Drag its title bar (the area with the `⠿` grip) with a mouse or finger to reposition it. The location is stored in this browser, and automatically clamped to the visible viewport. The title bar can also be focused and moved with arrow keys (Shift + arrow for smaller steps). The minimize and close/dock buttons still work, and the large timer on the home screen has not changed. The clock keeps running while you move it. This release bumps the service-worker cache to `v15`.

## Learning Progress and Google sync

The **My Progress** link beside the offline badge opens skill exams, a personalized test, exam history, recommendations, and Google login. The footer includes a **Learning Guide**. Exam attempts are saved locally and synced to Supabase when signed in and online. The static PWA can still be used offline.

See `setup/SETUP.md` and execute `setup/supabase-schema.sql` in the Supabase SQL Editor before testing synchronization. Google OAuth uses the project settings configured in Supabase, while `config.js` contains only public credentials. Never add secret keys to the frontend.

The exam banks contain more questions than a single attempt and diversify retakes with a different order and priority for previously unseen questions.

### Editable nickname

My Progress shows the user's chosen nickname, never their Google name by default. Use **Set nickname / Edit nickname** to pick a display name (2–32 characters). The Google email is in the collapsible **Account details** section. The nickname is stored in `auth.users.user_metadata.ktf_nickname` via `supabase.auth.updateUser`, cached on each device for offline use, and synchronized whenever online. No new SQL required.

## Design update: exams on the study page

Skill exams now appear in the main study area with the same card-and-answer layout as ordinary practice instead of using a modal window. The Learning Guide and Learning Progress dashboard retain their separate dialogs, styled with the current theme. Scrollbars match the selected palette. The global timer supports the exam page. All existing authentication, nickname and offline sync settings remain unchanged.


### UI polish release v20

Refined the Learning Progress account area, skill cards, guide layout, and exam typography/responsive spacing. Exam word prompts use a smaller, context-aware size than individual kana/kanji. No changes to authentication, stored progress, exams, or schema. Offline service-worker cache version updated.

## v21 — Smooth selection and deferred cloud sync

- Character selection and deselection now update only the touched tiles and selection counters. The character grid is not reconstructed after each click or drag.
- Vocabulary unlock calculations are cached until the selection changes; all and random selections also update tiles in place.
- Supabase changes are batched after a short idle period. A remote sync cannot overwrite newer local edits or interrupt an active drag.
- Local selections still persist immediately, even offline.
- The PWA service worker cache version has been updated for this release. No database migration is needed.

## Private Manga Reader (v24)

New temporary page reader to the left of Word Challenge. Multiple manga pages can be uploaded without being persisted or synced, and each detected dialogue lets you attempt its romaji before revealing the reading, English translation, vocabulary and kanji explanations. Corrections are supported. No manga art is generated or bundled.

**One-time online setup required:** see `setup/MANGA_READER_SETUP.md` for the OpenAI API key, the allowed email and user ID Secrets, `setup/manga-quota.sql` and deployment of `supabase/functions/ktf-manga-analyze/index.ts`. Online AI analysis requires a Google/Supabase session; other app features remain offline. The function sends page images to OpenAI GPT-6 Luna for analysis when requested, but does not save them in Supabase.

## Manga Reader v24: staged analysis + private access

Manga Reader uses two stages: image transcription and text-only explanation. It displays transcribed Japanese immediately and retains it if explanations fail. The **Retry explanations** button does not repeat OCR. Both the PWA JavaScript and the Supabase function must be deployed together. See `setup/MANGA_READER_SETUP.md`.

## v24 private GPT-6 Luna access

The Manga Reader button remains hidden for every visitor until a signed-in account is authorized by `GET /functions/v1/ktf-manga-analyze`. The Edge Function checks both the authenticated Supabase user ID and email against Supabase Edge Function Secrets, with no nickname restriction. A `403` blocks all AI modes even if somebody calls the endpoint manually. The frontend contains no allowed email, allowed user ID or OpenAI API key. Set `OPENAI_API_KEY`, `OPENAI_MODEL`, `KTF_AI_ALLOWED_EMAIL`, and `KTF_AI_ALLOWED_USER_ID` as described in `setup/MANGA_READER_SETUP.md`.
