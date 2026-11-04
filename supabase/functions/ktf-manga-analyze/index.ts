import { withSupabase } from 'npm:@supabase/server@^1'

const MODEL = Deno.env.get('GEMINI_MODEL') || 'gemini-3.8-flash'
const OCR_PROMPT = `Read this Japanese manga page and transcribe its legible speech bubbles and narration. Return the text EXACTLY as printed, including kanji and kana. Respect manga reading order (right-to-left panels, vertical columns top-to-bottom). Treat each coherent bubble or sentence as one segment. Furigana helps interpret the main text, but must not be repeated as separate dialogue. Ignore decorative sound effects unless clearly spoken. Do not translate, romanize, explain grammar, infer unreadable characters, or generate images. If a text region is obvious, optionally estimate its bounding box [top,left,bottom,right] scaled 0..1000; otherwise use null. Return JSON only: {"segments":[{"japanese":"original Japanese text","bbox":null}]}. If nothing is readable, return {"segments":[]}.`
const EXPLAIN_PROMPT = `You are a careful Japanese reading tutor. You will receive an array of numbered manga dialogue transcriptions, not an image. For EACH entry, return exactly the same index and explain ONLY its given Japanese text. Provide: complete hiragana/katakana reading, Hepburn romaji, a natural English sentence translation, up to 12 useful vocabulary/particle entries with surface form, kana reading, romaji and English meaning, and up to 12 kanji with core English meaning, contextual reading where linguistically separable, and a brief note. For irregular jukujikun, do not invent per-kanji phonetics: use "part of whole word". Japanese proper names can be ambiguous: avoid unjustified certainty. Do not alter the supplied dialogue or invent missing words. Preserve indices. Return JSON only: {"segments":[{"index":0,"reading":"...","romaji":"...","english":"...","words":[{"surface":"...","reading":"...","romaji":"...","meaning":"..."}],"kanji":[{"character":"...","meaning":"...","reading_here":"...","note":"..."}]}]}.`

const str = (value: unknown, max=700) => typeof value === 'string' ? value.trim().slice(0,max) : ''
const object = (value: unknown): Record<string,unknown> => typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string,unknown> : {}
const list = (value: unknown): unknown[] => Array.isArray(value) ? value : []
const errorResponse = (error: string, status = 502) => Response.json({error},{status,headers:{'Cache-Control':'no-store'}})

function normalizeWords(value: unknown) {
  return list(value).slice(0,20).map(row => {
    const item=object(row)
    return {surface:str(item.surface,80),reading:str(item.reading,120),romaji:str(item.romaji,120),meaning:str(item.meaning,240)}
  }).filter(item=>item.surface)
}
function normalizeKanji(value: unknown) {
  return list(value).slice(0,20).map(row => {
    const item=object(row)
    return {character:str(item.character,4),meaning:str(item.meaning,200),reading_here:str(item.reading_here,100),note:str(item.note,200)}
  }).filter(item=>item.character)
}
function normalizeExplanation(value:unknown) {
  const row=object(value)
  return {
    reading:str(row.reading,500),romaji:str(row.romaji,650),english:str(row.english,850),
    words:normalizeWords(row.words),kanji:normalizeKanji(row.kanji)
  }
}

class GeminiFailure extends Error {
  status: number
  constructor(message: string, status: number) {super(message);this.status=status}
}
async function callGemini(key:string, stage:'ocr'|'explain', parts:unknown[]) {
  const maxOutputTokens=stage==='ocr'?4096:8192
  const requestBody={
    contents:[{role:'user',parts}],
    generationConfig:{responseMimeType:'application/json',maxOutputTokens,thinkingConfig:{thinkingLevel:'low'}}
  }
  for(let attempt=0;attempt<2;attempt++){
    if(attempt)await new Promise(resolve=>setTimeout(resolve,1400))
    let response:Response
    try {
      response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL)}:generateContent`,{
        method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},
        signal:AbortSignal.timeout(stage==='ocr'?28000:32000),body:JSON.stringify(requestBody)
      })
    }catch(e){
      console.warn('ktf-manga: upstream timeout/network',JSON.stringify({stage,model:MODEL,attempt:attempt+1,detail:String(e).slice(0,120)}))
      if(attempt===0)continue
      throw new GeminiFailure(`Gemini did not respond during ${stage}. Try again later.`,504)
    }
    if(!response.ok){
      const info=object(await response.json().catch(()=>({})))
      const details=object(info.error)
      const message=str(details.message,240)||`Gemini returned HTTP ${response.status}`
      console.warn('ktf-manga: upstream response',JSON.stringify({stage,model:MODEL,attempt:attempt+1,status:response.status,code:str(details.status,50),message}))
      if(response.status===503 && attempt===0)continue
      const status=response.status===429?429:response.status===503?503:response.status===504?504:502
      throw new GeminiFailure(`Gemini ${stage} failed (HTTP ${response.status}): ${message}`,status)
    }
    const body=object(await response.json().catch(()=>({})))
    const candidate=object(list(body.candidates)[0])
    const content=object(candidate.content)
    const output=list(content.parts).map(part=>str(object(part).text,150000)).join('')
    let data:unknown
    try {data=JSON.parse(output)}catch{
      const reason=str(candidate.finishReason,60)
      console.warn('ktf-manga: incomplete JSON',JSON.stringify({stage,model:MODEL,reason,outputChars:output.length}))
      throw new GeminiFailure(`Gemini returned an incomplete ${stage} response${reason?` (${reason})`:''}. Try a smaller page or fewer dialogues.`,502)
    }
    console.info('ktf-manga: success',JSON.stringify({stage,model:MODEL,attempt:attempt+1}))
    return data
  }
  throw new GeminiFailure('Gemini is temporarily unavailable.',503)
}

export default {
  fetch: withSupabase({auth:'user'}, async (request,ctx) => {
    if(request.method!=='POST')return errorResponse('Method not allowed',405)
    if(Number(request.headers.get('content-length')||0)>5_500_000)return errorResponse('Request too large',413)
    const key=Deno.env.get('GEMINI_API_KEY')
    if(!key)return errorResponse('GEMINI_API_KEY is missing from Supabase Edge Function Secrets.',503)
    let data:Record<string,unknown>
    try {data=object(await request.json())}catch{return errorResponse('Invalid JSON',400)}
    const mode=str(data.mode,30)
    if(!['image','explain','text'].includes(mode))return errorResponse('Invalid mode',400)
    const imageData=mode==='image'?str(data.imageData,5_400_000):''
    const text=mode==='text'?str(data.text,500):''
    const segments=mode==='explain'?list(data.segments).slice(0,12).map((raw,index)=>({index,japanese:str(object(raw).japanese,500)})).filter(item=>item.japanese):[]
    if(mode==='image'&&(data.mimeType!=='image/jpeg'||imageData.length<50||imageData.length>5_300_000||!/^[A-Za-z0-9+/=]+$/.test(imageData)))return errorResponse('Invalid processed JPEG image',400)
    if(mode==='text'&&!text)return errorResponse('Japanese text required',400)
    if(mode==='explain'&&(!segments.length||list(data.segments).length>12))return errorResponse('Supply 1 to 12 Japanese dialogues',400)
    const quota=await ctx.supabase.rpc('consume_ktf_manga_quota')
    if(quota.error)return errorResponse('Daily Manga Reader request limit reached or quota setup missing. Check setup/manga-quota.sql.',429)
    try {
      if(mode==='image'){
        const output=await callGemini(key,'ocr',[{text:OCR_PROMPT},{inlineData:{mimeType:'image/jpeg',data:imageData}}])
        const results=list(object(output).segments).slice(0,55).map(row=>{
          const raw=object(row)
          const bbox=list(raw.bbox).length===4&&list(raw.bbox).every(n=>typeof n==='number'&&n>=0&&n<=1000)&&Number(list(raw.bbox)[2])>Number(list(raw.bbox)[0])&&Number(list(raw.bbox)[3])>Number(list(raw.bbox)[1])?raw.bbox:null
          return {japanese:str(raw.japanese,500),reading:'',romaji:'',english:'',words:[],kanji:[],bbox}
        }).filter(row=>row.japanese)
        return Response.json({segments:results,stage:'ocr'}, {headers:{'Cache-Control':'no-store'}})
      }
      const input=mode==='text'?[{index:0,japanese:text}]:segments
      const output=await callGemini(key,'explain',[{text:EXPLAIN_PROMPT+'\n\nInput:\n'+JSON.stringify(input)}])
      const responses=list(object(output).segments)
      const used=new Set<number>()
      const results=input.map((source,pos)=>{
        let row=responses.map(object).find(item=>Number(item.index)===source.index&&!used.has(source.index))
        if(!row)row=object(responses[pos])
        used.add(source.index)
        return {index:source.index,japanese:source.japanese,...normalizeExplanation(row)}
      })
      return Response.json({segments:results,stage:'explain'}, {headers:{'Cache-Control':'no-store'}})
    }catch(e){
      if(e instanceof GeminiFailure)return errorResponse(e.message,e.status)
      console.error('ktf-manga: unexpected function error',String(e).slice(0,220))
      return errorResponse('Unexpected manga analysis error',500)
    }
  })
}
