"use strict";
(() => {
  const KEY = 'ktf-global-study-clock-v1';
  const POSITION_KEY = 'ktf-floating-clock-position-v1';
  const $ = id => document.getElementById(id);
  const MAX_MS = (99 * 60 + 59) * 60000;
  const dictionary = {
    en: {
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
      close: 'Done →',
      confirm: 'Finish this study session early and see your progress?',
      announcement: 'Study time remaining', minimize: 'Minimize study clock', expand: 'Expand study clock', dock: 'Keep clock in the lesson', float: 'Float study clock', drag: 'Drag to move the clock. Use arrow keys to adjust its position.'
    },
    es: {
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
      close: 'Listo →',
      confirm: '¿Querés terminar antes esta sesión y ver tu progreso?',
      announcement: 'Tiempo restante de estudio', minimize: 'Minimizar reloj de estudio', expand: 'Expandir reloj de estudio', dock: 'Dejar el reloj dentro de la lección', float: 'Hacer flotar el reloj', drag: 'Arrastrá para mover el reloj. Usá las flechas para ajustar su posición.'
    }
  };
  const lang = () => document.documentElement.lang === 'es' ? 'es' : 'en';
  const t = key => dictionary[lang()][key];
  const defaultStats = () => ({ answers: 0, correct: 0, words: 0, characters: 0,
    guided: 0, started: 0, finished: 0, byScript: {hiragana:0,katakana:0,kanji:0},
    uniqueIds: [], errors: {} });
  const blank = () => ({ status: 'idle', savedHours:'', savedMinutes:'', durationMs:0,
    startedAt:null, deadlineAt:null, remainingMs:0, stats: defaultStats() });
  let clock = blank();
  const clockElement = $('globalStudyClock');
  const homeMarker = document.createComment('study clock position');
  clockElement.before(homeMarker);
  const lesson = $('quizScreen');
  let lessonOpen = false;
  let isDocked = false;
  let isMinimized = false;
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
    const lessonActive = lessonOpen && clock.status !== 'idle';
    const floating = lessonActive && !isDocked;
    const docked = lessonActive && isDocked;
    if (docked) {
      if (clockElement.parentNode !== lesson || lesson.firstChild !== clockElement) lesson.prepend(clockElement);
    } else if (clockElement.previousSibling !== homeMarker) homeMarker.after(clockElement);
    clockElement.classList.toggle('is-floating', floating);
    clockElement.classList.toggle('is-docked', docked);
    clockElement.classList.toggle('is-minimized', floating && isMinimized);
    clockElement.classList.toggle('is-active', clock.status !== 'idle');
    $('studyClockMinimize').hidden = !floating;
    $('studyClockDock').hidden = !floating;
    $('studyClockFloat').hidden = !docked;
    titlebar.tabIndex = floating ? 0 : -1;
    titlebar.title = floating ? t('drag') : '';
    applyFloatingPosition();
  }
  function viewChanged(open) {
    lessonOpen = open;
    if (open) {
      isDocked = false;
      isMinimized = matchMedia('(max-width: 680px)').matches;
    }
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
        clock = { ...clock, ...saved, stats: {...defaultStats(), ...(saved.stats || {})} };
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
    $('studyClockDock').setAttribute('aria-label',t('dock'));
    $('studyClockDock').title = t('dock');
    $('studyClockFloat').setAttribute('aria-label',t('float'));
    $('studyClockFloat').title = t('float');
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
    $('studyClockSummary').innerHTML =
      summaryCard(format(elapsedMs),t('time'))+
      summaryCard(stats.answers,t('answers'))+
      summaryCard(stats.answers ? Math.round(stats.correct / stats.answers * 100)+'%' : '—',t('accurate'))+
      summaryCard(stats.words,t('words'))+
      summaryCard(stats.characters,t('kana'))+
      summaryCard(stats.guided,t('guided'))+
      summaryCard(stats.finished,t('lessons'))+
      summaryCard(unique,t('unique'))+
      `<div class="study-clock-summary-note"><strong>${safeText(t('mistakes'))}:</strong> ${safeText(mistakes)}</div>`;
    const dialog = $('studyClockCompleteDialog');
    if (!dialog.open) dialog.showModal();
    if (finishedNaturally) playSoftBell();
  }
  function finish(natural=false) {
    if (clock.status === 'idle') return;
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
    persist();
    render();
  }
  function pauseResume() {
    if (clock.status === 'running') {
      clock.remainingMs = remaining();
      clock.deadlineAt = null;
      clock.status = 'paused';
    } else if (clock.status === 'paused') {
      unlockBellAudio();
      clock.deadlineAt = Date.now() + clock.remainingMs;
      clock.status = 'running';
    }
    persist();
    render();
  }
  function onQuizStart() {
    viewChanged(true);
    if (!track()) return;
    clock.stats.started++;
    persist();
  }
  function onGuided(item) {
    if (!track()) return;
    clock.stats.guided++;
    addUnique(item);
    persist();
  }
  function addUnique(item) {
    if (item?.id && !clock.stats.uniqueIds.includes(item.id)) clock.stats.uniqueIds.push(item.id);
  }
  function onAnswer({item,kind,correct}) {
    if (!track()) return;
    const stats = clock.stats;
    stats.answers++;
    if (correct) stats.correct++;
    if (kind === 'words') stats.words++;
    else { stats.characters++; if (Object.hasOwn(stats.byScript,item.script)) stats.byScript[item.script]++; }
    addUnique(item);
    if (!correct) {
      const error = stats.errors[item.id] || {kana:item.kana,count:0};
      error.count++;
      stats.errors[item.id] = error;
    }
    persist();
  }
  function onQuizFinish() {
    viewChanged(false);
    if (!track()) return;
    clock.stats.finished++;
    persist();
  }
  window.KTFStudyClock = {onQuizStart,onGuided,onAnswer,onQuizFinish,onViewChange: viewChanged};
  $('studyHours').value = clock.savedHours;
  $('studyMinutes').value = clock.savedMinutes;
  $('studyHours').addEventListener('input',saveInput);
  $('studyMinutes').addEventListener('input',saveInput);
  $('studyClockStart').addEventListener('click',start);
  $('studyClockPause').addEventListener('click',pauseResume);
  $('studyClockFinish').addEventListener('click',() => { if (window.confirm(t('confirm'))) finish(false); });
  $('studyClockDismiss').addEventListener('click',() => $('studyClockCompleteDialog').close());
  $('studyClockMinimize').addEventListener('click', () => { isMinimized = !isMinimized; render(); });
  $('studyClockDock').addEventListener('click', () => { isDocked = true; isMinimized = false; render(); });
  $('studyClockFloat').addEventListener('click', () => { isDocked = false; isMinimized = false; render(); });
  document.addEventListener('ktf:languagechange',render);
  document.addEventListener('visibilitychange',() => { if (!document.hidden) tick(); });
  document.addEventListener('pointerdown', () => { if (clock.status !== 'idle') unlockBellAudio(); }, {passive:true});
  window.addEventListener('pageshow',tick);
  setInterval(tick, 500);
  render();
  if (clock.status === 'running' && remaining() <= 0) setTimeout(() => finish(true), 0);
})();
