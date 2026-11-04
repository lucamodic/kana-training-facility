import { withSupabase } from 'npm:@supabase/server@^1'

const MODEL = Deno.env.get('GEMINI_MODEL') || 'gemini-3.8-flash'
const PROMPT = `You are a meticulous Japanese manga reading assistant for language learners. This is OCR, not image creation. Read all legible Japanese dialogue on the uploaded manga page. Respect Japanese manga reading order: right to left, and top to bottom within columns. Treat each separate speech bubble or coherent sentence as a separate segment. Combine connected vertical text in the same bubble. Do not duplicate furigana as separate dialogue. Use the furigana to determine readings. Do not make up unreadable text. Ignore decorative sound effects unless they are actual speech. Provide full accurate Japanese transcription, Hepburn romanization (not translation), natural English sentence translation, and a concise list of meaningful words/particles with Japanese surface form, kana reading, romaji and English gloss. Remember that Japanese kanji readings change depending on surrounding words, grammatical inflections and context. For place names and names use the most plausible reading, not an invented one. The words array should focus on kanji compounds, tricky vocabulary and grammar, up to 16 items per segment. Also return a kanji array with each distinct kanji in the sentence, its English core meaning, contextual reading when this is linguistically separable, and a very brief note. For irregular jukujikun where per-kanji sound cannot be separated accurately, set reading_here to "part of whole word" instead of inventing a sound. If helpful estimate bounding boxes in page coordinates 0..1000 as [top,left,bottom,right], otherwise return null. Return only JSON with shape {"segments":[{"japanese":"...","reading":"hiragana...","romaji":"...","english":"natural translation","words":[{"surface":"...","reading":"...","romaji":"...","meaning":"..."}],"kanji":[{"character":"日","meaning":"day / sun","reading_here":"ni","note":"contextual reading"}],"bbox":[0,0,0,0]}]}. All explanations must be in English. If uncertain about a transcription or reading, omit dubious symbols rather than guessing. Do not include image markdown. No extra keys.`
const TEXT_PROMPT = `Read this Japanese text as a Japanese-language tutor. It may be dialogue from manga. Supply exact Japanese text, kana reading and Hepburn romaji, natural English translation and word-level readings/English glosses, with accurate contextual kanji readings. Do not invent words. Return only JSON matching {"segments":[{"japanese":"...","reading":"...","romaji":"...","english":"...","words":[{"surface":"...","reading":"...","romaji":"...","meaning":"..."}],"kanji":[{"character":"日","meaning":"day / sun","reading_here":"ni","note":"contextual reading"}],"bbox":null}]}. Return exactly one segment.`

function string(value: unknown, max = 600): string {
  return typeof value === 'string' ? value.slice(0, max).trim() : ''
}
function normalizeResult(payload: unknown) {
  const source = typeof payload === 'object' && payload !== null ? payload as Record<string, unknown> : {}
  const records = Array.isArray(source.segments) ? source.segments.slice(0, 55) : []
  const segments = records.map(value => {
    const row = typeof value === 'object' && value ? value as Record<string, unknown> : {}
    const box = Array.isArray(row.bbox) && row.bbox.length === 4 && row.bbox.every(n => typeof n === 'number' && n >= 0 && n <= 1000) && row.bbox[2] > row.bbox[0] && row.bbox[3] > row.bbox[1] ? row.bbox : null
    const words = Array.isArray(row.words) ? row.words.slice(0, 35).map(value => {
      const word = typeof value === 'object' && value ? value as Record<string, unknown> : {}
      return {surface:string(word.surface,80),reading:string(word.reading,120),romaji:string(word.romaji,120),meaning:string(word.meaning,250)}
    }).filter(word=>word.surface) : []
    const kanji = Array.isArray(row.kanji) ? row.kanji.slice(0,30).map(value => {
      const entry=typeof value === 'object' && value ? value as Record<string,unknown> : {}
      return {character:string(entry.character,4),reading_here:string(entry.reading_here,100),meaning:string(entry.meaning,200),note:string(entry.note,200)}
    }).filter(entry=>entry.character):[]
    return { japanese:string(row.japanese,500),reading:string(row.reading,500),romaji:string(row.romaji,650),english:string(row.english,850),words,kanji,bbox:box }
  }).filter(row => row.japanese)
  return { segments }
}

export default {
  fetch: withSupabase({ auth: 'user' }, async (request, ctx) => {
    if (request.method !== 'POST') return Response.json({ error:'Method not allowed' }, { status:405 })
    if (Number(request.headers.get('content-length') || 0) > 5_500_000) return Response.json({error:'Image is too large'}, {status:413})
    const key = Deno.env.get('GEMINI_API_KEY')
    if (!key) return Response.json({ error:'GEMINI_API_KEY has not been configured in Supabase Edge Function Secrets.' }, {status:503})
    let data: Record<string, unknown>
    try { data = await request.json() } catch { return Response.json({ error:'Invalid JSON' },{status:400}) }
    const imageMode = data.mode === 'image'
    const textMode = data.mode === 'text'
    if (!imageMode && !textMode) return Response.json({ error:'Invalid mode' },{status:400})
    const imageData = imageMode ? string(data.imageData, 5_400_000) : ''
    const text = textMode ? string(data.text, 500) : ''
    if ((imageMode && (!/^[A-Za-z0-9+/=]+$/.test(imageData) || imageData.length < 50 || imageData.length > 5_300_000)) || (textMode && !text)) return Response.json({error:'Invalid image or Japanese text'}, {status:400})
    if(imageMode && data.mimeType !== 'image/jpeg')return Response.json({error:'Only processed JPEG input is accepted'}, {status:400})
    const quota=await ctx.supabase.rpc('consume_ktf_manga_quota')
    if(quota.error)return Response.json({error:'Manga Reader quota unavailable or exceeded. Run setup/manga-quota.sql in Supabase and check your daily allowance.'},{status:429})
    const parts = textMode ? [{text:TEXT_PROMPT + '\n\nJapanese text:\n' + text}] : [{text:PROMPT},{inlineData:{mimeType:'image/jpeg',data:imageData}}]
    let upstream: Response
    try {
      upstream=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL)}:generateContent`,{
        method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},signal:AbortSignal.timeout(62000),
        body:JSON.stringify({contents:[{role:'user',parts}],generationConfig:{responseMimeType:'application/json',maxOutputTokens:8192}})
      })
    } catch {return Response.json({error:'The language model timed out. Try a clearer crop or fewer text bubbles.'},{status:504})}
    if(!upstream.ok){
      const response=await upstream.json().catch(()=>({}))
      const message=string(response?.error?.message,260) || `Google AI returned ${upstream.status}`
      return Response.json({error:message},{status:upstream.status === 429?429:502})
    }
    const response=await upstream.json()
    const output=response?.candidates?.[0]?.content?.parts?.filter((part:Record<string,unknown>)=>typeof part.text==='string').map((part:Record<string,unknown>)=>part.text).join('') || ''
    let result:unknown
    try { result=JSON.parse(output) } catch {return Response.json({error:'The OCR response was incomplete. Try a smaller image or a text crop.'},{status:502})}
    return Response.json(normalizeResult(result),{headers:{'Cache-Control':'no-store'}})
  })
}
