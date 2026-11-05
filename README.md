## v29.1 — Custom practice mode parity

- Custom now supports Infinite Practice, Learn My Selection (3 guided passes + 3 memory-test passes), and One Pass across all selected custom tabs.
- Custom session settings include no-limit or timed practice, guess limit, Rapid Fire per-answer countdown, and pause/resume.
- Custom no longer stops automatically after 20 questions in Infinite mode.
- One Pass ignores the Custom session countdown and guess limit to match the main trainer, but supports Rapid Fire. The floating My Study Time clock remains independent.
- Session results retain per-item review history through the existing cloud event system; guided learning passes do not create scored attempts.
- Session settings persist locally. No SQL changes or new manga image storage.
- Footer and PWA asset versions updated to 29.1; deploy all files together.

## v29.0 — Cohesive Custom practice and focused Manga Reader

- Custom collection now uses the same tab navigation and compact selectable tiles as Kana practice. Click or drag across tiles to select multiple; use the search, Select visible, and Deselect visible controls to manage selection. Editing and deleting controls are no longer shown on individual tiles. Custom additions remain available from the Add Custom modal and Manga Reader.
- Characters / Words / All are now top-level tabs with selected counters. Practice controls are aligned with consistent heights.
- Manga Reader has distinct Library & Chapters and Reading views. In the Reading view, the upload form, large heading and manga library controls are hidden, while page thumbnails, reordering, AI analysis and saved explanations remain accessible. Use Library & chapters to go back to management, or Continue reading to return.
- No new SQL, no IndexedDB migrations, no changes to OCR, image hashes or Supabase secrets. The offline/PWA cache is bumped to 29.0.

## v28.5 — Interfaz Custom compacta y timer flotante

- **Custom** utiliza el mismo estilo retro de los paneles de práctica. Los filtros, la búsqueda y los botones de selección comparten una barra horizontal cuando entra en pantalla y se adaptan en filas ordenadas en dispositivos pequeños. Los elementos guardados aparecen como tarjetas seleccionables.
- **Agregar custom** abre un modal; el mismo modal permite editar. Guardar o cancelar lo cierra correctamente, y los mensajes del editor aparecen dentro del modal.
- **My Study Time** es una ventana flotante y arrastrable desde el inicio, minimizada por defecto; se puede expandir, configurar y minimizar sin ocupar espacio en el flujo de la página. Recuerda su posición y su estado minimizado en este navegador. Sigue funcionando durante cualquier sección de la app.
- **Manga Reader** tiene paneles de lectura más altos y ya no muestra las dos leyendas solicitadas sobre envío a OpenAI o apertura sin tokens.
- Se retiraron los dos textos de ayuda/sincronización de la vista Custom. Esto **no corrige ni cambia** el estado real de sincronización; los mensajes de errores de guardado siguen apareciendo cuando corresponde.
- Actualizados los recursos de la PWA, su caché y el footer a `v28.5`. El almacenamiento y las tablas SQL no cambian respecto a v28.4.

## v28.4 — Colección Custom y guardado desde Manga Reader

- El botón Custom abre una pantalla funcional de colección, con regreso a la pantalla de origen.
- Manga Reader incluye «My Custom Collection» para abrirla sin pasar por el inicio.
- Los botones para guardar palabras y kanjis muestran «Saving…» y, al guardarse, «✓ Saved», con animación breve y confirmación junto al elemento.
- Lo que ya está guardado se indica al volver al manga, evitando duplicados y cambios de botón engañosos.
- Los archivos CSS y JavaScript usan identificadores v28.4, con nuevo caché de service worker para reducir versiones mezcladas en deploys.
- No modifica las páginas de manga ni sus análisis almacenados localmente. No requiere SQL adicional si ya se instaló la v28.0.

## v28.3 — Word Challenge en el panel derecho y actualización PWA

- Word Challenge ahora aparece una sola vez, debajo de One Pass, junto a los otros modos de práctica del panel derecho. No está en la barra superior.
- Se corrigió el ID duplicado de la v28.2 para que el botón abra el diálogo correctamente.
- El pie de página y la versión del paquete se actualizaron a v28.3.
- Se cambió el identificador del caché del service worker y se usa primero la red para obtener archivos frescos, con respaldo offline. Esto evita que la PWA siga sirviendo archivos viejos cuando ya existe una versión nueva.
- No requiere SQL nuevo ni modifica datos, IndexedDB, historial de manga, Supabase o la lógica de práctica.
- Subí **todos los archivos del ZIP**, incluidos `index.html`, `styles.css`, `sw.js` y `package.json`, al repositorio vinculado con Vercel. El deploy debe contener esos archivos en la raíz configurada del proyecto.
- Si el navegador mantiene la versión vieja, aceptá el aviso de actualización de la PWA. Para verificar qué está publicado, probá primero en incógnito. No uses «Borrar datos del sitio», porque la biblioteca del Manga Reader puede estar guardada localmente.

## v28.0 — Caracteres y palabras personalizadas

Ahora hay una sección **Caracteres custom**, junto a Kanji, Manga Reader y Word Challenge. Podés agregar cualquier carácter, kanji, palabra o expresión japonesa; guardar la lectura en romaji y kana, el significado y una nota; editar, borrar, buscar y filtrar elementos. Desde el desglose de palabras y kanjis del Manga Reader se pueden guardar directamente con **+ Guardar** y queda registrado el manga/capítulo de origen. Guardar un elemento no llama a OpenAI ni consume tokens. Los duplicados del mismo tipo y texto se evitan.

La colección permite seleccionar elementos y practicar hasta 20 por sesión con respuestas escritas, usando lectura en romaji, significado o modo mixto. Guarda cada respuesta, incluso los errores, para mostrar **aciertos / intentos** por elemento. Cuando solo hay lectura en kana, se genera una transliteración básica a romaji; podés corregirla desde **Editar**. Si no hay romaji ni significado, el elemento se guarda pero todavía no participa en las preguntas.

El almacenamiento utiliza el historial offline de `cloud-sync.js`, separado por User ID. Con sesión de Google, sincroniza con la tabla ya existente `public.ktf_progress_events` y sus políticas RLS. Sin sesión, guarda localmente y migra los elementos de invitado a la cuenta al iniciar sesión. **Para activar la sincronización**, ejecutá una vez `setup/custom-collection.sql` en el SQL Editor de Supabase antes de publicar esta versión. Ese SQL extiende únicamente los tipos de eventos permitidos: **no borra las selecciones, los exámenes, las imágenes ni los análisis guardados del Manga Reader**. No hacen falta cambios en la Edge Function ni en OpenAI.

Para desplegar en Vercel, reemplazá los archivos del proyecto por los de este ZIP, conservando tu `config.js` y cualquier configuración de despliegue propia. La PWA actualiza el caché al identificador v28 para descargar `custom-collection.js`. Tus mangas siguen guardándose localmente como antes, mientras que la colección custom se sincroniza entre dispositivos cuando iniciás sesión.

# Kana Training Facility v27.0 — OCR sin duplicados y eliminación de textos

- Los resultados OCR nuevos se limpian antes de solicitar explicaciones, descartando bloques que son la concatenación exacta de dos o más bloques ya detectados. También se eliminan duplicados idénticos cuando provienen de la misma región; textos iguales en posiciones claramente diferentes se conservan.
- Al abrir una página previamente analizada, se aplica la misma limpieza y se guarda de vuelta en IndexedDB. No se repite ningún análisis ni se consumen tokens; se mantienen los bloques y las explicaciones válidas.
- Cada tarjeta de diálogo ahora ofrece **Quitar texto**, con confirmación. Borra únicamente ese bloque de la página y persiste el cambio en el caché local; se conservan el capítulo, la imagen y los demás resultados.
- Ningún cambio en el esquema, identificadores de usuario, hash de imágenes, versiones OCR/explicación de IndexedDB ni Secret de Supabase.
- Para publicar, actualizá los archivos estáticos en GitHub Pages (incluido `sw.js`) y desplegá también `supabase/functions/ktf-manga-analyze/index.ts` para el filtrado adicional en el servidor.

---

# Kana Training Facility v26.1 — ubicaciones de diálogo

Esta actualización recupera y refuerza el resaltado de la zona de la imagen correspondiente a cada texto japonés al seleccionar su tarjeta, al hacer foco en el campo de romaji o al revelar la respuesta.

Cuando el OCR proporciona coordenadas, la región aparece automáticamente. En los capítulos analizados que no tengan coordenadas, usá **Marcar texto en imagen**, arrastrá un rectángulo sobre el globo y soltá. Se guarda dentro del capítulo en IndexedDB y no consume tokens de OpenAI. Si la ubicación automática es imprecisa, usá **Ajustar ubicación**.

Se conserva el mismo nombre de base IndexedDB, la versión del esquema, los hashes y las versiones de OCR y explicaciones de v26. Ninguna migración borra registros; no hace falta volver a subir las páginas guardadas.

Para instalar: subí el contenido de este ZIP a GitHub Pages. Después actualizá `supabase/functions/ktf-manga-analyze/index.ts` en Supabase Edge Functions y elegí **Deploy updates** si querés que los OCR nuevos soliciten coordenadas de forma más insistente. No se modifican los Secrets ni el SQL.

**Los resultados antiguos no reciben coordenadas de forma automática**, porque el cache ya tiene la transcripción sin esa información. Podés marcarlos manualmente sin repetir el análisis, o volver a analizar una página cuando quieras.

---

# Kana Training Facility

A retro-inspired Japanese study website. Everything runs in your browser, with **no accounts, analytics, external libraries, server, or build tools**.

## Features

- **Global study clock:** the study timer is a compact, floating and movable window on every screen, minimized by default and expandable to set hours and minutes. Its position and minimized preference persist locally. The countdown and study summary continue uninterrupted while moving or minimizing it.


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

The global clock floats from the start on all screens, minimized by default. Expand the window to set a duration or inspect the current countdown. Drag its title bar (`⠿`) to move it; the location is saved and clamped to the visible viewport. For keyboard positioning, focus the title bar and use arrow keys (Shift + arrow for smaller steps). Minimizing the window does not pause the countdown.

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

## Private Manga Reader (v25)

New private page reader to the left of Word Challenge. Multiple manga pages can be uploaded and cached locally (not synced), and each detected dialogue lets you attempt its romaji before revealing the reading, English translation, vocabulary and kanji explanations. Corrections are supported. No manga art is generated or bundled.

**One-time online setup required:** see `setup/MANGA_READER_SETUP.md` for the OpenAI API key, the allowed email and user ID Secrets, `setup/manga-quota.sql` and deployment of `supabase/functions/ktf-manga-analyze/index.ts`. Online AI analysis requires a Google/Supabase session; other app features remain offline. The function sends page images to OpenAI GPT-6 Luna for analysis when requested, but does not save them in Supabase.

## Manga Reader v24: staged analysis + private access

Manga Reader uses two stages: image transcription and text-only explanation. It displays transcribed Japanese immediately and retains it if explanations fail. The **Retry explanations** button does not repeat OCR. Both the PWA JavaScript and the Supabase function must be deployed together. See `setup/MANGA_READER_SETUP.md`.

## v24 private GPT-6 Luna access

The Manga Reader button remains hidden for every visitor until a signed-in account is authorized by `GET /functions/v1/ktf-manga-analyze`. The Edge Function checks both the authenticated Supabase user ID and email against Supabase Edge Function Secrets, with no nickname restriction. A `403` blocks all AI modes even if somebody calls the endpoint manually. The frontend contains no allowed email, allowed user ID or OpenAI API key. Set `OPENAI_API_KEY`, `OPENAI_MODEL`, `KTF_AI_ALLOWED_EMAIL`, and `KTF_AI_ALLOWED_USER_ID` as described in `setup/MANGA_READER_SETUP.md`.


## Manga Reader v25: Local chapter library and version footer

The footer shows **v25.0**. Manga Reader stores uploaded pages in IndexedDB in compressed JPEG form, with OCR and explanations. Pages are deduplicated by the SHA-256 hash of the **original uploaded file**; uploading identical bytes again restores the cached result rather than repeating a paid OpenAI call. A new `manga-cache.js` file handles this storage; keep it in the repository. Cached Japanese text explanations are also reusable independently of OCR. Manual **Reanalyze with AI** deliberately creates new paid requests.

Before choosing image files, fill in **Manga title** (for example, *The Green Manga*) and **Chapter / batch** (for example, *Capítulo #1*), then add around four pages or up to 16. The chapter is saved locally with page order. **View analyzed manga** opens a library grouped by series and ordered naturally by chapter numbers, so Capítulo #2 appears before #10. **New chapter** preserves the current manga title and suggests the next chapter number. You can change an existing chapter title by editing the fields and leaving the field. Removing a chapter removes only its grouping: cached analyses are retained to avoid duplicate token charges. **Delete all local manga** removes both chapters and cached pages after confirmation.

The library is indexed to the currently authorized Supabase User UID in this browser, is hidden from unauthorized users, and never syncs manga pages to Supabase. **It is not an encrypted vault**: browser profile/device access and clearing website storage affect availability/privacy. IndexedDB may be evicted by the browser; exporting backups is not supported yet. Images uploaded after future image compression or editing have different bytes and might not match previous SHA-256 values, even if visually identical.


## Manga Reader v26.0 — Better Japanese OCR and manual page ordering

- Thumbnails can now be dragged, and accessible left/right arrows work on desktop and mobile; chapter order is persisted locally and restored when the chapter is reopened, even when uploaded image hashes complete out of order. No OpenAI calls are made merely to rearrange pages.
- OCR prompts now scan the whole manga image more carefully and incoming photos can be processed at up to 3000px on the longest side (subject to the backend size limit).
- **Reanalyze with AI** triggers a thorough two-pass OCR process on that page. The second pass is asked to identify genuinely omitted dialogue only. Existing explanations are retained for unchanged text. The second pass costs extra tokens.
- Optional Supabase secret `OPENAI_OCR_MODEL` overrides the OCR model without changing the main `OPENAI_MODEL` used for explanations; no value is required by default.
- **No cache migration or deletion:** IndexedDB database/version, page cache versions, hashes, saved chapters, account IDs and text explanations remain intact. The footer displays `v26.0` and the PWA Service Worker cache ID has been bumped.
- **Deployment:** upload all static files to GitHub Pages AND redeploy the new `supabase/functions/ktf-manga-analyze/index.ts` to activate the OCR fix. Existing Secrets and SQL stay unchanged.
