const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const ts = require('typescript');

const root = path.join(__dirname, '..');
const serverSource = fs.readFileSync(path.join(root, 'supabase/functions/ktf-manga-analyze/index.ts'), 'utf8').replace(/^import .*\n/, '');
const serverJs = ts.transpileModule(serverSource, {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const ocrSample = {segments:[{japanese:'おはよう',bbox:[0,0,100,100]}]};
const explainSample = {segments:[{index:0,reading:'おはよう',romaji:'ohayou',english:'Good morning',words:[],kanji:[]}]};

function serverScenario({email='owner@example.com',id='owner-uid',jwtId=id,allowedEmail='owner@example.com',allowedId='owner-uid',configured=true}={}) {
  const env = new Map([
    ['KTF_AI_ALLOWED_EMAIL',configured?allowedEmail:undefined],
    ['KTF_AI_ALLOWED_USER_ID',configured?allowedId:undefined],
    ['OPENAI_API_KEY','test-key'],
    ['OPENAI_MODEL','gpt-6-luna']
  ]);
  let quotaCalls=0;
  const apiCalls=[];
  const ctx={
    userClaims:{id:jwtId},
    supabase:{
      auth:{getUser:async()=>({data:{user:{id,email,user_metadata:{ktf_nickname:'arbitrary'}}},error:null})},
      rpc:async()=>{quotaCalls++;return {data:1,error:null}}
    }
  };
  const sandbox={exports:{},Deno:{env:{get:key=>env.get(key)}},Request,Response,AbortSignal,URL,
    console:{warn(){},error(){},info(){}},
    withSupabase:(_options,fn)=>fn,
    fetch:async (url,options)=>{
      apiCalls.push({url,options,body:JSON.parse(options.body)});
      const data = options.body.includes('input_image')?ocrSample:explainSample;
      return Response.json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(data)}]}]});
    }
  };
  vm.runInNewContext(serverJs,sandbox,{filename:'edge-function.js'});
  const fetchHandler=sandbox.exports.default.fetch;
  const call=(method='GET',body=null)=>fetchHandler(new Request('https://example.test/functions/v1/ktf-manga-analyze',{
    method,headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined
  }),ctx);
  return {call,apiCalls,get quotaCalls(){return quotaCalls}};
}

test('owner is authorized by user id and email, regardless of nickname',async()=>{
  const scenario=serverScenario();
  const response=await scenario.call();
  assert.equal(response.status,200);
  assert.deepEqual(await response.json(),{allowed:true});
  assert.equal(scenario.quotaCalls,0);
});

test('different email is denied before quota or OpenAI call',async()=>{
  const s=serverScenario({email:'visitor@example.com'});
  assert.equal((await s.call('POST',{mode:'text',text:'こんにちは'})).status,403);
  assert.equal(s.quotaCalls,0);
  assert.equal(s.apiCalls.length,0);
});

test('different user id is denied',async()=>{
  const s=serverScenario({id:'visitor-uid',jwtId:'visitor-uid'});
  assert.equal((await s.call()).status,403);
});

test('inconsistent JWT claim is denied',async()=>{
  const s=serverScenario({jwtId:'different-uid'});
  assert.equal((await s.call()).status,403);
});

test('missing allowlist secrets denies closed',async()=>{
  const s=serverScenario({configured:false});
  assert.equal((await s.call()).status,503);
});

test('authorized text request calls GPT-6 Luna through Responses API',async()=>{
  const s=serverScenario();
  const response=await s.call('POST',{mode:'text',text:'おはよう'});
  assert.equal(response.status,200);
  const body=await response.json();
  assert.equal(body.stage,'explain');
  assert.equal(body.segments[0].romaji,'ohayou');
  assert.equal(s.quotaCalls,1);
  assert.equal(s.apiCalls.length,1);
  assert.equal(s.apiCalls[0].url,'https://api.openai.com/v1/responses');
  assert.equal(s.apiCalls[0].body.model,'gpt-6-luna');
  assert.equal(s.apiCalls[0].body.store,false);
  assert.match(s.apiCalls[0].body.input[0].content[0].text,/json/i);
});

test('authorized image request sends jpeg input_image',async()=>{
  const s=serverScenario();
  const response=await s.call('POST',{mode:'image',mimeType:'image/jpeg',imageData:'A'.repeat(100)});
  assert.equal(response.status,200);
  assert.equal((await response.json()).segments[0].japanese,'おはよう');
  assert.equal(s.apiCalls.length,1);
  assert.equal(s.apiCalls[0].body.input[0].content[0].type,'input_text');
  assert.match(s.apiCalls[0].body.input[0].content[0].text,/json/i);
  assert.equal(s.apiCalls[0].body.input[0].content[1].type,'input_image');
});

test('frontend hides reader for guests and other users and reveals it for owner',async()=>{
  const readerSource=fs.readFileSync(path.join(root,'manga-reader.js'),'utf8');
  const elements=new Map();
  const docListeners=new Map();
  const listeners=[];
  const calls=[];
  let user=null;
  const mk=id=>{
    if(elements.has(id))return elements.get(id);
    const el={id,hidden:id==='openMangaButton'||id==='examScreen'||id==='mangaScreen',dataset:{},style:{},
      classList:{add(){},remove(){},toggle(){}},addEventListener(){},setAttribute(name,value){this[name]=value},
      scrollIntoView(){},set textContent(value){this._text=value},get textContent(){return this._text}};
    elements.set(id,el);
    return el;
  };
  const doc={getElementById:mk,querySelectorAll:()=>[],
    addEventListener:(event,handler)=>{const a=docListeners.get(event)||[];a.push(handler);docListeners.set(event,a)},
    dispatchEvent:event=>{for(const fn of docListeners.get(event.type)||[])fn(event)},
    hidden:false
  };
  const cloud={getStatus:()=>({user}),getAccessToken:async()=>user?'access-token':null,
    subscribe:fn=>{listeners.push(fn)},signIn:async()=>{}};
  const fakeWindow={KTFCloud:cloud,KTFBridge:{getLanguage:()=> 'en',isQuizActive:()=>false},
    KTF_CONFIG:{SUPABASE_URL:'https://demo.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_demo'},
    addEventListener(){}};
  vm.runInNewContext(readerSource,{window:fakeWindow,document:doc,navigator:{onLine:true},
    fetch:async (_url,opts)=>{
      calls.push({userId:user?.id,opts});
      const allow=user?.id==='owner-uid';
      return {ok:allow,status:allow?200:403,json:async()=>allow?{allowed:true}:{error:'denied'}};
    },
    CustomEvent:class {constructor(type,init){this.type=type;this.detail=init?.detail}},
    AbortController,crypto,setTimeout,clearTimeout,URL,console
  });
  const tick=()=>new Promise(resolve=>setTimeout(resolve,20));
  assert.equal(mk('openMangaButton').hidden,true);
  fakeWindow.KTFMangaReader.open();
  assert.equal(mk('setupScreen').hidden,false);
  user={id:'owner-uid'};
  for(const fn of listeners)fn();
  await tick();
  assert.equal(mk('openMangaButton').hidden,false);
  fakeWindow.KTFMangaReader.open();
  assert.equal(mk('mangaScreen').hidden,false);
  user={id:'someone-else'};
  for(const fn of listeners)fn();
  await tick();
  assert.equal(mk('openMangaButton').hidden,true);
  assert.equal(mk('mangaScreen').hidden,true);
  user=null;
  for(const fn of listeners)fn();
  await tick();
  assert.equal(mk('openMangaButton').hidden,true);
  assert.equal(calls.length,2);
});
