"use strict";
(() => {
  const $ = id => document.getElementById(id);
  const cloud = window.KTFCloud;
  const bridge = window.KTFBridge;
  const cache = window.KTFMangaCache;
  const pages = [];
  let history = [];
  let chapters = [];
  let libraryOpen = false;
  let activeChapterId = null;
  let chapterReady = Promise.resolve();
  let historySerial = 0;
  let cacheWarningShown = false;
  const ownerId = () => cloud?.getStatus?.()?.user?.id || '';
  let activeId = null;
  let running = false;
  let analyzeAll = false;
  let aborter = null;
  let selectedItem = null;
  let authorized = false;
  let accessIdentity = '';
  let accessExpiresAt = 0;
  let accessSerial = 0;
  let accessPending = null;
  const accessEndpoint = () => `${window.KTF_CONFIG.SUPABASE_URL}/functions/v1/ktf-manga-analyze`;
  function setAuthorized(value) {
    const previous = authorized;
    authorized = Boolean(value);
    $('openMangaButton').hidden = !authorized;
    $('openMangaButton').setAttribute('aria-hidden', String(!authorized));
    if (previous !== authorized) document.dispatchEvent(new CustomEvent('ktf:aiaccesschange', {detail:{allowed:authorized}}));
    if (previous && !authorized) {
      if (!$('mangaScreen').hidden) closeReader();
      analyzeAll = false;
      aborter?.abort();
      running = false;
      for (const page of pages) URL.revokeObjectURL(page.url);
      pages.length = 0;
      activeId = null;
      selectedItem = null;
      historySerial++;
      history = [];
      chapters = [];
      activeChapterId = null;
      chapterReady = Promise.resolve();
      libraryOpen = false;
      $('mangaSeriesName').value = '';
      $('mangaChapterName').value = '';
      $('mangaHistoryList').innerHTML = '';
      $('mangaHistoryPanel').hidden = true;
    }
    if (!previous && authorized) refreshHistory().catch(() => {});
  }
  async function refreshAccess(force = false) {
    const uid = cloud?.getStatus?.()?.user?.id || '';
    if (!uid || !navigator.onLine) {
      accessSerial++;
      accessIdentity = '';
      accessExpiresAt = 0;
      accessPending = null;
      setAuthorized(false);
      return false;
    }
    if (uid !== accessIdentity) {
      accessSerial++;
      accessIdentity = uid;
      accessExpiresAt = 0;
      accessPending = null;
      setAuthorized(false);
    }
    if (!force && Date.now() < accessExpiresAt) return authorized;
    if (accessPending) return accessPending;
    const revision = ++accessSerial;
    const task = (async () => {
      let allowed = false;
      try {
        const token = await cloud.getAccessToken();
        if (token) {
          const response = await fetch(accessEndpoint(), {
            method: 'GET',
            cache: 'no-store',
            headers: {
              Authorization: `Bearer ${token}`,
              apikey: window.KTF_CONFIG.SUPABASE_PUBLISHABLE_KEY
            }
          });
          if (response.ok) {
            const data = await response.json();
            allowed = data.allowed === true;
          }
        }
      } catch (_) {}
      if (revision === accessSerial && uid === cloud?.getStatus?.()?.user?.id) {
        setAuthorized(allowed);
        accessExpiresAt = Date.now() + (allowed ? 300000 : 30000);
      }
      return allowed;
    })();
    accessPending = task;
    try { return await task; }
    finally { if (accessPending === task) accessPending = null; }
  }
  const MAX_PAGES = 16;
  const MAX_FILE = 18 * 1024 * 1024;
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const lang = () => bridge?.getLanguage?.() === 'es' ? 'es' : 'en';
  const labels = {
    en:{title:'Manga Reader',subtitle:'Read real Japanese pages at your own pace',choose:'Add manga pages',empty:'Drop some manga pages here or choose files to begin.',read:'Analyze this page',all:'Analyze all pages',retry:'Try again',add:'Add pages',remove:'Remove page',signIn:'Sign in with Google to analyze',signed:'Google sign-in is only required for online analysis.',noSave:'Analyzed pages, compressed images and explanations are saved privately in this browser (IndexedDB), not synced between devices.',sent:'When you analyze, the image is sent to OpenAI GPT-6 Luna through your protected Supabase function.',noItems:'No dialogue detected. You can add Japanese text yourself.',noAnalysis:'Select Analyze to recognize Japanese text on this page.',working:'Reading Japanese text…',line:'Text',readPrompt:'Write this in romaji',check:'Check my reading',show:'Show reading & translation',hide:'Hide answer',words:'Word meanings',edit:'Correct Japanese text',saveEdit:'Update explanation',cancel:'Cancel',addText:'Add a text manually',correct:'Looks right!',incorrect:'Not quite. Try again or reveal the answer.',romaji:'Reading (romaji)',english:'English translation',notReady:'Sign in and deploy the Manga Reader function to enable AI analysis.',error:'Could not analyze this page.',done:'Page analyzed.',pending:'Ready to analyze',processing:'Analyzing',completed:'Analyzed',manual:'Manual text',yourReading:'Your reading',loadError:'Could not read these files.',long:'Unanalyzed pages are temporary. Analyzed pages are saved locally.',help:'You can try the romaji first, then reveal the reading or individual word meanings. OCR and translations may be imperfect.',continue:'Next page',chooseNext:'Choose a page above.',noInternet:'Manga Reader needs an internet connection for analysis. Your other study modes still work offline.',tooMany:'Up to 16 pages per batch.',bigFile:'A file exceeds 18 MB.',invalid:'Choose PNG, JPG or WEBP images.',missing:'Enter some Japanese text first.',editing:'Correct the OCR and refresh its explanation.',reveal:'Reveal word meanings',hideWords:'Hide word meanings',noWords:'No word breakdown available. Try refreshing the explanation.',failed:'Not ready',processingMany:'Analyzing page',of:'of',analyzed:'Done',cancelAnalysis:'Stop analyzing',close:'Back to selection',needLogin:'Sign in with Google in My Progress or use the button here. Pages will not be synced.',privacy:'PRIVATE READING SPACE',noRegions:'If a bubble is missed, choose Add a text manually.',skip:'Skip page',reset:'Clear all pages',confirmReset:'Clear all pages and their unsaved notes?',recognition:'Recognized dialogue',ocrDone:'Text recognized · preparing explanations',retryExplanation:'Retry explanations',needExplanation:'Explanations are not ready yet. Your transcription is preserved.',hint:'Words can have context-dependent readings; check uncertain results against the image.',newPage:'Add another manga page'},
    es:{title:'Lector de manga',subtitle:'Leé páginas reales en japonés a tu ritmo',choose:'Agregar páginas de manga',empty:'Arrastrá páginas acá o elegí archivos para comenzar.',read:'Analizar esta página',all:'Analizar todas',retry:'Reintentar',add:'Agregar páginas',remove:'Quitar página',signIn:'Iniciar sesión con Google para analizar',signed:'Solo necesitás iniciar sesión para el análisis online.',noSave:'Las páginas analizadas, imágenes comprimidas y explicaciones se guardan localmente en este navegador (IndexedDB), sin sincronizarse entre dispositivos.',sent:'Al analizar, la imagen se envía a OpenAI GPT-6 Luna mediante tu función protegida de Supabase.',noItems:'No se detectaron diálogos. Podés agregar texto japonés manualmente.',noAnalysis:'Elegí Analizar para reconocer el japonés de esta página.',working:'Reconociendo texto japonés…',line:'Texto',readPrompt:'Escribí esto en romaji',check:'Comprobar lectura',show:'Mostrar lectura y traducción',hide:'Ocultar respuesta',words:'Significado de palabras',edit:'Corregir japonés detectado',saveEdit:'Actualizar explicación',cancel:'Cancelar',addText:'Agregar texto manualmente',correct:'¡Muy bien!',incorrect:'No coincide. Probá de nuevo o revelá la respuesta.',romaji:'Lectura (romaji)',english:'Traducción al inglés',notReady:'Iniciá sesión y publicá la función de Manga Reader para activar el análisis.',error:'No se pudo analizar esta página.',done:'Página analizada.',pending:'Lista para analizar',processing:'Analizando',completed:'Analizada',manual:'Texto manual',yourReading:'Tu lectura',loadError:'No se pudieron leer esos archivos.',long:'Las páginas sin analizar son temporales. Las analizadas quedan guardadas localmente.',help:'Podés intentar el romaji primero y después revelar la lectura o el significado de cada palabra. El OCR y las traducciones pueden equivocarse.',continue:'Página siguiente',chooseNext:'Elegí una página arriba.',noInternet:'Manga Reader necesita internet para el análisis. Los demás modos siguen funcionando offline.',tooMany:'Hasta 16 páginas por lote.',bigFile:'Un archivo supera los 18 MB.',invalid:'Elegí imágenes PNG, JPG o WEBP.',missing:'Ingresá primero un texto en japonés.',editing:'Corregí el OCR y actualizá la explicación.',reveal:'Revelar palabras',hideWords:'Ocultar palabras',noWords:'No hay desglose disponible. Probá actualizar la explicación.',failed:'Sin analizar',processingMany:'Analizando página',of:'de',analyzed:'Terminado',cancelAnalysis:'Detener análisis',close:'Volver a selección',needLogin:'Iniciá sesión con Google en Mi progreso o usá el botón acá. Las páginas no se sincronizan.',privacy:'ESPACIO DE LECTURA PRIVADO',noRegions:'Si falta una burbuja, elegí Agregar texto manualmente.',skip:'Saltar página',reset:'Limpiar páginas',confirmReset:'¿Borrar todas las páginas y notas temporales?',recognition:'Diálogos reconocidos',ocrDone:'Texto reconocido · preparando explicaciones',retryExplanation:'Reintentar explicaciones',needExplanation:'Las explicaciones todavía no están listas. El texto reconocido se conserva.',hint:'Las lecturas pueden cambiar según el contexto: revisá los resultados dudosos contra la imagen.',newPage:'Agregar otra página'}
  };
  const t = key => labels[lang()][key] || key;
  const currentPage = () => pages.find(page => page.id === activeId) || null;
  const uuid = () => crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
  function toast(message, isError=false) {
    const node = $('mangaNotice');
    node.textContent = message;
    node.dataset.type = isError ? 'error' : 'info';
    node.hidden = !message;
  }
  function normalize(text) {
    return String(text||'').normalize('NFKC').toLowerCase()
      .replace(/[āâ]/g,'aa').replace(/[īî]/g,'ii').replace(/[ūû]/g,'uu')
      .replace(/[ēê]/g,'ee').replace(/[ōô]/g,'ou')
      .replace(/[^a-z]/g,'').replace(/shi/g,'si').replace(/chi/g,'ti')
      .replace(/tsu/g,'tu').replace(/fu/g,'hu').replace(/ji/g,'zi');
  }
  const cacheLabels = {
    en:{history:'My manga library',historyHelp:'Each chapter keeps the order of your pages, OCR and explanations. Saved only in this browser for your signed-in account.',historyEmpty:'No saved chapters yet.',historyOpen:'Open saved page',historyDelete:'Delete',historyClear:'Delete all local manga',historyConfirm:'Delete ALL saved chapters, images and analyses on this device? This cannot be undone.',historyDeleteConfirm:'Remove this cached page from this browser?',force:'Reanalyze with AI',forceConfirm:'This makes new paid OCR and explanation requests. Continue?',cacheHit:'Loaded from local cache · no tokens used.',cacheFail:'Local storage is unavailable or full. Your work might be lost when reloading.',cacheLoading:'Checking saved analysis…',cacheRestored:'Opened from the local library.',series:'Manga title',chapter:'Chapter / batch',newChapter:'New chapter',viewLibrary:'View analyzed manga',hideLibrary:'Hide my library',needTitle:'Enter the manga title and chapter before adding pages.',deleteChapter:'Delete chapter',confirmDeleteChapter:'Remove this chapter from the library? The image analyses will remain cached to avoid spending tokens again.',orphans:'Other cached pages',pages:'pages',analyzedPages:'analyzed',opened:'Chapter opened without using tokens.',chapterSaved:'Chapter saved on this device.',chapterMissing:'This chapter has no cached image available.',chapterBusy:'Saving pages on this device…'},
    es:{history:'Mis mangas y capítulos',historyHelp:'Cada capítulo mantiene el orden de las páginas, OCR y explicaciones. Solo en este navegador y para tu cuenta.',historyEmpty:'Todavía no guardaste capítulos.',historyOpen:'Abrir página guardada',historyDelete:'Eliminar',historyClear:'Borrar todos los mangas locales',historyConfirm:'¿Eliminar TODOS los capítulos, imágenes y análisis guardados en este dispositivo? No se puede deshacer.',historyDeleteConfirm:'¿Eliminar esta página del caché de este navegador?',force:'Volver a analizar con IA',forceConfirm:'Esto vuelve a gastar solicitudes pagas de OCR y explicaciones. ¿Continuar?',cacheHit:'Cargado desde caché local · sin gastar tokens.',cacheFail:'El almacenamiento local no está disponible o está lleno. Podrías perder el trabajo al recargar.',cacheLoading:'Buscando análisis guardado…',cacheRestored:'Abierto desde la biblioteca local.',series:'Título del manga',chapter:'Capítulo / lote',newChapter:'Nuevo capítulo',viewLibrary:'Ver mangas analizados',hideLibrary:'Ocultar biblioteca',needTitle:'Ingresá el nombre del manga y del capítulo antes de agregar páginas.',deleteChapter:'Eliminar capítulo',confirmDeleteChapter:'¿Quitar este capítulo de la biblioteca? Los análisis de sus imágenes seguirán en caché para no gastar tokens otra vez.',orphans:'Otras páginas guardadas',pages:'páginas',analyzedPages:'analizadas',opened:'Capítulo abierto sin gastar tokens.',chapterSaved:'Capítulo guardado en este dispositivo.',chapterMissing:'Este capítulo no tiene imágenes guardadas disponibles.',chapterBusy:'Guardando las páginas en el dispositivo…'}
  };
  const ct = key => cacheLabels[lang()][key] || key;
  function cacheWarning() {
    if (cacheWarningShown) return;
    cacheWarningShown = true;
    toast(ct('cacheFail'), true);
  }
  async function refreshHistory() {
    if (!authorized || !ownerId() || !cache) return;
    const uid = ownerId();
    const revision = ++historySerial;
    try {
      const [entries, savedChapters] = await Promise.all([cache.list(uid), cache.listChapters(uid)]);
      if (revision !== historySerial || !authorized || uid !== ownerId()) return;
      history = entries;
      chapters = savedChapters;
      renderHistory();
    } catch (error) { console.warn('Local manga history unavailable', String(error)); cacheWarning(); }
  }
  function renderHistory() {
    $('mangaHistoryPanel').hidden = !authorized || !libraryOpen;
    $('mangaLibraryToggle').textContent = ct(libraryOpen ? 'hideLibrary' : 'viewLibrary');
    $('mangaLibraryToggle').setAttribute('aria-expanded', String(libraryOpen));
    $('mangaHistoryHeading').textContent = ct('history');
    $('mangaHistoryHelp').textContent = ct('historyHelp');
    $('mangaHistoryClear').textContent = ct('historyClear');
    $('mangaHistoryClear').disabled = (!chapters.length && !history.length) || running;
    $('mangaActiveChapter').hidden = !activeChapterId;
    $('mangaActiveChapter').textContent = activeChapterId ? `${$('mangaSeriesName').value.trim()} · ${$('mangaChapterName').value.trim()}` : '';
    if (!libraryOpen) return;
    const seriesMap = new Map();
    for (const chapter of chapters) {
      const name = chapter.mangaTitle || 'Manga';
      if (!seriesMap.has(name)) seriesMap.set(name, []);
      seriesMap.get(name).push(chapter);
    }
    const natural = new Intl.Collator(lang() === 'es' ? 'es' : 'en', {numeric:true, sensitivity:'base'});
    const grouped = [...seriesMap.entries()].sort((a,b)=>natural.compare(a[0],b[0])).map(([name, items])=>{
      items.sort((a,b)=>natural.compare(a.chapterTitle||'',b.chapterTitle||''));
      const cards = items.map(chapter=>{
        const total = chapter.pages?.length || 0;
        const done = chapter.pages?.filter(page => history.some(record => record.hash === page.hash && record.status === 'completed')).length || 0;
        return `<div class="manga-chapter-entry"><button type="button" class="manga-chapter-open" data-chapter-open="${escapeHtml(chapter.id)}"><strong>${escapeHtml(chapter.chapterTitle)}</strong><small>${total} ${ct('pages')} · ${done} ${ct('analyzedPages')}</small></button><button type="button" class="mini-button" data-chapter-delete="${escapeHtml(chapter.id)}">${ct('historyDelete')}</button></div>`;
      }).join('');
      return `<section class="manga-series"><h3>${escapeHtml(name)}</h3><div class="manga-chapter-cards">${cards}</div></section>`;
    }).join('');
    const assigned = new Set(chapters.flatMap(chapter => (chapter.pages || []).map(page => page.hash)));
    const orphan = history.filter(record => !assigned.has(record.hash)).map(record=>{
      const count = Array.isArray(record.items) ? record.items.length : 0;
      return `<div class="manga-history-entry"><button type="button" data-cache-open="${escapeHtml(record.hash)}" title="${ct('historyOpen')}"><strong>${escapeHtml(record.name)}</strong><small>${count} ${t('line').toLowerCase()}</small></button><button type="button" class="mini-button" data-cache-delete="${escapeHtml(record.hash)}">${ct('historyDelete')}</button></div>`;
    }).join('');
    $('mangaHistoryList').innerHTML = grouped + (orphan ? `<section class="manga-orphans"><h3>${ct('orphans')}</h3><div class="manga-chapter-cards">${orphan}</div></section>` : '') || `<p class="manga-privacy-subtle">${ct('historyEmpty')}</p>`;
  }
  function clearWorkspace() {
    for (const page of pages) URL.revokeObjectURL(page.url);
    pages.length = 0;
    activeId = null;
    selectedItem = null;
    $('mangaImage').dataset.page = '';
  }
  async function awaitPendingSaves() {
    await Promise.allSettled(pages.map(page => page.cacheReady).filter(Boolean));
  }
  async function startNewChapter() {
    if (!authorized || running) return;
    await awaitPendingSaves();
    const series = $('mangaSeriesName').value.trim();
    const numberForSeries = chapters.filter(chapter => chapter.mangaTitle.trim().toLowerCase() === series.toLowerCase())
      .map(chapter => Number((chapter.chapterTitle.match(/\d+/) || [])[0]) || 0);
    const next = Math.max(0, ...numberForSeries) + 1;
    clearWorkspace();
    activeChapterId = null;
    chapterReady = Promise.resolve();
    $('mangaChapterName').value = series ? `${lang() === 'es' ? 'Capítulo' : 'Chapter'} #${next}` : '';
    $('mangaSeriesName').focus();
    render();
  }
  async function openSavedChapter(id) {
    if (!authorized || running || !cache) return;
    const uid = ownerId();
    await awaitPendingSaves();
    try {
      const chapter = await cache.readChapter(uid,id);
      if (!chapter || uid !== ownerId() || !authorized) return;
      const savedPages = [];
      for (const entry of (chapter.pages || []).slice(0,MAX_PAGES)) {
        const record = await cache.read(uid,entry.hash);
        if (!record?.imageBlob || uid !== ownerId() || !authorized) continue;
        const name = entry.name || record.name || 'manga.jpg';
        const file = new File([record.imageBlob],name,{type:'image/jpeg'});
        const page = {id:uuid(),name,file,url:URL.createObjectURL(record.imageBlob),items:[],status:'pending',hash:entry.hash,
          previewBlob:record.imageBlob,cacheReady:Promise.resolve(),chapterId:id};
        if (hydrate(page,record)) savedPages.push(page);
        else URL.revokeObjectURL(page.url);
      }
      if (!authorized || uid !== ownerId()) { savedPages.forEach(page=>URL.revokeObjectURL(page.url)); return; }
      clearWorkspace();
      pages.push(...savedPages);
      activeChapterId = id;
      chapterReady = Promise.resolve();
      $('mangaSeriesName').value = chapter.mangaTitle;
      $('mangaChapterName').value = chapter.chapterTitle;
      activeId = pages[0]?.id || null;
      selectedItem = pages[0]?.items[0]?.id || null;
      libraryOpen = false;
      render();
      toast(pages.length ? ct('opened') : ct('chapterMissing'), !pages.length);
    } catch (error) {console.warn('Could not open manga chapter',String(error)); cacheWarning();}
  }
  async function deleteChapter(id) {
    if (!authorized || running || !confirm(ct('confirmDeleteChapter'))) return;
    const uid = ownerId();
    try {
      await cache.removeChapter(uid,id);
      if (uid === ownerId()) {
        if (activeChapterId === id) activeChapterId = null;
        await refreshHistory();
      }
    } catch (error) {console.warn('Could not delete chapter',String(error)); cacheWarning();}
  }
  async function updateChapterTitle() {
    if (!activeChapterId || !authorized || running) return;
    const mangaTitle = $('mangaSeriesName').value.trim().slice(0,120);
    const chapterTitle = $('mangaChapterName').value.trim().slice(0,80);
    if (!mangaTitle || !chapterTitle) return;
    const uid = ownerId();
    try {
      await chapterReady;
      if (!authorized || ownerId() !== uid) return;
      await cache.renameChapter(uid, activeChapterId, mangaTitle, chapterTitle);
      await refreshHistory();
    } catch (error) { console.warn('Could not rename chapter',String(error));cacheWarning(); }
  }
  function hydrate(page, record) {
    if (!record || record.ocrVersion !== cache.OCR_VERSION) return false;
    page.hash = record.hash;
    page.previewBlob = record.imageBlob;
    const explanationValid = record.explainVersion === cache.EXPLAIN_VERSION;
    page.items = (Array.isArray(record.items) ? record.items : []).map(raw => {
      const item = toItem(raw, {manual: Boolean(raw.manual)});
      if (!explanationValid) Object.assign(item, {reading:'',romaji:'',english:'',words:[],kanji:[]});
      return item;
    }).filter(item => item.japanese);
    page.items.forEach((item,index) => { item.dirty = Boolean(record.items[index]?.dirty); });
    page.status = page.items.length ? (page.items.some(item => !item.romaji || item.dirty) ? 'transcribed' : 'completed') : (record.status === 'completed' ? 'completed' : 'pending');
    return true;
  }
  async function rememberPage(page) {
    const uid = ownerId();
    if (!authorized || !uid || !cache || !page.hash || !pages.includes(page)) return;
    try {
      if (!page.previewBlob) {
        const prepared = await imageForAPI(page.file);
        page.previewBlob = prepared.blob;
      }
      if (!authorized || uid !== ownerId() || !pages.includes(page)) return;
      const record = {
        hash:page.hash, name:page.name, imageBlob:page.previewBlob, status:page.status,
        items:page.items.map(item => ({japanese:item.japanese,romaji:item.romaji,reading:item.reading,english:item.english,words:item.words,kanji:item.kanji,bbox:item.bbox,manual:item.manual,dirty:item.dirty}))
      };
      await cache.save(uid, record);
      refreshHistory().catch(() => {});
    } catch (error) { console.warn('Could not save manga cache', String(error)); cacheWarning(); }
  }
  async function lookupPage(page) {
    const uid = ownerId();
    if (!authorized || !uid || !cache) return;
    try {
      page.hash = await cache.fileHash(page.file);
      if (!authorized || uid !== ownerId() || !pages.includes(page)) return;
      const found = await cache.read(uid, page.hash);
      if (found && authorized && uid === ownerId() && pages.includes(page) && hydrate(page, found)) {
        if (activeId === page.id) selectedItem = page.items[0]?.id || null;
        if (page.status !== 'pending') toast(ct('cacheHit'));
      } else if (authorized && uid === ownerId() && pages.includes(page)) {
        await rememberPage(page);
      }
      if (page.chapterId && authorized && uid === ownerId() && pages.includes(page)) {
        await chapterReady;
        await cache.addPageToChapter(uid,page.chapterId,{hash:page.hash,name:page.name});
        refreshHistory().catch(() => {});
      }
    } catch (error) { console.warn('Manga cache lookup unavailable', String(error)); cacheWarning(); }
    finally { if (pages.includes(page)) render(); }
  }
  async function openSavedPage(hash) {
    if (!authorized || running || pages.length >= MAX_PAGES) return;
    const uid = ownerId();
    try {
      const record = await cache.read(uid, hash);
      if (!record?.imageBlob || !authorized || uid !== ownerId()) return;
      const file = new File([record.imageBlob], record.name || 'manga.jpg', {type:'image/jpeg'});
      const page = {id:uuid(), name:record.name || 'manga.jpg',file,url:URL.createObjectURL(record.imageBlob),items:[],status:'pending',hash,previewBlob:record.imageBlob,cacheReady:Promise.resolve()};
      if (!hydrate(page, record)) { URL.revokeObjectURL(page.url); return; }
      if (!pages.length) activeChapterId = null;
      pages.push(page);
      activeId = page.id;
      selectedItem = page.items[0]?.id || null;
      render();
      toast(ct('cacheRestored'));
    } catch (error) { console.warn('Could not reopen saved manga page',String(error)); cacheWarning(); }
  }
  async function deleteHistoryEntry(hash) {
    if (!authorized || running || !confirm(ct('historyDeleteConfirm'))) return;
    const uid = ownerId();
    try { await cache.remove(uid, hash); if (uid === ownerId()) await refreshHistory(); }
    catch (error) { console.warn('Could not delete saved page', String(error)); cacheWarning(); }
  }
  async function clearHistory() {
    if (!authorized || running || !confirm(ct('historyConfirm'))) return;
    const uid = ownerId();
    try {
      await awaitPendingSaves();
      if (!authorized || uid !== ownerId()) return;
      await cache.clear(uid);
      clearWorkspace();
      activeChapterId = null;
      chapterReady = Promise.resolve();
      $('mangaSeriesName').value = '';
      $('mangaChapterName').value = '';
      await refreshHistory();
      render();
    } catch (error) { console.warn('Could not clear saved pages', String(error)); cacheWarning(); }
  }
  function updateText() {
    $('mangaTitle').textContent=t('title');
    $('mangaIntro').textContent=t('subtitle');
    $('mangaChooseLabel').textContent=t('choose');
    $('mangaAddLabel').textContent=t('add');
    $('mangaPrivacy').textContent=t('noSave');
    $('mangaUploadHint').textContent=t('sent');
    $('mangaEmpty').textContent=t('empty');
    $('mangaAnalyze').textContent=t('read');
    $('mangaAnalyzeAll').textContent=t('all');
    $('mangaCancel').textContent=t('cancelAnalysis');
    $('mangaManual').textContent=t('addText');
    $('mangaClear').textContent=t('reset');
    $('mangaLogin').textContent=t('signIn');
    $('mangaLoginTop').textContent=t('signIn');
    $('mangaBack').textContent=t('close');
    $('mangaRightHeading').textContent=t('recognition');
    $('mangaNoSave').textContent=t('help');
    $('mangaLaunchText').textContent=t('title');
    $('mangaPrivacyEyebrow').textContent=t('privacy');
    $('mangaReanalyze').textContent=ct('force');
    $('mangaSeriesLabel').textContent=ct('series');
    $('mangaChapterLabel').textContent=ct('chapter');
    $('mangaNewChapter').textContent=ct('newChapter');
    renderHistory();
  }
  function showReader() {
    if (!authorized) return;
    if (bridge.isQuizActive() || !$('examScreen').hidden) {
      toast(lang()==='es'?'Terminá tu práctica o examen antes de abrir el lector.':'Finish your practice or exam before opening the reader.',true);
      return;
    }
    $('setupScreen').hidden=true;
    $('quizScreen').hidden=true;
    $('summaryScreen') && ($('summaryScreen').hidden=true);
    $('examScreen').hidden=true;
    $('mangaScreen').hidden=false;
    updateText();
    render();
    refreshHistory().catch(() => {});
    $('mangaScreen').scrollIntoView({block:'start',behavior:'instant'});
    document.dispatchEvent(new CustomEvent('ktf:mangascreenchange',{detail:{active:true}}));
  }
  function closeReader() {
    analyzeAll=false;
    if(aborter)aborter.abort();
    running=false;
    $('mangaScreen').hidden=true;
    $('setupScreen').hidden=false;
    toast('');
    document.dispatchEvent(new CustomEvent('ktf:mangascreenchange',{detail:{active:false}}));
    $('setupScreen').scrollIntoView({block:'start',behavior:'instant'});
  }
  function renderStrip() {
    $('mangaPageStrip').innerHTML=pages.map((page,index)=>`<button type="button" class="manga-page-thumb ${page.id===activeId?'is-active':''}" data-page="${page.id}" aria-pressed="${page.id===activeId}" title="${escapeHtml(page.name)}"><img src="${page.url}" alt="" loading="lazy"><span>${index+1}</span><small>${escapeHtml(page.name.length>15?page.name.slice(0,13)+'…':page.name)}</small></button>`).join('');
    $('mangaPageStrip').hidden=!pages.length;
  }
  function render() {
    updateText();
    renderStrip();
    const page=currentPage();
    $('mangaWorkspace').hidden=!page;
    $('mangaEmpty').hidden=Boolean(page);
    $('mangaControls').hidden=!page;
    $('mangaClear').disabled=!pages.length||running;
    $('mangaAnalyze').disabled=!page||running||page.status==='completed';
    $('mangaReanalyze').hidden=!page||!['completed','transcribed'].includes(page.status);
    $('mangaReanalyze').disabled=running;
    $('mangaAnalyzeAll').disabled=!pages.length||running;
    $('mangaCancel').hidden=!running;
    const authed=Boolean(cloud?.getStatus?.()?.user);
    $('mangaLogin').hidden=authed;
    $('mangaLoginTop').hidden=authed;
    if(!page)return;
    const img=$('mangaImage');
    if(img.dataset.page!==page.id){img.dataset.page=page.id;img.src=page.url;img.alt=page.name;}
    $('mangaPageName').textContent=page.name;
    $('mangaRemove').textContent=t('remove');
    $('mangaPageState').textContent=page.status==='completed'?`${t('completed')} · ${page.items.length}`:page.status==='processing'?t('working'):page.status==='transcribed'?t('ocrDone'):t('pending');
    $('mangaAnalyze').textContent=page.status==='completed'?t('completed'):page.status==='transcribed'?t('retryExplanation'):t('read');
    $('mangaRightCount').textContent=page.items.length ? `${page.items.length}` : '—';
    $('mangaTextEmpty').textContent=page.status==='processing'?t('working'):page.status==='completed'?t('noItems'):t('noAnalysis');
    $('mangaTextEmpty').hidden=Boolean(page.items.length);
    renderItems(page);
    highlightRegion(page);
  }
  function renderItems(page) {
    $('mangaReadings').innerHTML=page.items.map((item,index)=>{
      const result=item.check==='correct'?`<span class="manga-check success">${t('correct')}</span>`:item.check==='wrong'?`<span class="manga-check wrong">${t('incorrect')}</span>`:'';
      const words=item.words?.length?item.words.map(word=>`<div class="manga-word"><strong lang="ja">${escapeHtml(word.surface)}</strong><span>${escapeHtml(word.romaji||word.reading||'—')}</span><small>${escapeHtml(word.meaning||'—')}</small></div>`).join(''):`<p class="subtle">${t('noWords')}</p>`;
      const kanji=item.kanji?.length?`<div class="manga-kanji-header">KANJI BREAKDOWN</div>${item.kanji.map(entry=>`<div class="manga-kanji"><strong lang="ja">${escapeHtml(entry.character)}</strong><div><b>${escapeHtml(entry.meaning)}</b><small>${escapeHtml(entry.reading_here)}${entry.note?' · '+escapeHtml(entry.note):''}</small></div></div>`).join('')}`:'';
      const explanation=item.dirty?`<p class="manga-item-warning">${t('editing')}</p>`:!item.romaji?`<p class="manga-item-warning">${t('needExplanation')}</p>`:`<div class="manga-reveal" ${item.revealed?'':'hidden'}><div class="manga-reveal-line"><span>${t('romaji')}</span><strong>${escapeHtml(item.romaji||'—')}</strong></div><div class="manga-reveal-line"><span>${t('english')}</span><p>${escapeHtml(item.english||'—')}</p></div></div><div class="manga-words" ${item.showWords?'':'hidden'}>${words}${kanji}</div>`;
      return `<article class="manga-item ${selectedItem===item.id?'is-selected':''}" data-item="${item.id}">
        <div class="manga-item-head"><span class="manga-item-number">${String(index+1).padStart(2,'0')}</span><span class="manga-item-type">${item.manual?t('manual'):t('line')}</span></div>
        <div class="manga-original" lang="ja">${escapeHtml(item.japanese)}</div>
        <form class="manga-romaji-form" data-check="${item.id}"><label for="manga-answer-${item.id}">${t('readPrompt')}</label><div class="manga-try-row"><input type="text" id="manga-answer-${item.id}" data-answer="${item.id}" value="${escapeHtml(item.answer||'')}" placeholder="romaji..." autocomplete="off" autocapitalize="none" spellcheck="false"><button class="button-primary" type="submit" ${item.dirty||!item.romaji?'disabled':''}>${t('check')}</button></div>${result}</form>
        <div class="manga-card-actions"><button class="button-secondary" type="button" data-reveal="${item.id}" ${item.dirty||!item.romaji?'disabled':''}>${item.revealed?t('hide'):t('show')}</button><button class="button-secondary" type="button" data-words="${item.id}" ${item.dirty||!item.romaji?'disabled':''}>${item.showWords?t('hideWords'):t('reveal')}</button><button class="mini-button" type="button" data-edit="${item.id}">${t('edit')}</button></div>
        ${explanation}
        <form class="manga-editor" data-save="${item.id}" ${item.editing?'':'hidden'}><label for="manga-edit-${item.id}">${t('edit')}</label><textarea id="manga-edit-${item.id}" rows="3" maxlength="500" required>${escapeHtml(item.japanese)}</textarea><div><button type="submit" class="button-primary">${t('saveEdit')}</button><button type="button" class="button-secondary" data-cancel-edit="${item.id}">${t('cancel')}</button></div></form>
      </article>`;
    }).join('');
  }
  function highlightRegion(page) {
    const overlay=$('mangaHighlight');
    const item=page.items.find(x=>x.id===selectedItem);
    const box=item?.bbox;
    if(!box||box.length!==4){overlay.hidden=true;return;}
    overlay.style.top=(box[0]/10)+'%';overlay.style.left=(box[1]/10)+'%';
    overlay.style.height=((box[2]-box[0])/10)+'%';overlay.style.width=((box[3]-box[1])/10)+'%';
    overlay.hidden=false;
  }
  function loadFiles(fileList) {
    if (!authorized || running) return;
    const files=[...fileList];
    if(!files.length)return;
    const series = $('mangaSeriesName').value.trim().slice(0,120);
    const chapter = $('mangaChapterName').value.trim().slice(0,80);
    if (!series || !chapter) return toast(ct('needTitle'),true);
    const validTypes=['image/jpeg','image/png','image/webp'];
    if(files.some(file=>!validTypes.includes(file.type)))return toast(t('invalid'),true);
    if(files.some(file=>file.size>MAX_FILE))return toast(t('bigFile'),true);
    if(files.length+pages.length>MAX_PAGES)return toast(t('tooMany'),true);
    const uid = ownerId();
    if (!activeChapterId) {
      activeChapterId = uuid();
      const id = activeChapterId;
      chapterReady = cache.saveChapter(uid,{id,mangaTitle:series,chapterTitle:chapter}).catch(error=>{
        console.warn('Unable to create local chapter',String(error));
        cacheWarning();
      });
    }
    for(const file of files){
      const page={id:uuid(),name:file.name,file,url:URL.createObjectURL(file),items:[],status:'pending',hash:null,
        previewBlob:null,cacheReady:null,chapterId:activeChapterId};
      pages.push(page);
      if(!activeId)activeId=page.id;
      page.cacheReady=lookupPage(page);
    }
    toast('');
    render();
  }
  function removePage() {
    if(running)return;
    const page=currentPage();if(!page)return;
    URL.revokeObjectURL(page.url);
    pages.splice(pages.indexOf(page),1);
    if (page.hash && page.chapterId && authorized) {
      const uid = ownerId();
      Promise.resolve(page.cacheReady).then(()=>cache.removePageFromChapter(uid,page.chapterId,page.hash)).then(()=>refreshHistory()).catch(()=>cacheWarning());
    }
    activeId=pages[0]?.id||null;
    selectedItem=null;
    render();
  }
  function clearAll() {
    if(running||!confirm(t('confirmReset')))return;
    clearWorkspace();
    render();
  }
  async function imageForAPI(file) {
    const bitmap=await createImageBitmap(file);
    const ratio=Math.min(1,2000/Math.max(bitmap.width,bitmap.height));
    const width=Math.max(1,Math.round(bitmap.width*ratio));
    const height=Math.max(1,Math.round(bitmap.height*ratio));
    const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
    const ctx=canvas.getContext('2d',{alpha:false});
    if(!ctx)throw new Error('Canvas is not supported.');
    ctx.fillStyle='#ffffff';ctx.fillRect(0,0,width,height);
    ctx.drawImage(bitmap,0,0,width,height);bitmap.close?.();
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.89));
    if(!blob)throw new Error('Could not prepare page image.');
    const base64=await new Promise((resolve,reject)=>{
      const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(new Error('Could not read image.'));reader.readAsDataURL(blob);
    });
    if(base64.length>5_400_000)throw new Error('This image is too large after processing. Try a smaller image.');
    return {base64,blob};
  }
  async function sendRequest(payload) {
    if (!authorized) throw new Error('AI access denied.');
    if(!navigator.onLine)throw new Error(t('noInternet'));
    const session=await cloud.getAccessToken();
    if(!session)throw new Error(t('needLogin'));
    aborter=new AbortController();
    const timeout=setTimeout(()=>aborter?.abort(),75000);
    try{
      const response=await fetch(`${window.KTF_CONFIG.SUPABASE_URL}/functions/v1/ktf-manga-analyze`,{
        method:'POST',signal:aborter.signal,headers:{'Content-Type':'application/json',Authorization:`Bearer ${session}`,apikey:window.KTF_CONFIG.SUPABASE_PUBLISHABLE_KEY},body:JSON.stringify(payload)
      });
      const raw=await response.text();
      let body;try{body=JSON.parse(raw)}catch{body={error:raw.slice(0,250)}}
      if(response.status===403){setAuthorized(false);accessExpiresAt=0;}
      if(!response.ok)throw new Error(body.error||`${response.status}: ${t('error')}`);
      return body;
    } finally {clearTimeout(timeout);aborter=null;}
  }
  function toItem(raw,existing) {
    const words=Array.isArray(raw.words)?raw.words.slice(0,35).map(word=>({surface:String(word.surface||'').slice(0,80),reading:String(word.reading||'').slice(0,120),romaji:String(word.romaji||'').slice(0,120),meaning:String(word.meaning||'').slice(0,250)})).filter(w=>w.surface):[];
    const kanji=Array.isArray(raw.kanji)?raw.kanji.slice(0,30).map(entry=>({character:String(entry.character||'').slice(0,4),meaning:String(entry.meaning||'').slice(0,200),reading_here:String(entry.reading_here||'').slice(0,100),note:String(entry.note||'').slice(0,200)})).filter(entry=>entry.character):[];
    const bbox=Array.isArray(raw.bbox)&&raw.bbox.length===4&&raw.bbox.every(n=>Number.isFinite(n)&&n>=0&&n<=1000)&&raw.bbox[2]>raw.bbox[0]&&raw.bbox[3]>raw.bbox[1]?raw.bbox:null;
    return {id:existing?.id||uuid(),japanese:String(raw.japanese||'').slice(0,500),romaji:String(raw.romaji||'').slice(0,650),english:String(raw.english||'').slice(0,850),reading:String(raw.reading||'').slice(0,500),words,kanji,bbox:bbox||existing?.bbox||null,manual:Boolean(existing?.manual),revealed:existing?.revealed||false,showWords:existing?.showWords||false,check:null,answer:existing?.answer||'',editing:false,dirty:false};
  }
  async function applyTextCache(items) {
    if (!cache || !authorized) return;
    const uid = ownerId();
    for (const item of items) {
      if (item.romaji || item.dirty) continue;
      try {
        const hash = await cache.textHash(item.japanese);
        const detail = await cache.readText(uid, hash);
        if (detail && authorized && uid === ownerId() && detail.romaji) Object.assign(item, toItem({...detail,japanese:item.japanese,bbox:item.bbox},item));
      } catch (error) { console.warn('Local text cache unavailable',String(error)); }
    }
  }
  async function analyzePage(page) {
    if (page.cacheReady) await page.cacheReady;
    if (!authorized || !pages.includes(page)) return;
    if (page.status === 'completed') return;
    if (page.status !== 'transcribed') {
      page.status = 'processing';render();
      const prepared = await imageForAPI(page.file);
      const result = await sendRequest({mode:'image',imageData:prepared.base64,mimeType:'image/jpeg'});
      if (!Array.isArray(result.segments)) throw new Error('The transcription did not return Japanese dialogue.');
      page.previewBlob = prepared.blob;
      page.items = result.segments.map(raw=>toItem(raw)).filter(item=>item.japanese);
      page.status = page.items.length ? 'transcribed' : 'completed';
      if (activeId === page.id) selectedItem = page.items[0]?.id || null;
      await rememberPage(page);
      render();
    }
    await applyTextCache(page.items);
    await rememberPage(page);
    const remaining = page.items.filter(item=>!item.romaji&&!item.dirty);
    if (!remaining.length) {page.status='completed';await rememberPage(page);render();return;}
    page.status='transcribed';render();
    for(let offset=0;offset<remaining.length;offset+=12){
      const group=remaining.slice(offset,offset+12).filter(item=>!item.romaji&&!item.dirty);
      if (!group.length) continue;
      const original=group.map(item=>({id:item.id,japanese:item.japanese}));
      const details=await sendRequest({mode:'explain',segments:original.map(item=>({japanese:item.japanese}))});
      if(!Array.isArray(details.segments))throw new Error('OpenAI did not return the requested explanations.');
      for (const [index,source] of original.entries()) {
        const item=page.items.find(entry=>entry.id===source.id);
        const detail=details.segments[index];
        if(!item||!detail||item.japanese!==source.japanese||!detail.romaji)continue;
        Object.assign(item,toItem({...detail,japanese:item.japanese,bbox:item.bbox},item));
        try { if (authorized && cache) await cache.saveText(ownerId(),await cache.textHash(item.japanese),{reading:item.reading,romaji:item.romaji,english:item.english,words:item.words,kanji:item.kanji}); }
        catch (error) { console.warn('Could not cache text explanation', String(error)); cacheWarning(); }
      }
      await rememberPage(page);
      render();
    }
    page.status=page.items.every(item=>item.romaji)?'completed':'transcribed';
    await rememberPage(page);
    render();
  }
  async function runAnalyze(all=false, force=false) {
    if(running || !authorized)return;
    const toCheck = all ? pages.filter(page=>page.status!=='completed') : currentPage()?[currentPage()]:[];
    if (!force && !toCheck.length) return;
    if(!navigator.onLine){toast(t('noInternet'),true);return;}
    const auth=cloud.getStatus();
    if(!auth.user){toast(t('needLogin'),true);$('mangaLogin').hidden=false;return;}
    running=true;
    analyzeAll=all;
    render();
    const queue=toCheck;
    let ix=0;
    for(const page of queue){
      if(all&&!analyzeAll)break;
      ix++;
      toast(all?`${t('processingMany')} ${ix} ${t('of')} ${queue.length}: ${page.name}`:t('working'));
      try{
        if (force) {
          if (page.cacheReady) await page.cacheReady;
          page.status='pending';
          page.items=[];
        }
        await analyzePage(page);
        toast(`${t('done')} ${page.name}`);
      }
      catch(err){if(page.status!=='transcribed')page.status='pending';toast(`${t('error')} ${err.message||err}`,true);if(all)break;}
      if(all && !analyzeAll)break;
      render();
    }
    running=false;analyzeAll=false;render();
  }
  async function analyzeText(page,item,corrected) {
    if (!authorized) return;
    const newText=String(corrected||'').trim();
    if(!newText){toast(t('missing'),true);return;}
    if(!cloud.getStatus().user){toast(t('needLogin'),true);return;}
    item.dirty=true;item.editing=false;item.japanese=newText;item.romaji='';item.reading='';item.english='';item.words=[];item.kanji=[];item.revealed=false;item.showWords=false;
    await rememberPage(page);
    render();
    try{
      toast(t('working'));
      let replacement = null;
      let hash = null;
      try { if (cache) { hash = await cache.textHash(newText); replacement = await cache.readText(ownerId(),hash); } } catch (_) {}
      if (!replacement) {
        const result=await sendRequest({mode:'text',text:newText});
        replacement=result.segments?.[0];
        if (replacement?.romaji && cache && hash) { try { await cache.saveText(ownerId(),hash,replacement); } catch (_) { cacheWarning(); } }
      }
      if(!replacement)throw new Error('Could not explain that text.');
      Object.assign(item,toItem({...replacement,japanese:newText},item));
      page.status=page.items.every(entry=>entry.romaji)?'completed':'transcribed';
      await rememberPage(page);
      toast(t('done'));
    }catch(err){toast(err.message||String(err),true);item.dirty=true;await rememberPage(page);}
    render();
  }
  async function addText() {
    const page=currentPage();if(!page)return;
    if (page.cacheReady) await page.cacheReady;
    const item=toItem({japanese:'',words:[]},{id:uuid(),manual:true});
    item.japanese=lang()==='es'?'Pegá o escribí el texto japonés':'Paste or type Japanese text';
    item.editing=true;item.dirty=true;
    page.items.push(item);page.status='transcribed';selectedItem=item.id;
    render();
    const input=$(`manga-edit-${item.id}`);if(input){input.value='';input.focus();input.scrollIntoView({block:'center'});}
  }
  function controls(event) {
    const target=event.target;
    const page=currentPage();if(!page)return;
    const button=target.closest('button');
    const card=target.closest('[data-item]');
    if(card){selectedItem=card.dataset.item;highlightRegion(page);document.querySelectorAll('.manga-item').forEach(node=>node.classList.toggle('is-selected',node.dataset.item===selectedItem));}
    if(!button)return;
    const action=['reveal','words','edit','cancelEdit'].find(key=>button.dataset[key]);
    if(!action)return;
    const item=page.items.find(x=>x.id===button.dataset[action]);if(!item)return;
    if(action==='reveal')item.revealed=!item.revealed;
    if(action==='words')item.showWords=!item.showWords;
    if(action==='edit')item.editing=!item.editing;
    if(action==='cancelEdit'){if(item.manual&&!item.romaji){page.items=page.items.filter(x=>x.id!==item.id);}else{item.editing=false;}}
    if (action==='cancelEdit') rememberPage(page).catch(() => {});
    render();
  }
  function attach() {
    $('openMangaButton').addEventListener('click',showReader);
    $('mangaBack').addEventListener('click',closeReader);
    $('mangaFiles').addEventListener('change',event=>{loadFiles(event.target.files);event.target.value='';});
    $('mangaDrop').addEventListener('dragover',event=>{event.preventDefault();event.currentTarget.classList.add('drag-over');});
    $('mangaDrop').addEventListener('dragleave',event=>event.currentTarget.classList.remove('drag-over'));
    $('mangaDrop').addEventListener('drop',event=>{event.preventDefault();event.currentTarget.classList.remove('drag-over');loadFiles(event.dataTransfer.files);});
    $('mangaPageStrip').addEventListener('click',event=>{const btn=event.target.closest('[data-page]');if(!btn)return;activeId=btn.dataset.page;selectedItem=null;render();});
    $('mangaRemove').addEventListener('click',removePage);
    $('mangaClear').addEventListener('click',clearAll);
    $('mangaAnalyze').addEventListener('click',()=>runAnalyze(false));
    $('mangaAnalyzeAll').addEventListener('click',()=>runAnalyze(true));
    $('mangaReanalyze').addEventListener('click',()=>{if(confirm(ct('forceConfirm')))runAnalyze(false,true);});
    $('mangaHistoryList').addEventListener('click',event=>{
      const chapter = event.target.closest('[data-chapter-open]');
      const chapterDelete = event.target.closest('[data-chapter-delete]');
      const open = event.target.closest('[data-cache-open]');
      const del = event.target.closest('[data-cache-delete]');
      if (chapter) openSavedChapter(chapter.dataset.chapterOpen);
      if (chapterDelete) deleteChapter(chapterDelete.dataset.chapterDelete);
      if (open) openSavedPage(open.dataset.cacheOpen);
      if (del) deleteHistoryEntry(del.dataset.cacheDelete);
    });
    $('mangaLibraryToggle').addEventListener('click',()=>{libraryOpen=!libraryOpen;renderHistory();if(libraryOpen) refreshHistory().catch(()=>{});});
    $('mangaNewChapter').addEventListener('click',startNewChapter);
    $('mangaSeriesName').addEventListener('change',updateChapterTitle);
    $('mangaChapterName').addEventListener('change',updateChapterTitle);
    $('mangaHistoryClear').addEventListener('click',clearHistory);
    $('mangaCancel').addEventListener('click',()=>{analyzeAll=false;aborter?.abort();});
    $('mangaManual').addEventListener('click',addText);
    $('mangaReadings').addEventListener('click',controls);
    $('mangaReadings').addEventListener('input',event=>{const id=event.target.dataset.answer;const item=currentPage()?.items.find(x=>x.id===id);if(item){item.answer=event.target.value;item.check=null;}});
    $('mangaReadings').addEventListener('submit',event=>{
      const form=event.target;
      if(form.matches('[data-check]')){
        event.preventDefault();
        const item=currentPage()?.items.find(x=>x.id===form.dataset.check);if(!item)return;
        const text=form.querySelector('input')?.value||'';
        item.answer=text;
        item.check=normalize(text) && normalize(text)===normalize(item.romaji)?'correct':'wrong';
        render();
        const next=$(`manga-answer-${item.id}`);next?.focus({preventScroll:true});
      }
      if(form.matches('[data-save]')){
        event.preventDefault();
        const item=currentPage()?.items.find(x=>x.id===form.dataset.save);if(!item)return;
        analyzeText(currentPage(),item,form.querySelector('textarea')?.value);
      }
    });
    const login=async()=>{try{if(pages.length){alert(lang()==='es'?'El inicio de sesión recarga la página y borra las imágenes temporales. Volvé a subirlas después de iniciar sesión.':'Sign-in reloads the app and clears temporary images. Add them again after signing in.');}await cloud.signIn();}catch(err){toast(err.message||String(err),true);}};
    $('mangaLogin').addEventListener('click',login);
    $('mangaLoginTop').addEventListener('click',login);
    $('mangaScreen').addEventListener('keydown',event=>{if(event.key==='Escape'){event.stopPropagation();closeReader();}});
    document.addEventListener('ktf:languagechange',()=>{if(!$('mangaScreen').hidden)render();else updateText();});
    cloud?.subscribe?.(() => {
      refreshAccess().catch(() => {});
      if (!$('mangaScreen').hidden) {
        const logged = Boolean(cloud.getStatus().user);
        $('mangaLogin').hidden = logged;
        $('mangaLoginTop').hidden = logged;
      }
    });
    window.addEventListener('online', () => refreshAccess(true).catch(() => {}));
    window.addEventListener('offline', () => refreshAccess().catch(() => {}));
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) refreshAccess(true).catch(() => {});
    });
    refreshAccess().catch(() => {});
    window.addEventListener('beforeunload',()=>{for(const page of pages)URL.revokeObjectURL(page.url);});
    updateText();
  }
  attach();
  window.KTFMangaReader={open:showReader};
})();
