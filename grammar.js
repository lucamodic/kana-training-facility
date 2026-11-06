"use strict";
(() => {
  const data=window.KTFGrammarData;
  if (!data) return;
  const $=id=>document.getElementById(id);
  const cloud=()=>window.KTFCloud;
  const lang=()=>document.documentElement.lang==='es'?'es':'en';
  const tr=(en,es)=>lang()==='es'?es:en;
  const html=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const txt=value=>String(value||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[¿?!¡.,;:。、！？]/g,'').replace(/\s+/g,' ').trim();
  const matchReading=(input,expected)=>window.KTFRomaji.matches(input,expected);
  const matchMeaning=(input,variants)=>variants.some(value=>txt(input)===txt(value));
  const lessons=data.lessons;
  const groups=data.groups;
  const byId=new Map(lessons.map(lesson=>[lesson.id,lesson]));
  const owner=()=>cloud()?.getStatus()?.owner||'guest';
  const key=()=>`ktf-grammar-lessons-v1:${owner()}`;
  const selectionDefault=['sentence'];
  let selected=new Set(selectionDefault);
  let currentOwner=null;
  let currentGroup='basics';
  let search='';
  let session=null;
  let lessonDialogId=null;
  let history=[];
  let revision=0;
  let lastTick=0;
  let timerId=null;
  let tabLoaded=false;
  const labels={
    en:{nav:'Grammar',back:'← Back to selection',all:'All',heading:'Learn how Japanese sentences work',subtitle:'Select lessons, learn the patterns, then write both romaji and meaning.',selected:'selected',selection:'YOUR SELECTION',lessonUnit:'lessons selected',emptySelection:'Choose one or more lessons to begin.',find:'Search lessons or grammar patterns…',selectAll:'Select visible',deselect:'Deselect visible',view:'Read lesson',examples:'examples',complete:'correct answers',lessonEyebrow:'✦ SHORT GRAMMAR LESSON',choose:'Select for practice',chosen:'Selected for practice',close:'Close',settings:'YOUR SESSION.INI',timer:'Session timer',noLimit:'No limit',minutes:'Minutes',guesses:'Guess limit',questions:'Questions',rapid:'Rapid Fire',seconds:'Seconds per question',hint:'Every question has two answers: romaji and meaning. Both must be correct.',learn:'Learn my selection →',learnHelp:'3 guided passes, followed by 3 memory passes.',infinite:'Infinite practice →',infiniteHelp:'New shuffled rounds until you finish.',onepass:'One Pass →',onepassHelp:'Each example appears once, then your results.',notReady:'Select at least one lesson.',modeLearn:'Guided learning',modeInfinite:'Infinite practice',modeOne:'One Pass',question:'Question',round:'Pass',readAndMean:'Read the sentence and write both answers',romaji:'1. Romaji reading',meaning:'2. Meaning',check:'Check both ↵',skip:"I don't know",next:'Next question →',guided:'GUIDED LEARNING',guidedNext:'Got it, next →',clock:'Pause',resume:'Resume',finish:'Finish lesson & view results',backQuiz:'← Finish lesson',answered:'Answered',correct:'Both correct',accuracy:'Accuracy',readingGood:'Reading correct',readingWrong:'Reading needs review',meaningGood:'Meaning correct',meaningWrong:'Meaning needs review',expectedReading:'Reading:',expectedMeaning:'Meaning:',explanation:'Why it works',accept:'My translation is valid',saved:'Your interpretation is counted as correct.',paused:'Paused',guidedTip:'Read both answers and the grammar explanation before continuing.',hintQuiz:'Two inputs, one sentence. Enter to check.',summaryEyebrow:'✦ GRAMMAR SESSION COMPLETE',summary:'Here’s how you did.',summarySub:'Both your reading and meaning are checked for each sentence.',review:'Sentences to review',flawless:'No errors this time. Great work!',backLessons:'Back to lessons',repeat:'Practice again →',sessionStopped:'Session finished',sessionDone:'Session completed',noAnswer:'Write both answers, or choose “I don’t know”.',timed:'Time is up!',rapidTimed:'Time is up for this question.',guestNotice:'Your practice results are saved locally and can sync when signed in.',confirmExit:'Finish the current grammar practice and view your results?',lessonCount:'lessons',sentenceCount:'sentences',partial:'Reading and meaning are scored separately; both must match for a full point.',score:'Both correct',onePassTimer:'One Pass uses one question per sentence; timer and guess limit are ignored.'},
    es:{nav:'Gramática',back:'← Volver a selección',all:'Todos',heading:'Aprendé cómo funcionan las oraciones',subtitle:'Elegí lecciones, aprendé las estructuras y escribí romaji y significado.',selected:'seleccionadas',selection:'TU SELECCIÓN',lessonUnit:'lecciones seleccionadas',emptySelection:'Elegí una o más lecciones para empezar.',find:'Buscar lecciones o estructuras…',selectAll:'Seleccionar visibles',deselect:'Deseleccionar visibles',view:'Leer lección',examples:'ejemplos',complete:'respuestas correctas',lessonEyebrow:'✦ LECCIÓN CORTA DE GRAMÁTICA',choose:'Seleccionar para practicar',chosen:'Seleccionada para practicar',close:'Cerrar',settings:'TU SESIÓN.INI',timer:'Temporizador',noLimit:'Sin límite',minutes:'Minutos',guesses:'Límite de intentos',questions:'Preguntas',rapid:'Rapid Fire',seconds:'Segundos por pregunta',hint:'Cada pregunta tiene dos respuestas: romaji y significado. Ambas deben estar bien.',learn:'Aprender mi selección →',learnHelp:'3 pasadas guiadas y 3 de memoria.',infinite:'Práctica infinita →',infiniteHelp:'Rondas mezcladas hasta que decidas terminar.',onepass:'Una pasada →',onepassHelp:'Cada ejemplo aparece una vez y después ves los resultados.',notReady:'Seleccioná al menos una lección.',modeLearn:'Aprendizaje guiado',modeInfinite:'Práctica infinita',modeOne:'Una pasada',question:'Pregunta',round:'Pasada',readAndMean:'Leé la oración y escribí las dos respuestas',romaji:'1. Lectura en romaji',meaning:'2. Significado',check:'Comprobar las dos ↵',skip:'No sé',next:'Siguiente pregunta →',guided:'APRENDIZAJE GUIADO',guidedNext:'Entendido, siguiente →',clock:'Pausar',resume:'Reanudar',finish:'Terminar práctica y ver resultados',backQuiz:'← Terminar práctica',answered:'Respondidas',correct:'Ambas correctas',accuracy:'Precisión',readingGood:'Lectura correcta',readingWrong:'Revisá la lectura',meaningGood:'Significado correcto',meaningWrong:'Revisá el significado',expectedReading:'Lectura:',expectedMeaning:'Significado:',explanation:'Por qué funciona',accept:'Mi traducción es válida',saved:'Tu interpretación se cuenta como correcta.',paused:'En pausa',guidedTip:'Leé ambas respuestas y la explicación gramatical antes de seguir.',hintQuiz:'Dos respuestas para una oración. Enter para comprobar.',summaryEyebrow:'✦ PRÁCTICA DE GRAMÁTICA TERMINADA',summary:'Así te fue.',summarySub:'Para acertar la oración debías escribir bien tanto la lectura como el significado.',review:'Oraciones para repasar',flawless:'¡Esta vez no tuviste errores!',backLessons:'Volver a lecciones',repeat:'Repetir práctica →',sessionStopped:'Práctica terminada',sessionDone:'Sesión completada',noAnswer:'Escribí las dos respuestas o elegí «No sé».',timed:'¡Se terminó el tiempo!',rapidTimed:'Se agotó el tiempo de esta pregunta.',guestNotice:'Tus resultados se guardan localmente y pueden sincronizarse con tu cuenta.',confirmExit:'¿Terminás esta práctica y querés ver tus resultados?',lessonCount:'lecciones',sentenceCount:'oraciones',partial:'La lectura y el significado se evalúan por separado; necesitás ambas respuestas correctas para acertar.',score:'Ambas correctas',onePassTimer:'Una pasada muestra cada oración una sola vez; ignora temporizador y límite de intentos.'}
  };
  const t=key=>labels[lang()][key]||labels.en[key]||key;
  const local=localized=>typeof localized==='object'?localized[lang()]||localized.en:localized;
  const getVisible=()=>lessons.filter(l=>(currentGroup==='all'||l.group===currentGroup)&&[l.title.en,l.title.es,l.description.en,l.description.es,l.concept.en,l.concept.es].some(s=>txt(s).includes(txt(search))));
  const getSelected=()=>lessons.filter(l=>selected.has(l.id));
  const samples=()=>getSelected().flatMap(l=>l.examples);
  const shuffle=arr=>{const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  const fmt=ms=>{let sec=Math.max(0,Math.floor(ms/1000));const hour=Math.floor(sec/3600);sec-=hour*3600;const min=Math.floor(sec/60);return hour?`${String(hour).padStart(2,'0')}:${String(min).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`:`${String(min).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`;};
  const saveSelection=()=>{try{localStorage.setItem(key(),JSON.stringify([...selected]));}catch(_){}};
  const loadSelection=()=>{
    const now=owner();
    if(currentOwner===now)return;
    currentOwner=now;
    try {const raw=localStorage.getItem(key());selected=new Set(Array.isArray(JSON.parse(raw))?JSON.parse(raw).filter(id=>byId.has(id)):selectionDefault);}catch(_){selected=new Set(selectionDefault);}
  };
  const toggle=id=>{if(selected.has(id))selected.delete(id);else selected.add(id);saveSelection();renderBrowse();};
  function renderBrowse(){
    loadSelection();
    const v=getVisible();
    const count=getSelected().length;
    $('grammarLessons').innerHTML=v.length?v.map(l=>{
      const hits=history.flatMap(h=>h.questions||[]).filter(q=>q.lessonId===l.id);
      const mastered=new Set(hits.filter(q=>q.correct).map(q=>q.id)).size;
      return `<article class="grammar-lesson-card ${selected.has(l.id)?'is-selected':''}"><button type="button" class="grammar-lesson-choice" data-lesson-select="${l.id}" aria-pressed="${selected.has(l.id)}"><span class="grammar-lesson-pick">${selected.has(l.id)?'✓':'+'}</span><strong>${html(local(l.title))}</strong><small>${html(local(l.description))}</small><span class="grammar-lesson-progress">${mastered}/${l.examples.length} ${html(t('complete'))}</span></button><button type="button" class="mini-button grammar-lesson-read" data-lesson-open="${l.id}">${html(t('view'))}</button></article>`;
    }).join(''):`<p class="subtle">${html(tr('No lessons match this search.','No hay lecciones con esa búsqueda.'))}</p>`;
    $('grammarSelectedBadge').textContent=`${count} ${t('selected')}`;
    $('grammarSelectedCount').textContent=String(count);
    for(const id of ['grammarLearn','grammarInfinite','grammarOnePass']) $(id).disabled=!count;
    $('grammarCourseCount').textContent=`${lessons.length} ${t('lessonCount')} · ${lessons.reduce((n,l)=>n+l.examples.length,0)} ${t('sentenceCount')}`;
    $('grammarTabs').querySelectorAll('[data-grammar-tab]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.grammarTab===currentGroup)));
  }
  function labelsUpdate(){
    $('grammarNavLabel').textContent=t('nav');
    $('grammarBack').textContent=t('back');
    $('grammarHeading').textContent=t('heading');$('grammarSubtitle').textContent=t('subtitle');
    $('grammarSearch').placeholder=t('find');$('grammarSelectVisible').textContent=t('selectAll');$('grammarClearVisible').textContent=t('deselect');
    $('grammarSelectionTitle').textContent=t('selection');$('grammarSelectedUnit').textContent=t('lessonUnit');$('grammarSelectedHint').textContent=t('emptySelection');
    $('grammarHoursLabel').textContent=tr('Hours','Horas');$('grammarSettingsTitle').textContent=t('settings');$('grammarTimerLabel').textContent=t('timer');$('grammarMinutesLabel').textContent=t('minutes');$('grammarGuessLabel').textContent=t('questions');$('grammarRapidLabel').textContent=t('rapid');$('grammarSecondsLabel').textContent=t('seconds');$('grammarSessionHint').textContent=t('hint');
    $('grammarLearn').textContent=t('learn');$('grammarInfinite').textContent=t('infinite');$('grammarOnePass').textContent=t('onepass');
    $('grammarLearnHelp').textContent=t('learnHelp');$('grammarInfiniteHelp').textContent=t('infiniteHelp');$('grammarOnePassHelp').textContent=t('onepassHelp');
    const options=$('grammarTimerMode').options;
    options[0].textContent=t('noLimit');options[1].textContent=t('timer');options[2].textContent=t('guesses');
    groups.forEach(g=>{$('grammarTabs').querySelector(`[data-grammar-tab="${g.id}"]`).textContent=g[lang()];});
    $('grammarTabs').querySelector('[data-grammar-tab="all"]').textContent=t('all');
    $('grammarLessonEyebrow').textContent=t('lessonEyebrow');$('grammarLessonAdd').textContent=t('choose');$('grammarLessonClose').setAttribute('aria-label',t('close'));
    $('grammarExit').textContent=t('backQuiz');$('grammarQuestionHeader').textContent=t('readAndMean');$('grammarRomajiLabel').textContent=t('romaji');$('grammarMeaningLabel').textContent=t('meaning');$('grammarCheck').textContent=t('check');$('grammarSkip').textContent=t('skip');$('grammarNext').textContent=t('next');$('grammarAcceptMeaning').textContent=t('accept');$('grammarGuidedTitle').textContent=t('guided');$('grammarGuidedNext').textContent=t('guidedNext');$('grammarFinish').textContent=t('finish');$('grammarQuizHint').textContent=t('hintQuiz');
    $('grammarAnsweredLabel').textContent=t('answered');$('grammarCorrectLabel').textContent=t('correct');$('grammarAccuracyLabel').textContent=t('accuracy');
    $('grammarSummaryEyebrow').textContent=t('summaryEyebrow');$('grammarSummaryTitle').textContent=t('summary');$('grammarSummarySubtitle').textContent=t('summarySub');$('grammarErrorsTitle').textContent=t('review');$('grammarSummaryAnsweredLabel').textContent=t('answered');$('grammarSummaryCorrectLabel').textContent=t('correct');$('grammarSummaryAccuracyLabel').textContent=t('accuracy');$('grammarSummaryBack').textContent=t('backLessons');$('grammarRepeat').textContent=t('repeat');
    if(!session)renderBrowse();
  }
  function openLesson(id){
    const l=byId.get(id);if(!l)return;
    lessonDialogId=id;
    $('grammarLessonTitle').textContent=local(l.title);
    $('grammarLessonConcept').textContent=local(l.concept);
    $('grammarLessonDescription').textContent=local(l.description);
    $('grammarLessonExamples').innerHTML=l.examples.map(e=>`<article><strong lang="ja">${html(e.japanese)}</strong><details><summary>${html(tr('Show reading and meaning','Mostrar lectura y significado'))}</summary><p>${html(e.reading)}</p><p>${html(e.meanings[lang()][0])}</p><small>${html(local(e.breakdown))}</small></details></article>`).join('');
    $('grammarLessonAdd').textContent=selected.has(id)?t('chosen'):t('choose');
    $('grammarLessonDialog').showModal();
  }
  function closeLesson(){if($('grammarLessonDialog').open)$('grammarLessonDialog').close();}
  function open(){
    window.KTFNavigation?.remember();
    if((window.KTFNavigation?.active() ?? window.KTFBridge?.isQuizActive?.()) || !$('examScreen').hidden) {window.alert(tr('Finish your current practice first.','Terminá la práctica actual antes de entrar.'));return;}
    loadSelection();

    $('grammarScreen').hidden=true;$('grammarBrowse').hidden=false;$('grammarPractice').hidden=true; $('grammarSummary').hidden=true;$('grammarTop').hidden=true;
    stopTimer();session=null;labelsUpdate();renderBrowse();refreshHistory();window.KTFNavigation?.openGrammar();
  }
  function close(){
    window.KTFNavigation?.remember();
    stopTimer();closeLesson();session=null;
    $('grammarScreen').hidden=true;$('grammarBrowse').hidden=false;$('grammarPractice').hidden=true;$('grammarSummary').hidden=true;
    $('setupScreen').hidden=false;window.KTFNavigation?.reveal('setupScreen',{restore:true,selection:'kana'});
  }
  function refreshHistory(){
    const rv=++revision;
    cloud()?.getAttempts?.().then(rows=>{if(rv!==revision)return;history=rows.filter(a=>a.examId==='grammar-practice');if(openPanel() && !session)renderBrowse();}).catch(()=>{});
  }
  function opts(mode){
    const timerMode=mode==='onepass'?'off':$('grammarTimerMode').value;
    const hours=Number($('grammarTimerHours').value);
    const minutePart=Number($('grammarTimerMinutes').value);
    const minutes=hours*60+minutePart;
    const guesses=Number($('grammarGuessLimit').value);
    const rapid=Boolean($('grammarRapidEnabled').checked);
    const seconds=Number($('grammarRapidSeconds').value);
    if(timerMode==='timer'&&(!Number.isInteger(hours)||hours<0||hours>99||!Number.isInteger(minutePart)||minutePart<0||minutePart>59||minutes<1)){window.alert(tr('Choose between 00:01 and 99:59.','Elegí entre 00:01 y 99:59.'));return null;}
    if(timerMode==='guesses'&&(!Number.isInteger(guesses)||guesses<1||guesses>10000)){window.alert(tr('Choose between 1 and 10000 questions.','Elegí entre 1 y 10000 preguntas.'));return null;}
    if(rapid&&(!Number.isInteger(seconds)||seconds<1||seconds>300)){window.alert(tr('Choose between 1 and 300 seconds.','Elegí entre 1 y 300 segundos.'));return null;}
    return {timerMode,minutes,guesses,rapid,seconds};
  }
  function stopTimer(){clearInterval(timerId);timerId=null;}
  function start(mode,overridePool=null){
    loadSelection();const pool=overridePool||samples();if(!pool.length){window.alert(t('notReady'));return;}
    const settings=opts(mode);if(!settings)return;
    window.KTFNavigation?.remember();
    stopTimer();
    session={mode,pool,settings,round:0,index:0,queue:shuffle(pool),current:null,answered:0,correct:0,results:[],phase:'question',paused:false,done:false,elapsedMs:0,rapidRemaining:settings.seconds*1000,lastItem:null};
    window.KTFStudyClock?.onQuizStart({source:'grammar',kind:'grammar',mode});
    lastTick=Date.now();
    $('grammarBrowse').hidden=true;$('grammarSummary').hidden=true;$('grammarPractice').hidden=false;$('grammarTop').hidden=true;
    timerId=setInterval(tick,200);
    updateQuestion();window.KTFNavigation?.reveal('grammarPractice');
    (isGuided()?$('grammarGuidedNext'):$('grammarRomaji')).focus({preventScroll:true});
  }
  function isGuided(){return session?.mode==='learn'&&session.round<3;}
  function sessionName(){return t(session.mode==='learn'?'modeLearn':session.mode==='infinite'?'modeInfinite':'modeOne');}
  function roundName(){return session.mode==='learn'?`${t('round')} ${session.round+1}/6`:session.mode==='onepass'?`${t('question')} ${session.index+1}/${session.queue.length}`:`${t('question')} ${session.answered+1}`;}
  function updateStats(){
    if(!session)return;
    $('grammarAnswered').textContent=String(session.answered);
    $('grammarCorrect').textContent=String(session.correct);
    $('grammarAccuracy').textContent=session.answered?`${Math.round(session.correct/session.answered*100)}%`:'—';
    const sessionClock=session.settings.timerMode==='timer'?fmt(Math.max(0,session.settings.minutes*60000-session.elapsedMs)):fmt(session.elapsedMs);
    $('grammarClock').textContent=sessionClock;
    $('grammarClock').hidden=!showClock&&session.settings.timerMode!=='timer';
    $('grammarClockToggle').hidden=session.settings.timerMode==='timer';
    $('grammarClockToggle').textContent=showClock?tr('Hide clock','Ocultar reloj'):tr('Show clock','Mostrar reloj');
    $('grammarClockToggle').setAttribute('aria-pressed',String(showClock));
    $('grammarGuessProgress').hidden=session.settings.timerMode!=='guesses';
    $('grammarGuessProgress').textContent=`${session.answered} / ${session.settings.guesses} ${t('questions')}`;
    const total=session.mode==='learn'?session.pool.length*6:session.mode==='onepass'?session.pool.length:0;
    const done=session.round*session.pool.length+session.index+(session.phase==='feedback'?1:0);
    window.KTFStudyUI?.progress('grammarLearningProgress',done,total,roundName());
    $('grammarSkillStats').textContent=skillStats(session.results);
    $('grammarPause').textContent=session.paused?t('resume'):t('clock');
    $('grammarPause').setAttribute('aria-pressed',String(session.paused));
    const rapidVisible=session.settings.rapid && !isGuided() && ['question','feedback'].includes(session.phase);
    $('grammarRapidIndicator').hidden=!rapidVisible;
    if(rapidVisible){
      const remaining=Math.max(0,session.rapidRemaining);
      const percent=Math.round(remaining/(session.settings.seconds*1000)*100);
      $('grammarRapidIndicatorTitle').textContent=tr('Time left for this answer','Tiempo restante para responder');
      $('grammarRapidRemaining').textContent=`${Math.ceil(remaining/1000)}s`;
      $('grammarRapidBar').style.width=`${percent}%`;
      $('grammarRapidProgress').setAttribute('aria-valuenow',String(percent));
      $('grammarRapidIndicator').classList.toggle('is-urgent',session.phase==='question'&&remaining<=Math.min(5000,session.settings.seconds*300));
      $('grammarRapidIndicator').classList.toggle('is-expired',session.timedOutCurrent===true);
      $('grammarRapidStatus').textContent=session.timedOutCurrent?t('rapidTimed'):(session.phase==='feedback'?tr('Time stopped. Press Next when ready.','Tiempo detenido. Tocá Siguiente cuando quieras continuar.'):'');
    }
  }
  function updateQuestion(){
    if(!session||session.done)return;
    session.current=session.queue[session.index];
    session.phase=isGuided()?'guided':'question';
    session.rapidRemaining=session.settings.seconds*1000;
    session.timedOutCurrent=false;
    const ex=session.current;
    $('grammarSessionType').textContent=sessionName();$('grammarQuestionCounter').textContent=roundName();$('grammarLessonTag').textContent=local(byId.get(ex.lessonId).title);
    $('grammarJapanese').textContent=ex.japanese;
    $('grammarGuided').hidden=!isGuided();$('grammarAnswerArea').hidden=isGuided();
    $('grammarRomaji').value='';$('grammarMeaning').value='';for(const id of ['grammarRomaji','grammarMeaning','grammarCheck','grammarSkip','grammarGuidedNext','grammarNext','grammarAcceptMeaning']) $(id).disabled=false;$('grammarFeedback').hidden=true;$('grammarFollowUp').hidden=true;$('grammarAnswerForm').hidden=false;$('grammarAcceptMeaning').hidden=true;
    if(isGuided()){
      window.KTFStudyClock?.onGuided({id:ex.id,kana:ex.japanese},'grammar');
      $('grammarGuidedReading').textContent=`${t('expectedReading')} ${ex.reading}`;
      $('grammarGuidedMeaning').textContent=`${t('expectedMeaning')} ${ex.meanings[lang()][0]}`;
      $('grammarGuidedTip')?.remove();
      const tip=document.createElement('p');tip.id='grammarGuidedTip';tip.className='guided-tip';tip.textContent=local(ex.breakdown);$('grammarGuidedNext').before(tip);
      $('grammarGuidedNext').focus({preventScroll:true});
    }else{$('grammarRomaji').focus({preventScroll:true});}
    updateStats();
  }
  function tick(){
    if(!session||session.done)return;
    const now=Date.now();const delta=Math.max(0,now-lastTick);lastTick=now;
    if(session.paused)return;
    session.elapsedMs+=delta;
    if(session.settings.timerMode==='timer'&&session.elapsedMs>=session.settings.minutes*60000){finish(t('timed'));return;}
    if(session.settings.rapid&&session.phase==='question'){
      session.rapidRemaining=Math.max(0,session.rapidRemaining-delta);
      if(session.rapidRemaining<=0)grade(true,true);
    }
    updateStats();
  }
  function grade(skip=false,timedOut=false){
    if(!session||session.phase!=='question'||session.paused)return;
    const ex=session.current;
    const reading=$('grammarRomaji').value.trim();const meaning=$('grammarMeaning').value.trim();
    if(!skip&&(!reading||!meaning)){
      if(!reading)$('grammarRomaji').focus();else $('grammarMeaning').focus();
      $('grammarQuizHint').textContent=t('noAnswer');return;
    }
    const readCorrect=!skip&&matchReading(reading,ex.reading);
    const meaningCorrect=!skip&&matchMeaning(meaning,ex.meanings[lang()]);
    const attempt={id:ex.id,lessonId:ex.lessonId,japanese:ex.japanese,reading,meaning,readingCorrect:readCorrect,meaningCorrect,correct:readCorrect&&meaningCorrect,expectedReading:ex.reading,expectedMeaning:ex.meanings[lang()][0]};
    session.results.push(attempt);session.answered++;if(attempt.correct)session.correct++;
    session.phase='feedback';
    session.timedOutCurrent=timedOut;
    $('grammarAnswerForm').hidden=true;$('grammarFollowUp').hidden=false;
    const rows=[`<div class="${readCorrect?'is-correct':'is-incorrect'}"><strong>${readCorrect?'✓':'✕'} ${t(readCorrect?'readingGood':'readingWrong')}</strong>${!readCorrect?`<span>${html(t('expectedReading'))} ${html(ex.reading)}</span>`:''}</div>`,`<div class="${meaningCorrect?'is-correct':'is-incorrect'}"><strong>${meaningCorrect?'✓':'✕'} ${t(meaningCorrect?'meaningGood':'meaningWrong')}</strong>${!meaningCorrect?`<span>${html(t('expectedMeaning'))} ${html(ex.meanings[lang()][0])}</span>`:''}</div>`,`<div class="grammar-explain"><strong>${html(t('explanation'))}</strong><span>${html(local(ex.breakdown))}</span></div>`];
    $('grammarFeedback').innerHTML=(timedOut?`<div class="is-incorrect"><strong>${html(t('rapidTimed'))}</strong></div>`:'')+rows.join('');$('grammarFeedback').hidden=false;
    $('grammarAcceptMeaning').hidden=meaningCorrect||!meaning;
    $('grammarNext').textContent=t('next');$('grammarNext').focus({preventScroll:true});
    updateStats();
  }
  function acceptMeaning(){
    if(!session||session.done||session.paused||session.phase!=='feedback')return;
    const last=session.results.at(-1);if(!last||last.meaningCorrect)return;
    last.meaningCorrect=true;
    last.correct=last.readingCorrect;
    if(last.correct)session.correct++;
    $('grammarAcceptMeaning').hidden=true;
    const answerRow=$('grammarFeedback').querySelectorAll(':scope > div')[session.timedOutCurrent?2:1];
    answerRow.innerHTML=`<strong>✓ ${html(t('saved'))}</strong>`;
    answerRow.className='is-correct';
    updateStats();
  }
  function recordStudyAnswer(){
    const attempt=session?.results?.at(-1);
    if(!attempt||attempt.studyClockRecorded)return;
    attempt.studyClockRecorded=true;
    window.KTFStudyClock?.onAnswer({source:'grammar',kind:'grammar',item:{id:attempt.id,kana:attempt.japanese},correct:attempt.correct,readingCorrect:attempt.readingCorrect,meaningCorrect:attempt.meaningCorrect});
  }
  function advance(){
    if(!session||session.done||session.paused)return;
    if(session.phase!=='feedback'&&session.phase!=='guided')return;
    if(session.phase==='feedback')recordStudyAnswer();
    session.index++;
    if(session.settings.timerMode==='guesses'&&session.answered>=session.settings.guesses){finish();return;}
    if(session.index>=session.queue.length){
      if(session.mode==='onepass'){finish();return;}
      if(session.mode==='learn'){
        session.round++;
        if(session.round>=6){finish();return;}
      }
      session.queue=shuffle(session.pool);session.index=0;
    }
    updateQuestion();
  }
  function endRequest(){
    if(!session)return;
    if(session.answered||isGuided()){finish();return;}
    finish();
  }
  function finish(reason=''){
    if(!session||session.done)return;
    window.KTFNavigation?.remember();
    if(session.phase==='feedback')recordStudyAnswer();
    window.KTFStudyClock?.onQuizFinish({source:'grammar',kind:'grammar',mode:session.mode});
    stopTimer();session.done=true;session.paused=false;
    $('grammarPractice').hidden=true;$('grammarBrowse').hidden=true;$('grammarSummary').hidden=false;$('grammarTop').hidden=true;
    const attempts=session.results;
    const completed=(session.mode==='onepass'&&session.answered===session.pool.length)||(session.mode==='learn'&&session.round>=6);
    $('grammarSummaryTitle').textContent=reason||t(completed?'sessionDone':'sessionStopped');
    $('grammarSummaryAnswered').textContent=String(session.answered);$('grammarSummaryCorrect').textContent=String(session.correct);$('grammarSummaryAccuracy').textContent=session.answered?`${Math.round(session.correct/session.answered*100)}%`:'—';
    const wrong=[...new Map(attempts.filter(a=>!a.correct).map(a=>[a.id,a])).values()];
    $('grammarSummarySkills').textContent=skillStats(attempts);
    $('grammarSummaryProgress').textContent=`${sessionName()} · ${fmt(session.elapsedMs)} · ${t('answered')}: ${session.answered}${session.mode==='onepass'?'/'+session.pool.length:''}${session.mode==='learn'?' · '+t('round')+' '+Math.min(6,session.round+1)+'/6':''}`;
    $('grammarReview').hidden=!wrong.length;
    $('grammarReview').textContent=tr('Practice my mistakes →','Practicar mis errores →');
    $('grammarErrors').innerHTML=wrong.length?`<ol class="hardest-list">${wrong.map(a=>`<li class="hardest-item"><span class="hardest-glyph" lang="ja">${html(a.japanese)}</span><div class="hardest-info"><strong>${html(local(byId.get(a.lessonId).title))}</strong><span>${html(a.expectedReading)}</span><span>${html(a.expectedMeaning)}</span></div><span class="hardest-count">${Number(a.readingCorrect)+Number(a.meaningCorrect)}/2</span></li>`).join('')}</ol>`:`<p class="summary-empty">${html(attempts.length?t('flawless'):tr('No answers yet.','Todavía no hay respuestas.'))}</p>`;
    if(attempts.length){
      const record={examId:'grammar-practice',kind:'grammar',questions:attempts,lessons:[...selected],correct:session.correct,total:session.answered,percent:Math.round(session.correct/session.answered*100),passed:session.correct/session.answered>=.9,startedAt:new Date(Date.now()-session.elapsedMs).toISOString(),completedAt:new Date().toISOString(),mode:session.mode};
      cloud()?.addAttempt?.(record).then(()=>refreshHistory()).catch(()=>{});
    }
    window.KTFNavigation?.reveal('grammarSummary');
  }
  function backToLessons(){window.KTFNavigation?.remember();stopTimer();session=null;$('grammarBrowse').hidden=false;$('grammarSummary').hidden=true;$('grammarPractice').hidden=true;$('grammarTop').hidden=true;renderBrowse();window.KTFNavigation?.openGrammar();}
  const openPanel=()=>!$('grammarScreen').hidden || (!$('setupScreen').hidden&&!$('grammarBrowse').hidden);
  let showClock=true;
  const optionIds=['grammarTimerMode','grammarTimerHours','grammarTimerMinutes','grammarGuessLimit','grammarRapidEnabled','grammarRapidSeconds'];
  function saveOptions(){try{localStorage.setItem('ktf-grammar-settings-v1',JSON.stringify({showClock,...Object.fromEntries(optionIds.map(id=>[id,$(id).type==='checkbox'?$(id).checked:$(id).value]))}));}catch(_){}}
  function skillStats(rows){const pct=field=>rows.length?Math.round(rows.filter(row=>row[field]).length/rows.length*100)+'%':'—';return `${tr('Reading','Lectura')}: ${pct('readingCorrect')} · ${tr('Meaning','Significado')}: ${pct('meaningCorrect')}`;}
  function init(){
    try{const saved=JSON.parse(localStorage.getItem('ktf-grammar-settings-v1')||'{}');showClock=saved.showClock!==false;for(const id of optionIds)if(saved[id]!==undefined){if($(id).type==='checkbox')$(id).checked=saved[id]===true;else $(id).value=saved[id];}}catch(_){}
    for(const id of optionIds)$(id).addEventListener('change',saveOptions);
    $('grammarTimerInputs').hidden=$('grammarTimerMode').value!=='timer';$('grammarGuessInputs').hidden=$('grammarTimerMode').value!=='guesses';$('grammarRapidInputs').hidden=!$('grammarRapidEnabled').checked;
    $('grammarClockToggle').addEventListener('click',()=>{showClock=!showClock;saveOptions();updateStats();});
    $('grammarReview').addEventListener('click',()=>{const ids=new Set(session.results.filter(row=>!row.correct).map(row=>row.id));const pool=session.pool.filter(row=>ids.has(row.id));window.KTFStudyUI.review(pool.map(item=>({item,label:item.japanese+' · '+item.reading})),chosen=>start('onepass',chosen.map(row=>row.item)));});
    $('openGrammarButton').addEventListener('click',open);
    $('grammarBack').addEventListener('click',close);
    $('grammarTabs').addEventListener('click',e=>{const tab=e.target.closest('[data-grammar-tab]');if(!tab)return;currentGroup=tab.dataset.grammarTab;renderBrowse();});
    $('grammarTabs').addEventListener('keydown',e=>{if(!['ArrowRight','ArrowLeft'].includes(e.key))return;e.preventDefault();const tabs=[...$('grammarTabs').querySelectorAll('[data-grammar-tab]')];const idx=tabs.indexOf(e.target);if(idx<0)return;tabs[(idx+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length].focus();tabs[(idx+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length].click();});
    $('grammarSearch').addEventListener('input',e=>{search=e.target.value;renderBrowse();});
    $('grammarLessons').addEventListener('click',e=>{const choice=e.target.closest('[data-lesson-select]');const read=e.target.closest('[data-lesson-open]');if(choice)toggle(choice.dataset.lessonSelect);else if(read)openLesson(read.dataset.lessonOpen);});
    $('grammarSelectVisible').addEventListener('click',()=>{getVisible().forEach(l=>selected.add(l.id));saveSelection();renderBrowse();});
    $('grammarClearVisible').addEventListener('click',()=>{getVisible().forEach(l=>selected.delete(l.id));saveSelection();renderBrowse();});
    $('grammarLessonClose').addEventListener('click',closeLesson);
    $('grammarLessonAdd').addEventListener('click',()=>{if(lessonDialogId)selected.add(lessonDialogId);saveSelection();closeLesson();renderBrowse();});
    $('grammarTimerMode').addEventListener('change',()=>{$('grammarTimerInputs').hidden=$('grammarTimerMode').value!=='timer';$('grammarGuessInputs').hidden=$('grammarTimerMode').value!=='guesses';});
    $('grammarRapidEnabled').addEventListener('change',()=>{$('grammarRapidInputs').hidden=!$('grammarRapidEnabled').checked;});
    $('grammarLearn').addEventListener('click',()=>start('learn'));
    $('grammarInfinite').addEventListener('click',()=>start('infinite'));
    $('grammarOnePass').addEventListener('click',()=>start('onepass'));
    $('grammarAnswerForm').addEventListener('submit',e=>{e.preventDefault();grade();});
    $('grammarSkip').addEventListener('click',()=>grade(true));
    $('grammarGuidedNext').addEventListener('click',advance);
    $('grammarNext').addEventListener('click',advance);
    $('grammarAcceptMeaning').addEventListener('click',acceptMeaning);
    $('grammarPause').addEventListener('click',()=>{if(!session||session.done)return;session.paused=!session.paused;lastTick=Date.now();$('grammarRomaji').disabled=session.paused;$('grammarMeaning').disabled=session.paused;$('grammarCheck').disabled=session.paused;$('grammarSkip').disabled=session.paused;$('grammarGuidedNext').disabled=session.paused;$('grammarNext').disabled=session.paused;$('grammarAcceptMeaning').disabled=session.paused;$('grammarPause').setAttribute('aria-pressed',String(session.paused));updateStats();});
    for(const id of ['grammarExit','grammarFinish'])$(id).addEventListener('click',endRequest);
    $('grammarSummaryBack').addEventListener('click',backToLessons);
    $('grammarRepeat').addEventListener('click',()=>{const mode=session?.mode||'onepass';const pool=session?.pool;backToLessons();start(mode,pool);});
    $('homeLink').addEventListener('click',()=>{if(openPanel())close();},true);
    document.addEventListener('ktf:languagechange',()=>{labelsUpdate();if(openPanel()){if(lessonDialogId&&$('grammarLessonDialog').open){closeLesson();openLesson(lessonDialogId);}if(session){updateStats();if(!session.done && session.current){$('grammarLessonTag').textContent=local(byId.get(session.current.lessonId).title);if(isGuided()){ $('grammarGuidedMeaning').textContent=`${t('expectedMeaning')} ${session.current.meanings[lang()][0]}`; }}}}});
    document.addEventListener('keydown',e=>{if(!openPanel()||!session||session.done||e.key!=='Enter'||session.phase!=='feedback'||e.target.tagName==='BUTTON'||e.target.closest('dialog'))return;e.preventDefault();advance();});
    labelsUpdate();
  }
  window.KTFGrammar={open,close,matchReading,matchMeaning,lessons,isActive:()=>Boolean(session&&!session.done)};
  init();
})();
