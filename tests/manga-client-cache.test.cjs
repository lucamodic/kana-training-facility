const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const {webcrypto} = require('node:crypto');

test('a repeated uploaded manga image restores its complete local analysis without a paid request',async()=>{
  const source=fs.readFileSync(path.join(__dirname,'..','manga-reader.js'),'utf8');
  const elements=new Map();
  const fileHandlers=new Map();
  const subscribers=[];
  const uid='owner-uuid';
  let currentUser={id:uid};
  let postCalls=0;
  const original={hash:'a'.repeat(64),name:'page.png',imageBlob:new Blob(['small compressed jpeg']),ocrVersion:'vocr',explainVersion:'vexplain',updatedAt:Date.now(),items:[{japanese:'こんにちは',romaji:'konnichiwa',reading:'こんにちは',english:'Hello',words:[],kanji:[],bbox:null,manual:false}],status:'completed'};
  const cache={savePosition:async()=>{},OCR_VERSION:'vocr',EXPLAIN_VERSION:'vexplain',fileHash:async()=>original.hash,
    read:async(account,hash)=>account===uid&&hash===original.hash?original:null,
    list:async()=>[original],save:async()=>{},remove:async()=>{},clear:async()=>{},
    listChapters:async()=>[{id:'chapter-a',owner:uid,mangaTitle:'Green Manga',chapterTitle:'Capítulo #1',pages:[{hash:original.hash,name:'page.png'}]}],
    saveChapter:async()=>{},addPageToChapter:async()=>{},readChapter:async(_u,id)=>id==='chapter-a'?{id,mangaTitle:'Green Manga',chapterTitle:'Capítulo #1',pages:[{hash:original.hash,name:'page.png'}]}:null,removeChapter:async()=>{},renameChapter:async()=>{},removePageFromChapter:async()=>{},
    textHash:async()=>original.hash,readText:async()=>null,saveText:async()=>{}};
  const el=id=>{
    if(!elements.has(id)){
      const handlers=new Map();
      const elem={id,hidden:id==='openMangaButton'||id==='mangaScreen'||id==='examScreen',dataset:{},style:{},value:id==='mangaSeriesName'?'Green Manga':id==='mangaChapterName'?'Capítulo #1':'',innerHTML:'',disabled:false,
        classList:{add(){},remove(){},toggle(){}},addEventListener(type,handler){handlers.set(type,handler)},setAttribute(name,value){this[name]=value},scrollIntoView(){},focus(){},
        get textContent(){return this._text||''},set textContent(value){this._text=value},handlers};
      elements.set(id,elem);
    }
    return elements.get(id);
  };
  const doc={hidden:false,getElementById:el,querySelectorAll:()=>[],addEventListener(){},dispatchEvent(){}};
  const cloud={getStatus:()=>({user:currentUser}),getAccessToken:async()=>currentUser?'token':null,subscribe:fn=>subscribers.push(fn)};
  const window={KTFCloud:cloud,KTFBridge:{getLanguage:()=> 'es',isQuizActive:()=>false},KTFMangaCache:cache,
    KTF_CONFIG:{SUPABASE_URL:'https://demo.supabase.co',SUPABASE_PUBLISHABLE_KEY:'anon'},addEventListener(){}};
  const localUrl={createObjectURL:()=>`blob:test-${Math.random()}`,revokeObjectURL(){}};
  const sandbox={window,document:doc,navigator:{onLine:true},URL:localUrl,crypto:webcrypto,Date,File,Blob,ArrayBuffer,
    fetch:async(_url,options)=>{
      if(options.method==='GET')return {ok:true,status:200,json:async()=>({allowed:true})};
      postCalls++;
      return {ok:true,status:200,text:async()=>JSON.stringify({segments:[]})};
    },CustomEvent:class {constructor(type,options){this.type=type;this.detail=options?.detail}},
    AbortController,setTimeout,clearTimeout,console,confirm:()=>true};
  vm.runInNewContext(source,sandbox);
  await new Promise(resolve=>setTimeout(resolve,30));
  assert.equal(el('openMangaButton').hidden,false);
  el('openMangaButton').handlers.get('click')();
  const file={name:'page.png',size:200,type:'image/png'};
  const input={files:[file],value:'x'};
  el('mangaFiles').handlers.get('change')({target:input});
  await new Promise(resolve=>setTimeout(resolve,45));
  assert.equal(el('mangaPageState').textContent,'Analizada · 1');
  assert.equal(el('mangaAnalyze').disabled,true);
  assert.equal(el('mangaReanalyze').hidden,false);
  assert.match(el('mangaReadings').innerHTML,/konnichiwa/);
  assert.equal(postCalls,0);
  el('mangaAnalyze').handlers.get('click')();
  await new Promise(resolve=>setTimeout(resolve,15));
  assert.equal(postCalls,0);
  el('mangaLibraryToggle').handlers.get('click')();
  await new Promise(resolve=>setTimeout(resolve,20));
  assert.match(el('mangaHistoryList').innerHTML,/Green Manga/);
  assert.match(el('mangaHistoryList').innerHTML,/Capítulo #1/);
  el('mangaHistoryList').handlers.get('click')({target:{closest:selector=>selector==='[data-chapter-open]'?{dataset:{chapterOpen:'chapter-a'}}:null}});
  await new Promise(resolve=>setTimeout(resolve,30));
  assert.equal(el('mangaPageState').textContent,'Analizada · 1');
  assert.equal(postCalls,0);
  currentUser=null;
  for(const fn of subscribers)fn();
  await new Promise(resolve=>setTimeout(resolve,15));
  assert.equal(el('openMangaButton').hidden,true);
  assert.equal(el('mangaScreen').hidden,true);
});
