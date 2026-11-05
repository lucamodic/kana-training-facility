"use strict";
(() => {
  const DB_NAME = 'ktf-manga-reader-cache';
  const DB_VERSION = 2;
  const OCR_VERSION = 'gpt-6-luna-ocr-json-v2';
  const EXPLAIN_VERSION = 'gpt-6-luna-explain-json-v2';
  let pending = null;
  const ownerKey = (owner, hash) => `${owner}:${hash}`;
  const textKey = (owner, hash) => `${owner}:${EXPLAIN_VERSION}:${hash}`;
  const chapterKey = (owner, id) => `${owner}:${id}`;

  function open() {
    if (!('indexedDB' in window)) return Promise.reject(new Error('IndexedDB unavailable'));
    if (!pending) {
      pending = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains('pages')) db.createObjectStore('pages', { keyPath: 'key' });
          if (!db.objectStoreNames.contains('texts')) db.createObjectStore('texts', { keyPath: 'key' });
          if (!db.objectStoreNames.contains('chapters')) db.createObjectStore('chapters', { keyPath: 'key' });
        };
        request.onsuccess = () => {
          const db = request.result;
          db.onversionchange = () => { db.close(); pending = null; };
          resolve(db);
        };
        request.onerror = () => reject(request.error || new Error('IndexedDB failed'));
        request.onblocked = () => reject(new Error('IndexedDB upgrade blocked'));
      }).catch(error => { pending = null; throw error; });
    }
    return pending;
  }

  async function query(storeName, mode, handler) {
    const db = await open();
    return new Promise((resolve, reject) => {
      let result;
      const tx = db.transaction(storeName, mode);
      tx.onerror = () => reject(tx.error || new Error('Storage transaction failed'));
      tx.onabort = () => reject(tx.error || new Error('Storage transaction aborted'));
      tx.oncomplete = () => resolve(result);
      try { handler(tx.objectStore(storeName), value => { result = value; }); }
      catch (error) { tx.abort(); reject(error); }
    });
  }

  async function sha256(data) {
    const bytes = data instanceof ArrayBuffer ? data : new TextEncoder().encode(data);
    const hash = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('');
  }

  const fileHash = file => file.arrayBuffer().then(sha256);
  const textHash = text => sha256(String(text).trim());

  const read = (owner, hash) => query('pages', 'readonly', (store, done) => {
    const request = store.get(ownerKey(owner, hash));
    request.onsuccess = () => done(request.result || null);
  });

  function save(owner, record) {
    return query('pages', 'readwrite', store => {
      store.put({ ...record, key: ownerKey(owner, record.hash), owner, updatedAt: Date.now(),
        ocrVersion: OCR_VERSION, explainVersion: EXPLAIN_VERSION });
    });
  }

  const list = async (owner) => {
    const records = await query('pages', 'readonly', (store, done) => {
      const request = store.getAll();
      request.onsuccess = () => done(request.result || []);
    });
    return records.filter(record => record.owner === owner && record.ocrVersion === OCR_VERSION)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  };

  const remove = (owner, hash) => query('pages', 'readwrite', store => store.delete(ownerKey(owner, hash)));
  async function clear(owner) {
    for (const storeName of ['pages', 'texts', 'chapters']) {
      await query(storeName, 'readwrite', store => {
        const request = store.openCursor();
        request.onsuccess = () => {
          const cursor = request.result;
          if (!cursor) return;
          if (cursor.value.owner === owner) cursor.delete();
          cursor.continue();
        };
      });
    }
  }

  const readText = (owner, hash) => query('texts', 'readonly', (store, done) => {
    const request = store.get(textKey(owner, hash));
    request.onsuccess = () => done(request.result?.result || null);
  });
  const saveText = (owner, hash, result) => query('texts', 'readwrite', store => {
    store.put({ key: textKey(owner, hash), owner, result, updatedAt: Date.now() });
  });

  const listChapters = async owner => {
    const records = await query('chapters', 'readonly', (store, done) => {
      const request = store.getAll();
      request.onsuccess = () => done(request.result || []);
    });
    return records.filter(record => record.owner === owner).sort((a, b) => b.updatedAt - a.updatedAt);
  };
  const readChapter = (owner, id) => query('chapters', 'readonly', (store, done) => {
    const request = store.get(chapterKey(owner, id));
    request.onsuccess = () => done(request.result || null);
  });
  const saveChapter = (owner, info) => query('chapters', 'readwrite', store => {
    const record = {key:chapterKey(owner, info.id), owner, id:info.id, mangaTitle:info.mangaTitle,
      chapterTitle:info.chapterTitle, pages:[], createdAt:Date.now(), updatedAt:Date.now()};
    store.put(record);
  });
  function modifyChapter(owner, id, handler) {
    return query('chapters', 'readwrite', store => {
      const request = store.get(chapterKey(owner, id));
      request.onsuccess = () => {
        const record = request.result;
        if (!record || record.owner !== owner) return;
        const next = handler(record);
        if (next) store.put({...next, updatedAt:Date.now()});
      };
    });
  }
  const renameChapter = (owner, id, mangaTitle, chapterTitle) => modifyChapter(owner, id, record => ({...record, mangaTitle, chapterTitle}));
  const addPageToChapter = (owner, id, page) => modifyChapter(owner, id, record => {
    if (record.pages.some(entry => entry.hash === page.hash)) return null;
    return {...record, pages:[...record.pages, {hash:page.hash, name:page.name}]};
  });
  const removePageFromChapter = (owner, id, hash) => modifyChapter(owner, id, record => ({...record,
    pages:record.pages.filter(item => item.hash !== hash)}));
  const reorderChapter = (owner, id, hashes) => modifyChapter(owner, id, record => {
    const rank = new Map(hashes.map((hash, index) => [hash, index]));
    const next = [...record.pages].sort((a, b) => (rank.get(a.hash) ?? Number.MAX_SAFE_INTEGER) - (rank.get(b.hash) ?? Number.MAX_SAFE_INTEGER));
    if (next.every((entry, index) => entry.hash === record.pages[index].hash)) return null;
    return {...record, pages:next};
  });
  const removeChapter = (owner, id) => query('chapters', 'readwrite', store => store.delete(chapterKey(owner,id)));

  const savePosition = (owner,id,position) => modifyChapter(owner,id,record=>({...record,position}));
  async function exportLibrary(owner) {
    const records=await list(owner);
    const pages=[];
    for(const record of records){
      if(!record.imageBlob)continue;
      const bytes=new Uint8Array(await record.imageBlob.arrayBuffer());
      let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
      const {imageBlob,key,owner:ignored,...data}=record;
      pages.push({...data,image:{type:imageBlob.type,base64:btoa(binary)}});
    }
    const chapters=(await listChapters(owner)).map(({key,owner:ignored,...record})=>record);
    return {type:'ktf-manga-library',version:1,pages,chapters};
  }
  function validateBackup(data) {
    if(data?.type!=='ktf-manga-library'||data.version!==1||!Array.isArray(data.pages)||!Array.isArray(data.chapters)||data.pages.length>2000||data.chapters.length>2000)throw Error('Invalid manga library backup');
    const hashes=new Set(),ids=new Set();
    const pages=data.pages.map(record=>{
      if(typeof record.hash!=='string'||!record.hash||hashes.has(record.hash)||record.ocrVersion!==OCR_VERSION||!Array.isArray(record.items)||record.items.length>1000||!['image/jpeg','image/png','image/webp'].includes(record.image?.type)||typeof record.image?.base64!=='string'||record.image.base64.length>28000000)throw Error('Invalid manga page');
      hashes.add(record.hash);
      for(const item of record.items){
        if(!item||typeof item.japanese!=='string'||['romaji','reading','english'].some(k=>item[k]!=null&&typeof item[k]!=='string')||['words','kanji'].some(k=>item[k]!=null&&(!Array.isArray(item[k])||item[k].some(row=>!row||typeof row!=='object'||Array.isArray(row)))))throw Error('Invalid manga dialogue');
      }
      const binary=atob(record.image.base64),bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
      return {hash:record.hash,name:String(record.name||'manga.jpg'),items:record.items,status:record.status,ocrVersion:record.ocrVersion,explainVersion:record.explainVersion,imageBlob:new Blob([bytes],{type:record.image.type}),updatedAt:Date.now()};
    });
    const chapters=data.chapters.map(record=>{
      if(typeof record.id!=='string'||!record.id||ids.has(record.id)||!Array.isArray(record.pages)||record.pages.some(page=>!page||typeof page.hash!=='string'))throw Error('Invalid manga chapter');
      ids.add(record.id);
      const position=record.position;
      const safePosition=position&&typeof position.hash==='string'?{hash:position.hash,text:String(position.text||''),top:Math.max(0,Number(position.top)||0),left:Math.max(0,Number(position.left)||0),dialogTop:Math.max(0,Number(position.dialogTop)||0)}:null;
      return {id:record.id,mangaTitle:String(record.mangaTitle||''),chapterTitle:String(record.chapterTitle||''),pages:record.pages.filter(page=>hashes.has(page.hash)).map(page=>({hash:page.hash,name:String(page.name||'manga.jpg')})),position:safePosition,createdAt:Date.now(),updatedAt:Date.now()};
    });
    return {pages,chapters};
  }
  async function importLibrary(owner,data) {
    // Validate everything before opening a single atomic merge. Existing records win.
    const prepared=validateBackup(data),db=await open();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(['pages','chapters'],'readwrite');
      let added=0;
      tx.oncomplete=()=>resolve(added);tx.onerror=tx.onabort=()=>reject(tx.error||Error('Library import failed'));
      for(const [name,records,keyFor] of [['pages',prepared.pages,r=>ownerKey(owner,r.hash)],['chapters',prepared.chapters,r=>chapterKey(owner,r.id)]]){
        const store=tx.objectStore(name);
        for(const record of records){const key=keyFor(record),request=store.get(key);request.onsuccess=()=>{if(!request.result){store.put({...record,key,owner});added++;}};}
      }
    });
  }

  window.KTFMangaCache = { OCR_VERSION, EXPLAIN_VERSION, fileHash, textHash, read, save, list, remove, clear, readText, saveText,
    listChapters, readChapter, saveChapter, renameChapter, addPageToChapter, removePageFromChapter, reorderChapter, removeChapter,
    savePosition,exportLibrary,importLibrary,validateBackup };
})();
