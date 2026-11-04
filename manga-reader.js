"use strict";
(() => {
  const $ = id => document.getElementById(id);
  const cloud = window.KTFCloud;
  const bridge = window.KTFBridge;
  const pages = [];
  let activeId = null;
  let running = false;
  let analyzeAll = false;
  let aborter = null;
  let selectedItem = null;
  const MAX_PAGES = 16;
  const MAX_FILE = 18 * 1024 * 1024;
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const lang = () => bridge?.getLanguage?.() === 'es' ? 'es' : 'en';
  const labels = {
    en:{title:'Manga Reader',subtitle:'Read real Japanese pages at your own pace',choose:'Add manga pages',empty:'Drop some manga pages here or choose files to begin.',read:'Analyze this page',all:'Analyze all pages',retry:'Try again',add:'Add pages',remove:'Remove page',signIn:'Sign in with Google to analyze',signed:'Google sign-in is only required for online analysis.',noSave:'Pages and results stay in this browser tab. They are not synced or saved between visits.',sent:'When you analyze, the image is sent to Google Gemini through your Supabase function.',noItems:'No dialogue detected. You can add Japanese text yourself.',noAnalysis:'Select Analyze to recognize Japanese text on this page.',working:'Reading Japanese text…',line:'Text',readPrompt:'Write this in romaji',check:'Check my reading',show:'Show reading & translation',hide:'Hide answer',words:'Word meanings',edit:'Correct Japanese text',saveEdit:'Update explanation',cancel:'Cancel',addText:'Add a text manually',correct:'Looks right!',incorrect:'Not quite. Try again or reveal the answer.',romaji:'Reading (romaji)',english:'English translation',notReady:'Sign in and deploy the Manga Reader function to enable AI analysis.',error:'Could not analyze this page.',done:'Page analyzed.',pending:'Ready to analyze',processing:'Analyzing',completed:'Analyzed',manual:'Manual text',yourReading:'Your reading',loadError:'Could not read these files.',long:'Pages are only kept until you close or reload the app.',help:'You can try the romaji first, then reveal the reading or individual word meanings. OCR and translations may be imperfect.',continue:'Next page',chooseNext:'Choose a page above.',noInternet:'Manga Reader needs an internet connection for analysis. Your other study modes still work offline.',tooMany:'Up to 16 pages per batch.',bigFile:'A file exceeds 18 MB.',invalid:'Choose PNG, JPG or WEBP images.',missing:'Enter some Japanese text first.',editing:'Correct the OCR and refresh its explanation.',reveal:'Reveal word meanings',hideWords:'Hide word meanings',noWords:'No word breakdown available. Try refreshing the explanation.',failed:'Not ready',processingMany:'Analyzing page',of:'of',analyzed:'Done',cancelAnalysis:'Stop analyzing',close:'Back to selection',needLogin:'Sign in with Google in My Progress or use the button here. Pages will not be synced.',privacy:'PRIVATE READING SPACE',noRegions:'If a bubble is missed, choose Add a text manually.',skip:'Skip page',reset:'Clear all pages',confirmReset:'Clear all pages and their unsaved notes?',recognition:'Recognized dialogue',ocrDone:'Text recognized · preparing explanations',retryExplanation:'Retry explanations',needExplanation:'Explanations are not ready yet. Your transcription is preserved.',hint:'Words can have context-dependent readings; check uncertain results against the image.',newPage:'Add another manga page'},
    es:{title:'Lector de manga',subtitle:'Leé páginas reales en japonés a tu ritmo',choose:'Agregar páginas de manga',empty:'Arrastrá páginas acá o elegí archivos para comenzar.',read:'Analizar esta página',all:'Analizar todas',retry:'Reintentar',add:'Agregar páginas',remove:'Quitar página',signIn:'Iniciar sesión con Google para analizar',signed:'Solo necesitás iniciar sesión para el análisis online.',noSave:'Las páginas y los resultados quedan en esta pestaña. No se sincronizan ni se guardan entre visitas.',sent:'Al analizar, la imagen se envía a Google Gemini mediante tu función de Supabase.',noItems:'No se detectaron diálogos. Podés agregar texto japonés manualmente.',noAnalysis:'Elegí Analizar para reconocer el japonés de esta página.',working:'Reconociendo texto japonés…',line:'Texto',readPrompt:'Escribí esto en romaji',check:'Comprobar lectura',show:'Mostrar lectura y traducción',hide:'Ocultar respuesta',words:'Significado de palabras',edit:'Corregir japonés detectado',saveEdit:'Actualizar explicación',cancel:'Cancelar',addText:'Agregar texto manualmente',correct:'¡Muy bien!',incorrect:'No coincide. Probá de nuevo o revelá la respuesta.',romaji:'Lectura (romaji)',english:'Traducción al inglés',notReady:'Iniciá sesión y publicá la función de Manga Reader para activar el análisis.',error:'No se pudo analizar esta página.',done:'Página analizada.',pending:'Lista para analizar',processing:'Analizando',completed:'Analizada',manual:'Texto manual',yourReading:'Tu lectura',loadError:'No se pudieron leer esos archivos.',long:'Las páginas se conservan solo hasta que cierres o recargues la app.',help:'Podés intentar el romaji primero y después revelar la lectura o el significado de cada palabra. El OCR y las traducciones pueden equivocarse.',continue:'Página siguiente',chooseNext:'Elegí una página arriba.',noInternet:'Manga Reader necesita internet para el análisis. Los demás modos siguen funcionando offline.',tooMany:'Hasta 16 páginas por lote.',bigFile:'Un archivo supera los 18 MB.',invalid:'Elegí imágenes PNG, JPG o WEBP.',missing:'Ingresá primero un texto en japonés.',editing:'Corregí el OCR y actualizá la explicación.',reveal:'Revelar palabras',hideWords:'Ocultar palabras',noWords:'No hay desglose disponible. Probá actualizar la explicación.',failed:'Sin analizar',processingMany:'Analizando página',of:'de',analyzed:'Terminado',cancelAnalysis:'Detener análisis',close:'Volver a selección',needLogin:'Iniciá sesión con Google en Mi progreso o usá el botón acá. Las páginas no se sincronizan.',privacy:'ESPACIO DE LECTURA PRIVADO',noRegions:'Si falta una burbuja, elegí Agregar texto manualmente.',skip:'Saltar página',reset:'Limpiar páginas',confirmReset:'¿Borrar todas las páginas y notas temporales?',recognition:'Diálogos reconocidos',ocrDone:'Texto reconocido · preparando explicaciones',retryExplanation:'Reintentar explicaciones',needExplanation:'Las explicaciones todavía no están listas. El texto reconocido se conserva.',hint:'Las lecturas pueden cambiar según el contexto: revisá los resultados dudosos contra la imagen.',newPage:'Agregar otra página'}
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
  }
  function showReader() {
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
    $('mangaAnalyze').disabled=!page||running;
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
    $('mangaAnalyze').textContent=page.status==='completed'?t('retry'):page.status==='transcribed'?t('retryExplanation'):t('read');
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
    const files=[...fileList];
    if(!files.length)return;
    const validTypes=['image/jpeg','image/png','image/webp'];
    if(files.some(file=>!validTypes.includes(file.type)))return toast(t('invalid'),true);
    if(files.some(file=>file.size>MAX_FILE))return toast(t('bigFile'),true);
    if(files.length+pages.length>MAX_PAGES)return toast(t('tooMany'),true);
    for(const file of files){
      const page={id:uuid(),name:file.name,file,url:URL.createObjectURL(file),items:[],status:'pending'};
      pages.push(page);
      if(!activeId)activeId=page.id;
    }
    toast('');
    render();
  }
  function removePage() {
    if(running)return;
    const page=currentPage();if(!page)return;
    URL.revokeObjectURL(page.url);
    pages.splice(pages.indexOf(page),1);
    activeId=pages[0]?.id||null;
    selectedItem=null;
    render();
  }
  function clearAll() {
    if(running||!confirm(t('confirmReset')))return;
    for(const page of pages)URL.revokeObjectURL(page.url);
    pages.length=0;
    activeId=null;
    selectedItem=null;
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
    return base64;
  }
  async function sendRequest(payload) {
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
  async function analyzePage(page) {
    if(page.status!=='transcribed'){
      page.status='processing';render();
      const data=await imageForAPI(page.file);
      const result=await sendRequest({mode:'image',imageData:data,mimeType:'image/jpeg'});
      if(!Array.isArray(result.segments))throw new Error('The transcription did not return Japanese dialogue.');
      page.items=result.segments.map(raw=>toItem(raw)).filter(item=>item.japanese);
      page.status=page.items.length?'transcribed':'completed';
      if(activeId===page.id)selectedItem=page.items[0]?.id||null;
      render();
    }
    const remaining=page.items.filter(item=>!item.romaji&&!item.dirty);
    if(!remaining.length){page.status='completed';render();return;}
    page.status='transcribed';render();
    for(let offset=0;offset<remaining.length;offset+=12){
      const group=remaining.slice(offset,offset+12);
      const original=group.map(item=>({id:item.id,japanese:item.japanese}));
      const details=await sendRequest({mode:'explain',segments:original.map(item=>({japanese:item.japanese}))});
      if(!Array.isArray(details.segments))throw new Error('Gemini did not return the requested explanations.');
      original.forEach((source,index)=>{
        const item=page.items.find(entry=>entry.id===source.id);
        const detail=details.segments[index];
        if(!item||!detail||item.japanese!==source.japanese||!detail.romaji)return;
        Object.assign(item,toItem({...detail,japanese:item.japanese,bbox:item.bbox},item));
      });
      render();
    }
    page.status=page.items.every(item=>item.romaji)?'completed':'transcribed';
    render();
  }
  async function runAnalyze(all=false) {
    if(running)return;
    if(!navigator.onLine){toast(t('noInternet'),true);return;}
    const auth=cloud.getStatus();
    if(!auth.user){toast(t('needLogin'),true);$('mangaLogin').hidden=false;return;}
    running=true;
    analyzeAll=all;
    render();
    const queue=all?pages.filter(page=>page.status!=='completed'):currentPage()?[currentPage()]:[];
    let ix=0;
    for(const page of queue){
      if(all&&!analyzeAll)break;
      ix++;
      toast(all?`${t('processingMany')} ${ix} ${t('of')} ${queue.length}: ${page.name}`:t('working'));
      try{await analyzePage(page);toast(`${t('done')} ${page.name}`);}
      catch(err){if(page.status!=='transcribed')page.status='pending';toast(`${t('error')} ${err.message||err}`,true);if(all)break;}
      if(all && !analyzeAll)break;
      render();
    }
    running=false;analyzeAll=false;render();
  }
  async function analyzeText(page,item,corrected) {
    const newText=String(corrected||'').trim();
    if(!newText){toast(t('missing'),true);return;}
    if(!cloud.getStatus().user){toast(t('needLogin'),true);return;}
    item.dirty=true;item.editing=false;item.japanese=newText;item.revealed=false;item.showWords=false;
    render();
    try{
      toast(t('working'));
      const result=await sendRequest({mode:'text',text:newText});
      const replacement=result.segments?.[0];
      if(!replacement)throw new Error('Could not explain that text.');
      Object.assign(item,toItem({...replacement,japanese:newText},item));
      toast(t('done'));
    }catch(err){toast(err.message||String(err),true);item.dirty=true;}
    render();
  }
  async function addText() {
    const page=currentPage();if(!page)return;
    const item=toItem({japanese:'',words:[]},{id:uuid(),manual:true});
    item.japanese=lang()==='es'?'Pegá o escribí el texto japonés':'Paste or type Japanese text';
    item.editing=true;item.dirty=true;
    page.items.push(item);page.status='completed';selectedItem=item.id;
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
    cloud?.subscribe?.(()=>{if(!$('mangaScreen').hidden){const logged=Boolean(cloud.getStatus().user);$('mangaLogin').hidden=logged;$('mangaLoginTop').hidden=logged;}});
    window.addEventListener('beforeunload',()=>{for(const page of pages)URL.revokeObjectURL(page.url);});
    updateText();
  }
  attach();
  window.KTFMangaReader={open:showReader};
})();
