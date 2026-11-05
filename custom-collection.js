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
      practiceTitle:'Personal practice',question:'Question',askReading:'Write the romaji reading',askMeaning:'Write the meaning',answer:'Your answer',check:'Check',skip:'I do not know',next:'Next question →',finish:'Finish practice',end:'Back to collection',correct:'Correct!',wrong:'Not quite',answerWas:'Expected answer:',noQuestions:'Choose at least one item with a meaning or romaji reading.',result:'Session completed',success:'Correct answers',attempts:'Attempts',practiceHint:'Practice results are saved in your account too.',count:'correct',review:'Review',imported:'Saved from manga', select:'Select for practice', remaining:'questions remaining'
    },
    es: {
      nav:'Custom',back:'← Volver a selección',backManga:'← Volver al lector de manga',eyebrow:'✦ TU MAZO PERSONAL',title:'Caracteres y palabras custom',intro:'Guardá kanjis y vocabulario del Manga Reader, o agregá los que quieras, y practicalos cuando quieras.',
      
      add:'Agregar carácter o palabra',addButton:'Agregar custom',closeEditor:'Cerrar editor',kind:'Tipo',kanji:'Kanji / carácter',word:'Palabra / expresión',japanese:'Texto japonés',reading:'Lectura en romaji (opcional)',kana:'Lectura en kana (opcional)',meaning:'Significado (opcional)',notes:'Notas (opcional)',save:'Guardar en mi colección',update:'Guardar cambios',cancel:'Cancelar edición',source:'Origen',manual:'Agregado manualmente',manga:'Manga Reader',list:'Mi colección',all:'Todos',onlyKanji:'Caracteres',onlyWords:'Palabras',search:'Buscar carácter, lectura o significado…',empty:'No hay elementos con ese filtro. Agregá uno acá o guardalo directamente desde un manga.',
      total:'guardados',selectAll:'Seleccionar visibles',selectNone:'Deseleccionar visibles',selected:'seleccionados',study:'Practicar seleccionados',mode:'Modo de práctica',mixed:'Mixto',readingMode:'Lectura en romaji',meaningMode:'Significado',edit:'Editar',remove:'Eliminar',confirm:'¿Eliminar este elemento de tu colección?',duplicates:'Ya tenés este elemento guardado.',added:'Agregado a tus caracteres custom.',saved:'Cambios guardados.',deleted:'Eliminado de tus caracteres custom.',invalid:'Ingresá un carácter o una palabra japonesa.',
      practiceTitle:'Práctica personalizada',question:'Pregunta',askReading:'Escribí la lectura en romaji',askMeaning:'Escribí el significado',answer:'Tu respuesta',check:'Comprobar',skip:'No sé',next:'Siguiente →',finish:'Terminar práctica',end:'Volver a la colección',correct:'¡Correcto!',wrong:'No del todo',answerWas:'Respuesta esperada:',noQuestions:'Seleccioná al menos un elemento con significado o lectura en romaji.',result:'Práctica terminada',success:'Respuestas correctas',attempts:'Intentos',practiceHint:'Tus resultados también se guardan en tu cuenta.',count:'aciertos',review:'Repaso',imported:'Guardado desde el manga',select:'Seleccionar para practicar',remaining:'preguntas restantes'
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
    $('customPracticeExit').textContent = t('end');
    $('customPracticeCheck').textContent = t('check');
    $('customPracticeAnswerLabel').textContent = t('answer');
    $('customPracticeSkip').textContent = t('skip');
    $('customPracticeNext').textContent = t('next');
  }
  function renderList() {
    labelText();
    const displayed = visible();
    $('customTotal').textContent = `${items.length} ${t('total')}`;
    $('customSelected').textContent = `${selected.size} ${t('selected')}`;
    $('customPracticeButton').disabled = !selected.size;
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
    if (window.KTFBridge?.isQuizActive?.() || !$('examScreen').hidden) {
      window.alert(language() === 'es' ? 'Terminá tu práctica antes de abrir Custom.' : 'Finish your practice before opening Custom.');
      return;
    }
    returnView = !$('mangaScreen').hidden ? 'manga' : 'setup';
    for (const name of ['setupScreen','quizScreen','summaryScreen','examScreen','mangaScreen']) if ($(name)) $(name).hidden = true;
    $('customScreen').hidden = false;
    $('customPractice').hidden = true;
    $('customBrowse').hidden = false;
    practice = null;
    hideEditor();
    renderList();
    refresh().catch(error => notify(error.message || String(error),true));
    $('customScreen').scrollIntoView({block:'start',behavior:'instant'});
  }
  function close(forceSetup = false) {
    hideEditor();
    $('customScreen').hidden = true;
    const backToManga = !forceSetup && returnView === 'manga' && !$('openMangaButton').hidden;
    $('mangaScreen').hidden = !backToManga;
    $('setupScreen').hidden = backToManga;
    practice = null;
    returnView = 'setup';
    (backToManga ? $('mangaScreen') : $('setupScreen')).scrollIntoView({block:'start',behavior:'instant'});
  }
  const splitAnswers = value => String(value || '').split(/[;,/|、，；]/g).map(normalize).filter(Boolean);
  function accepted(value, expected, kind) {
    const answer = normalize(value).replace(/[.!?。！？]+$/g,'');
    const options = splitAnswers(expected);
    if (!answer || !options.length) return false;
    if (kind === 'romaji') return options.some(option => option.replace(/[\s.'-]/g,'') === answer.replace(/[\s.'-]/g,''));
    return options.includes(answer);
  }
  function questionBank() {
    const mode = $('customMode').value;
    const bank = [];
    for (const item of items.filter(row => selected.has(row.id))) {
      const types = [];
      if (mode !== 'meaning' && item.romaji) types.push('romaji');
      if (mode !== 'romaji' && item.meaning) types.push('meaning');
      if (!types.length) continue;
      const type = types[Math.floor(Math.random()*types.length)];
      bank.push({item,type});
    }
    for (let i=bank.length-1;i>0;i--) {const j=Math.floor(Math.random()*(i+1));[bank[i],bank[j]]=[bank[j],bank[i]];}
    return bank.slice(0,20);
  }
  function startPractice() {
    const bank = questionBank();
    if (!bank.length) {notify(t('noQuestions'),true);return;}
    practice = {bank,index:0,correct:0,answered:0,checked:false,lastCorrect:false};
    $('customBrowse').hidden = true;
    $('customPractice').hidden = false;
    renderPractice();
  }
  function renderPractice() {
    if (!practice) return;
    const {bank,index} = practice;
    $('customPracticeTitle').textContent = t('practiceTitle');
    const item = bank[index];
    if (!item) {
      $('customPracticeQuestion').textContent = t('result');
      $('customPracticeSymbol').textContent = `${practice.correct} / ${practice.answered}`;
      $('customPracticeInfo').textContent = `${t('success')}: ${practice.correct} · ${t('attempts')}: ${practice.answered}. ${t('practiceHint')}`;
      $('customPracticeForm').hidden = true;
      $('customPracticeProgress').textContent = '';
      $('customPracticeNext').hidden = true;
      $('customPracticeExit').textContent = t('end');
      return;
    }
    $('customPracticeForm').hidden = false;
    $('customPracticeQuestion').textContent = t(item.type === 'romaji' ? 'askReading' : 'askMeaning');
    $('customPracticeSymbol').textContent = item.item.surface;
    $('customPracticeInfo').textContent = `${item.item.kind === 'kanji' ? t('kanji') : t('word')} · ${t('review')}`;
    $('customPracticeProgress').textContent = `${t('question')} ${index + 1} / ${bank.length}`;
    $('customPracticeAnswer').value = '';
    $('customPracticeAnswer').disabled = false;
    $('customPracticeCheck').disabled = false;
    $('customPracticeSkip').hidden = false;
    $('customPracticeFeedback').hidden = true;
    $('customPracticeNext').hidden = true;
    $('customPracticeCheck').textContent = t('check');
    $('customPracticeSkip').textContent = t('skip');
    practice.checked = false;
    $('customPracticeAnswer').focus({preventScroll:true});
  }
  async function checkPractice(skipped = false) {
    if (!practice || practice.checked) return;
    const question = practice.bank[practice.index];
    if (!question) return;
    const expected = question.type === 'romaji' ? question.item.romaji : question.item.meaning;
    const answer = $('customPracticeAnswer').value;
    if (!skipped && !answer.trim()) return;
    const correct = !skipped && accepted(answer,expected,question.type);
    practice.checked = true;
    practice.answered++;
    if (correct) practice.correct++;
    const feedback = $('customPracticeFeedback');
    feedback.hidden = false;
    feedback.classList.toggle('is-correct',correct);
    feedback.classList.toggle('is-wrong',!correct);
    feedback.textContent = `${t(correct?'correct':'wrong')} ${t('answerWas')} ${expected}${question.item.kana ? ` (${question.item.kana})` : ''}`;
    $('customPracticeAnswer').disabled = true;
    $('customPracticeCheck').disabled = true;
    $('customPracticeSkip').hidden = true;
    $('customPracticeNext').hidden = false;
    $('customPracticeNext').textContent = practice.index === practice.bank.length - 1 ? t('finish') : t('next');
    try { await persist('custom_review',{itemId:question.item.id,correct,mode:question.type,answeredAt:new Date().toISOString()}); }
    catch (error) {notify(error.message || String(error),true);}
    $('customPracticeNext').focus({preventScroll:true});
  }
  function finishPractice() {
    practice = null;
    $('customBrowse').hidden = false;
    $('customPractice').hidden = true;
    renderList();
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
    $('customPracticeButton').disabled = !selected.size;
    $('customCharacterCount').textContent = String(items.filter(item => item.kind === 'kanji' && selected.has(item.id)).length);
    $('customWordCount').textContent = String(items.filter(item => item.kind === 'word' && selected.has(item.id)).length);
    $('customAllCount').textContent = String(selected.size);
  }
  function attach() {
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
    $('customPracticeButton').addEventListener('click',startPractice);
    $('customPracticeForm').addEventListener('submit',event => {event.preventDefault();checkPractice().catch(() => {});});
    $('customPracticeSkip').addEventListener('click',()=>checkPractice(true).catch(() => {}));
    $('customPracticeNext').addEventListener('click',()=>{if (!practice)return;practice.index++;renderPractice();});
    $('customPracticeExit').addEventListener('click',finishPractice);
    cloud.subscribe(() => {
      if (owner !== currentOwner()) {loaded = false;practice = null;if(isOpen()){ $('customBrowse').hidden=false;$('customPractice').hidden=true;hideEditor(); }}
      refresh().catch(() => {});
    });
    document.addEventListener('ktf:languagechange',()=>{labelText();if (isOpen() && !practice) renderList();if (practice)renderPractice();});
    window.addEventListener('ktf:custom-added',event => {addFromManga(event.detail.kind,event.detail.item,event.detail.source).catch(error => notify(String(error.message||error),true));});
    document.addEventListener('keydown',event => {if(isOpen() && event.key === 'Escape' && !practice && !$('customEditorDialog').open) close();});
  }
  window.KTFCustomCollection = {addFromManga,refresh,open,isSaved};
  attach();
  refresh().catch(() => {});
})();
