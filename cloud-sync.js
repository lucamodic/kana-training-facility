"use strict";
(() => {
  const bridge = window.KTFBridge;
  const config = window.KTF_CONFIG;
  const dbName = 'ktf-progress-offline-v1';
  const fallbackKey = 'ktf-progress-events-fallback-v1';
  const ownerKey = 'ktf-progress-active-user-v1';
  const nicknameKey = 'ktf-user-nickname-v1:';
  const pendingNicknameKey = 'ktf-user-nickname-pending-v1:';
  let owner = localStorage.getItem(ownerKey) || 'guest';
  let client = null;
  let user = null;
  let status = navigator.onLine ? 'local' : 'offline';
  let statusDetails = '';
  let syncing = null;
  let applying = false;
  let lastSettings = JSON.stringify(bridge.getSettings());
  let saveDebounce;
  let syncDebounce;
  let settingsRevision = 0;
  let settingsDirty = false;
  let syncRequestedAgain = false;
  let dbPromise;
  const listeners = new Set();
  const notify = () => listeners.forEach(callback => { try { callback(); } catch (_) {} });
  const uuid = () => crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random()*16|0;
    return (c === 'x' ? r : (r&3|8)).toString(16);
  });
  function openDb() {
    if (!('indexedDB' in window)) return Promise.resolve(null);
    if (!dbPromise) dbPromise = new Promise(resolve => {
      const request = indexedDB.open(dbName, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('events')) db.createObjectStore('events',{keyPath:'id'});
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
      request.onblocked = () => resolve(null);
    });
    return dbPromise;
  }
  function fallback() {
    try { return JSON.parse(localStorage.getItem(fallbackKey) || '[]'); } catch (_) { return []; }
  }
  function putFallback(records) {
    try {
      const rows = fallback();
      const byId = new Map(rows.map(row => [row.id,row]));
      for (const record of records) byId.set(record.id, record);
      localStorage.setItem(fallbackKey,JSON.stringify([...byId.values()].slice(-1500)));
    } catch (_) {}
  }
  async function readAll() {
    const db = await openDb();
    if (!db) return fallback();
    return new Promise(resolve => {
      const tx = db.transaction('events','readonly');
      const request = tx.objectStore('events').getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve(fallback());
    });
  }
  async function putMany(records) {
    if (!records.length) return;
    const db = await openDb();
    if (!db) { putFallback(records); return; }
    return new Promise(resolve => {
      const tx = db.transaction('events','readwrite');
      for (const row of records) tx.objectStore('events').put(row);
      tx.oncomplete = resolve;
      tx.onerror = () => {putFallback(records);resolve();};
      tx.onabort = resolve;
    });
  }
  function newEvent(type,payload,account=owner) {
    return {id:uuid(),owner:account,type,payload,time:new Date().toISOString(),synced:false};
  }
  async function addAttempt(attempt) {
    const entry = newEvent('exam_attempt',attempt);
    await putMany([entry]);
    notify();
    if (user && navigator.onLine) sync().catch(() => {});
    return entry;
  }
  async function getAttempts() {
    const rows = await readAll();
    return rows.filter(row => row.owner === owner && row.type === 'exam_attempt')
      .map(row => ({...row.payload,id:row.id}))
      .sort((a,b) => (b.completedAt || '').localeCompare(a.completedAt || ''));
  }
  async function addCustomEvent(type,payload) {
    if (!['custom_upsert','custom_delete','custom_review'].includes(type)) throw new Error('Unsupported custom event.');
    const record = newEvent(type,payload);
    await putMany([record]);
    notify();
    scheduleSync(200);
    return record;
  }
  async function getCustomEvents() {
    return (await readAll()).filter(row => row.owner === owner && ['custom_upsert','custom_delete','custom_review'].includes(row.type));
  }
  function hasMeaningfulSettings(settings) {
    return Object.values(settings.selected || {}).some(values => Array.isArray(values) && values.length > 0);
  }
  function scheduleSync(delay=1200) {
    if (!user || !navigator.onLine) return;
    clearTimeout(syncDebounce);
    syncDebounce=setTimeout(() => {sync().catch(() => {});},delay);
  }
  async function settingsChanged() {
    if (applying) return;
    const revision = settingsRevision;
    const account = owner;
    const settings = bridge.getSettings();
    const raw = JSON.stringify(settings);
    if (raw === lastSettings) {
      if (revision === settingsRevision) settingsDirty = false;
      return;
    }
    if (account === 'guest' && !hasMeaningfulSettings(settings)) {
      lastSettings = raw;
      if (revision === settingsRevision) settingsDirty = false;
      return;
    }
    await putMany([newEvent('settings',settings,account)]);
    if (account === owner) lastSettings = raw;
    if (revision === settingsRevision) settingsDirty = false;
    notify();
    scheduleSync();
  }
  document.addEventListener('ktf:settingschange', () => {
    if (applying) return;
    settingsRevision++;
    settingsDirty = true;
    clearTimeout(saveDebounce);
    saveDebounce = setTimeout(() => {settingsChanged().catch(() => {});}, 650);
  });
  function nicknameForAccount() {
    if (!user && owner === 'guest') return '';
    const pending = localStorage.getItem(pendingNicknameKey + owner);
    if (pending !== null) return pending;
    const serverNickname = user?.user_metadata?.ktf_nickname;
    if (typeof serverNickname === 'string' && serverNickname.trim()) return serverNickname.trim();
    return localStorage.getItem(nicknameKey + owner) || '';
  }
  async function updateNickname(value) {
    if (!user && (owner === 'guest' || navigator.onLine)) throw new Error('Sign in before setting a nickname.');
    const nickname=String(value).trim().replace(/\s+/g,' ');
    const length=Array.from(nickname).length;
    if (length < 2 || length > 32) throw new Error('Use 2 to 32 characters.');
    localStorage.setItem(nicknameKey+owner,nickname);
    localStorage.setItem(pendingNicknameKey+owner,nickname);
    notify();
    if (navigator.onLine) {
      await sync();
      if (localStorage.getItem(pendingNicknameKey+owner) !== null) await sync();
    }
    return {nickname,pending:localStorage.getItem(pendingNicknameKey+owner)!==null};
  }
  async function refreshAccountProfile() {
    const {data,error}=await client.auth.getUser();
    if (error) throw error;
    if (data?.user?.id !== owner) throw new Error('The active account has changed.');
    user=data.user;
    const remoteNickname=user.user_metadata?.ktf_nickname;
    if (localStorage.getItem(pendingNicknameKey+owner)===null && typeof remoteNickname==='string') {
      localStorage.setItem(nicknameKey+owner,remoteNickname.trim());
    }
    const pending=localStorage.getItem(pendingNicknameKey+owner);
    if (pending!==null) {
      const {data:updated,error:updateError}=await client.auth.updateUser({data:{ktf_nickname:pending}});
      if (updateError) throw updateError;
      if (updated?.user?.id===owner) user=updated.user;
      if (localStorage.getItem(pendingNicknameKey+owner)===pending) localStorage.removeItem(pendingNicknameKey+owner);
    }
    notify();
  }
  async function loadClient() {
    if (client) return client;
    if (!navigator.onLine) return null;
    if (!window.supabase?.createClient) {
      const origins = [
        'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
        'https://unpkg.com/@supabase/supabase-js@2'
      ];
      let loaded = false;
      for (const url of origins) {
        try {
          await new Promise((resolve,reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.crossOrigin = 'anonymous';
            script.onload = resolve;
            script.onerror = reject;
            document.head.append(script);
          });
          loaded = Boolean(window.supabase?.createClient);
          if (loaded) break;
        } catch (_) {}
      }
      if (!loaded) throw new Error('Could not load the authentication library. Check your internet connection.');
    }
    client = window.supabase.createClient(config.SUPABASE_URL,config.SUPABASE_PUBLISHABLE_KEY,{
      auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:'pkce'}
    });
    client.auth.onAuthStateChange((event,session) => {
      queueMicrotask(() => {
        if (session?.user?.id && session.user.id !== user?.id) setAccount(session.user).catch(() => {});
        else if (event === 'SIGNED_OUT') setGuest().catch(() => {});
      });
    });
    return client;
  }
  async function setAccount(account) {
    user = account;
    const previousOwner = owner;
    clearTimeout(saveDebounce);
    clearTimeout(syncDebounce);
    settingsDirty = false;
    owner = account.id;
    localStorage.setItem(ownerKey,owner);
    status = navigator.onLine ? 'connecting' : 'offline';
    notify();
    const records = await readAll();
    if (previousOwner === 'guest') {
      const guestAttempts = records.filter(row => row.owner === 'guest' && ['exam_attempt','custom_upsert','custom_delete','custom_review'].includes(row.type));
      await putMany(guestAttempts.map(row => ({...row,owner, synced:false})));
    }
    await sync();
    notify();
  }
  async function setGuest() {
    clearTimeout(saveDebounce);
    clearTimeout(syncDebounce);
    settingsDirty = false;
    user = null;
    owner = 'guest';
    localStorage.removeItem(ownerKey);
    status = 'local';
    statusDetails = '';
    const saved = await readAll();
    const guest = latestSettings(saved.filter(row => row.owner === 'guest'));
    const blank = {...bridge.getSettings(), selected: {hiragana:[],katakana:[],kanji:[]}};
    if (!bridge.isQuizActive()) {
      applying=true;
      try {bridge.applySettings(guest?.payload || blank);lastSettings=JSON.stringify(bridge.getSettings());}
      finally {applying=false;}
    }
    notify();
  }
  async function remoteEvents() {
    const output = [];
    const pageSize=700;
    for (let offset=0;offset<40000;offset+=pageSize) {
      const {data,error}=await client.from('ktf_progress_events').select('id,user_id,event_type,payload,client_time').eq('user_id',owner).order('client_time',{ascending:true}).range(offset,offset+pageSize-1);
      if (error) throw error;
      output.push(...(data || []));
      if (!data || data.length < pageSize) break;
    }
    return output;
  }
  function latestSettings(rows) {
    return rows.filter(row=>row.type==='settings').sort((a,b)=>b.time.localeCompare(a.time))[0] || null;
  }
  function mergeFirstTimeSettings(local,remote) {
    const union = structuredClone(remote);
    for (const script of ['hiragana','katakana','kanji']) {
      union.selected[script]=[...new Set([...(remote.selected?.[script] || []),...(local.selected?.[script] || [])])];
    }
    return union;
  }
  async function sync() {
    if (!user || !navigator.onLine) return;
    if (syncing) {
      syncRequestedAgain = true;
      return syncing;
    }
    const revisionAtStart = settingsRevision;
    syncing = (async () => {
      status = 'syncing';statusDetails='';notify();
      try {
        await loadClient();
        await refreshAccountProfile();
        const remotes = await remoteEvents();
        const saved = await readAll();
        const known = new Set(saved.map(row=>row.id));
        const updates = remotes.filter(row=>!known.has(row.id)).map(row=>({
          id:row.id,owner:row.user_id,type:row.event_type,payload:row.payload,time:row.client_time,synced:true
        }));
        await putMany(updates);
        let locals = await readAll();
        const hadCloudSettings=remotes.some(row=>row.event_type==='settings');
        const localSettings = bridge.getSettings();
        const latest = latestSettings(locals.filter(row=>row.owner===owner));
        if (!latest && !hadCloudSettings && hasMeaningfulSettings(localSettings)) {
          const record=newEvent('settings',localSettings);
          await putMany([record]);
        } else if (latest) {
          let target = latest.payload;
          const cloudHasSelections=hadCloudSettings;
          const remoteLatest = latestSettings(remotes.map(row=>({type:row.event_type,payload:row.payload,time:row.client_time})));
          const firstMerge= !localStorage.getItem('ktf-account-initialized:'+owner) && cloudHasSelections && hasMeaningfulSettings(localSettings) && remoteLatest;
          if (firstMerge) {
            target=mergeFirstTimeSettings(localSettings,remoteLatest.payload);
            const record=newEvent('settings',target);
            await putMany([record]);
          }
          if (!settingsDirty && settingsRevision === revisionAtStart && !bridge.isSelectionActive?.() && !bridge.isQuizActive() && JSON.stringify(target)!==JSON.stringify(localSettings)) {
            applying=true;
            try { bridge.applySettings(target);lastSettings=JSON.stringify(bridge.getSettings()); }
            finally {applying=false;}
          }
        }
        localStorage.setItem('ktf-account-initialized:'+owner,'1');
        locals=(await readAll()).filter(row=>row.owner===owner && !row.synced);
        for (let i=0;i<locals.length;i+=150) {
          const batch=locals.slice(i,i+150);
          const {error}=await client.from('ktf_progress_events').upsert(batch.map(row=>({
            id:row.id,user_id:owner,event_type:row.type,payload:row.payload,client_time:row.time
          })),{onConflict:'id',ignoreDuplicates:true});
          if (error) throw error;
          await putMany(batch.map(row=>({...row,synced:true})));
        }
        status='synced';statusDetails='';notify();
      } catch (error) {
        status='error';statusDetails=String(error.message || error);notify();
      }
    })().finally(()=>{
      syncing=null;
      if (syncRequestedAgain) {
        syncRequestedAgain=false;
        scheduleSync(450);
      }
    });
    return syncing;
  }
  async function initialize() {
    notify();
    if (!navigator.onLine) {status='offline';notify();return;}
    if (owner === 'guest' && !new URLSearchParams(location.search).has('code')) {status='local';notify();return;}
    try {
      const api=await loadClient();
      const {data,error}=await api.auth.getSession();
      if (error) throw error;
      if (data.session?.user) {
        if (user?.id !== data.session.user.id) await setAccount(data.session.user);
      } else if (owner !== 'guest') await setGuest();
      else {status='local';notify();}
    } catch (error) {status='error';statusDetails=String(error.message || error);notify();}
  }
  async function signIn() {
    if (!navigator.onLine) throw new Error('Google sign-in needs an internet connection.');
    const api=await loadClient();
    const returnTo=new URL('./',location.href).href;
    const {error}=await api.auth.signInWithOAuth({provider:'google',options:{redirectTo:returnTo}});
    if (error) throw error;
  }
  async function signOut() {
    if (client && navigator.onLine) await client.auth.signOut();
    await setGuest();
  }
  async function getAccessToken() {
    if (!user || !navigator.onLine) return null;
    const api=await loadClient();
    const {data,error}=await api.auth.getSession();
    if(error)throw error;
    if(!data.session?.user || data.session.user.id !== user.id)return null;
    return data.session.access_token;
  }
  window.KTFCloud = {
    addAttempt,getAttempts,addCustomEvent,getCustomEvents,signIn,signOut,sync,initialize,updateNickname,getNickname:nicknameForAccount,getAccessToken,
    subscribe(callback){listeners.add(callback);return()=>listeners.delete(callback);},
    getStatus(){return {status,details:statusDetails,user,owner,online:navigator.onLine};}
  };
  window.addEventListener('online',()=>{initialize().catch(()=>{});});
  window.addEventListener('offline',()=>{status='offline';notify();});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&navigator.onLine)sync().catch(()=>{});});
  setInterval(()=>{if(navigator.onLine&&user)sync().catch(()=>{});},120000);
  initialize().catch(()=>{});
})();
