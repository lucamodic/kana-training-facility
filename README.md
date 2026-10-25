# Kana Training Facility

A retro-inspired Japanese study website. Everything runs in your browser, with **no accounts, analytics, external libraries, server, or build tools**.

## Features

- **Hiragana, katakana, and beginner kanji** with individual selection, group selection, and click-and-drag painting to select or deselect multiple characters at once (mouse, pen, or finger). Touch taps and keyboard selection also work.
- **Learn mode**: three guided passes (answers visible) and three memory-test passes.
- **Infinite character practice** for the selected script.
- **Word challenge**: open the dedicated Word Challenge dialog from the tab bar to guess an English/Spanish meaning (depending on your language) or a romaji reading. In Romaji Reading mode, the English meaning appears after every answer, whether correct or incorrect. Word eligibility combines **all three tabs** (not just the tab you currently have open), and the vocabulary includes mixed-script words and short expressions. Only words made entirely from your selected written characters appear. The word list is a curated starter dictionary, not an online dictionary.
- **Practice by guess count**: choose Guess limit and enter any number from 1 to 10,000 (default 200). Each checked answer or “I don’t know” counts; the session ends automatically at the target and shows your full results. The current count is visible while practicing. This can also apply to Word Challenge, learning memory rounds, and focused review.
- **Optional timer**: no countdown by default, plus a custom countdown (hours and minutes, 00:01 to 99:59), count-up, and 5/10/15-minute presets. During Infinite Practice, choosing no countdown automatically shows a running elapsed clock; hide or show it any time without resetting it. A configured countdown and elapsed clock never display together. Pause/resume supported; countdowns finish the session automatically.
- **Results and mistake review**: after finishing, see your accuracy and hardest items. Choose which missed items to review in a modal.
- **English and Spanish** interface: English by default, with a header language selector. Word-meaning questions, accepted answers, and kanji glosses change with the selected language. Your choice is saved locally.
- **Six editable themes**: Lavender, Mint, Peach, Sky, Burgundy, and Midnight, available through a compact theme menu in the header.
- **Saved preferences** via localStorage (no visible backup controls).
- **Favicon** displaying the hiragana あ.

## Run locally

Open `index.html` in a modern browser. No internet or installation needed. `index.html`, `styles.css`, `app.js`, `favicon.svg`, and `favicon.png` must stay together.

## Publish to GitHub Pages

1. Create a GitHub repository and copy the project files into the repository's root.
2. Open **Settings → Pages** in your repository.
3. Under **Build and deployment**, choose **Deploy from a branch** and select your default branch and `/ (root)`.
4. Save, then open your GitHub Pages URL once it is published.

**Privacy:** Standard GitHub Pages sites are public even if the repository is private. Don't put secrets or passwords in any of these frontend files. If you need to prevent public access, put the site behind an authentication gateway (for example, Cloudflare Access) instead.

## Customize

- **Colors:** Each theme is a `html[data-theme="..."]` CSS block in `styles.css`. Theme-menu buttons are in `index.html`, and accepted theme identifiers are in `app.js` (`PALETTES`).
- **Kanji:** Edit `kanjiRows` in `app.js`. Fields are `character|comma-separated readings|meaning|category`.
- **Words:** Edit `wordRows` in `app.js`. Fields are `Japanese spelling|comma-separated romaji readings|semicolon-separated English answers`. To add mixed-script vocabulary with a Spanish meaning, edit `mixedWordRows` with `Japanese spelling|romaji readings|English meanings|Spanish meanings`.

### How word unlocking works

Every written kana and kanji in a word must be selected in the respective tab, **even when the word combines hiragana, katakana, and kanji**. You do not need to switch to a specific tab to start Word Challenge. Small kana can be represented by their normal-size counterparts; the katakana long vowel mark `ー` is accepted automatically. For example, selecting `ね` and `こ` unlocks `ねこ` (cat). Selecting the kanji `日` and `本` unlocks `日本` (Japan). You can open the Word Challenge dialog at any time; the Start button is disabled until at least one word is unlocked.

## Important details

- Romaji entry uses an exact match after normalizing whitespace and basic punctuation. Kanji often have many context-dependent readings; this is a beginner study aid, not a full dictionary.
- Settings are stored in **this browser and this site origin**, not in a GitHub repository. Moving to a different device or URL will not carry them over.
- The default interface language is English. Change it in the header to Spanish; the choice is saved per browser.

## Session navigation

- Practice, Learn, Word Challenge and review sessions automatically scroll to the exercise card, centered when it fits the screen.
- The page respects reduced-motion preferences. The exercise input remains keyboard-focused without causing a second scroll.

## Mobile character selection

The session card appears first on small screens, followed by the writing-system tabs and character grid. You can tap tiles or hold and drag your finger across tiles to select or deselect in bulk. While finger-painting, staying near the top/bottom edge scrolls through longer character grids. To scroll normally, swipe from a section heading or the space outside the tiles.

### Mixed-script vocabulary examples

- `このケーキ` → `kono keeki` (this cake): hiragana + katakana.
- `本を読む` → `hon o yomu` (read a book): kanji + hiragana.
- `コーヒー店` → `koohii ten` (coffee shop): katakana + kanji.
- `私はパンを食べる` → `watashi wa pan o taberu` (I eat bread): all three scripts.

Word Challenge counts and examples update instantly as you choose or clear characters in any tab. Longer samples can be called short expressions rather than standalone dictionary words.
