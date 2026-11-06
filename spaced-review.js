"use strict";
(() => {
  const $=id=>document.getElementById(id);
  const cloud=window.KTFCloud, engine=window.KTFReviewScheduler;
  const tr=(en,es)=>document.documentElement.lang==='es'?es:en;
  const lang=()=>document.documentElement.lang==='es'?'es':'en';
  const split=value=>String(value||'').split(/[;,/|、，；]/).map(s=>s.trim()).filter(Boolean);
  let states=new Map(), session=null, revision=0, owner=cloud.getStatus().owner, pending=0;
  const writes=new Set();
  const mainCard=(item,type='romaji',selected=false)=>({key:`main:${item.id}:${type}`,source:item.script||'words',prompt:item.kana,type,selected,
    readings:item.readings||item.answers||[],meanings:item.kind==='word'?window.KTFBridge.wordMeanings(item):split(window.KTFBridge.itemMeaning(item))});
  const customCard=(item,type='both',selected=false)=>({key:`custom:${item.id}:${type}`,source:'custom',prompt:item.surface,type,selected,
    readings:split(item.romaji),meanings:split(item.meaning),note:item.notes||''});
  const grammarCard=(ex,selected=false)=>({key:`grammar:${ex.id}:both`,source:'grammar',prompt:ex.japanese,type:'both',selected,
    readings:[ex.reading],meanings:ex.meanings[lang()],note:ex.breakdown[lang()]});
  function cards(){
    const bridge=window.KTFBridge, selection=bridge.getSettings().selected;
    const result=Object.entries(bridge.catalog).flatMap(([script,items])=>items.flatMap(item=>[mainCard(item,'romaji',selection[script]?.includes(item.kana)),...(item.meaning?[mainCard(item,'meaning',false)]:[])]));
    const eligible=new Set(bridge.eligibleWords().map(item=>item.id));
    for(const item of bridge.words)for(const type of ['romaji','meaning'])result.push(mainCard(item,type,eligible.has(item.id)));
    for(const item of window.KTFCustomCollection.getItems()){
      const preferred=item.romaji&&item.meaning?'both':item.romaji?'romaji':'meaning';
      for(const type of ['romaji','meaning','both'])if((type!=='meaning'?item.romaji:true)&&(type!=='romaji'?item.meaning:true))result.push(customCard(item,type,type===preferred));
    }
    const selected=new Set(window.KTFGrammar.getSelected());
    for(const lesson of window.KTFGrammar.lessons)for(const ex of lesson.examples)result.push(grammarCard(ex,selected.has(lesson.id)));
    return result;
  }
  function labels(){
    $('spacedReviewTitle').textContent=tr('Your next practice','Tu próxima práctica');
    $('spacedReviewHelp').textContent=tr('Due reviews and recent mistakes first, plus new material from your selections and Custom collection.','Repasos vencidos y errores recientes primero, más material nuevo de tus selecciones y tu colección personalizada.');
    $('spacedReviewCountLabel').textContent=tr('Questions (1–100)','Preguntas (1–100)');
    $('spacedReviewAuto').textContent=tr('Prepare a practice for me →','Preparame una práctica →');
    $('spacedReviewDue').textContent=tr('Review due items','Repasar pendientes');
    $('spacedReviewHome').querySelector('summary').textContent=tr('How reviews work','Cómo funcionan los repasos');
    $('spacedReviewLocalHelp').textContent=tr('Correct: 1, 3, 7, 14, 30, then 60 days. Mistake: retry after 10 minutes. Saved offline and synced with your account.','Aciertos: 1, 3, 7, 14, 30 y luego 60 días. Error: repaso a los 10 minutos. Se guarda sin conexión y se sincroniza con tu cuenta.');
    if(session){
      const localized=new Map(cards().map(card=>[card.key,card]));
      session.deck=session.deck.map(card=>localized.get(card.key)||card);
      quizLabels();
      if(session.done)resultLabels();
      else if(session.checked)renderFeedback(session.deck[session.index],session.lastReading,session.lastMeaning);
    }
    renderStatus();
  }
  function renderStatus(){
    const all=cards(), now=Date.now();
    const due=all.filter(card=>states.has(card.key)&&states.get(card.key).due<=now).length;
    const fresh=all.filter(card=>card.selected&&!states.has(card.key)).length;
    const future=all.map(card=>states.get(card.key)?.due).filter(time=>time>now).sort((a,b)=>a-b)[0];
    $('spacedReviewStatus').textContent=`${due} ${tr('due','pendientes')} · ${fresh} ${tr('new available','nuevos disponibles')}${future?` · ${tr('Next review','Próximo repaso')}: ${new Date(future).toLocaleString(lang())}`:''}`;
    $('spacedReviewDue').disabled=!due||pending>0;
    $('spacedReviewAuto').disabled=pending>0;
  }
  async function refresh(){
    const rev=++revision, account=cloud.getStatus().owner;
    if(owner!==account){owner=account;states=new Map();if(session){session=null;window.KTFNavigation.reveal('setupScreen');}}
    const events=await cloud.getCustomEvents();
    if(rev!==revision||account!==cloud.getStatus().owner)return;
    states=engine.fold(events);renderStatus();
  }
  function record(card,correct){
    // custom_review is an existing synchronized event; namespaced IDs keep it
    // separate from collection statistics and require no database migration.
    pending++;renderStatus();
    const work=cloud.addCustomEvent('custom_review',{itemId:`study:${card.key}`,studyReview:true,key:card.key,correct})
      .catch(()=>{$('spacedReviewNotice').textContent=tr('Could not save this review.','No se pudo guardar este repaso.');})
      .finally(async()=>{pending--;writes.delete(work);await refresh();});
    writes.add(work);return work;
  }
  async function start(onlyDue){
    if(!window.KTFNavigation.canLeave())return;
    const input=$('spacedReviewCount'), limit=Number(input.value);
    if(!Number.isInteger(limit)||limit<1||limit>100){input.reportValidity();input.focus();return;}
    const account=cloud.getStatus().owner;
    $('spacedReviewAuto').disabled=true;$('spacedReviewDue').disabled=true;
    await Promise.all([...writes]);await window.KTFCustomCollection.refresh();await refresh();
    if(account!==cloud.getStatus().owner||!window.KTFNavigation.canLeave())return;
    const deck=engine.plan(cards(),states,limit,Date.now(),onlyDue);
    if(!deck.length){$('spacedReviewNotice').textContent=tr('No reviews ready. Select more study material or return when a review is due.','No hay repasos listos. Seleccioná más material o volvé cuando venza el próximo repaso.');return;}
    $('spacedReviewNotice').textContent='';
    session={deck,index:0,correct:0,answered:0,checked:false,done:false,owner:account,history:[],startedAt:new Date().toISOString()};
    window.KTFStudyClock?.onQuizStart({source:'review',kind:'review',mode:'onepass'});
    window.KTFNavigation.reveal('spacedReviewScreen');showQuestion();
  }
  function showQuestion(){
    const card=session.deck[session.index];session.checked=false;
    quizLabels();
    $('spacedReviewPrompt').textContent=card.prompt;
    $('spacedReviewReadingArea').hidden=card.type==='meaning';$('spacedReviewMeaningArea').hidden=card.type==='romaji';
    for(const [id,enabled] of [['spacedReviewReading',card.type!=='meaning'],['spacedReviewMeaning',card.type!=='romaji']]){$(id).value='';$(id).disabled=!enabled;$(id).required=enabled;}
    $('spacedReviewForm').hidden=false;$('spacedReviewResult').hidden=true;$('spacedReviewFeedback').hidden=true;$('spacedReviewNext').hidden=true;
    $('spacedReviewCheck').hidden=false;$('spacedReviewSkip').hidden=false;
    $(card.type==='meaning'?'spacedReviewMeaning':'spacedReviewReading').focus({preventScroll:true});
  }
  function quizLabels(){
    const card=session.deck[Math.min(session.index,session.deck.length-1)];
    $('spacedReviewQuizTitle').textContent=tr('Personalized practice','Práctica personalizada');
    const sourceLabels={hiragana:'Hiragana',katakana:'Katakana',kanji:'Kanji',words:tr('Words','Palabras'),custom:tr('Custom','Mi colección'),grammar:tr('Grammar','Gramática')};
    $('spacedReviewProgress').textContent=`${session.index+1} / ${session.deck.length} · ${sourceLabels[card.source]||card.source}`;
    $('spacedReviewReadingLabel').textContent=tr('Romaji reading','Lectura en romaji');$('spacedReviewMeaningLabel').textContent=tr('Meaning','Significado');
    $('spacedReviewCheck').textContent=tr('Check','Comprobar');$('spacedReviewSkip').textContent=tr('I do not know','No sé');
    $('spacedReviewNext').textContent=tr('Next →','Siguiente →');$('spacedReviewExit').textContent=tr('Finish practice','Terminar práctica');
  }
  const normal=value=>String(value).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[¿?!¡.,;:。！？]/g,'').replace(/\s+/g,' ').trim();
  async function grade(skip=false){
    const run=session;if(!run||run.done||run.checked||run.owner!==cloud.getStatus().owner)return;
    if(!skip&&!$('spacedReviewForm').reportValidity())return;
    const card=run.deck[run.index];
    const reading=card.type==='meaning'||(!skip&&card.readings.some(value=>window.KTFRomaji.matches($('spacedReviewReading').value,value)));
    const meaning=card.type==='romaji'||(!skip&&card.meanings.some(value=>normal(value)===normal($('spacedReviewMeaning').value)));
    const correct=!skip&&reading&&meaning;run.checked=true;run.answered++;if(correct)run.correct++;
    run.history.push({id:card.key,prompt:card.prompt,type:card.type,correct,answer:[$('spacedReviewReading').value,$('spacedReviewMeaning').value].filter(Boolean).join(' · '),expected:[card.type!=='meaning'?card.readings.join(' / '):'',card.type!=='romaji'?card.meanings.join(' / '):''].filter(Boolean).join(' · '),readingCorrect:reading,meaningCorrect:meaning});
    $('spacedReviewReading').disabled=true;$('spacedReviewMeaning').disabled=true;
    $('spacedReviewCheck').hidden=true;$('spacedReviewSkip').hidden=true;
    run.lastReading=reading;run.lastMeaning=meaning;renderFeedback(card,reading,meaning);
    window.KTFStudyClock?.onAnswer({source:'review',kind:card.source,item:{id:card.key,kana:card.prompt},correct,readingCorrect:reading,meaningCorrect:meaning});
    $('spacedReviewNext').hidden=false;$('spacedReviewNext').focus({preventScroll:true});
    await record(card,correct);
  }
  function renderFeedback(card,reading,meaning){
    const feedback=$('spacedReviewFeedback');feedback.replaceChildren();feedback.hidden=false;
    for(const [show,ok,label,values] of [[card.type!=='meaning',reading,tr('Reading','Lectura'),card.readings],[card.type!=='romaji',meaning,tr('Meaning','Significado'),card.meanings]])if(show){const row=document.createElement('p');row.className=ok?'is-correct':'is-wrong';row.textContent=`${ok?'✓':'✕'} ${label}: ${values.join(' / ')}`;feedback.append(row);}
    if(card.note){const note=document.createElement('p');note.textContent=card.note;feedback.append(note);}
  }
  function finish(){
    if(!session||session.done)return;
    session.done=true;
    if(session.answered)cloud.addAttempt({examId:'spaced-practice',kind:'review',mode:'onepass',questions:session.history,correct:session.correct,total:session.answered,percent:Math.round(100*session.correct/session.answered),startedAt:session.startedAt,completedAt:new Date().toISOString()}).catch(()=>{});
    window.KTFStudyClock?.onQuizFinish({source:'review',kind:'review',mode:'onepass'});
    $('spacedReviewForm').hidden=true;$('spacedReviewNext').hidden=true;$('spacedReviewFeedback').hidden=true;
    resultLabels();$('spacedReviewExit').focus();
  }
  function resultLabels(){
    $('spacedReviewResult').hidden=false;$('spacedReviewResult').textContent=`${session.correct} / ${session.answered} ${tr('correct answers','respuestas correctas')} · ${tr('Your review schedule has been updated.','Tu calendario de repaso se actualizó.')}`;
    $('spacedReviewExit').textContent=tr('Back to selection','Volver a selección');
  }
  $('spacedReviewHome').innerHTML=`<div><h2 id="spacedReviewTitle"></h2><p id="spacedReviewHelp" class="subtle"></p><p id="spacedReviewStatus" role="status"></p></div><div class="review-home-actions"><label><span id="spacedReviewCountLabel"></span><input id="spacedReviewCount" type="number" min="1" max="100" step="1" value="20" required></label><button id="spacedReviewAuto" class="button-primary" type="button"></button><button id="spacedReviewDue" class="button-secondary" type="button"></button></div><details><summary>${tr('How reviews work','Cómo funcionan los repasos')}</summary><p id="spacedReviewLocalHelp"></p></details><p id="spacedReviewNotice" role="status"></p>`;
  const screen=document.createElement('section');screen.id='spacedReviewScreen';screen.hidden=true;screen.className='review-screen';
  screen.innerHTML=`<h2 id="spacedReviewQuizTitle"></h2><p id="spacedReviewProgress"></p><div class="quiz-card"><p id="spacedReviewPrompt" class="review-prompt" lang="ja"></p><form id="spacedReviewForm" autocomplete="off"><div id="spacedReviewReadingArea"><label id="spacedReviewReadingLabel" for="spacedReviewReading"></label><input id="spacedReviewReading" class="answer-input" autocapitalize="off" spellcheck="false"></div><div id="spacedReviewMeaningArea"><label id="spacedReviewMeaningLabel" for="spacedReviewMeaning"></label><input id="spacedReviewMeaning" class="answer-input" autocapitalize="off" spellcheck="false"></div><div class="quiz-actions"><button id="spacedReviewCheck" class="button-primary" type="submit"></button><button id="spacedReviewSkip" class="button-secondary" type="button"></button></div></form><div id="spacedReviewFeedback" role="status" hidden></div><p id="spacedReviewResult" role="status" hidden></p><button id="spacedReviewNext" class="button-primary" type="button" hidden></button></div><button id="spacedReviewExit" class="button-secondary" type="button"></button>`;
  document.querySelector('main').append(screen);
  $('spacedReviewAuto').onclick=()=>start(false);$('spacedReviewDue').onclick=()=>start(true);
  $('spacedReviewForm').onsubmit=event=>{event.preventDefault();grade();};$('spacedReviewSkip').onclick=()=>grade(true);
  $('spacedReviewNext').onclick=()=>{if(!session?.checked||session.done)return;if(++session.index>=session.deck.length)finish();else showQuestion();};
  $('spacedReviewExit').onclick=()=>{if(!session?.done){finish();return;}session=null;window.KTFNavigation.reveal('setupScreen',{restore:true});refresh();};
  window.KTFReview={isActive:()=>Boolean(session&&!session.done),refresh,
    recordExam:(question,correct)=>{const item=[...Object.values(window.KTFBridge.catalog).flat(),...window.KTFBridge.words].find(item=>item.id===question.sourceId);if(item)record(mainCard(item,question.type==='meaning'?'meaning':'romaji'),correct);},
    recordMain:(item,type,correct)=>record(mainCard(item,type),correct),
    recordCustom:(item,type,correct)=>record(customCard(item,type),correct),
    recordGrammar:(id,correct)=>{const ex=window.KTFGrammar.lessons.flatMap(lesson=>lesson.examples).find(ex=>ex.id===id);if(ex)record(grammarCard(ex),correct);}};
  cloud.subscribe(()=>refresh().catch(()=>{}));
  document.addEventListener('ktf:languagechange',labels);
  document.addEventListener('ktf:settingschange',renderStatus);
  document.addEventListener('ktf:custom-collection-changed',renderStatus);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
  setInterval(renderStatus,60000);
  labels();refresh();
})();
