const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const {webcrypto} = require('node:crypto');

const delay = ms => new Promise(resolve => setTimeout(resolve,ms));

test('manga region highlights open on cached pages and manually marked bubbles persist without paid requests',async()=>{
  const src=fs.readFileSync(path.join(__dirname,'..','manga-reader.js'),'utf8');
  const uid='my-user-id';
  const hash='7'.repeat(64);
  const saved={hash,name:'chapter1-page1.jpg',imageBlob:new Blob(['jpeg'],{type:'image/jpeg'}),status:'completed',ocrVersion:'vocr',explainVersion:'vexplain',items:[
    {japanese:'こんにちは',reading:'こんにちは',romaji:'konnichiwa',english:'hello',words:[],kanji:[],bbox:[100,200,300,400]},
    {japanese:'ありがとう',reading:'ありがとう',romaji:'arigatou',english:'thanks',words:[],kanji:[],bbox:null}
  ]};
  const chapter={id:'chapter1',owner:uid,mangaTitle:'Example Manga',chapterTitle:'Chapter #1',pages:[{hash,name:saved.name}]};
  let writes=0;
  let postCalls=0;
  const cache={OCR_VERSION:'vocr',EXPLAIN_VERSION:'vexplain',
    async read(){return saved},async save(_id,record){writes++;Object.assign(saved,record)},async list(){return [saved]},
    async listChapters(){return [chapter]},async readChapter(){return chapter},async renameChapter(){},
    async remove(){},async clear(){},async fileHash(){return hash},async textHash(){return 'textHash'},
    async readText(){return null},async saveText(){},async reorderChapter(){},async addPageToChapter(){}
  };
  const nodes=new Map();
  const el=id=>{
    if(!nodes.has(id)){
      const handlers=new Map();
      const obj={id,handlers,hidden:id==='openMangaButton'||id==='mangaScreen'||id==='examScreen',dataset:{},
        style:{},innerHTML:'',value:id==='mangaSeriesName'?'Example Manga':id==='mangaChapterName'?'Chapter #1':'',
        classList:{toggle(){},add(){},remove(){}},addEventListener(type,cb){handlers.set(type,cb)},
        setAttribute(){},focus(){},scrollIntoView(){},querySelectorAll(){return []},
        getBoundingClientRect(){return {top:0,left:0,width:500,height:1000}},
        get textContent(){return this._text||''},set textContent(value){this._text=value}
      };
      nodes.set(id,obj);
    }
    return nodes.get(id);
  };
  const document={hidden:false,getElementById:el,querySelectorAll:()=>[],addEventListener(){},dispatchEvent(){}};
  const cloud={getStatus:()=>({user:{id:uid}}),getAccessToken:async()=> 'token',subscribe(){}};
  const window={KTFCloud:cloud,KTFBridge:{getLanguage:()=> 'es',isQuizActive:()=>false},KTFMangaCache:cache,
    KTF_CONFIG:{SUPABASE_URL:'https://example.supabase.co',SUPABASE_PUBLISHABLE_KEY:'publishable'},addEventListener(){}};
  const fakeURL={createObjectURL:()=> 'blob:page',revokeObjectURL(){}};
  vm.runInNewContext(src,{window,document,navigator:{onLine:true},URL:fakeURL,crypto:webcrypto,File,Blob,
    fetch:async(_url,req)=>{if(req.method==='GET')return {ok:true,json:async()=>({allowed:true})};postCalls++;throw new Error('unexpected AI call')},
    CustomEvent:class{constructor(name){this.type=name}},setTimeout,clearTimeout,AbortController,confirm:()=>true,console});
  await delay(20);
  el('openMangaButton').handlers.get('click')();
  el('mangaHistoryList').handlers.get('click')({target:{closest:selector=>selector==='[data-chapter-open]'?{dataset:{chapterOpen:'chapter1'}}:null}});
  await delay(50);
  assert.equal(el('mangaHighlight').hidden,false);
  assert.equal(el('mangaHighlight').style.top,'10%');
  assert.equal(el('mangaHighlight').style.left,'20%');
  const ids=[...el('mangaReadings').innerHTML.matchAll(/data-locate="([^"]+)"/g)].map(match=>match[1]);
  assert.equal(ids.length,2);
  el('mangaReadings').handlers.get('focusin')({target:{closest:selector=>selector==='[data-item]'?{dataset:{item:ids[1]}}:null}});
  assert.equal(el('mangaHighlight').hidden,true);
  assert.equal(el('mangaLocateHint').hidden,false);
  el('mangaReadings').handlers.get('click')({target:{closest:selector=>{
    if(selector==='[data-item]')return {dataset:{item:ids[1]}};
    if(selector==='button')return {dataset:{locate:ids[1]}};
    return null;
  }}});
  assert.match(el('mangaReadings').innerHTML,/Cancelar marcado/);
  const img=el('mangaImage');
  img.handlers.get('pointerdown')({pointerId:1,pointerType:'mouse',button:0,clientX:100,clientY:120,preventDefault(){}});
  img.handlers.get('pointermove')({pointerId:1,clientX:190,clientY:330,preventDefault(){}});
  await img.handlers.get('pointerup')({pointerId:1,clientX:190,clientY:330});
  assert.ok(writes>0);
  assert.deepEqual(JSON.parse(JSON.stringify(saved.items[1].bbox)),[120,200,330,380]);
  assert.equal(el('mangaHighlight').hidden,false);
  assert.equal(el('mangaHighlight').style.left,'20%');
  assert.equal(postCalls,0);
  el('mangaHistoryList').handlers.get('click')({target:{closest:selector=>selector==='[data-chapter-open]'?{dataset:{chapterOpen:'chapter1'}}:null}});
  await delay(35);
  const idsAfter=[...el('mangaReadings').innerHTML.matchAll(/data-locate="([^"]+)"/g)].map(match=>match[1]);
  el('mangaReadings').handlers.get('focusin')({target:{closest:selector=>selector==='[data-item]'?{dataset:{item:idsAfter[1]}}:null}});
  assert.equal(el('mangaHighlight').hidden,false);
  assert.equal(el('mangaHighlight').style.top,'12%');
  assert.equal(postCalls,0);
});
