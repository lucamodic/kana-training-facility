"use strict";
(() => {
  const KEY = 'ktf-global-study-clock-v1';
  const POSITION_KEY = 'ktf-floating-clock-position-v1';
  const $ = id => document.getElementById(id);
  const MAX_MS = (99 * 60 + 59) * 60000;
  const dictionary = {
    en: {
      activityReview: 'Personalized practice',
      title: 'MY STUDY TIME', subtitle: 'Your own little study session',
      description: 'Set your own hours and minutes. The clock follows you across lessons.',
      hours: 'Hours', minutes: 'Minutes', setup: 'SET YOUR TIME', remaining: 'TIME LEFT', paused: 'PAUSED',
      start: 'Start study time →', pause: 'Pause', resume: 'Resume', finish: 'Finish & see summary',
      error: 'Choose a duration between 1 minute and 99 hours 59 minutes.',
      doneTitle: 'Study session complete!', earlyTitle: 'Study session summary',
      doneDescription: "Lovely work today. Here's what you practiced.",
      earlyDescription: "Here's what you covered before finishing.",
      time: 'Time studied', answers: 'Answers', accurate: 'Accuracy', words: 'Word answers',
      kana: 'Character answers', guided: 'Guided cards seen', lessons: 'Lessons finished',
      unique: 'Different items', mistakes: 'Need another look', noMistakes: 'No mistakes recorded this session.',
      activity: 'Your activities', activityTime: 'Active time', activityAccuracy: 'Accuracy', activityAnswers: 'answers', activityGuided: 'guided cards', activityLessons: 'sessions', activityRead: 'pages read', activityExplanations: 'explanations opened', activityAnalyzed: 'analyses completed', activitySaved: 'items saved', activityDifficult: 'Review', activityReading: 'romaji correct', activityMeaning: 'meanings correct', activityManga: 'Manga Reader', activityCustom: 'Custom', activityGrammar: 'Grammar', activityKana: 'Kana', activityWords: 'Word Challenge',
      close: 'Done →',
      confirm: 'Finish this study session early and see your progress?',
      announcement: 'Study time remaining', minimize: 'Minimize study clock', expand: 'Expand study clock', dock: 'Keep clock in the lesson', float: 'Float study clock', drag: 'Drag to move the clock. Use arrow keys to adjust its position.'
    },
    es: {
      activityReview: 'Práctica personalizada',
      title: 'MI TIEMPO DE ESTUDIO', subtitle: 'Tu pequeña sesión de estudio',
      description: 'Elegí las horas y minutos que quieras. El reloj sigue activo entre lecciones.',
      hours: 'Horas', minutes: 'Minutos', setup: 'ELEGÍ TU TIEMPO', remaining: 'TIEMPO RESTANTE', paused: 'EN PAUSA',
      start: 'Empezar a estudiar →', pause: 'Pausar', resume: 'Reanudar', finish: 'Terminar y ver resumen',
      error: 'Elegí una duración entre 1 minuto y 99 horas 59 minutos.',
      doneTitle: '¡Terminaste tu tiempo de estudio!', earlyTitle: 'Resumen de estudio',
      doneDescription: '¡Muy buen trabajo! Esto fue lo que practicaste.',
      earlyDescription: 'Esto fue lo que estudiaste hasta ahora.',
      time: 'Tiempo estudiado', answers: 'Respuestas', accurate: 'Precisión', words: 'Palabras respondidas',
      kana: 'Caracteres respondidos', guided: 'Tarjetas guiadas vistas', lessons: 'Lecciones terminadas',
      unique: 'Elementos diferentes', mistakes: 'Para seguir repasando', noMistakes: 'No tuviste errores en esta sesión.',
      activity: 'Tus actividades', activityTime: 'Tiempo activo', activityAccuracy: 'Precisión', activityAnswers: 'respuestas', activityGuided: 'tarjetas guiadas', activityLessons: 'sesiones', activityRead: 'páginas leídas', activityExplanations: 'explicaciones abiertas', activityAnalyzed: 'análisis completados', activitySaved: 'elementos guardados', activityDifficult: 'Para repasar', activityReading: 'lecturas correctas', activityMeaning: 'significados correctos', activityManga: 'Lector de manga', activityCustom: 'Mi colección', activityGrammar: 'Gramática', activityKana: 'Kana', activityWords: 'Desafío de palabras',
      close: 'Listo →',
      confirm: '¿Querés terminar antes esta sesión y ver tu progreso?',
      announcement: 'Tiempo restante de estudio', minimize: 'Minimizar reloj de estudio', expand: 'Expandir reloj de estudio', dock: 'Dejar el reloj dentro de la lección', float: 'Hacer flotar el reloj', drag: 'Arrastrá para mover el reloj. Usá las flechas para ajustar su posición.'
    }
  };
  const lang = () => document.documentElement.lang === 'es' ? 'es' : 'en';
  const t = key => dictionary[lang()][key];
  const sectionNames = ['kana','words','custom','grammar','manga','review'];
  const defaultSection = () => ({answers:0,correct:0,guided:0,started:0,finished:0,activeMs:0,pages:0,analyzed:0,saved:0,readingCorrect:0,meaningCorrect:0});
  const defaultStats = () => ({ answers: 0, correct: 0, words: 0, characters: 0,
    guided: 0, started: 0, finished: 0, byScript: {hiragana:0,katakana:0,kanji:0},
    uniqueIds: [], mangaPageIds:[], errors: {}, sections:Object.fromEntries(sectionNames.map(name=>[name,defaultSection()])) });
  const restoreStats = source => {
    const original=source&&typeof source==='object'?source:{};
    const defaults=defaultStats();
    return {...defaults,...original,uniqueIds:Array.isArray(original.uniqueIds)?original.uniqueIds:[],
      mangaPageIds:Array.isArray(original.mangaPageIds)?original.mangaPageIds:[],
      errors:original.errors&&typeof original.errors==='object'?original.errors:{},
      byScript:{...defaults.byScript,...(original.byScript||{})},
      sections:Object.fromEntries(sectionNames.map(name=>[name,{...defaultSection(),...(original.sections?.[name]||{})}]))};
  };
  const blank = () => ({ status: 'idle', savedHours:'', savedMinutes:'', durationMs:0,
    startedAt:null, deadlineAt:null, remainingMs:0, stats: defaultStats() });
  let clock = blank();
  let lastActivityAt = Date.now();
  let activeQuizSection = 'kana';
  const clockElement = $('globalStudyClock');
  const homeMarker = document.createComment('study clock position');
  clockElement.before(homeMarker);
  let lesson = $('quizScreen');
  let lessonOpen = false;
  let isMinimized = true;
  try { isMinimized = localStorage.getItem('ktf-study-clock-window-minimized') !== 'false'; } catch (_) {}
  const titlebar = clockElement.querySelector('.study-clock-titlebar');
  let floatingPosition = null;
  let activeDrag = null;
  try {
    const stored = JSON.parse(localStorage.getItem(POSITION_KEY) || 'null');
    if (stored && Number.isFinite(stored.left) && Number.isFinite(stored.top)) {
      floatingPosition = {left: stored.left, top: stored.top};
    }
  } catch (_) {}
  function viewportBounds() {
    const viewport = window.visualViewport;
    return viewport
      ? {left: viewport.offsetLeft, top: viewport.offsetTop, width: viewport.width, height: viewport.height}
      : {left: 0, top: 0, width: innerWidth, height: innerHeight};
  }
  function clampPosition(position) {
    const viewport = viewportBounds();
    const rect = clockElement.getBoundingClientRect();
    const padding = 8;
    const minLeft = viewport.left + padding;
    const minTop = viewport.top + padding;
    const maxLeft = Math.max(minLeft, viewport.left + viewport.width - rect.width - padding);
    const maxTop = Math.max(minTop, viewport.top + viewport.height - rect.height - padding);
    return {
      left: Math.min(maxLeft, Math.max(minLeft, position.left)),
      top: Math.min(maxTop, Math.max(minTop, position.top))
    };
  }
  function applyFloatingPosition() {
    if (!clockElement.classList.contains('is-floating')) {
      clockElement.style.left = '';
      clockElement.style.top = '';
      clockElement.style.right = '';
      clockElement.style.bottom = '';
      return;
    }
    if (!floatingPosition) {
      clockElement.style.left = '';
      clockElement.style.top = '';
      clockElement.style.right = '';
      clockElement.style.bottom = '';
      return;
    }
    floatingPosition = clampPosition(floatingPosition);
    clockElement.style.left = `${floatingPosition.left}px`;
    clockElement.style.top = `${floatingPosition.top}px`;
    clockElement.style.right = 'auto';
    clockElement.style.bottom = 'auto';
  }
  function saveFloatingPosition() {
    if (!floatingPosition) return;
    try { localStorage.setItem(POSITION_KEY, JSON.stringify(floatingPosition)); } catch (_) {}
  }
  function placeClock() {
    clockElement.classList.add('is-floating');
    clockElement.classList.remove('is-docked');
    clockElement.classList.toggle('is-minimized', isMinimized);
    clockElement.classList.toggle('is-active', clock.status !== 'idle');
    $('studyClockMinimize').hidden = false;
    titlebar.tabIndex = 0;
    titlebar.title = t('drag');
    applyFloatingPosition();
  }
  function viewChanged(open, mode = 'practice') {
    lesson = mode === 'exam' ? $('examScreen') : $('quizScreen');
    lessonOpen = open;
    placeClock();
  }
  function pointerStart(event) {
    if (!clockElement.classList.contains('is-floating') || event.button !== 0 ||
        event.target.closest('button, input, a, select')) return;
    const rect = clockElement.getBoundingClientRect();
    floatingPosition = {left: rect.left, top: rect.top};
    activeDrag = {id: event.pointerId, x: event.clientX, y: event.clientY,
      left: rect.left, top: rect.top};
    clockElement.classList.add('is-dragging');
    titlebar.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  }
  function pointerMove(event) {
    if (!activeDrag || event.pointerId !== activeDrag.id) return;
    floatingPosition = clampPosition({
      left: activeDrag.left + event.clientX - activeDrag.x,
      top: activeDrag.top + event.clientY - activeDrag.y
    });
    applyFloatingPosition();
  }
  function pointerEnd(event) {
    if (!activeDrag || event.pointerId !== activeDrag.id) return;
    activeDrag = null;
    clockElement.classList.remove('is-dragging');
    if (titlebar.hasPointerCapture?.(event.pointerId)) titlebar.releasePointerCapture(event.pointerId);
    saveFloatingPosition();
  }
  titlebar.addEventListener('pointerdown', pointerStart);
  titlebar.addEventListener('pointermove', pointerMove);
  titlebar.addEventListener('pointerup', pointerEnd);
  titlebar.addEventListener('pointercancel', pointerEnd);
  titlebar.addEventListener('lostpointercapture', pointerEnd);
  titlebar.addEventListener('keydown', event => {
    if (!clockElement.classList.contains('is-floating') ||
        !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    const rect = clockElement.getBoundingClientRect();
    const step = event.shiftKey ? 4 : 18;
    floatingPosition = clampPosition({
      left: rect.left + (event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0),
      top: rect.top + (event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0)
    });
    applyFloatingPosition();
    saveFloatingPosition();
  });
  function fitFloatingClock() {
    if (clockElement.classList.contains('is-floating') && floatingPosition) {
      applyFloatingPosition();
      saveFloatingPosition();
    }
  }
  window.addEventListener('resize', fitFloatingClock);
  window.visualViewport?.addEventListener('resize', fitFloatingClock);
  window.visualViewport?.addEventListener('scroll', fitFloatingClock);
  const normalizeTime = value => String(value ?? '').trim();
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved && typeof saved === 'object') {
      clock.savedHours = normalizeTime(saved.savedHours);
      clock.savedMinutes = normalizeTime(saved.savedMinutes);
      if (['running','paused'].includes(saved.status) &&
        Number.isFinite(saved.durationMs) && saved.durationMs > 0 && saved.durationMs <= MAX_MS &&
        Number.isFinite(saved.remainingMs) && saved.remainingMs >= 0 &&
        Number.isFinite(saved.startedAt)) {
        clock = { ...clock, ...saved, stats: restoreStats(saved.stats) };
      }
    }
  } catch (_) {}
  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(clock)); } catch (_) {} };
  const format = ms => {
    const sec = Math.max(0, Math.ceil(ms / 1000));
    return [Math.floor(sec/3600), Math.floor(sec%3600/60), sec%60].map(x => String(x).padStart(2,'0')).join(':');
  };
  const remaining = () => clock.status === 'running' ? Math.max(0,clock.deadlineAt - Date.now()) : clock.remainingMs;
  const running = () => clock.status === 'running';
  const track = () => clock.status === 'running' && remaining() > 0;
  const visible = id => {const node=$(id);return Boolean(node&&!node.hidden);};
  function currentSection() {
    if(visible('spacedReviewScreen'))return 'review';
    if(visible('grammarScreen'))return 'grammar';
    if(visible('customScreen'))return 'custom';
    if(visible('mangaScreen'))return 'manga';
    if(visible('quizScreen'))return activeQuizSection;
    if(visible('setupScreen'))return 'kana';
    return null;
  }
  function accumulateTime() {
    const now=Date.now();
    const delta=Math.max(0,Math.min(1200,now-lastActivityAt));
    lastActivityAt=now;
    if(!track() || document.hidden || delta===0)return;
    const section=currentSection();
    if(section&&clock.stats.sections[section])clock.stats.sections[section].activeMs+=delta;
  }
  function sectionFor(kind,source) {
    if(sectionNames.includes(source))return source;
    return kind==='words'?'words':'kana';
  }
  function activeStats(source) {return clock.stats.sections[source]||clock.stats.sections.kana;}
  function addUnique(item,source='kana') {
    const id=item?.id;
    if(id===undefined||id===null)return;
    const key=`${source}:${id}`;
    if(!clock.stats.uniqueIds.includes(key))clock.stats.uniqueIds.push(key);
  }

  function reflectLabels() {
    $('studyClockTitle').textContent = t('title');
    $('studyClockSubtitle').textContent = t('subtitle');
    $('studyClockDescription').textContent = t('description');
    $('studyHoursLabel').textContent = t('hours');
    $('studyMinutesLabel').textContent = t('minutes');
    $('studyClockStart').textContent = t('start');
    $('studyClockPause').textContent = clock.status === 'paused' ? t('resume') : t('pause');
    $('studyClockFinish').textContent = t('finish');
    $('studyClockError').textContent = t('error');
    $('studyClockProgress').setAttribute('aria-label', t('announcement'));
    $('studyClockDismiss').textContent = t('close');
    const minimize = $('studyClockMinimize');
    minimize.setAttribute('aria-label', t(isMinimized ? 'expand' : 'minimize'));
    minimize.title = t(isMinimized ? 'expand' : 'minimize');
    minimize.textContent = isMinimized ? '+' : '−';
  }
  function render() {
    const active = clock.status !== 'idle';
    reflectLabels();
    $('studyHours').disabled = active;
    $('studyMinutes').disabled = active;
    $('studyClockStart').hidden = active;
    $('studyClockPause').hidden = !active;
    $('studyClockFinish').hidden = !active;
    $('studyClockStatus').textContent = active ? t(clock.status === 'paused' ? 'paused' : 'remaining') : t('setup');
    $('studyClockDisplay').textContent = active ? format(remaining()) : '--:--:--';
    $('studyClockMiniTime').textContent = active ? format(remaining()) : '--:--:--';
    const progress = active ? Math.max(0, Math.min(100, 100 * remaining() / clock.durationMs)) : 0;
    $('studyClockBar').style.width = progress + '%';
    $('studyClockProgress').setAttribute('aria-valuenow', Math.round(progress));
    placeClock();
  }
  const safeText = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let bellContext = null;
  function unlockBellAudio() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    try {
      if (!bellContext || bellContext.state === 'closed') bellContext = new AudioContextClass();
      if (bellContext.state === 'suspended') bellContext.resume().catch(() => {});
    } catch (_) {}
  }
  function playSoftBell() {
    if (!bellContext || bellContext.state !== 'running') return;
    try {
      const startAt = bellContext.currentTime + 0.04;
      const chimes = [
        {frequency: 783.99, offset: 0, duration: 1.55},
        {frequency: 1046.50, offset: 0.26, duration: 1.9}
      ];
      chimes.forEach(({frequency, offset, duration}) => {
        [
          {ratio: 1, volume: 0.075},
          {ratio: 2.01, volume: 0.017},
          {ratio: 3.94, volume: 0.006}
        ].forEach(({ratio, volume}) => {
          const tone = bellContext.createOscillator();
          const envelope = bellContext.createGain();
          const at = startAt + offset;
          tone.type = 'sine';
          tone.frequency.value = frequency * ratio;
          envelope.gain.setValueAtTime(0.0001, at);
          envelope.gain.exponentialRampToValueAtTime(volume, at + 0.018);
          envelope.gain.exponentialRampToValueAtTime(0.0001, at + duration);
          tone.connect(envelope);
          envelope.connect(bellContext.destination);
          tone.start(at);
          tone.stop(at + duration + 0.04);
        });
      });
    } catch (_) {}
  }
  function summaryCard(value, label) {
    return `<div class="study-clock-summary-item"><strong>${safeText(value)}</strong><span>${safeText(label)}</span></div>`;
  }
  function showSummary(summary, elapsedMs, finishedNaturally) {
    $('studyClockDialogTitle').textContent = t(finishedNaturally ? 'doneTitle':'earlyTitle');
    $('studyClockDialogDescription').textContent = t(finishedNaturally ? 'doneDescription':'earlyDescription');
    const stats = summary || defaultStats();
    const unique = Array.isArray(stats.uniqueIds) ? stats.uniqueIds.length : 0;
    const errors = Object.entries(stats.errors || {}).sort((a,b)=>b[1].count-a[1].count).slice(0,3);
    const mistakes = errors.length ? errors.map(([id, value]) => `${value.kana} (${value.count})`).join(' · ') : t('noMistakes');
    const activityRows=sectionNames.map(name=>{
      const row=stats.sections?.[name]||defaultSection();
      const values=[];
      if(row.activeMs>0)values.push(`${t('activityTime')}: ${format(row.activeMs)}`);
      if(row.answers>0)values.push(`${row.correct}/${row.answers} ${t('activityAnswers')} · ${Math.round(row.correct/row.answers*100)}% ${t('activityAccuracy').toLowerCase()}`);
      if(row.guided>0)values.push(`${row.guided} ${t(name==='manga'?'activityExplanations':'activityGuided')}`);
      if(row.finished>0)values.push(`${row.finished} ${t('activityLessons')}`);
      if(name==='grammar'&&row.answers>0)values.push(`${row.readingCorrect} ${t('activityReading')} · ${row.meaningCorrect} ${t('activityMeaning')}`);
      if(name==='manga'){
        if(row.pages>0)values.push(`${row.pages} ${t('activityRead')}`);
        if(row.analyzed>0)values.push(`${row.analyzed} ${t('activityAnalyzed')}`);
        if(row.saved>0)values.push(`${row.saved} ${t('activitySaved')}`);
      }
      const weak=errors.filter(([key])=>key.startsWith(`${name}:`)).map(([,value])=>`${value.kana} (${value.count})`).slice(0,3);
      if(weak.length)values.push(`${t('activityDifficult')}: ${weak.join(', ')}`);
      if(!values.length)return '';
      const title=t({kana:'activityKana',words:'activityWords',custom:'activityCustom',grammar:'activityGrammar',manga:'activityManga',review:'activityReview'}[name]);
      return `<div class="study-clock-activity-row"><strong>${safeText(title)}</strong><span>${safeText(values.join(' · '))}</span></div>`;
    }).filter(Boolean).join('');
    $('studyClockSummary').innerHTML =
      summaryCard(format(elapsedMs),t('time'))+
      summaryCard(stats.answers,t('answers'))+
      summaryCard(stats.answers ? Math.round(stats.correct / stats.answers * 100)+'%' : '—',t('accurate'))+
      summaryCard(stats.words,t('words'))+
      summaryCard(stats.characters,t('kana'))+
      summaryCard(stats.guided,t('guided'))+
      summaryCard(stats.finished,t('lessons'))+
      summaryCard(unique,t('unique'))+
      (activityRows?`<section class="study-clock-activity"><h3>${safeText(t('activity'))}</h3>${activityRows}</section>`:'')+
      `<div class="study-clock-summary-note"><strong>${safeText(t('mistakes'))}:</strong> ${safeText(mistakes)}</div>`;
    const dialog = $('studyClockCompleteDialog');
    if (!dialog.open) dialog.showModal();
    if (finishedNaturally) playSoftBell();
  }
  function finish(natural=false) {
    if (clock.status === 'idle') return;
    accumulateTime();
    const duration = clock.durationMs;
    const elapsed = natural ? duration : duration - remaining();
    const stats = clock.stats;
    const savedHours = clock.savedHours;
    const savedMinutes = clock.savedMinutes;
    clock = {...blank(), savedHours, savedMinutes};
    persist();
    render();
    showSummary(stats,Math.max(0,elapsed),natural);
  }
  function tick() {
    accumulateTime();
    if (running() && remaining() <= 0) { finish(true); return; }
    if (clock.status !== 'idle') render();
  }
  function validInputs() {
    const hRaw = $('studyHours').value.trim(), mRaw = $('studyMinutes').value.trim();
    const h = hRaw === '' ? 0 : Number(hRaw), m = mRaw === '' ? 0 : Number(mRaw);
    return /^\d*$/.test(hRaw) && /^\d*$/.test(mRaw) && Number.isInteger(h) && Number.isInteger(m)
      && h>=0 && h<=99 && m>=0 && m<=59 && h*60+m>0 ? (h*60+m)*60000 : null;
  }
  function saveInput() {
    if (clock.status !== 'idle') return;
    clock.savedHours = $('studyHours').value;
    clock.savedMinutes = $('studyMinutes').value;
    $('studyClockError').hidden = true;
    persist();
  }
  function start() {
    const durationMs = validInputs();
    if (!durationMs) { $('studyClockError').hidden = false; return; }
    $('studyClockError').hidden = true;
    unlockBellAudio();
    clock = { ...clock, status:'running', durationMs, remainingMs:durationMs,
      startedAt:Date.now(), deadlineAt:Date.now()+durationMs, stats:defaultStats() };
    lastActivityAt=Date.now();
    persist();
    render();
  }
  function pauseResume() {
    accumulateTime();
    if (clock.status === 'running') {
      clock.remainingMs = remaining();
      clock.deadlineAt = null;
      clock.status = 'paused';
    } else if (clock.status === 'paused') {
      unlockBellAudio();
      clock.deadlineAt = Date.now() + clock.remainingMs;
      clock.status = 'running';
    }
    lastActivityAt=Date.now();
    persist();
    render();
  }
  function onQuizStart({kind,source}={}) {
    accumulateTime();
    const section=sectionFor(kind,source);
    if(section==='kana'||section==='words')viewChanged(true);
    activeQuizSection=section;
    lastActivityAt=Date.now();
    if(!track())return;
    clock.stats.started++;
    activeStats(section).started++;
    persist();
  }
  function onGuided(item,source=activeQuizSection) {
    if(!track())return;
    clock.stats.guided++;
    activeStats(source).guided++;
    addUnique(item,source);
    persist();
  }
  function onAnswer({item,kind,correct,source,readingCorrect,meaningCorrect}) {
    if(!track())return;
    const section=sectionFor(kind,source);
    const stats=clock.stats;
    const row=activeStats(section);
    stats.answers++;
    row.answers++;
    if(correct){stats.correct++;row.correct++;}
    if(section==='words'||(section==='custom'&&kind==='word'))stats.words++;
    else if(section==='kana'||section==='custom')stats.characters++;
    if(section==='kana'&&item&&Object.hasOwn(stats.byScript,item.script))stats.byScript[item.script]++;
    if(section==='grammar'){
      if(readingCorrect)row.readingCorrect++;
      if(meaningCorrect)row.meaningCorrect++;
    }
    addUnique(item,section);
    if(!correct&&item?.id){
      const key=`${section}:${item.id}`;
      const error=stats.errors[key]||{kana:item.kana||item.surface||item.japanese||item.id,count:0};
      error.count++;
      stats.errors[key]=error;
    }
    persist();
  }
  function onQuizFinish({kind,source}={}) {
    accumulateTime();
    const section=sectionFor(kind,source||activeQuizSection);
    if(section==='kana'||section==='words')viewChanged(false);
    lastActivityAt=Date.now();
    if(!track())return;
    clock.stats.finished++;
    activeStats(section).finished++;
    persist();
  }
  function onMangaPage({id,name}={}) {
    if(!track()||!id)return;
    const key=String(id);
    if(clock.stats.mangaPageIds.includes(key))return;
    clock.stats.mangaPageIds.push(key);
    activeStats('manga').pages++;
    addUnique({id:key},'manga');
    persist();
  }
  function onMangaAnalysis() {
    if(!track())return;
    activeStats('manga').analyzed++;
    persist();
  }
  function onMangaSaved() {
    if(!track())return;
    activeStats('manga').saved++;
    persist();
  }
  window.KTFStudyClock = {onQuizStart,onGuided,onAnswer,onQuizFinish,onMangaPage,onMangaAnalysis,onMangaSaved,onViewChange:viewChanged};
  $('studyHours').value = clock.savedHours;
  $('studyMinutes').value = clock.savedMinutes;
  $('studyHours').addEventListener('input',saveInput);
  $('studyMinutes').addEventListener('input',saveInput);
  $('studyClockStart').addEventListener('click',start);
  $('studyClockPause').addEventListener('click',pauseResume);
  $('studyClockFinish').addEventListener('click',() => { if (window.confirm(t('confirm'))) finish(false); });
  $('studyClockDismiss').addEventListener('click',() => $('studyClockCompleteDialog').close());
  $('studyClockMinimize').addEventListener('click', () => { isMinimized = !isMinimized; try { localStorage.setItem('ktf-study-clock-window-minimized', String(isMinimized)); } catch (_) {} render(); });
  document.addEventListener('ktf:languagechange',render);
  document.addEventListener('visibilitychange',() => { if (!document.hidden) tick(); });
  document.addEventListener('pointerdown', () => { if (clock.status !== 'idle') unlockBellAudio(); }, {passive:true});
  window.addEventListener('pageshow',tick);
  setInterval(tick, 500);
  render();
  if (clock.status === 'running' && remaining() <= 0) setTimeout(() => finish(true), 0);
})();
