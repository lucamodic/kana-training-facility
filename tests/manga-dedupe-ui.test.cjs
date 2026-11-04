const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const {webcrypto} = require('node:crypto');

const delay = ms => new Promise(resolve=>setTimeout(resolve,ms));

test('saved manga is deduped without requests, and user can remove one dialogue without losing other explanations',async()=>{
  const src=fs.readFileSync(path.join(__dirname,'..','manga-reader.js'),'utf8');
  const uid='owner-uuid';
  const hash='9'.repeat(64);
  const a='カウンター越しにつまんなそうにしている';
  const b='黒ずくめのおにーさんだ';
  const mk=(japanese,bbox)=>({japanese,reading:japanese,romaji:`reading-${japanese}`,english:`meaning-${japanese}`,words:[],kanji:[],bbox,manual:false});
  const saved={hash,name:'page.jpg',imageBlob:new Blob(['jpeg'],{type:'image/jpeg'}),status:'completed',ocrVersion:'vocr',explainVersion:'vexplain',items:[
    mk(a,[50,700,200,880]),mk(b,[220,200,330,450]),mk(`${a}\n${b}`,null),mk('はい',[400,700,500,800]),mk('はい',[600,100,700,200])
  ]};
  const chapter={id:'chapter1',owner:uid,mangaTitle:'Test manga',chapterTitle:'Chapter 1',pages:[{hash,name:saved.name}]};
  let writes=0,postCalls=0;
  const cache={OCR_VERSION:'vocr',EXPLAIN_VERSION:'vexplain',
    read:async()=>saved,save:async(_uid,record)=>{writes++;Object.assign(saved,record)},list:async()=>[saved],
    listChapters:async()=>[chapter],readChapter:async()=>chapter,renameChapter:async()=>{},
    remove:async()=>{},clear:async()=>{},fileHash:async()=>hash,textHash:async()=>hash,
    readText:async()=>null,saveText:async()=>{},reorderChapter:async()=>{},addPageToChapter:async()=>{}
  };
  const nodes=new Map();
  const el=id=>{
    if(!nodes.has(id)){
      const handlers=new Map();
      nodes.set(id,{id,handlers,hidden:id==='openMangaButton'||id==='mangaScreen'||id==='examScreen',
        dataset:{},style:{},innerHTML:'',value:id==='mangaSeriesName'?'Test manga':id==='mangaChapterName'?'Chapter 1':'',
        classList:{toggle(){},add(){},remove(){}},addEventListener(type,fn){handlers.set(type,fn)},
        setAttribute(){},focus(){},scrollIntoView(){},querySelectorAll(){return []},
        get textContent(){return this._text||''},set textContent(v){this._text=v}});
    }
    return nodes.get(id);
  };
  const document={hidden:false,getElementById:el,querySelectorAll:()=>[],addEventListener(){},dispatchEvent(){}};
  const cloud={getStatus:()=>({user:{id:uid}}),getAccessToken:async()=> 'token',subscribe(){}};
  const window={KTFCloud:cloud,KTFBridge:{getLanguage:()=> 'es',isQuizActive:()=>false},KTFMangaCache:cache,
    KTF_CONFIG:{SUPABASE_URL:'https://example.supabase.co',SUPABASE_PUBLISHABLE_KEY:'publishable'},addEventListener(){}};
  const fakeURL={createObjectURL:()=> 'blob:page',revokeObjectURL(){}};
  let confirmationCount=0;
  vm.runInNewContext(src,{window,document,navigator:{onLine:true},URL:fakeURL,crypto:webcrypto,File,Blob,
    fetch:async(_url,req)=>{if(req.method==='GET')return {ok:true,json:async()=>({allowed:true})};postCalls++;throw new Error('Unexpected paid request')},
    CustomEvent:class{constructor(type){this.type=type}},setTimeout,clearTimeout,AbortController,
    confirm:()=>{confirmationCount++;return true},console});
  await delay(20);
  el('openMangaButton').handlers.get('click')();
  el('mangaHistoryList').handlers.get('click')({target:{closest:selector=>selector==='[data-chapter-open]'?{dataset:{chapterOpen:'chapter1'}}:null}});
  await delay(50);
  assert.deepEqual(Array.from(saved.items,item=>item.japanese),[a,b,'はい','はい']);
  assert.equal(el('mangaPageState').textContent,'Analizada · 4');
  assert.ok(writes>0);
  assert.equal(postCalls,0);
  assert.match(el('mangaReadings').innerHTML,/Quitar texto/);
  const ids=[...el('mangaReadings').innerHTML.matchAll(/data-remove-item="([^"]+)"/g)].map(match=>match[1]);
  assert.equal(ids.length,4);
  const id=ids[1];
  el('mangaReadings').handlers.get('click')({target:{closest:selector=>{
    if(selector==='button')return {dataset:{removeItem:id}};
    if(selector==='[data-item]')return {dataset:{item:id}};
    return null;
  }}});
  await delay(40);
  assert.equal(confirmationCount,1);
  assert.deepEqual(Array.from(saved.items,item=>item.japanese),[a,'はい','はい']);
  assert.equal(saved.items[0].english,`meaning-${a}`);
  assert.equal(el('mangaPageState').textContent,'Analizada · 3');
  assert.equal(postCalls,0);
  el('mangaHistoryList').handlers.get('click')({target:{closest:selector=>selector==='[data-chapter-open]'?{dataset:{chapterOpen:'chapter1'}}:null}});
  await delay(40);
  assert.equal(el('mangaPageState').textContent,'Analizada · 3');
  assert.equal(postCalls,0);
});
