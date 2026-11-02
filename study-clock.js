"use strict";
(() => {
  const KEY = 'ktf-global-study-clock-v1';
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
      replay: '♪ Play Japanese message', close: 'Done →',
      confirm: 'Finish this study session early and see your progress?',
      announcement: 'Study time remaining', notSupported: 'Audio could not play automatically. You can try the Japanese message button.'
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
      replay: '♪ Escuchar mensaje en japonés', close: 'Listo →',
      confirm: '¿Querés terminar antes esta sesión y ver tu progreso?',
      announcement: 'Tiempo restante de estudio', notSupported: 'No se pudo reproducir el audio automáticamente. Probá con el botón del mensaje japonés.'
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
    $('studyClockReplaySpeech').textContent = t('replay');
    $('studyClockDismiss').textContent = t('close');
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
    const progress = active ? Math.max(0, Math.min(100, 100 * remaining() / clock.durationMs)) : 0;
    $('studyClockBar').style.width = progress + '%';
    $('studyClockProgress').setAttribute('aria-valuenow', Math.round(progress));
  }
  const safeText = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function sayJapanese() {
    if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) return;
    try {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance('お疲れさまでした。今日もよく頑張りました。');
      utterance.lang = 'ja-JP';
      utterance.rate = .88;
      const japaneseVoice = speechSynthesis.getVoices().find(voice => voice.lang.toLowerCase().startsWith('ja'));
      if (japaneseVoice) utterance.voice = japaneseVoice;
      speechSynthesis.speak(utterance);
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
    if (finishedNaturally) sayJapanese();
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
      clock.deadlineAt = Date.now() + clock.remainingMs;
      clock.status = 'running';
    }
    persist();
    render();
  }
  function onQuizStart() {
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
    if (!track()) return;
    clock.stats.finished++;
    persist();
  }
  window.KTFStudyClock = {onQuizStart,onGuided,onAnswer,onQuizFinish};
  $('studyHours').value = clock.savedHours;
  $('studyMinutes').value = clock.savedMinutes;
  $('studyHours').addEventListener('input',saveInput);
  $('studyMinutes').addEventListener('input',saveInput);
  $('studyClockStart').addEventListener('click',start);
  $('studyClockPause').addEventListener('click',pauseResume);
  $('studyClockFinish').addEventListener('click',() => { if (window.confirm(t('confirm'))) finish(false); });
  $('studyClockDismiss').addEventListener('click',() => $('studyClockCompleteDialog').close());
  $('studyClockReplaySpeech').addEventListener('click',sayJapanese);
  document.addEventListener('ktf:languagechange',render);
  document.addEventListener('visibilitychange',() => { if (!document.hidden) tick(); });
  window.addEventListener('pageshow',tick);
  setInterval(tick, 500);
  render();
  if (clock.status === 'running' && remaining() <= 0) setTimeout(() => finish(true), 0);
})();
