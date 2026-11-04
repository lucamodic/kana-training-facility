"use strict";
(() => {
  const bridge = window.KTFBridge;
  const cloud = window.KTFCloud;
  const get = id => document.getElementById(id);
  const L = () => bridge.getLanguage();
  const trans = (en,es) => L()==='es'?es:en;
  const definitions = [
    {id:'kana-basics',name:['Kana Fundamentals','Fundamentos de kana'],description:['Basic Hiragana and Katakana recognition.','Reconocimiento de hiragana y katakana básicos.'],size:30,next:'kana-combinations'},
    {id:'kana-combinations',name:['Kana Combinations','Combinaciones de kana'],description:['Voiced sounds, small kana and combinations.','Sonidos sonoros, kana pequeños y combinaciones.'],size:30,next:'basic-kanji'},
    {id:'basic-kanji',name:['Basic Kanji','Kanji básicos'],description:['Individual readings and meanings for early kanji.','Lecturas individuales y significados de kanji iniciales.'],size:25,next:'kanji-context'},
    {id:'kanji-context',name:['Kanji in Context','Kanji en contexto'],description:['Read words where kanji take different readings.','Leé palabras donde los kanji cambian de lectura.'],size:25,next:'reading-basics'},
    {id:'reading-basics',name:['Reading Basics','Lectura básica'],description:['Read and understand unlocked Japanese vocabulary.','Leé y comprendé el vocabulario japonés disponible.'],size:30,next:null},
    {id:'my-knowledge',name:['Test My Knowledge','Evaluar lo que sé'],description:['Personalized review of your selected characters.','Repaso personalizado de los caracteres que seleccionaste.'],size:30,next:null}
  ];
  const byId = Object.fromEntries(definitions.map(def=>[def.id,def]));
  const normalize = value => String(value||'').normalize('NFKC').trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[\s\-_.,!?'’。！？]/g,'');
  const clean = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const shuffle = data => {
    const copy = [...data];
    for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}
    return copy;
  };
  const getSelection = () => bridge.getSettings().selected;
  const wordAllowed = () => bridge.eligibleWords();
  const isKanji = word => /[\u3400-\u9fff]/u.test(word.kana);
  const countScripts = word => [/[\u3040-\u309f]/u,/[\u30a0-\u30ff]/u,/[\u3400-\u9fff]/u].filter(regex=>regex.test(word.kana)).length;
  function characterQuestions(items,modes=['reading']) {
    const questions=[];
    for(const item of items)for(const mode of modes){
      if(mode==='meaning'&&!item.meaning)continue;
      questions.push({id:mode+':'+item.id,sourceId:item.id,prompt:item.kana,
        answers:mode==='reading'?item.answers:item.meaning.split(';').map(s=>s.trim()),
        answerText:mode==='reading'?item.answers[0]:item.meaning.split(';')[0],
        type:mode,category:item.category||item.script,script:item.script,meaning:item.meaning||'',
        reading:item.answers?.[0]||'',kind:'character'});
    }
    return questions;
  }
  function wordQuestions(items,modes=['reading','meaning']) {
    const questions=[];
    for(const item of items)for(const mode of modes){
      const english=item.meanings||[];
      const spanish=item.meaningsEs||[];
      const meanings= L()==='es'&&spanish.length?spanish:english;
      if(!meanings.length&&mode==='meaning')continue;
      questions.push({id:mode+':'+item.id,sourceId:item.id,prompt:item.kana,
        answers:mode==='reading'?item.readings:meanings,
        answerText:mode==='reading'?item.readings[0]:meanings[0],
        type:mode,category:countScripts(item)>1?'Mixed scripts':isKanji(item)?'Kanji in words':'Vocabulary',
        script:isKanji(item)?'kanji':'word',kind:'word',reading:item.readings?.[0]||'',meaning:english[0]||''});
    }
    return questions;
  }
  function buildBank(exam) {
    const catalog=bridge.catalog;
    const selected=getSelection();
    if(exam==='kana-basics')return characterQuestions(['hiragana','katakana'].flatMap(s=>catalog[s].filter(x=>x.category==='basic')));
    if(exam==='kana-combinations')return characterQuestions(['hiragana','katakana'].flatMap(s=>catalog[s].filter(x=>['voiced','combo','extra'].includes(x.category))));
    if(exam==='basic-kanji'){
      const chosen=catalog.kanji.filter(x=>selected.kanji.includes(x.kana));
      const early=catalog.kanji.filter(x=>['Numbers','People & learning'].includes(x.category));
      const pool=chosen.length>=12?chosen:early;
      return characterQuestions(pool,['reading','meaning']);
    }
    if(exam==='kanji-context')return wordQuestions(wordAllowed().filter(isKanji));
    if(exam==='reading-basics')return wordQuestions(wordAllowed());
    if(exam==='my-knowledge')return characterQuestions(['hiragana','katakana','kanji'].flatMap(s=>catalog[s].filter(x=>selected[s].includes(x.kana))),['reading','meaning']);
    return [];
  }
  function sampleQuestions(bank,size,previous) {
    const lastSet=new Set(previous?.questions?.map(question=>question.id)||[]);
    const seenBySource=new Map();
    const result=[];
    const preferred=shuffle(bank.filter(q=>!lastSet.has(q.id)));
    const remaining=shuffle(bank.filter(q=>lastSet.has(q.id)));
    for(const question of [...preferred,...remaining]){
      if(result.length>=size)break;
      const n=seenBySource.get(question.sourceId)||0;
      if(n&&bank.length>=size)continue;
      result.push(question);
      seenBySource.set(question.sourceId,n+1);
    }
    if(result.length<size){
      for(const question of shuffle(bank)) {
        if(result.length>=size)break;
        if(!result.some(x=>x.id===question.id))result.push(question);
      }
    }
    return shuffle(result);
  }
  let attempts=[];
  let current=null;
  let page='dashboard';
  function t(key) {
    const texts={
      en:{button:'My Progress',title:'Learning Progress',intro:'Check your skills, find your next step and continue from any device.',exams:'Skill exams',history:'Exam history',account:'Cloud sync',guest:'Studying as a guest',signin:'Continue with Google',signout:'Sign out',sync:'Sync now',connected:'Signed in',offline:'Offline — changes are saved on this device',syncing:'Syncing your progress…',synced:'All changes synced',error:'Sync needs attention',local:'Saved locally',guide:'Learning Guide',start:'Take exam',review:'Retake exam',test:'Your exam',pass:'Passed',fail:'Keep practicing',correct:'Correct',answered:'answered',question:'Question',next:'Next question',finish:'See results',exit:'Leave exam',write:'Type your answer',meaning:'Write the meaning',reading:'Write the romaji reading',results:'Exam results',recommend:'Your next step',mistakes:'Review these questions',empty:'No exams yet. Take one whenever you feel ready.',noQuestions:'Not enough unlocked words for this exam. Select more characters first.',ready:'Exam ready',from:'from',syncHelp:'Study offline; your progress syncs when you reconnect.',guideLink:'Learning Guide',progressLink:'My Progress',again:'Take another exam',close:'Close',progressSaved:'Results saved on this device',cannotStart:'Finish your current lesson before taking an exam.',guideTitle:'Learning Guide',guideIntro:'Choose what to study, test your understanding, and use your results to guide your next practice.',howExams:'How exams work',howExamsBody:'Each skill exam draws from a larger question bank. Retakes use a different order and favor questions you did not see last time. The passing score is 90%. You can always retry.',howSelection:'Your selections',howSelectionBody:'The personalized exam checks the characters you marked. Context and reading exams use unlocked words from all three scripts. Selecting a kanji does not mean you know every way it is pronounced.',howSync:'Offline and syncing',howSyncBody:'Exams and selections are saved locally. Sign in with Google to sync between devices when online. Changes made on different devices may take time to appear; open the app online to sync.',howScoring:'Reading vs meaning',howScoringBody:'Reading questions expect romaji. Meaning questions expect the English meaning (or Spanish when using Español). Kanji can have several pronunciations, and words may use a different one.',notice:'You can start with whichever exam feels right. There are no forced levels.',pending:'Pending offline',weak:'Focus on',none:'None',signError:'Could not sign in',historyDetail:'Details',closeResult:'Back to progress',import:'Import backup',export:'Export backup',backupHelp:'Offline backup of exam attempts. Importing keeps unique attempts and does not erase others.',howProfile:'Your nickname',howProfileBody:'Your display name is separate from Google. Choose a nickname in My Progress; your Google email is only shown under Account details. Nickname changes save offline and sync when online.',howManga:'Manga Reader',howMangaBody:'Upload pages you already have access to, then analyze them online. Try writing the romaji before revealing readings, vocabulary and English translations. Pages are temporary, not stored or synced. Analysis sends the page to OpenAI GPT-6 Luna through a protected Supabase function and requires Google sign-in.'},
      es:{button:'Mi progreso',title:'Progreso de aprendizaje',intro:'Evaluá lo que sabés, descubrí qué seguir y retomá desde cualquier dispositivo.',exams:'Exámenes por habilidad',history:'Historial de exámenes',account:'Sincronización',guest:'Estudiando sin cuenta',signin:'Continuar con Google',signout:'Cerrar sesión',sync:'Sincronizar ahora',connected:'Sesión iniciada',offline:'Sin conexión: los cambios se guardan en este dispositivo',syncing:'Sincronizando progreso…',synced:'Todo sincronizado',error:'La sincronización necesita atención',local:'Guardado localmente',guide:'Guía de aprendizaje',start:'Rendir examen',review:'Repetir examen',test:'Tu examen',pass:'Aprobado',fail:'Seguí practicando',correct:'Correctas',answered:'respondidas',question:'Pregunta',next:'Siguiente pregunta',finish:'Ver resultados',exit:'Salir del examen',write:'Escribí tu respuesta',meaning:'Escribí el significado',reading:'Escribí la lectura en romaji',results:'Resultados del examen',recommend:'Tu próximo paso',mistakes:'Revisá estas preguntas',empty:'Todavía no rendiste exámenes. Empezá cuando quieras.',noQuestions:'No hay suficientes palabras desbloqueadas para este examen. Seleccioná más caracteres.',ready:'Examen disponible',from:'de',syncHelp:'Estudiá offline; tu progreso se sincroniza cuando vuelvas a conectarte.',guideLink:'Guía de aprendizaje',progressLink:'Mi progreso',again:'Rendir otro examen',close:'Cerrar',progressSaved:'Resultados guardados en este dispositivo',cannotStart:'Terminá la lección actual antes de rendir un examen.',guideTitle:'Guía de aprendizaje',guideIntro:'Elegí qué estudiar, evaluá lo que entendés y aprovechá los resultados para planear la próxima práctica.',howExams:'Cómo funcionan los exámenes',howExamsBody:'Cada examen usa un banco amplio de preguntas. Al repetirlo cambia el orden y prioriza las que no aparecieron la vez anterior. Se aprueba con 90%. Podés repetirlo cuando quieras.',howSelection:'Tus selecciones',howSelectionBody:'El examen personalizado utiliza los caracteres marcados. Los exámenes de contexto y lectura usan palabras desbloqueadas en los tres alfabetos. Seleccionar un kanji no significa dominar todas sus lecturas.',howSync:'Offline y sincronización',howSyncBody:'Los exámenes y selecciones se guardan localmente. Iniciá sesión con Google para sincronizar entre dispositivos cuando haya internet. Abrí la app con conexión para recibir cambios de la otra computadora.',howScoring:'Lectura y significado',howScoringBody:'Las preguntas de lectura esperan romaji. Las de significado aceptan inglés (o español cuando usás Español). Los kanji pueden tener varias lecturas y una palabra puede usar una distinta.',notice:'Podés empezar por cualquier examen. No hay niveles obligatorios.',pending:'Pendiente offline',weak:'Reforzá',none:'Ninguno',signError:'No se pudo iniciar sesión',historyDetail:'Detalles',closeResult:'Volver a progreso',import:'Importar respaldo',export:'Exportar respaldo',backupHelp:'Respaldo offline de intentos. Importar conserva los intentos únicos sin borrar otros.',howProfile:'Tu nickname',howProfileBody:'Tu nombre visible es independiente de Google. Elegí tu nickname en Mi progreso; el email solo aparece en Detalles de la cuenta. Los cambios se guardan offline y se sincronizan con conexión.',howManga:'Manga Reader',howMangaBody:'Subí páginas que ya tengas disponibles y analizalas online. Intentá escribir el romaji antes de revelar lecturas, vocabulario y traducción al inglés. Las páginas son temporales: no se guardan ni sincronizan. El análisis envía la imagen a OpenAI GPT-6 Luna mediante una función protegida de Supabase y requiere iniciar sesión con Google.'}
    };
    return texts[L()]?.[key] || texts.en[key] || key;
  }
  function recommend() {
    const passed=new Set(attempts.filter(a=>a.passed).map(a=>a.examId));
    const stages=['kana-basics','kana-combinations','basic-kanji','kanji-context','reading-basics'];
    const needed=stages.find(id=>!passed.has(id));
    const latest=attempts[0];
    if(latest && !latest.passed && latest.weak?.length){
      const weak=latest.weak.slice(0,2).join(', ');
      return L()==='es' ? `Reforzá ${weak} y repetí ${byId[latest.examId]?.name[1]||'ese examen'}.` : `Review ${weak} and retake ${byId[latest.examId]?.name[0]||'that exam'}.`;
    }
    if(!needed)return trans('You have passed all skill exams. Keep reading new words and expanding your kanji.','Aprobaste todos los exámenes. Seguí leyendo palabras nuevas y ampliando tus kanji.');
    const index=L()==='es'?1:0;
    return `${trans('Suggested next: ','Siguiente sugerido: ')}${byId[needed].name[index]}. ${byId[needed].description[index]}`;
  }
  function profileText(key) {
    const content={
      en:{greeting:'Welcome back, ',choose:'Choose your nickname',edit:'Edit nickname',set:'Set nickname',label:'Your nickname',placeholder:'Choose a nickname',save:'Save nickname',cancel:'Cancel',hint:'2–32 characters. Works offline and syncs with your Google account.',details:'Account details',email:'Google email',saved:'Nickname saved on this device. It will sync when you reconnect.',synced:'Nickname saved and synced.',invalid:'Your nickname must be between 2 and 32 characters.'},
      es:{greeting:'¡Qué bueno verte, ',choose:'Elegí tu nickname',edit:'Editar nickname',set:'Elegir nickname',label:'Tu nickname',placeholder:'Elegí un nickname',save:'Guardar nickname',cancel:'Cancelar',hint:'De 2 a 32 caracteres. Funciona offline y se sincroniza con Google.',details:'Detalles de la cuenta',email:'Correo de Google',saved:'Nickname guardado en este dispositivo. Se sincronizará cuando vuelvas a conectarte.',synced:'Nickname guardado y sincronizado.',invalid:'El nickname debe tener entre 2 y 32 caracteres.'}
    };
    return content[L()==='es'?'es':'en'][key];
  }
  function closeNicknameEditor() {
    get('progressNicknameForm').hidden=true;
    get('progressNicknameFeedback').hidden=true;
  }
  function openNicknameEditor() {
    get('progressNicknameInput').value=cloud.getNickname();
    get('progressNicknameForm').hidden=false;
    get('progressNicknameFeedback').hidden=true;
    get('progressNicknameInput').focus();
  }
  async function submitNickname(event) {
    event.preventDefault();
    const input=get('progressNicknameInput');
    const nickname=input.value.trim().replace(/\s+/g,' ');
    const length=Array.from(nickname).length;
    const feedback=get('progressNicknameFeedback');
    if (length<2||length>32) {
      feedback.textContent=profileText('invalid');feedback.hidden=false;
      return;
    }
    const saveButton=get('progressNicknameSave');
    saveButton.disabled=true;
    try {
      const result=await cloud.updateNickname(nickname);
      get('progressNicknameForm').hidden=true;
      feedback.textContent=result.pending?profileText('saved'):profileText('synced');
      feedback.hidden=false;
    } catch (error) {
      feedback.textContent=error.message||profileText('saved');feedback.hidden=false;
    } finally {
      saveButton.disabled=false;
      renderDashboard();
    }
  }
  function examLabel(id) {const def=byId[id];return def?def.name[L()==='es'?1:0]:id;}
  function statusText() {
    const s=cloud.getStatus();
    const labels={offline:t('offline'),syncing:t('syncing'),synced:t('synced'),error:t('error'),local:t('local'),connecting:t('syncing')};
    return labels[s.status] || t('local');
  }
  async function refresh() {
    attempts=await cloud.getAttempts();
    if(!get('progressDialog').open||page!=='dashboard')return;
    renderDashboard();
  }
  function renderDashboard() {
    get('progressTitle').textContent=t('title');
    get('progressIntro').textContent=t('intro');
    get('progressAccountTitle').textContent=t('account');
    get('progressStatus').textContent=statusText();
    const auth=cloud.getStatus();
    const cachedAccount=!auth.user && auth.owner!=='guest' && !auth.online;
    const hasAccount=Boolean(auth.user)||cachedAccount;
    const nickname=cloud.getNickname();
    get('progressUser').textContent=hasAccount?(nickname?profileText('greeting')+nickname:profileText('choose')):t('guest');
    get('progressNicknameEdit').hidden=!hasAccount;
    get('progressNicknameEdit').textContent=nickname?profileText('edit'):profileText('set');
    get('progressAccountDetails').hidden=!auth.user;
    get('progressAccountDetailsLabel').textContent=profileText('details');
    get('progressEmailLabel').textContent=profileText('email');
    get('progressEmail').textContent=auth.user?.email||'';
    get('progressNicknameLabel').textContent=profileText('label');
    get('progressNicknameInput').placeholder=profileText('placeholder');
    get('progressNicknameSave').textContent=profileText('save');
    get('progressNicknameCancel').textContent=profileText('cancel');
    get('progressNicknameHint').textContent=profileText('hint');
    if (!hasAccount) closeNicknameEditor();
    get('progressLogin').hidden=hasAccount;
    get('progressLogout').hidden=!auth.user;
    get('progressSync').hidden=!auth.user;
    get('progressSyncHelp').textContent=t('syncHelp');
    get('progressRecommendation').textContent=recommend();
    get('progressNotice').textContent=t('notice');
    get('progressExamsHeading').textContent=t('exams');
    get('progressHistoryHeading').textContent=t('history');
    get('progressLogin').textContent=t('signin');
    get('progressLogout').textContent=t('signout');
    get('progressSync').textContent=t('sync');
    get('progressGuide').textContent=t('guide');
    get('progressExport').textContent=t('export');
    const results=get('progressExams');
    const passed=new Set(attempts.filter(a=>a.passed).map(a=>a.examId));
    results.innerHTML=definitions.map(def=>{
      const count=buildBank(def.id).length;
      const available=count>=Math.min(8,def.size);
      const previous=attempts.filter(a=>a.examId===def.id);
      return `<article class="progress-exam-card"><div class="progress-exam-head"><h3>${clean(def.name[L()==='es'?1:0])}</h3><span class="progress-exam-status">${passed.has(def.id)?t('pass'):previous.length?Math.max(...previous.map(x=>x.percent))+'%':count+' '+t('question').toLowerCase()+'s'}</span></div><p>${clean(def.description[L()==='es'?1:0])}</p><button type="button" class="button-secondary" data-exam="${def.id}" ${available?'':'disabled'}>${previous.length?t('review'):t('start')} →</button>${available?'':`<small>${t('noQuestions')}</small>`}</article>`;
    }).join('');
    get('progressEmpty').hidden=attempts.length>0;
    get('progressEmpty').textContent=t('empty');
    get('progressHistory').innerHTML=attempts.slice(0,35).map(a=>`<article class="progress-history-row"><div><strong>${clean(examLabel(a.examId))}</strong><small>${new Date(a.completedAt).toLocaleString(L()==='es'?'es-AR':'en-US',{dateStyle:'medium',timeStyle:'short'})} · ${a.correct}/${a.total}</small></div><span class="progress-history-percent ${a.passed?'is-passed':''}">${a.percent}%</span></article>`).join('');
  }
  async function showProgress() {
    if(!get('examScreen').hidden){
      if(current && !window.confirm(trans('Leave this exam? Your unfinished attempt will not be saved.','¿Salir del examen? El intento sin terminar no se guardará.')))return;
      closeExamView();
    }
    page='dashboard';
    if(!get('progressDialog').open)get('progressDialog').showModal();
    attempts=await cloud.getAttempts();
    renderDashboard();
  }
  function startExam(id) {
    if(bridge.isQuizActive()) {window.alert(t('cannotStart'));return;}
    const def=byId[id];
    if(!def)return;
    const bank=buildBank(id);
    if(bank.length<Math.min(8,def.size)) {window.alert(t('noQuestions'));return;}
    const previous=attempts.find(a=>a.examId===id);
    const questions=sampleQuestions(bank,Math.min(def.size,bank.length),previous);
    current={examId:id,questions,index:0,answers:[],startedAt:new Date().toISOString()};
    page='exam';
    get('progressDialog').close();
    get('setupScreen').hidden=true;
    get('quizScreen').hidden=true;
    get('summaryScreen').hidden=true;
    get('examScreen').hidden=false;
    get('examQuestionPanel').hidden=false;
    get('examResult').hidden=true;
    get('examHint').hidden=false;
    window.KTFStudyClock?.onViewChange(true,'exam');
    renderQuestion();
    get('examScreen').scrollIntoView({block:'start',behavior:'instant'});
  }
  function renderQuestion() {
    const q=current?.questions[current.index];
    if(!q)return;
    get('examTitle').textContent=examLabel(current.examId);
    get('examCounter').textContent=`${t('question')} ${current.index+1} ${t('from')} ${current.questions.length}`;
    const progress=Math.round(current.index/current.questions.length*100);
    get('examProgressFill').style.width=progress+'%';
    get('examProgressPercent').textContent=progress+'%';
    get('examProgressTrack').setAttribute('aria-valuenow',String(progress));
    get('examExit').textContent=trans('← Back to progress','← Volver a mi progreso');
    get('examSubtitle').textContent=trans('No hints or instant feedback. See your results at the end.','Sin pistas ni correcciones inmediatas. Vas a ver tus resultados al finalizar.');
    get('examEyebrow').textContent=trans('✦ SKILL CHECK','✦ EVALUACIÓN');
    get('examModeBadge').textContent=trans('✦ EXAM MODE','✦ MODO EXAMEN');
    get('examPassingBadge').textContent=trans('PASS · 90%','APROBACIÓN · 90%');
    get('examHint').textContent=trans('No hints during an exam · Enter to continue','Sin pistas durante el examen · Enter para continuar');
    get('examPrompt').textContent=q.prompt;
    get('examPrompt').classList.toggle('exam-prompt-word', q.kind==='word' || [...q.prompt].length>2);
    get('examPrompt').lang='ja';
    get('examQuestionLabel').textContent=q.type==='meaning'?t('meaning'):t('reading');
    get('examAnswerLabel').textContent=trans('Your answer','Tu respuesta');
    get('examInput').placeholder=t('write');
    get('examInput').value='';
    get('examNext').textContent=current.index===current.questions.length-1?t('finish'):t('next');
    get('examSkip').textContent=trans("I don't know",'No sé');
    get('examInput').focus({preventScroll:true});
  }
  async function submitAnswer(event) {
    event.preventDefault();
    if(!current)return;
    const q=current.questions[current.index];
    const answer=get('examInput').value.trim();
    const match=q.answers.some(candidate=>normalize(candidate)===normalize(answer));
    current.answers.push({id:q.id,prompt:q.prompt,expected:q.answerText,answer,correct:match,type:q.type,category:q.category,script:q.script,meaning:q.meaning,reading:q.reading});
    current.index++;
    if(current.index<current.questions.length)renderQuestion();
    else await finishExam();
  }
  async function finishExam() {
    const correct=current.answers.filter(a=>a.correct).length;
    const total=current.questions.length;
    const percent=Math.round(correct/total*100);
    const errors=current.answers.filter(a=>!a.correct);
    const weak=[...new Set(errors.map(e=>e.category))];
    const result={examId:current.examId,questions:current.answers,correct,total,percent,passed:percent>=90,weak,startedAt:current.startedAt,completedAt:new Date().toISOString()};
    await cloud.addAttempt(result);
    attempts=await cloud.getAttempts();
    get('examQuestionPanel').hidden=true;
    get('examResult').hidden=false;
    get('examHint').hidden=true;
    get('examResultTitle').textContent=t('results');
    get('examResultScore').textContent=`${percent}% · ${correct}/${total}`;
    get('examResultPass').textContent=result.passed?t('pass'):t('fail');
    get('examResultPass').className=result.passed?'exam-result-passed':'exam-result-review';
    get('examResultNext').textContent=result.passed && byId[result.examId]?.next
      ? `${t('recommend')}: ${examLabel(byId[result.examId].next)}`
      : errors.length?`${t('recommend')}: ${t('weak')} ${weak.slice(0,3).join(', ')}`
      : recommend();
    get('examResultMistakes').innerHTML=errors.length?`<h3>${t('mistakes')}</h3>${errors.slice(0,15).map(q=>`<div class="exam-mistake"><strong lang="ja">${clean(q.prompt)}</strong><span>${clean(q.answer||'—')} → ${clean(q.expected)}</span></div>`).join('')}`:'';
    get('examBack').textContent=t('closeResult');
    get('examProgressFill').style.width='100%';
    get('examProgressPercent').textContent='100%';
    get('examProgressTrack').setAttribute('aria-valuenow','100');
    get('examResultsEyebrow').textContent=trans('✦ EXAM COMPLETE','✦ EXAMEN FINALIZADO');
    get('examCounter').textContent=trans('Exam complete','Examen finalizado');
    current=null;
  }
  function closeExamView() {
    current=null;
    page='dashboard';
    get('examScreen').hidden=true;
    get('setupScreen').hidden=false;
    get('quizScreen').hidden=true;
    get('summaryScreen').hidden=true;
    window.KTFStudyClock?.onViewChange(false);
    window.scrollTo({top:0,behavior:'instant'});
  }
  function renderGuide() {
    get('guideTitle').textContent=t('guideTitle');
    get('guideIntro').textContent=t('guideIntro');
    const sections=['howExams','howSelection','howScoring','howSync','howProfile'];
    if (!get('openMangaButton').hidden) sections.push('howManga');
    get('guideSections').innerHTML=sections.map(key=>`<section><h3>${t(key)}</h3><p>${t(key+'Body')}</p></section>`).join('');
    get('guideClose').textContent='✕';
    get('guideClose').setAttribute('aria-label',t('close'));
    get('guideClose').title=t('close');
  }
  async function exportBackup() {
    const exams=await cloud.getAttempts();
    const blob=new Blob([JSON.stringify({type:'ktf-exam-backup',version:1,exportedAt:new Date().toISOString(),attempts:exams},null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const anchor=document.createElement('a');anchor.href=url;anchor.download='kana-training-progress.json';anchor.click();
    setTimeout(()=>URL.revokeObjectURL(url),1500);
  }
  function init() {
    get('progressOpen').addEventListener('click',showProgress);
    get('footerProgress').addEventListener('click',showProgress);
    get('progressClose').addEventListener('click',()=>get('progressDialog').close());
    get('progressExams').addEventListener('click',e=>{
      const button=e.target.closest('[data-exam]');
      if(button)startExam(button.dataset.exam);
    });
    get('examForm').addEventListener('submit',submitAnswer);
    get('examSkip').addEventListener('click',()=>{
      if(!current)return;
      get('examInput').value='';
      submitAnswer(new Event('submit',{cancelable:true}));
    });
    get('examExit').addEventListener('click',showProgress);
    get('examBack').addEventListener('click',showProgress);
    get('homeLink').addEventListener('click',event=>{
      if(get('examScreen').hidden)return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if(current && !window.confirm(trans('Leave this exam? Your unfinished attempt will not be saved.','¿Salir del examen? El intento sin terminar no se guardará.')))return;
      closeExamView();
    },true);
    get('progressLogin').addEventListener('click',async()=>{try{await cloud.signIn();}catch(error){alert(t('signError')+': '+error.message);}});
    get('progressLogout').addEventListener('click',async()=>{await cloud.signOut();await refresh();});
    get('progressNicknameEdit').addEventListener('click',()=>{
      if(get('progressNicknameForm').hidden)openNicknameEditor();else closeNicknameEditor();
    });
    get('progressNicknameCancel').addEventListener('click',closeNicknameEditor);
    get('progressNicknameForm').addEventListener('submit',submitNickname);
    get('progressSync').addEventListener('click',async()=>{await cloud.sync();await refresh();});
    get('footerGuide').addEventListener('click',()=>{renderGuide();get('guideDialog').showModal();});
    get('progressGuide').addEventListener('click',()=>{renderGuide();get('guideDialog').showModal();});
    get('guideClose').addEventListener('click',()=>get('guideDialog').close());
    get('progressExport').addEventListener('click',exportBackup);
    get('progressDialog').addEventListener('click',e=>{if(e.target===get('progressDialog'))get('progressDialog').close();});
    get('guideDialog').addEventListener('click',e=>{if(e.target===get('guideDialog'))get('guideDialog').close();});
    cloud.subscribe(()=>{refresh().catch(()=>{});});
    document.addEventListener('ktf:aiaccesschange',()=>{if(get('guideDialog').open)renderGuide();});
    document.addEventListener('ktf:languagechange',()=>{
      get('progressOpen').textContent=t('button');
      get('footerGuide').textContent=t('guideLink');
      get('footerProgress').textContent=t('progressLink');
      if(get('progressDialog').open)renderDashboard();
      if(get('guideDialog').open)renderGuide();
      if(!get('examScreen').hidden&&current)renderQuestion();
    });
    get('progressOpen').textContent=t('button');
    get('footerGuide').textContent=t('guideLink');
    get('footerProgress').textContent=t('progressLink');
  }
  window.KTFLearning = {definitions,buildBank,sampleQuestions,open:showProgress,leaveExam:closeExamView};
  init();
})();
