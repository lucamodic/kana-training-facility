const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const {webcrypto} = require('node:crypto');

function fakeIndexedDB() {
  const stores = new Map();
  const db = {
    objectStoreNames:{contains:key=>stores.has(key)},
    createObjectStore(name){stores.set(name,new Map());return {};},
    close(){},
    transaction(name){
      const data = stores.get(name);
      let pending=0;
      let completeScheduled=false;
      const tx={onerror:null,onabort:null,oncomplete:null,error:null,abort(){},objectStore(storeName){
        assert.equal(storeName,name);
        function schedule(value,cb) {
          const request={result:null,onsuccess:null};
          pending++;
          queueMicrotask(()=>{
            request.result=value();
            request.onsuccess?.();
            pending--;
            maybeComplete();
          });
          return request;
        }
        return {
          get:key=>schedule(()=>data.get(key)),
          getAll:()=>schedule(()=>Array.from(data.values())),
          put:value=>schedule(()=>{data.set(value.key,structuredClone(value));return value.key;}),
          delete:key=>schedule(()=>data.delete(key)),
          openCursor(){
            const request={result:null,onsuccess:null};
            const keys=[...data.keys()];
            let ix=0;
            pending++;
            function step() {
              queueMicrotask(()=>{
                if(ix>=keys.length){request.result=null;request.onsuccess?.();pending--;maybeComplete();return;}
                const key=keys[ix++];
                request.result={value:data.get(key),delete(){data.delete(key)},continue:step};
                request.onsuccess?.();
              });
            }
            step();
            return request;
          }
        };
      }};
      function maybeComplete(){
        if(pending===0&&!completeScheduled){
          completeScheduled=true;
          queueMicrotask(()=>{if(pending===0)tx.oncomplete?.();else completeScheduled=false;});
        }
      }
      return tx;
    }
  };
  return {open(){
    const req={result:db,onupgradeneeded:null,onsuccess:null,onerror:null,onblocked:null};
    queueMicrotask(()=>{req.onupgradeneeded?.();req.onsuccess?.()});
    return req;
  }};
}

function makeCache(){
  const root=path.join(__dirname,'..');
  const script=fs.readFileSync(path.join(root,'manga-cache.js'),'utf8');
  const sandbox={window:{},indexedDB:fakeIndexedDB(),crypto:webcrypto,TextEncoder,Uint8Array,ArrayBuffer,Blob,File,Promise,Date,console};
  sandbox.window.indexedDB=sandbox.indexedDB;
  vm.runInNewContext(script,sandbox);
  return sandbox.window.KTFMangaCache;
}

test('SHA-256 recognizes the same uploaded manga file again',async()=>{
  const c=makeCache();
  const a=new File(['manga bytes'],'page.jpg',{type:'image/jpeg'});
  const b=new File(['manga bytes'],'duplicate-name.jpg',{type:'image/jpeg'});
  const d=new File(['different bytes'],'page.jpg',{type:'image/jpeg'});
  assert.equal(await c.fileHash(a),await c.fileHash(b));
  assert.notEqual(await c.fileHash(a),await c.fileHash(d));
});

test('cache persists compressed image, OCR and explanations across calls',async()=>{
  const c=makeCache();
  const hash=await c.fileHash(new File(['raw-image'],'page.jpg'));
  const imageBlob=new Blob(['compressed jpeg'],{type:'image/jpeg'});
  const items=[{japanese:'おはよう',bbox:[1,2,3,4],romaji:'ohayou',english:'Good morning',words:[],kanji:[]}];
  await c.save('owner',{hash,name:'page.jpg',imageBlob,items,status:'completed'});
  const saved=await c.read('owner',hash);
  assert.equal(saved.name,'page.jpg');
  assert.equal(saved.items[0].romaji,'ohayou');
  assert.equal(await saved.imageBlob.text(),'compressed jpeg');
  assert.equal(saved.ocrVersion,c.OCR_VERSION);
  assert.equal(saved.explainVersion,c.EXPLAIN_VERSION);
  assert.equal((await c.list('owner')).length,1);
});

test('per-account isolation protects the private history and text cache',async()=>{
  const c=makeCache();
  const hash='a'.repeat(64);
  await c.save('owner',{hash,name:'private.jpg',imageBlob:new Blob([]),items:[],status:'completed'});
  assert.equal(await c.read('other',hash),null);
  assert.equal((await c.list('other')).length,0);
  const textHash=await c.textHash('おはよう');
  await c.saveText('owner',textHash,{romaji:'ohayou'});
  assert.equal((await c.readText('owner',textHash)).romaji,'ohayou');
  assert.equal(await c.readText('other',textHash),null);
});

test('remove a cached page and clear all owner history including text cache',async()=>{
  const c=makeCache();
  const hash='b'.repeat(64);
  await c.save('owner',{hash,name:'page.jpg',imageBlob:new Blob([]),items:[],status:'completed'});
  await c.remove('owner',hash);
  assert.equal(await c.read('owner',hash),null);
  await c.save('owner',{hash,name:'page.jpg',imageBlob:new Blob([]),items:[],status:'completed'});
  await c.save('other',{hash,name:'their.jpg',imageBlob:new Blob([]),items:[],status:'completed'});
  const textHash=await c.textHash('こんにちは');
  await c.saveText('owner',textHash,{romaji:'konnichiwa'});
  await c.clear('owner');
  assert.equal((await c.list('owner')).length,0);
  assert.equal(await c.readText('owner',textHash),null);
  assert.equal((await c.list('other')).length,1);
});


test('chapters group ordered pages under manga titles and can be reopened independently',async()=>{
  const c=makeCache();
  await c.saveChapter('owner',{id:'chapter-1',mangaTitle:'Manga verde',chapterTitle:'Capítulo #1'});
  await c.addPageToChapter('owner','chapter-1',{hash:'a'.repeat(64),name:'01.jpg'});
  await c.addPageToChapter('owner','chapter-1',{hash:'b'.repeat(64),name:'02.jpg'});
  await c.addPageToChapter('owner','chapter-1',{hash:'a'.repeat(64),name:'duplicated.jpg'});
  const loaded=await c.readChapter('owner','chapter-1');
  assert.equal(loaded.mangaTitle,'Manga verde');
  assert.equal(loaded.chapterTitle,'Capítulo #1');
  assert.deepEqual(Array.from(loaded.pages,p=>p.name),['01.jpg','02.jpg']);
  await c.renameChapter('owner','chapter-1','Manga verde','Capítulo #2');
  assert.equal((await c.readChapter('owner','chapter-1')).chapterTitle,'Capítulo #2');
  assert.equal((await c.listChapters('owner')).length,1);
  assert.equal((await c.listChapters('other')).length,0);
  await c.removePageFromChapter('owner','chapter-1','a'.repeat(64));
  assert.equal((await c.readChapter('owner','chapter-1')).pages.length,1);
  await c.removeChapter('owner','chapter-1');
  assert.equal(await c.readChapter('owner','chapter-1'),null);
});

test('chapter metadata and cached images survive until owner clears local data',async()=>{
  const c=makeCache();
  const hash='c'.repeat(64);
  await c.save('owner',{hash,name:'03.jpg',imageBlob:new Blob(['image']),items:[{japanese:'はい',romaji:'hai'}],status:'completed'});
  await c.saveChapter('owner',{id:'chapter-3',mangaTitle:'Manga verde',chapterTitle:'Capítulo #3'});
  await c.addPageToChapter('owner','chapter-3',{hash,name:'03.jpg'});
  assert.equal((await c.readChapter('owner','chapter-3')).pages[0].hash,hash);
  assert.equal((await c.read('owner',hash)).items[0].romaji,'hai');
  await c.clear('owner');
  assert.equal((await c.listChapters('owner')).length,0);
  assert.equal(await c.read('owner',hash),null);
});


test('reordering pages persists in IndexedDB and does not discard analyses or alter other chapters',async()=>{
  const c=makeCache();
  const hashes=['a','b','c'].map(c=>c.repeat(64));
  await c.saveChapter('owner',{id:'chapter-1',mangaTitle:'Green',chapterTitle:'Capítulo #1'});
  await c.saveChapter('owner',{id:'chapter-2',mangaTitle:'Green',chapterTitle:'Capítulo #2'});
  for(let i=0;i<hashes.length;i++){
    await c.save('owner',{hash:hashes[i],name:`${i+1}.jpg`,status:'completed',items:[{japanese:`頁${i+1}`,romaji:`page${i+1}`}],imageBlob:new Blob([String(i)])});
    await c.addPageToChapter('owner','chapter-1',{hash:hashes[i],name:`${i+1}.jpg`});
  }
  await c.addPageToChapter('owner','chapter-2',{hash:hashes[0],name:'separate.jpg'});
  await c.reorderChapter('owner','chapter-1',[hashes[2],hashes[0],hashes[1]]);
  let order=await c.readChapter('owner','chapter-1');
  assert.deepEqual(Array.from(order.pages,p=>p.hash),[hashes[2],hashes[0],hashes[1]]);
  assert.equal((await c.read('owner',hashes[2])).items[0].romaji,'page3');
  assert.deepEqual(Array.from((await c.readChapter('owner','chapter-2')).pages,p=>p.hash),[hashes[0]]);
  await c.reorderChapter('owner','chapter-1',[hashes[1]]);
  order=await c.readChapter('owner','chapter-1');
  assert.equal(order.pages.length,3);
  assert.deepEqual(Array.from(order.pages,p=>p.hash),[hashes[1],hashes[2],hashes[0]]);
});
