"use strict";
(() => {
  const $ = id => document.getElementById(id);
  const cloud = window.KTFCloud;
  if (!cloud) return;
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  const normalize = value => String(value ?? '').normalize('NFKC').toLowerCase().trim().replace(/[\s\u3000]+/g, ' ').replace(/[’‘]/g, "'");
  const clean = (value, max) => String(value ?? '').trim().slice(0, max);
  const uuid = () => crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random()*16|0; return (c === 'x' ? r : (r&3|8)).toString(16); });
  const kanaMap = {
    'あ':'a','い':'i','う':'u','え':'e','お':'o','か':'ka','き':'ki','く':'ku','け':'ke','こ':'ko','さ':'sa','し':'shi','す':'su','せ':'se','そ':'so','た':'ta','ち':'chi','つ':'tsu','て':'te','と':'to','な':'na','に':'ni','ぬ':'nu','ね':'ne','の':'no','は':'ha','ひ':'hi','ふ':'fu','へ':'he','ほ':'ho','ま':'ma','み':'mi','む':'mu','め':'me','も':'mo','や':'ya','ゆ':'yu','よ':'yo','ら':'ra','り':'ri','る':'ru','れ':'re','ろ':'ro','わ':'wa','を':'wo','ん':'n','が':'ga','ぎ':'gi','ぐ':'gu','げ':'ge','ご':'go','ざ':'za','じ':'ji','ず':'zu','ぜ':'ze','ぞ':'zo','だ':'da','ぢ':'ji','づ':'zu','で':'de','ど':'do','ば':'ba','び':'bi','ぶ':'bu','べ':'be','ぼ':'bo','ぱ':'pa','ぴ':'pi','ぷ':'pu','ぺ':'pe','ぽ':'po','ゔ':'vu','ぁ':'a','ぃ':'i','ぅ':'u','ぇ':'e','ぉ':'o'
  };
  const digraphMap = {
    'きゃ':'kya','きゅ':'kyu','きょ':'kyo','しゃ':'sha','しゅ':'shu','しょ':'sho','ちゃ':'cha','ちゅ':'chu','ちょ':'cho','にゃ':'nya','にゅ':'nyu','にょ':'nyo','ひゃ':'hya','ひゅ':'hyu','ひょ':'hyo','みゃ':'mya','みゅ':'myu','みょ':'myo','りゃ':'rya','りゅ':'ryu','りょ':'ryo','ぎゃ':'gya','ぎゅ':'gyu','ぎょ':'gyo','じゃ':'ja','じゅ':'ju','じょ':'jo','ぢゃ':'ja','ぢゅ':'ju','ぢょ':'jo','びゃ':'bya','びゅ':'byu','びょ':'byo','ぴゃ':'pya','ぴゅ':'pyu','ぴょ':'pyo','ふぁ':'fa','ふぃ':'fi','ふぇ':'fe','ふぉ':'fo','てぃ':'ti','でぃ':'di','うぃ':'wi','うぇ':'we','うぉ':'wo','しぇ':'she','ちぇ':'che','じぇ':'je'
  };
  function kanaToRomaji(text) {
    const input=String(text||'').normalize('NFKC').replace(/[\u30a1-\u30f6]/g,c=>String.fromCharCode(c.charCodeAt(0)-96));
    let result='';
    for(let i=0;i<input.length;i++) {
      const char=input[i];
      if(char==='っ') {
        const pair=digraphMap[input.slice(i+1,i+3)] || kanaMap[input[i+1]] || '';
        result+=pair.startsWith('ch')?'t':pair[0]||'';
        continue;
      }
      if(char==='ー') {const last=result.match(/[aeiou]$/);if(last)result+=last[0];continue;}
      const pair=digraphMap[input.slice(i,i+2)];
      if(pair){result+=pair;i++;continue;}
      const single=kanaMap[char];
      if(single){result+=single;continue;}
      if(/[\s,;|/、・]/.test(char)){result+=char;continue;}
      return '';
    }
    return result;
  }
  const language = () => document.documentElement.lang === 'es' ? 'es' : 'en';
  const dictionaries = {
    en: {
      nav:'Custom', back:'← Back to selection',backManga:'← Back to Manga Reader', eyebrow:'✦ YOUR PERSONAL STUDY DECK',title:'Custom Characters & Words',intro:'Save kanji and vocabulary from Manga Reader, or add your own, and practice them anytime.',
      
      add:'Add a character or word',addButton:'Add custom',closeEditor:'Close editor',kind:'Type',kanji:'Kanji / character',word:'Word / expression',japanese:'Japanese text',reading:'Romaji reading (optional)',kana:'Kana reading (optional)',meaning:'Meaning (optional)',notes:'Notes (optional)',save:'Save to collection',update:'Save changes',cancel:'Cancel edit',source:'Source',manual:'Added manually',manga:'Manga Reader',list:'Your collection',all:'All',onlyKanji:'Characters',onlyWords:'Words',search:'Find a character, reading or meaning…',empty:'No saved items match this filter. Add some here or save them directly from a manga.',
      total:'saved',selectAll:'Select visible',selectNone:'Deselect visible',selected:'selected',study:'Practice selected',mode:'Practice mode',mixed:'Mixed',readingMode:'Romaji reading',meaningMode:'Meaning',edit:'Edit',remove:'Remove',confirm:'Remove this item from your custom collection?',duplicates:'This item is already in your collection.',added:'Added to your custom collection.',saved:'Changes saved.',deleted:'Removed from your custom collection.',invalid:'Enter a Japanese character or word.',
      sessionLabel:'YOUR SESSION.INI',timerLabel:'Session timer',timerNone:'No limit',timerCustom:'Timer',timerGuesses:'Guess limit',hoursLabel:'Hours',minutesLabel:'Minutes',guessLabel:'Number of guesses',rapidTitle:'Rapid Fire',rapidSubtitle:'A timed challenge for each answer',rapidSecondsLabel:'Seconds per answer',settingsNote:'Your custom session uses the same practice options as the main trainer.',learnButton:'Learn my selection →',learnHelp:'3 guided passes followed by 3 memory-test passes.',infiniteButton:'Infinite practice →',infiniteHelp:'Shuffled questions until you decide to finish.',onePassButton:'One Pass · Daily review →',onePassHelp:'Each selected item appears once, across all tabs. Timer and guess limit do not apply.',guidedLabel:'GUIDED LEARNING',guidedTip:'Study the reading and meaning before continuing.',guidedNext:'Got it, next →',memoryPass:'Memory test',guidedPass:'Guided pass',infiniteTitle:'Infinite practice',learnTitle:'Guided learning',onePassTitle:'One Pass · Daily review',statsAnswered:'Answered',statsCorrect:'Correct',statsAccuracy:'Accuracy',pause:'Pause',resume:'Resume',endSession:'Finish lesson & view results',timeUp:'Time is up!',guessComplete:'Guess limit reached',rapidTimeUp:'Time is up! This counts as a mistake.',rapidTimeLeft:'Time left for this answer',rapidWaiting:'Time stopped. Press Next when ready.',hideClock:'Hide clock',showClock:'Show clock',settingsInvalid:'Check the timer, guess limit or Rapid Fire values.',sessionDuration:'Study time',sessionReason:'Session finished',timedOutCount:'Rapid Fire timeouts',
      practiceTitle:'Personal practice',question:'Question',askReading:'Write the romaji reading',askMeaning:'Write the meaning',answer:'Your answer',check:'Check',skip:'I do not know',next:'Next question →',finish:'Finish practice',end:'Back to collection',sideSelection:'YOUR SELECTION',sideUnit:'items selected',sideHint:'Choose the characters and words you want to practice.',deleteSelected:'Delete selected',confirmDelete:'Delete {count} selected items? This cannot be undone.',deletedBatch:'Deleted {count} items from your collection.',finishLesson:'← Finish lesson',summaryTitle:"Here’s how you did.",summaryDescription:'Your results from this session.',hardestTitle:'Your trickiest items',hardestHelp:'Ranked by incorrect and skipped answers.',summaryBack:'Back to collection',summaryAgain:'Try again →',summaryReview:'Practice my toughest items →',attemptSingle:'attempt',attemptPlural:'attempts',mistakeSingle:'mistake',mistakePlural:'mistakes',summaryFlawless:'Amazing! No mistakes this time.',summaryEmpty:'No answers yet. Try a round.',correct:'Correct!',wrong:'Not quite',answerWas:'Expected answer:',noQuestions:'Choose at least one item with a meaning or romaji reading.',result:'Session completed',success:'Correct answers',attempts:'Attempts',practiceHint:'Practice results are saved in your account too.',count:'correct',review:'Review',imported:'Saved from manga', select:'Select for practice', remaining:'questions remaining'
    },
    es: {
      nav:'Custom',back:'← Volver a selección',backManga:'← Volver al lector de manga',eyebrow:'✦ TU MAZO PERSONAL',title:'Caracteres y palabras custom',intro:'Guardá kanjis y vocabulario del Manga Reader, o agregá los que quieras, y practicalos cuando quieras.',
      
      add:'Agregar carácter o palabra',addButton:'Agregar custom',closeEditor:'Cerrar editor',kind:'Tipo',kanji:'Kanji / carácter',word:'Palabra / expresión',japanese:'Texto japonés',reading:'Lectura en romaji (opcional)',kana:'Lectura en kana (opcional)',meaning:'Significado (opcional)',notes:'Notas (opcional)',save:'Guardar en mi colección',update:'Guardar cambios',cancel:'Cancelar edición',source:'Origen',manual:'Agregado manualmente',manga:'Manga Reader',list:'Mi colección',all:'Todos',onlyKanji:'Caracteres',onlyWords:'Palabras',search:'Buscar carácter, lectura o significado…',empty:'No hay elementos con ese filtro. Agregá uno acá o guardalo directamente desde un manga.',
      total:'guardados',selectAll:'Seleccionar visibles',selectNone:'Deseleccionar visibles',selected:'seleccionados',study:'Practicar seleccionados',mode:'Modo de práctica',mixed:'Mixto',readingMode:'Lectura en romaji',meaningMode:'Significado',edit:'Editar',remove:'Eliminar',confirm:'¿Eliminar este elemento de tu colección?',duplicates:'Ya tenés este elemento guardado.',added:'Agregado a tus caracteres custom.',saved:'Cambios guardados.',deleted:'Eliminado de tus caracteres custom.',invalid:'Ingresá un carácter o una palabra japonesa.',
      sessionLabel:'TU SESIÓN.INI',timerLabel:'Temporizador',timerNone:'Sin límite',timerCustom:'Temporizador',timerGuesses:'Límite de intentos',hoursLabel:'Horas',minutesLabel:'Minutos',guessLabel:'Cantidad de intentos',rapidTitle:'Ráfaga',rapidSubtitle:'Un desafío contrarreloj por respuesta',rapidSecondsLabel:'Segundos por respuesta',settingsNote:'Tu colección custom tiene las mismas opciones que la práctica principal.',learnButton:'Aprender mi selección →',learnHelp:'3 pasadas guiadas y 3 pasadas de memoria.',infiniteButton:'Práctica infinita →',infiniteHelp:'Preguntas mezcladas hasta que decidas terminar.',onePassButton:'Una pasada · Repaso diario →',onePassHelp:'Cada elemento seleccionado aparece una vez, incluso en otras pestañas. Sin temporizador ni límite de intentos.',guidedLabel:'APRENDIZAJE GUIADO',guidedTip:'Estudiá la lectura y el significado antes de continuar.',guidedNext:'Entendido, siguiente →',memoryPass:'Prueba de memoria',guidedPass:'Pasada guiada',infiniteTitle:'Práctica infinita',learnTitle:'Aprendizaje guiado',onePassTitle:'Una pasada · Repaso diario',statsAnswered:'Respondidas',statsCorrect:'Correctas',statsAccuracy:'Precisión',pause:'Pausar',resume:'Reanudar',endSession:'Terminar y ver resultados',timeUp:'¡Se acabó el tiempo!',guessComplete:'Límite de intentos alcanzado',rapidTimeUp:'¡Tiempo agotado! Cuenta como error.',rapidTimeLeft:'Tiempo restante para responder',rapidWaiting:'Tiempo detenido. Tocá Siguiente cuando quieras continuar.',hideClock:'Ocultar reloj',showClock:'Mostrar reloj',settingsInvalid:'Revisá los valores del temporizador, intentos o Ráfaga.',sessionDuration:'Tiempo de estudio',sessionReason:'Sesión terminada',timedOutCount:'Respuestas agotadas por tiempo',
      practiceTitle:'Práctica personalizada',question:'Pregunta',askReading:'Escribí la lectura en romaji',askMeaning:'Escribí el significado',answer:'Tu respuesta',check:'Comprobar',skip:'No sé',next:'Siguiente →',finish:'Terminar práctica',end:'Volver a la colección',sideSelection:'TU SELECCIÓN',sideUnit:'elementos seleccionados',sideHint:'Elegí los caracteres y palabras que querés practicar.',deleteSelected:'Borrar seleccionados',confirmDelete:'¿Eliminar {count} elementos seleccionados? No se puede deshacer.',deletedBatch:'Se eliminaron {count} elementos de tu colección.',finishLesson:'← Terminar lección',summaryTitle:'Así te fue.',summaryDescription:'Los resultados de esta sesión.',hardestTitle:'Tus elementos más difíciles',hardestHelp:'Ordenados por errores y respuestas omitidas.',summaryBack:'Volver a la colección',summaryAgain:'Practicar de nuevo →',summaryReview:'Practicar los más difíciles →',attemptSingle:'intento',attemptPlural:'intentos',mistakeSingle:'error',mistakePlural:'errores',summaryFlawless:'¡Excelente! No tuviste errores.',summaryEmpty:'Todavía no respondiste. Probá una ronda.',correct:'¡Correcto!',wrong:'No del todo',answerWas:'Respuesta esperada:',noQuestions:'Seleccioná al menos un elemento con significado o lectura en romaji.',result:'Práctica terminada',success:'Respuestas correctas',attempts:'Intentos',practiceHint:'Tus resultados también se guardan en tu cuenta.',count:'aciertos',review:'Repaso',imported:'Guardado desde el manga',select:'Seleccionar para practicar',remaining:'preguntas restantes'
    }
  };
  const t = key => dictionaries[language()][key] || dictionaries.en[key] || key;
  let items = [];
  let stats = new Map();
  let selected = new Set();
  let filter = 'kanji';
  let search = '';
  let editId = null;
  let loaded = false;
  let owner = null;
  let practice = null;
  let deleting = false;
  const sessionSettingsKey = 'ktf-custom-session-settings-v1';
  const sessionDefaults = {timerMode:'off',hours:0,minutes:5,guesses:200,rapidFire:false,rapidSeconds:10,showClock:true,answerMode:'mixed'};
  let sessionSettings = {...sessionDefaults};
  try {
    const stored = JSON.parse(localStorage.getItem(sessionSettingsKey) || '{}');
    if (stored && typeof stored === 'object') sessionSettings = {...sessionSettings,...Object.fromEntries(Object.keys(sessionDefaults).filter(key => Object.hasOwn(stored,key)).map(key => [key,stored[key]]))};
  } catch (_) {}
  function saveSessionSettings() {
    try {localStorage.setItem(sessionSettingsKey,JSON.stringify(sessionSettings));} catch (_) {}
  }
  let renderRevision = 0;
  let messageTimeout = null;
  let returnView = 'setup';
  const currentOwner = () => cloud.getStatus().owner || 'guest';
  const itemKey = item => `${item.kind}:${normalize(item.surface)}`;
  const isOpen = () => !$('customScreen').hidden;
  const isSaved = (kind, data) => {
    if (!loaded || owner !== currentOwner()) return false;
    const surface = kind === 'word' ? data?.surface : data?.character;
    if (!surface) return false;
    return items.some(item => item.kind === kind && normalize(item.surface) === normalize(surface));
  };
  function notify(text, isError = false) {
    const target = $('customNotice');
    target.textContent = text;
    target.hidden = !text;
    target.classList.toggle('is-error', isError);
    const editorNotice = $('customEditorNotice');
    editorNotice.textContent = text;
    editorNotice.hidden = !text || !$('customEditorDialog').open;
    editorNotice.classList.toggle('is-error', isError);
    clearTimeout(messageTimeout);
    if (text) messageTimeout = setTimeout(() => {target.hidden = true;editorNotice.hidden = true;}, 5500);
  }
  function fold(events) {
    const collection = new Map();
    const scores = new Map();
    const sorted = events.slice().sort((a,b) => a.time.localeCompare(b.time) || a.id.localeCompare(b.id));
    for (const event of sorted) {
      const p = event.payload || {};
      if (event.type === 'custom_upsert' && p.item && p.item.id) collection.set(p.item.id, p.item);
      if (event.type === 'custom_delete' && p.id) collection.delete(p.id);
      if (event.type === 'custom_review' && p.itemId) {
        const record = scores.get(p.itemId) || {correct:0,total:0};
        record.total++;
        if (p.correct === true) record.correct++;
        scores.set(p.itemId, record);
      }
    }
    const byKey = new Map();
    for (const item of collection.values()) byKey.set(itemKey(item), item);
    return {items:[...byKey.values()].sort((a,b) => (b.updatedAt||'').localeCompare(a.updatedAt||'')),scores};
  }
  async function refresh() {
    const revision = ++renderRevision;
    const activeOwner = currentOwner();
    const events = await cloud.getCustomEvents();
    if (revision !== renderRevision || activeOwner !== currentOwner()) return;
    const output = fold(events);
    const wasLoaded = loaded && owner === activeOwner;
    const previous = selected;
    owner = activeOwner;
    items = output.items;
    stats = output.scores;
    selected = wasLoaded ? new Set(items.filter(item => previous.has(item.id)).map(item => item.id)) : new Set();
    loaded = true;
    $('customCount').textContent = String(items.length);
    if (isOpen() && !practice) renderList();
    document.dispatchEvent(new CustomEvent('ktf:custom-collection-changed',{detail:{owner:activeOwner,count:items.length}}));
  }
  function visible() {
    return items.filter(item => (filter === 'all' || item.kind === filter) && (!search || [item.surface,item.romaji,item.kana,item.meaning,item.notes].some(text => normalize(text).includes(normalize(search)))));
  }
  function labelText() {
    $('customNavLabel').textContent = t('nav');
    $('customTabCharacters').textContent = t('onlyKanji');
    $('customTabWords').textContent = t('onlyWords');
    $('customTabAll').textContent = t('all');
    $('customBack').textContent = t(returnView === 'manga' ? 'backManga' : 'back');
    for (const [id,key] of [['customEyebrow','eyebrow'],['customTitle','title'],['customIntro','intro'],['customAddTitle','add'],['customKindLabel','kind'],['customJapaneseLabel','japanese'],['customRomajiLabel','reading'],['customKanaLabel','kana'],['customMeaningLabel','meaning'],['customNotesLabel','notes'],['customListTitle','list'],['customSelectAll','selectAll'],['customSelectNone','selectNone'],['customPracticeButton','study'],['customModeLabel','mode']]) $(id).textContent = t(key);
    $('customKind').options[0].textContent = t('kanji');
    $('customKind').options[1].textContent = t('word');
    $('customMode').options[0].textContent = t('mixed');
    $('customMode').options[1].textContent = t('readingMode');
    $('customMode').options[2].textContent = t('meaningMode');
    $('customSearch').placeholder = t('search');
    $('customSave').textContent = editId ? t('update') : t('save');
    $('customCancel').textContent = t('cancel');
    $('customAddButtonLabel').textContent = t('addButton');
    $('customEditorClose').setAttribute('aria-label',t('closeEditor'));
    $('customDeleteSelected').setAttribute('aria-label',t('deleteSelected'));
    $('customDeleteSelected').title=t('deleteSelected');
    $('customPracticeExit').textContent = t('finishLesson');
    $('customPracticeCheck').textContent = t('check');
    $('customPracticeAnswerLabel').textContent = t('answer');
    $('customPracticeSkip').textContent = t('skip');
    $('customPracticeNext').textContent = t('next');
    for (const [id,key] of [['customSessionLabel','sessionLabel'],['customTimerLabel','timerLabel'],['customHoursLabel','hoursLabel'],['customMinutesLabel','minutesLabel'],['customGuessLabel','guessLabel'],['customRapidTitle','rapidTitle'],['customRapidSubtitle','rapidSubtitle'],['customRapidSecondsLabel','rapidSecondsLabel'],['customSettingsNote','settingsNote'],['customLearnButton','learnButton'],['customLearnHelp','learnHelp'],['customPracticeButton','infiniteButton'],['customInfiniteHelp','infiniteHelp'],['customOnePassButton','onePassButton'],['customOnePassHelp','onePassHelp'],['customGuidedLabel','guidedLabel'],['customGuidedTip','guidedTip'],['customGuidedNext','guidedNext'],['customStatsAnsweredLabel','statsAnswered'],['customStatsCorrectLabel','statsCorrect'],['customStatsAccuracyLabel','statsAccuracy']]) $(id).textContent=t(key);
    for (const [index,key] of ['timerNone','timerCustom','timerGuesses'].entries()) $('customTimerMode').options[index].textContent=t(key);
    for (const [id,key] of [['customDeleteLabel','deleteSelected'],['customSideSelectionLabel','sideSelection'],['customSideSelectedUnit','sideUnit'],['customSideSelectionHint','sideHint'],['customSummaryTitle','summaryTitle'],['customSummaryDescription','summaryDescription'],['customSummaryMistakesTitle','hardestTitle'],['customSummaryMistakesHelp','hardestHelp'],['customSummaryBack','summaryBack'],['customSummaryAgain','summaryAgain'],['customSummaryReview','summaryReview']]) $(id).textContent = t(key);
    for (const [id,key] of [['customSummaryAnsweredLabel','statsAnswered'],['customSummaryCorrectLabel','statsCorrect'],['customSummaryAccuracyLabel','statsAccuracy']]) $(id).textContent=t(key);
    if (!practice) $('customPracticeExit').textContent=t('finishLesson');
  }
  function renderList() {
    labelText();
    const displayed = visible();
    $('customTotal').textContent = `${items.length} ${t('total')}`;
    $('customSelected').textContent = `${selected.size} ${t('selected')}`;
    $('customSideSelected').textContent = String(selected.size);
    updateActionAvailability();
    $('customCharacterCount').textContent = String(items.filter(item => item.kind === 'kanji' && selected.has(item.id)).length);
    $('customWordCount').textContent = String(items.filter(item => item.kind === 'word' && selected.has(item.id)).length);
    $('customAllCount').textContent = String(selected.size);
    document.querySelectorAll('[data-custom-filter]').forEach(button => {
      const active = button.dataset.customFilter === filter;
      button.setAttribute('aria-selected',String(active));
      button.tabIndex = active ? 0 : -1;
    });
    $('customItems').innerHTML = displayed.length ? displayed.map(item => {
      const selectedItem = selected.has(item.id);
      const details = [item.romaji || item.kana,item.meaning].filter(Boolean);
      return `<button type="button" class="kana-tile custom-item" data-custom-tile="${escapeHtml(item.id)}" aria-pressed="${selectedItem}" title="${escapeHtml([item.surface,...details,item.notes].filter(Boolean).join(' · '))}">
        <span class="glyph custom-item-japanese" lang="ja">${escapeHtml(item.surface)}</span>
        ${item.romaji || item.kana ? `<span class="roman custom-item-reading">${escapeHtml(item.romaji || item.kana)}</span>` : ''}
        ${item.meaning ? `<span class="custom-item-meaning">${escapeHtml(item.meaning)}</span>` : ''}
      </button>`;
    }).join('') : `<p class="subtle custom-empty">${t('empty')}</p>`;
  }
  function updateActionAvailability() {
    const allowed = items.some(item => selected.has(item.id) && answerTypes(item,$('customMode').value).length);
    for (const id of ['customPracticeButton','customLearnButton','customOnePassButton']) $(id).disabled = !allowed;
    $('customDeleteSelected').disabled = deleting || selected.size === 0;
  }
  function answerTypes(item,answerMode) {
    const types=[];
    if (answerMode !== 'meaning' && item.romaji) types.push('romaji');
    if (answerMode !== 'romaji' && item.meaning) types.push('meaning');
    return types;
  }
  function restoreSessionOptions() {
    $('customMode').value=sessionSettings.answerMode||'mixed';
    $('customTimerMode').value=['off','custom','guesses'].includes(sessionSettings.timerMode) ? sessionSettings.timerMode : 'off';
    $('customSessionHours').value=String(sessionSettings.hours);
    $('customSessionMinutes').value=String(sessionSettings.minutes);
    $('customGuessCount').value=String(sessionSettings.guesses);
    $('customRapidEnabled').checked=sessionSettings.rapidFire === true;
    $('customRapidSeconds').value=String(sessionSettings.rapidSeconds);
    updateSessionFields();
  }
  function updateSessionFields() {
    $('customSessionTimerFields').hidden=$('customTimerMode').value !== 'custom';
    $('customGuessFields').hidden=$('customTimerMode').value !== 'guesses';
    $('customRapidFields').hidden=!$('customRapidEnabled').checked;
    $('customRapidEnabled').setAttribute('aria-expanded',String($('customRapidEnabled').checked));
  }
  function validInteger(value,minimum,maximum) {
    const text=String(value).trim();
    return /^\d+$/.test(text) && Number.isSafeInteger(Number(text)) && Number(text)>=minimum && Number(text)<=maximum ? Number(text) : null;
  }
  function readSessionOptions(mode) {
    const timerMode=mode==='onepass'?'off':$('customTimerMode').value;
    let timerSeconds=null,guessLimit=null;
    if (timerMode === 'custom') {
      const hours=validInteger($('customSessionHours').value,0,99);
      const minutes=validInteger($('customSessionMinutes').value,0,59);
      if (hours===null || minutes===null || hours+minutes===0) return null;
      timerSeconds=hours*3600+minutes*60;
    }
    if (timerMode === 'guesses') {
      guessLimit=validInteger($('customGuessCount').value,1,10000);
      if (guessLimit===null) return null;
    }
    const rapidSeconds=$('customRapidEnabled').checked ? validInteger($('customRapidSeconds').value,1,300) : null;
    if ($('customRapidEnabled').checked && rapidSeconds===null) return null;
    return {timerMode,timerSeconds,guessLimit,rapidSeconds};
  }
  function updateSessionSettings() {
    sessionSettings={...sessionSettings,answerMode:$('customMode').value,timerMode:$('customTimerMode').value,hours:$('customSessionHours').value,minutes:$('customSessionMinutes').value,guesses:$('customGuessCount').value,rapidFire:$('customRapidEnabled').checked,rapidSeconds:$('customRapidSeconds').value};
    saveSessionSettings();
    updateSessionFields();
  }
  function showEditor(item = null) {
    if (!item) resetForm();
    const dialog = $('customEditorDialog');
    if (!dialog.open) dialog.showModal();
    $('customEditorNotice').hidden = true;
    $('customJapanese').focus({preventScroll:true});
  }
  function hideEditor() {
    const dialog = $('customEditorDialog');
    if (dialog.open) dialog.close();
    $('customEditorNotice').hidden = true;
    resetForm();
  }
  function resetForm() {
    editId = null;
    $('customForm').reset();
    $('customKind').value = 'kanji';
    labelText();
  }
  async function persist(type,payload) {
    await cloud.addCustomEvent(type,payload);
    await refresh();
  }
  async function save(raw, origin = '') {
    const kind = raw.kind === 'word' ? 'word' : 'kanji';
    const surface = clean(raw.surface,120);
    if (!surface) {notify(t('invalid'),true);return false;}
    if (!loaded || owner !== currentOwner()) await refresh();
    const existing = items.find(row => row.kind === kind && normalize(row.surface) === normalize(surface));
    if (existing && existing.id !== editId) {notify(t('duplicates'));return false;}
    const previous = items.find(row => row.id === editId);
    const item = {
      id:previous?.id || uuid(),kind,surface,
      romaji:clean(raw.romaji || kanaToRomaji(raw.kana),200),kana:clean(raw.kana,200),meaning:clean(raw.meaning,300),notes:clean(raw.notes,300),
      source:previous?.source || clean(origin || t('manual'),200),
      createdAt:previous?.createdAt || new Date().toISOString(),updatedAt:new Date().toISOString()
    };
    await persist('custom_upsert',{item});
    selected.add(item.id);
    if (isOpen()) renderList();
    notify(previous?t('saved'):t('added'));
    return true;
  }
  async function addFromManga(kind,data,source) {
    const raw = kind === 'word' ? {
      kind:'word',surface:data.surface,kana:data.reading || '',romaji:data.romaji || '',meaning:data.meaning || '',notes:''
    } : {
      kind:'kanji',surface:data.character,kana:/[\u3040-\u30ff]/.test(data.reading_here||'') ? data.reading_here : '',romaji:/[\u3040-\u30ff]/.test(data.reading_here||'') ? kanaToRomaji(data.reading_here) : /^[a-zāēīōū'-]+$/i.test(String(data.reading_here||'').trim()) ? data.reading_here : '',meaning:data.meaning || '',notes:[data.note, /[\u3040-\u30ff]/.test(data.reading_here||'') ? '' : data.reading_here].filter(Boolean).join(' · ')
    };
    return save(raw,source || t('manga'));
  }
  function open() {
    if ((window.KTFNavigation?.active() ?? window.KTFBridge?.isQuizActive?.()) || !$('examScreen').hidden) {
      window.alert(language() === 'es' ? 'Terminá tu práctica antes de abrir Custom.' : 'Finish your practice before opening Custom.');
      return;
    }
    window.KTFNavigation?.remember();
    returnView = !$('mangaScreen').hidden ? 'manga' : 'setup';
    for (const name of ['setupScreen','quizScreen','summaryScreen','examScreen','mangaScreen','grammarScreen']) if ($(name)) $(name).hidden = true;
    $('customScreen').hidden = false;
    $('customTop').hidden = false;
    $('customPractice').hidden = true;
    $('customSummary').hidden = true;
    $('customBrowse').hidden = false;
    stopSessionClock();
    practice = null;
    hideEditor();
    renderList();
    refresh().catch(error => notify(error.message || String(error),true));
    window.KTFNavigation?.reveal('customScreen',{restore:true});
  }
  function close(forceSetup = false) {
    window.KTFNavigation?.remember();
    hideEditor();
    $('customScreen').hidden = true;
    $('customSummary').hidden = true;
    $('customTop').hidden = false;
    const backToManga = !forceSetup && returnView === 'manga' && !$('openMangaButton').hidden;
    $('mangaScreen').hidden = !backToManga;
    $('setupScreen').hidden = backToManga;
    stopSessionClock();
    practice = null;
    returnView = 'setup';
    window.KTFNavigation?.reveal(backToManga?'mangaScreen':'setupScreen',{restore:true});
  }
  const splitAnswers = value => String(value || '').split(/[;,/|、，；]/g).map(normalize).filter(Boolean);
  function accepted(value, expected, kind) {
    const answer = normalize(value).replace(/[.!?。！？]+$/g,'');
    const options = splitAnswers(expected);
    if (!answer || !options.length) return false;
    if (kind === 'romaji') return options.some(option => window.KTFRomaji.matches(answer,option));
    return options.includes(answer);
  }
  function questionBank(answerMode) {
    return items.filter(item => selected.has(item.id) && answerTypes(item,answerMode).length);
  }
  function shuffledQuestions(session) {
    const deck=session.pool.map(item => {
      const types=answerTypes(item,session.answerMode);
      return {item,type:types[Math.floor(Math.random()*types.length)]};
    });
    for(let i=deck.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}
    if (deck.length>1 && deck[0].item.id===session.lastItem) {
      const alternative=deck.findIndex(question=>question.item.id!==session.lastItem);
      if (alternative>0) [deck[0],deck[alternative]]=[deck[alternative],deck[0]];
    }
    return deck;
  }
  function formatDuration(milliseconds) {
    const seconds=Math.max(0,Math.floor(milliseconds/1000));
    const hours=Math.floor(seconds/3600);
    const minutes=Math.floor(seconds%3600/60);
    const rest=seconds%60;
    return hours ? `${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:${String(rest).padStart(2,'0')}` : `${String(minutes).padStart(2,'0')}:${String(rest).padStart(2,'0')}`;
  }
  function stopSessionClock() {
    if (!practice) return;
    if (practice.interval !== null) {clearInterval(practice.interval);practice.interval=null;}
    if (practice.advanceTimeout !== null) {clearTimeout(practice.advanceTimeout);practice.advanceTimeout=null;}
  }
  function showSessionStats(session) {
    $('customStatsAnswered').textContent=String(session.answered);
    $('customStatsCorrect').textContent=String(session.correct);
    $('customStatsAccuracy').textContent=session.answered ? `${Math.round(session.correct/session.answered*100)}%` : '—';
  }
  function showSessionClock(session) {
    if (!session) return;
    $('customPracticeClock').textContent=formatDuration(session.timerSeconds === null ? session.elapsedMs : Math.max(0,session.timerSeconds*1000-session.elapsedMs));
    $('customPracticeClock').hidden=!session.showClock && session.timerSeconds===null;
    $('customClockToggle').hidden=session.timerSeconds!==null;
    $('customClockToggle').textContent=t(session.showClock?'hideClock':'showClock');
    $('customClockToggle').setAttribute('aria-pressed',String(session.showClock));
    $('customPracticeClock').classList.toggle('is-urgent',session.timerSeconds!==null && session.timerSeconds*1000-session.elapsedMs<=30000);
    const rapidVisible=session.rapidSeconds!==null && !session.guided && !session.done;
    const remaining=rapidVisible?Math.max(0,session.rapidSeconds*1000-session.rapidElapsedMs):0;
    const percent=rapidVisible?Math.round(remaining/(session.rapidSeconds*1000)*100):0;
    $('customRapidIndicator').hidden=!rapidVisible;
    if(rapidVisible){
      $('customRapidIndicatorTitle').textContent=t('rapidTimeLeft');
      $('customRapidRemaining').textContent=`${Math.ceil(remaining/1000)}s`;
      $('customRapidBar').style.width=`${percent}%`;
      $('customRapidProgress').setAttribute('aria-valuenow',String(percent));
      $('customRapidIndicator').classList.toggle('is-urgent',!session.checked&&remaining<=Math.min(5000,session.rapidSeconds*300));
      $('customRapidIndicator').classList.toggle('is-expired',session.rapidTimedOut===true);
      $('customRapidStatus').textContent=session.rapidTimedOut?t('rapidTimeUp'):(session.checked?t('rapidWaiting'):'');
    }
    $('customGuessProgress').hidden=session.guessLimit===null;
    $('customGuessProgress').textContent=`${session.answered} / ${session.guessLimit} ${t('attempts')}`;
    const total=session.mode==='learn'?session.pool.length*6:session.mode==='onepass'?session.pool.length:0;
    window.KTFStudyUI?.progress('customLearningProgress',session.done?session.index:session.index-1,total,session.mode==='learn'?`${session.guided?t('guidedPass'):t('memoryPass')} · ${Math.min(6,session.round)}/6`:t('onePassTitle'));
    $('customPracticeProgress').textContent=session.done ? '' : `${session.mode==='learn' ? `${session.round<=3?t('guidedPass'):t('memoryPass')} ${session.round<=3?session.round:session.round-3}/3 · ` : ''}${t('question')} ${session.index}${session.mode!=='infinite'?` / ${session.mode==='learn'?session.pool.length*6:session.pool.length}`:''}`;
    $('customPauseSession').textContent=t(session.paused?'resume':'pause');
    $('customPauseSession').setAttribute('aria-pressed',String(session.paused));
    $('customPracticeCard').classList.toggle('is-paused',session.paused);
    $('customPracticeAnswer').disabled=session.paused || session.checked || session.guided || session.done;
    $('customPracticeCheck').disabled=session.paused || session.checked;
    $('customPracticeSkip').disabled=session.paused || session.checked;
    $('customGuidedNext').disabled=session.paused;
    $('customPracticeNext').disabled=session.paused;
  }
  function startPractice(mode='infinite',overridePool=null) {
    const answerMode=$('customMode').value;
    const pool=overridePool || questionBank(answerMode);
    if (!pool.length) {notify(t('noQuestions'),true);return;}
    const options=readSessionOptions(mode);
    if (!options) {notify(t('settingsInvalid'),true);return;}
    window.KTFNavigation?.remember();
    stopSessionClock();
    practice={startedAt:new Date().toISOString(),mode,answerMode,pool,showClock:sessionSettings.showClock!==false,deck:[],round:0,index:0,lastItem:null,current:null,checked:false,guided:false,done:false,paused:false,correct:0,answered:0,history:[],rapidTimeouts:0,elapsedMs:0,rapidElapsedMs:0,lastTick:performance.now(),interval:null,advanceTimeout:null,...options};
    $('customBrowse').hidden=true;
    $('customSummary').hidden=true;
    $('customTop').hidden=true;
    $('customNotice').hidden=true;
    $('customPractice').hidden=false;
    $('customPracticeExit').textContent=t('finishLesson');
    $('customSessionKind').textContent=t(mode==='onepass'?'onePassTitle':mode==='learn'?'learnTitle':'infiniteTitle');
    $('customPauseSession').hidden=false;
    $('customPracticeStats').hidden=false;
    $('customPracticeCard').classList.remove('is-paused');
    $('customPracticeForm').hidden=false;
    $('customPracticeAnswerArea').hidden=false;
    $('customQuizHint').hidden=false;
    $('customFinishLesson').hidden=false;
    showSessionStats(practice);
    window.KTFStudyClock?.onQuizStart({source:'custom',kind:'custom',mode});
    nextSessionQuestion();
    if (practice && !practice.done) {
      practice.lastTick=performance.now();
      practice.interval=setInterval(tickSession,100);
    }
    window.KTFNavigation?.reveal('customPractice');
    (practice.guided?$('customGuidedNext'):$('customPracticeAnswer')).focus({preventScroll:true});
  }
  function tickSession() {
    const session=practice;
    if (!session || session.done) return;
    const now=performance.now();
    const delta=Math.max(0,now-session.lastTick);
    session.lastTick=now;
    if (session.paused) return;
    session.elapsedMs+=delta;
    if (session.timerSeconds!==null && session.elapsedMs>=session.timerSeconds*1000) {
      session.elapsedMs=session.timerSeconds*1000;
      completeSession(t('timeUp'));
      return;
    }
    if (session.rapidSeconds!==null && !session.guided && !session.checked) {
      session.rapidElapsedMs+=delta;
      if (session.rapidElapsedMs>=session.rapidSeconds*1000) {
        session.rapidElapsedMs=session.rapidSeconds*1000;
        checkPractice(true,true).catch(error=>notify(error.message || String(error),true));
      }
    }
    showSessionClock(session);
  }
  function toggleSessionPause() {
    if (!practice || practice.done) return;
    tickSession();
    if (!practice || practice.done) return;
    practice.paused=!practice.paused;
    practice.lastTick=performance.now();
    showSessionClock(practice);
    if (!practice.paused && !practice.guided && !practice.checked) $('customPracticeAnswer').focus({preventScroll:true});
  }
  function nextSessionQuestion() {
    const session=practice;
    if (!session || session.done) return;
    if (session.guessLimit !== null && session.answered>=session.guessLimit) {completeSession(t('guessComplete'));return;}
    if (!session.deck.length) {
      if ((session.mode==='learn' && session.round===6) || (session.mode==='onepass' && session.round===1)) {completeSession();return;}
      session.deck=shuffledQuestions(session);
      session.round++;
    }
    session.current=session.deck.shift();
    session.lastItem=session.current.item.id;
    session.index++;
    session.guided=session.mode==='learn' && session.round<=3;
    if(session.guided)window.KTFStudyClock?.onGuided({id:session.current.item.id,kana:session.current.item.surface},'custom');
    session.checked=false;
    session.rapidElapsedMs=0;
    session.rapidTimedOut=false;
    if (session.advanceTimeout!==null) {clearTimeout(session.advanceTimeout);session.advanceTimeout=null;}
    $('customPracticeForm').hidden=session.guided;
    $('customGuidedBlock').hidden=!session.guided;
    $('customPracticeNext').hidden=true;
    $('customPracticeSymbol').textContent=session.current.item.surface;
    $('customPracticeInfo').textContent=`${session.current.item.kind==='kanji'?t('kanji'):t('word')} · ${t('review')}`;
    $('customPracticeQuestion').textContent=session.guided?t('guidedPass') : t(session.current.type==='romaji'?'askReading':'askMeaning');
    $('customGuidedAnswer').textContent=[...new Set([session.current.item.romaji,session.current.item.kana,session.current.item.meaning].filter(Boolean))].join(' · ');
    $('customPracticeAnswer').value='';
    $('customPracticeFeedback').hidden=true;
    $('customPracticeCheck').textContent=t('check');
    $('customPracticeSkip').textContent=t('skip');
    $('customPracticeSkip').hidden=false;
    $('customPracticeCheck').hidden=false;
    showSessionClock(session);
    if (!session.paused) (session.guided?$('customGuidedNext'):$('customPracticeAnswer')).focus({preventScroll:true});
  }
  async function checkPractice(skipped=false,timedOut=false) {
    const session=practice;
    if (!session || session.done || session.paused || session.guided || session.checked) return;
    const question=session.current;
    const expected=question.type==='romaji' ? question.item.romaji : question.item.meaning;
    const answer=$('customPracticeAnswer').value;
    if (!skipped && !answer.trim()) return;
    const correct=!skipped && accepted(answer,expected,question.type);
    session.checked=true;
    session.rapidTimedOut=timedOut;
    session.answered++;
    if(correct) session.correct++;
    session.history.push({item:question.item,correct,answer,expected,type:question.type,skipped,timedOut});
    window.KTFStudyClock?.onAnswer({source:'custom',kind:question.item.kind,item:{id:question.item.id,kana:question.item.surface},correct});
    if(timedOut)session.rapidTimeouts++;
    const feedback=$('customPracticeFeedback');
    feedback.hidden=false;
    feedback.classList.toggle('is-correct',correct);
    feedback.classList.toggle('is-wrong',!correct);
    feedback.classList.toggle('correct',correct);
    feedback.classList.toggle('wrong',!correct);
    feedback.textContent=`${timedOut?t('rapidTimeUp'):(t(correct?'correct':'wrong'))} ${t('answerWas')} ${expected}${question.item.kana ? ` (${question.item.kana})` : ''}`;
    if(question.item.kind==='word'){
      const known=window.KTFBridge.words.find(word=>word.kana===question.item.surface);
      const breakdown=known&&window.KTFBridge.renderKanjiBreakdown(known);
      if(breakdown)feedback.append(breakdown);
      else if(question.item.notes){const note=document.createElement('p');note.textContent=question.item.notes;feedback.append(note);}
    }
    $('customPracticeSkip').hidden=true;
    $('customPracticeNext').hidden=false;
    $('customPracticeCheck').hidden=true;
    $('customPracticeNext').textContent=(session.guessLimit!==null && session.answered>=session.guessLimit) || (session.mode==='onepass' && session.round===1 && !session.deck.length) || (session.mode==='learn' && session.round===6 && !session.deck.length) ? t('finish') : t('next');
    showSessionStats(session);
    showSessionClock(session);
    try {await persist('custom_review',{itemId:question.item.id,correct,mode:question.type,answeredAt:new Date().toISOString()});}
    catch(error){notify(error.message || String(error),true);}
    if(practice!==session || session.done)return;
    $('customPracticeNext').focus({preventScroll:true});
  }
  function completeSession(reason='') {
    const session=practice;
    if(!session || session.done)return;
    window.KTFNavigation?.remember();
    stopSessionClock();
    window.KTFStudyClock?.onQuizFinish({source:'custom',kind:'custom',mode:session.mode});
    session.done=true;
    session.paused=false;
    session.finishReason=reason;
    session.completed=(session.mode==='onepass'||session.mode==='learn')&&!session.deck.length&&session.checked&&(session.mode!=='learn'||session.round===6);
    if(session.answered)cloud.addAttempt({examId:'custom-practice',kind:'custom',mode:session.mode,questions:session.history.map(row=>({id:row.item.id,prompt:row.item.surface,answer:row.answer,expected:row.expected,correct:row.correct,type:row.type})),correct:session.correct,total:session.answered,percent:Math.round(session.correct/session.answered*100),startedAt:session.startedAt,completedAt:new Date().toISOString(),elapsedMs:session.elapsedMs}).catch(error=>notify(String(error.message||error),true));
    $('customPractice').hidden=true;
    $('customBrowse').hidden=true;
    $('customSummary').hidden=false;
    renderSessionResult(session);
    window.KTFNavigation?.reveal('customSummary');
  }
  function renderSessionResult(session) {
    const history=session.history || [];
    const mistakeMap=new Map();
    for(const row of history){
      const key=row.item.id;
      if(!mistakeMap.has(key)) mistakeMap.set(key,{item:row.item,attempts:0,correct:0,errors:0});
      const record=mistakeMap.get(key);
      record.attempts++;
      if(row.correct)record.correct++;
      else record.errors++;
    }
    const hardest=[...mistakeMap.values()].filter(item=>item.errors>0).sort((a,b)=>b.errors-a.errors||b.attempts-a.attempts||a.item.surface.localeCompare(b.item.surface));
    $('customSummaryEyebrow').textContent=session.finishReason || t(session.completed?'result':'sessionReason');
    $('customSummaryDescription').textContent=session.mode==='learn'?`${t('question')}: ${Math.max(0,session.index-(session.checked?0:1))}/${session.pool.length*6} · ${t('guidedPass')} / ${t('memoryPass')}: ${session.round}/6`:session.mode==='onepass'?`${t('statsAnswered')}: ${session.answered}/${session.pool.length}`:t('summaryDescription');
    $('customSummaryAnswered').textContent=String(session.answered);
    $('customSummaryCorrect').textContent=String(session.correct);
    $('customSummaryAccuracy').textContent=session.answered?`${Math.round(session.correct/session.answered*100)}%`:'—';
    $('customSummaryProgress').textContent=`${t(session.mode==='onepass'?'onePassTitle':session.mode==='learn'?'learnTitle':'infiniteTitle')} · ${t('sessionDuration')}: ${formatDuration(session.elapsedMs)}${session.rapidTimeouts?` · ${t('timedOutCount')}: ${session.rapidTimeouts}`:''}`;
    $('customHardestResults').innerHTML=hardest.length?`<ol class="hardest-list">${hardest.slice(0,10).map(row=>`<li class="hardest-item"><span class="hardest-glyph" lang="ja">${escapeHtml(row.item.surface)}</span><div class="hardest-info"><strong>${escapeHtml([row.item.romaji||row.item.kana,row.item.meaning].filter(Boolean).join(' · '))}</strong><span>${row.attempts} ${t(row.attempts===1?'attemptSingle':'attemptPlural')} · ${row.correct} ${t('count')}</span></div><span class="hardest-count">${row.errors} ${t(row.errors===1?'mistakeSingle':'mistakePlural')}</span></li>`).join('')}</ol>`:`<p class="summary-empty">${t(session.answered?'summaryFlawless':'summaryEmpty')}</p>`;
    $('customSummaryReview').hidden=!hardest.length;
  }
  function backToCollection() {
    window.KTFNavigation?.remember();
    stopSessionClock();
    practice=null;
    $('customBrowse').hidden=false;
    $('customPractice').hidden=true;
    $('customSummary').hidden=true;
    $('customTop').hidden=false;
    renderList();
    window.KTFNavigation?.reveal('customScreen',{restore:true});
  }
  function finishPractice() {
    if(practice && !practice.done){completeSession();return;}
    backToCollection();
  }
  function retryPractice(onlyMistakes=false) {
    if(!practice || !practice.done)return;
    const previous=practice;
    const pool=onlyMistakes?[...new Map((previous.history||[]).filter(row=>!row.correct).map(row=>[row.item.id,row.item])).values()]:previous.pool;
    if(!pool.length)return;
    if(onlyMistakes){window.KTFStudyUI.review(pool.map(item=>({item,label:[item.surface,item.romaji,item.meaning].filter(Boolean).join(' · ')})),chosen=>startPractice('onepass',chosen.map(row=>row.item)));return;}
    startPractice(previous.mode,pool);
  }
  async function deleteSelected() {
    if(deleting || !selected.size)return;
    const targets=items.filter(item=>selected.has(item.id));
    if(!targets.length)return;
    const question=t('confirmDelete').replace('{count}',String(targets.length));
    if(!window.confirm(question))return;
    deleting=true;
    updateActionAvailability();
    try {
      const events=targets.map(item=>({type:'custom_delete',payload:{id:item.id}}));
      if(typeof cloud.addCustomEvents==='function') await cloud.addCustomEvents(events);
      else for(const event of events) await cloud.addCustomEvent(event.type,event.payload);
      for(const item of targets) selected.delete(item.id);
      await refresh();
      notify(t('deletedBatch').replace('{count}',String(targets.length)));
    } catch(error) {
      notify(error.message||String(error),true);
    } finally {
      deleting=false;
      updateActionAvailability();
    }
  }
  let dragState = null;
  let pointerHandled = null;
  function toggleTile(id) {
    if (selected.has(id)) selected.delete(id);
    else selected.add(id);
    renderList();
  }
  function applyDrag(tile) {
    const id = tile?.dataset?.customTile;
    if (!dragState || !id || dragState.seen.has(id)) return;
    dragState.seen.add(id);
    if (dragState.value) selected.add(id);
    else selected.delete(id);
    tile.setAttribute('aria-pressed',String(selected.has(id)));
    $('customSelected').textContent = `${selected.size} ${t('selected')}`;
    $('customSideSelected').textContent = String(selected.size);
    updateActionAvailability();
    $('customCharacterCount').textContent = String(items.filter(item => item.kind === 'kanji' && selected.has(item.id)).length);
    $('customWordCount').textContent = String(items.filter(item => item.kind === 'word' && selected.has(item.id)).length);
    $('customAllCount').textContent = String(selected.size);
  }
  function attach() {
    restoreSessionOptions();
    $('openCustomButton').addEventListener('click',open);
    $('mangaOpenCustom').addEventListener('click',open);
    $('customBack').addEventListener('click',()=>close());
    $('customAddButton').addEventListener('click',()=>showEditor());
    $('customEditorClose').addEventListener('click',hideEditor);
    $('customEditorDialog').addEventListener('click',event => {
      if (event.target === $('customEditorDialog')) hideEditor();
    });
    $('customEditorDialog').addEventListener('close',resetForm);
    $('homeLink').addEventListener('click',()=>{if(isOpen())close(true);},true);
    $('customForm').addEventListener('submit',async event => {
      event.preventDefault();
      const raw = {kind:$('customKind').value,surface:$('customJapanese').value,romaji:$('customRomaji').value,kana:$('customKana').value,meaning:$('customMeaning').value,notes:$('customNotes').value};
      const ok = await save(raw);
      if (ok) hideEditor();
    });
    $('customCancel').addEventListener('click',hideEditor);
    $('customSearch').addEventListener('input',event => {search = event.target.value;renderList();});
    document.querySelectorAll('[data-custom-filter]').forEach(button => button.addEventListener('click',() => {filter = button.dataset.customFilter;renderList();}));
    $('customItems').addEventListener('click',event => {
      const tile = event.target.closest('[data-custom-tile]');
      if (!tile) return;
      if (pointerHandled && pointerHandled.id === tile.dataset.customTile && Date.now() - pointerHandled.time < 650) {
        pointerHandled = null;
        return;
      }
      toggleTile(tile.dataset.customTile);
    });
    $('customItems').addEventListener('pointerdown',event => {
      if (event.button !== 0 || event.target.closest('[data-custom-tile]') === null) return;
      const tile = event.target.closest('[data-custom-tile]');
      dragState = {value:!selected.has(tile.dataset.customTile),seen:new Set()};
      applyDrag(tile);
      pointerHandled = {id:tile.dataset.customTile,time:Date.now()};
      event.preventDefault();
    });
    document.addEventListener('pointermove',event => {
      if (!dragState || !isOpen()) return;
      const tile = document.elementFromPoint(event.clientX,event.clientY)?.closest?.('[data-custom-tile]');
      if (tile && $('customItems').contains(tile)) applyDrag(tile);
    });
    document.addEventListener('pointerup',() => {dragState=null;});
    document.addEventListener('pointercancel',() => {dragState=null;});
    document.addEventListener('keydown',event => {
      if (!isOpen() || !event.target.matches?.('[data-custom-filter]')) return;
      if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
      event.preventDefault();
      const tabs=[...document.querySelectorAll('[data-custom-filter]')];
      const index=tabs.indexOf(event.target);
      const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+(event.key==='ArrowRight'?1:tabs.length-1))%tabs.length;
      tabs[next].click();
      tabs[next].focus();
    });
    $('customSelectAll').addEventListener('click',()=>{visible().forEach(item => selected.add(item.id));renderList();});
    $('customSelectNone').addEventListener('click',()=>{visible().forEach(item => selected.delete(item.id));renderList();});
    $('customDeleteSelected').addEventListener('click',deleteSelected);
    $('customPracticeButton').addEventListener('click',()=>startPractice('infinite'));
    $('customLearnButton').addEventListener('click',()=>startPractice('learn'));
    $('customOnePassButton').addEventListener('click',()=>startPractice('onepass'));
    $('customMode').addEventListener('change',()=>{updateActionAvailability();updateSessionSettings();});
    for(const id of ['customTimerMode','customSessionHours','customSessionMinutes','customGuessCount','customRapidEnabled','customRapidSeconds']) $(id).addEventListener(id==='customTimerMode'||id==='customRapidEnabled'?'change':'input',updateSessionSettings);
    $('customPauseSession').addEventListener('click',toggleSessionPause);
    $('customClockToggle').addEventListener('click',()=>{
      if(!practice || practice.done || practice.timerSeconds!==null)return;
      practice.showClock=!practice.showClock;
      sessionSettings.showClock=practice.showClock;
      saveSessionSettings();
      showSessionClock(practice);
    });
    $('customGuidedNext').addEventListener('click',()=>{if(practice && !practice.done && !practice.paused && practice.guided)nextSessionQuestion();});
    $('customPracticeForm').addEventListener('submit',event => {event.preventDefault();checkPractice().catch(() => {});});
    $('customPracticeSkip').addEventListener('click',()=>checkPractice(true).catch(() => {}));
    $('customPracticeNext').addEventListener('click',()=>{if(practice && !practice.paused && practice.checked)nextSessionQuestion();});
    $('customPracticeExit').addEventListener('click',finishPractice);
    $('customFinishLesson').addEventListener('click',finishPractice);
    $('customSummaryBack').addEventListener('click',backToCollection);
    $('customSummaryAgain').addEventListener('click',()=>retryPractice(false));
    $('customSummaryReview').addEventListener('click',()=>retryPractice(true));
    cloud.subscribe(() => {
      if (owner !== currentOwner()) {loaded = false;stopSessionClock();practice = null;if(isOpen()){ $('customBrowse').hidden=false;$('customPractice').hidden=true;$('customSummary').hidden=true;$('customTop').hidden=false;hideEditor(); }}
      refresh().catch(() => {});
    });
    document.addEventListener('ktf:languagechange',()=>{labelText();if(isOpen() && !practice)renderList();if(practice){showSessionStats(practice);showSessionClock(practice);if(practice.done)renderSessionResult(practice);}});
    window.addEventListener('ktf:custom-added',event => {addFromManga(event.detail.kind,event.detail.item,event.detail.source).catch(error => notify(String(error.message||error),true));});
    document.addEventListener('keydown',event => {if(isOpen() && event.key === 'Escape' && !practice && !$('customEditorDialog').open) close();});
  }
  window.KTFCustomCollection = {addFromManga,refresh,open,isSaved,isActive:()=>Boolean(practice&&!practice.done),
    practiceSource:async source=>{if(!window.KTFNavigation.canLeave())return;open();await refresh();const pool=items.filter(item=>item.source===source&&answerTypes(item,$('customMode').value).length);if(!pool.length){notify(t('noQuestions'),true);return;}selected=new Set(pool.map(item=>item.id));renderList();startPractice('onepass',pool);}};
  attach();
  refresh().catch(() => {});
})();
