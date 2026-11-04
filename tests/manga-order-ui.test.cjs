const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const {webcrypto} = require('node:crypto');

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

test('pages keep upload order despite asynchronous hashing and manual arrow moves survive chapter reopen without paid AI requests',async()=>{
  const source = fs.readFileSync(path.join(__dirname,'..','manga-reader.js'),'utf8');
  const uid='owner';
  const records=new Map();
  const hashes={A:'a'.repeat(64),B:'b'.repeat(64),C:'c'.repeat(64)};
  for(const [name,hash] of Object.entries(hashes)){
    records.set(hash,{hash,name:`${name}.png`,imageBlob:new Blob([name],{type:'image/jpeg'}),status:'completed',ocrVersion:'vocr',explainVersion:'vexplain',items:[{japanese:name,romaji:name.toLowerCase(),reading:name,english:name,words:[],kanji:[]}]});
  }
  let chapter=null;
  let postCalls=0;
  let reorderCalls=0;
  const cache={OCR_VERSION:'vocr',EXPLAIN_VERSION:'vexplain',
    async fileHash(file){await wait(file.name==='A.png'?36:file.name==='B.png'?5:19);return hashes[file.name[0]]},
    async read(_owner,hash){return records.get(hash)||null},
    async save(){},async list(){return [...records.values()]},async listChapters(){return chapter?[chapter]:[]},
    async saveChapter(_owner,info){chapter={...info,pages:[],owner:uid}},
    async addPageToChapter(_owner,id,page){if(chapter?.id===id&&!chapter.pages.some(x=>x.hash===page.hash))chapter.pages.push(page)},
    async reorderChapter(_owner,id,hashOrder){reorderCalls++;const rank=new Map(hashOrder.map((hash,i)=>[hash,i]));chapter.pages.sort((a,b)=>(rank.get(a.hash)??100)-(rank.get(b.hash)??100))},
    async readChapter(){return chapter},async renameChapter(){},async removePageFromChapter(){},async removeChapter(){},
    async readText(){return null},async saveText(){},async clear(){},async remove(){}
  };
  const elements=new Map();
  const el=id=>{
    if(!elements.has(id)){
      const handlers=new Map();
      elements.set(id,{id,hidden:id==='openMangaButton'||id==='mangaScreen'||id==='examScreen',dataset:{},style:{},
        value:id==='mangaSeriesName'?'Blue Manga':id==='mangaChapterName'?'Capítulo #1':'',innerHTML:'',disabled:false,
        classList:{add(){},remove(){},toggle(){}},addEventListener(type,fn){handlers.set(type,fn)},
        setAttribute(name,value){this[name]=value},scrollIntoView(){},focus(){},querySelectorAll(){return []},
        get textContent(){return this._text||''},set textContent(v){this._text=v},handlers});
    }
    return elements.get(id);
  };
  const doc={hidden:false,getElementById:el,querySelectorAll:()=>[],addEventListener(){},dispatchEvent(){}};
  const cloud={getStatus:()=>({user:{id:uid}}),getAccessToken:async()=> 'test-token',subscribe(){}};
  const window={KTFCloud:cloud,KTFBridge:{getLanguage:()=> 'es',isQuizActive:()=>false},KTFMangaCache:cache,
    KTF_CONFIG:{SUPABASE_URL:'https://demo.supabase.co',SUPABASE_PUBLISHABLE_KEY:'anon'},addEventListener(){}};
  const fakeUrl={createObjectURL:()=>`blob:${Math.random()}`,revokeObjectURL(){}};
  const sandbox={window,document:doc,navigator:{onLine:true},URL:fakeUrl,crypto:webcrypto,File,Blob,
    fetch:async (_url,opt)=>{if(opt.method==='GET')return {ok:true,json:async()=>({allowed:true})};postCalls++;throw new Error('An unexpected OpenAI call occurred')},
    CustomEvent:class{constructor(type){this.type=type}},AbortController,setTimeout,clearTimeout,confirm:()=>true,console};
  vm.runInNewContext(source,sandbox);
  await wait(20);
  el('openMangaButton').handlers.get('click')();
  const files=['A','B','C'].map(name=>new File(['raw'],`${name}.png`,{type:'image/png'}));
  el('mangaFiles').handlers.get('change')({target:{files,value:'test'}});
  await wait(95);
  assert.deepEqual(chapter.pages.map(p=>p.hash),[hashes.A,hashes.B,hashes.C]);
  assert.equal(postCalls,0);
  assert.ok(reorderCalls>=1);
  assert.match(el('mangaPageStrip').innerHTML,/data-move-left=/);
  const firstId=el('mangaPageStrip').innerHTML.match(/data-page="([^"]+)"/)[1];
  el('mangaPageStrip').handlers.get('click')({target:{closest:selector=>selector==='[data-move-right]'?{dataset:{moveRight:firstId}}:null}});
  await wait(60);
  assert.deepEqual(chapter.pages.map(p=>p.hash),[hashes.B,hashes.A,hashes.C]);
  assert.equal(postCalls,0);
  el('mangaHistoryList').handlers.get('click')({target:{closest:selector=>selector==='[data-chapter-open]'?{dataset:{chapterOpen:chapter.id}}:null}});
  await wait(45);
  assert.equal(el('mangaPageName').textContent,'B.png');
  assert.deepEqual(chapter.pages.map(p=>p.hash),[hashes.B,hashes.A,hashes.C]);
  assert.equal(postCalls,0);
});
