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
  const removeChapter = (owner, id) => query('chapters', 'readwrite', store => store.delete(chapterKey(owner,id)));

  window.KTFMangaCache = { OCR_VERSION, EXPLAIN_VERSION, fileHash, textHash, read, save, list, remove, clear, readText, saveText,
    listChapters, readChapter, saveChapter, renameChapter, addPageToChapter, removePageFromChapter, removeChapter };
})();
