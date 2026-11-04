import { withSupabase } from 'npm:@supabase/server@^1'

const MODEL = Deno.env.get('OPENAI_MODEL') || 'gpt-6-luna'
const OCR_PROMPT = `Read this Japanese manga page and transcribe its legible speech bubbles and narration. Return the text EXACTLY as printed, including kanji and kana. Respect manga reading order (right-to-left panels, vertical columns top-to-bottom). Treat each coherent bubble or sentence as one segment. Furigana helps interpret the main text, but must not be repeated as separate dialogue. Ignore decorative sound effects unless clearly spoken. Do not translate, romanize, explain grammar, infer unreadable characters, or generate images. If a text region is obvious, optionally estimate its bounding box [top,left,bottom,right] scaled 0..1000; otherwise use null. Return JSON only: {"segments":[{"japanese":"original Japanese text","bbox":null}]}. If nothing is readable, return {"segments":[]}.`
const EXPLAIN_PROMPT = `You are a careful Japanese reading tutor. You will receive an array of numbered manga dialogue transcriptions, not an image. For EACH entry, return exactly the same index and explain ONLY its given Japanese text. Provide: complete hiragana/katakana reading, Hepburn romaji, a natural English sentence translation, up to 12 useful vocabulary/particle entries with surface form, kana reading, romaji and English meaning, and up to 12 kanji with core English meaning, contextual reading where linguistically separable, and a brief note. For irregular jukujikun, do not invent per-kanji phonetics: use "part of whole word". Japanese proper names can be ambiguous: avoid unjustified certainty. Do not alter the supplied dialogue or invent missing words. Preserve indices. Return JSON only: {"segments":[{"index":0,"reading":"...","romaji":"...","english":"...","words":[{"surface":"...","reading":"...","romaji":"...","meaning":"..."}],"kanji":[{"character":"...","meaning":"...","reading_here":"...","note":"..."}]}]}.`

const str = (value: unknown, max = 700) => typeof value === 'string' ? value.trim().slice(0, max) : ''
const object = (value: unknown): Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {}
const list = (value: unknown): unknown[] => Array.isArray(value) ? value : []
const errorResponse = (error: string, status = 502) => Response.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } })

function normalizeWords(value: unknown) {
  return list(value).slice(0, 20).map(row => {
    const item = object(row)
    return { surface: str(item.surface, 80), reading: str(item.reading, 120), romaji: str(item.romaji, 120), meaning: str(item.meaning, 240) }
  }).filter(item => item.surface)
}

function normalizeKanji(value: unknown) {
  return list(value).slice(0, 20).map(row => {
    const item = object(row)
    return { character: str(item.character, 4), meaning: str(item.meaning, 200), reading_here: str(item.reading_here, 100), note: str(item.note, 200) }
  }).filter(item => item.character)
}

function normalizeExplanation(value: unknown) {
  const row = object(value)
  return {
    reading: str(row.reading, 500),
    romaji: str(row.romaji, 650),
    english: str(row.english, 850),
    words: normalizeWords(row.words),
    kanji: normalizeKanji(row.kanji)
  }
}

class OpenAIFailure extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function callOpenAI(key: string, stage: 'ocr' | 'explain', content: unknown[]) {
  const requestBody = {
    model: MODEL,
    store: false,
    reasoning: { effort: 'low' },
    max_output_tokens: stage === 'ocr' ? 4096 : 8192,
    instructions: stage === 'ocr' ? OCR_PROMPT : EXPLAIN_PROMPT,
    input: [{ role: 'user', content }],
    text: { format: { type: 'json_object' } }
  }

  let response: Response
  try {
    response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(stage === 'ocr' ? 45000 : 60000),
      body: JSON.stringify(requestBody)
    })
  } catch (error) {
    console.warn('ktf-manga: OpenAI network error', JSON.stringify({ stage, detail: String(error).slice(0, 100) }))
    throw new OpenAIFailure('OpenAI did not respond. Try again later.', 504)
  }

  const body = object(await response.json().catch(() => ({})))
  if (!response.ok) {
    const details = object(body.error)
    console.warn('ktf-manga: OpenAI upstream error', JSON.stringify({ stage, model: MODEL, status: response.status, code: str(details.code, 80), message: str(details.message, 220) }))
    const status = response.status === 429 ? 429 : response.status >= 500 ? 503 : 502
    throw new OpenAIFailure(`OpenAI ${stage} request failed (HTTP ${response.status}).`, status)
  }

  const text = list(body.output).flatMap(item => {
    const message = object(item)
    if (message.type !== 'message') return []
    return list(message.content).map(part => {
      const entry = object(part)
      return entry.type === 'output_text' ? str(entry.text, 150000) : ''
    })
  }).join('')

  if (body.status !== 'completed' || !text) {
    const incomplete = str(object(body.incomplete_details).reason, 100)
    console.warn('ktf-manga: incomplete OpenAI response', JSON.stringify({ stage, model: MODEL, status: str(body.status, 80), reason: incomplete }))
    throw new OpenAIFailure('OpenAI returned an incomplete response. Try fewer dialogues or a smaller page.', 502)
  }

  try {
    return JSON.parse(text)
  } catch {
    console.warn('ktf-manga: invalid OpenAI JSON', JSON.stringify({ stage, model: MODEL, length: text.length }))
    throw new OpenAIFailure('OpenAI returned invalid JSON. Try again.', 502)
  }
}

export default {
  fetch: withSupabase({ auth: 'user' }, async (request, ctx) => {
    if (request.method !== 'GET' && request.method !== 'POST') return errorResponse('Method not allowed', 405)

    const allowedId = str(Deno.env.get('KTF_AI_ALLOWED_USER_ID'), 128)
    const allowedEmail = str(Deno.env.get('KTF_AI_ALLOWED_EMAIL'), 320).toLowerCase()
    if (!allowedId || !allowedEmail) return errorResponse('AI access configuration missing.', 503)

    const { data: authData, error: authError } = await ctx.supabase.auth.getUser()
    if (authError || !authData.user) return errorResponse('Authentication required.', 401)

    const user = authData.user
    const isAllowed = user.id === allowedId &&
      user.id === str(ctx.userClaims?.id, 128) &&
      str(user.email, 320).toLowerCase() === allowedEmail

    if (!isAllowed) return errorResponse('AI access denied.', 403)

    if (request.method === 'GET') return Response.json({ allowed: true }, { headers: { 'Cache-Control': 'no-store' } })

    if (Number(request.headers.get('content-length') || 0) > 5_500_000) return errorResponse('Request too large', 413)
    const key = Deno.env.get('OPENAI_API_KEY')
    if (!key) return errorResponse('OPENAI_API_KEY is missing from Supabase Edge Function Secrets.', 503)

    let data: Record<string, unknown>
    try {
      const rawBody = await request.text()
      if (rawBody.length > 5_500_000) return errorResponse('Request too large', 413)
      data = object(JSON.parse(rawBody))
    } catch {
      return errorResponse('Invalid JSON', 400)
    }

    const mode = str(data.mode, 30)
    if (!['image', 'explain', 'text'].includes(mode)) return errorResponse('Invalid mode', 400)
    const imageData = mode === 'image' ? str(data.imageData, 5_400_000) : ''
    const text = mode === 'text' ? str(data.text, 500) : ''
    const segments = mode === 'explain' ? list(data.segments).slice(0, 12).map((raw, index) => ({ index, japanese: str(object(raw).japanese, 500) })).filter(item => item.japanese) : []

    if (mode === 'image' && (data.mimeType !== 'image/jpeg' || imageData.length < 50 || imageData.length > 5_300_000 || !/^[A-Za-z0-9+/=]+$/.test(imageData))) return errorResponse('Invalid processed JPEG image', 400)
    if (mode === 'text' && !text) return errorResponse('Japanese text required', 400)
    if (mode === 'explain' && (!segments.length || list(data.segments).length > 12)) return errorResponse('Supply 1 to 12 Japanese dialogues', 400)

    const quota = await ctx.supabase.rpc('consume_ktf_manga_quota')
    if (quota.error) return errorResponse('Daily Manga Reader request limit reached or quota setup missing. Check setup/manga-quota.sql.', 429)

    try {
      if (mode === 'image') {
        const output = await callOpenAI(key, 'ocr', [{ type: 'input_image', image_url: `data:image/jpeg;base64,${imageData}`, detail: 'high' }])
        const results = list(object(output).segments).slice(0, 55).map(row => {
          const raw = object(row)
          const b = list(raw.bbox)
          const bbox = b.length === 4 && b.every(n => typeof n === 'number' && n >= 0 && n <= 1000) && Number(b[2]) > Number(b[0]) && Number(b[3]) > Number(b[1]) ? b : null
          return { japanese: str(raw.japanese, 500), reading: '', romaji: '', english: '', words: [], kanji: [], bbox }
        }).filter(row => row.japanese)
        return Response.json({ segments: results, stage: 'ocr' }, { headers: { 'Cache-Control': 'no-store' } })
      }

      const input = mode === 'text' ? [{ index: 0, japanese: text }] : segments
      const output = await callOpenAI(key, 'explain', [{ type: 'input_text', text: `Input:\n${JSON.stringify(input)}` }])
      const responses = list(object(output).segments)
      const used = new Set<number>()
      const results = input.map((source, pos) => {
        let row = responses.map(object).find(item => Number(item.index) === source.index && !used.has(source.index))
        if (!row) row = object(responses[pos])
        used.add(source.index)
        return { index: source.index, japanese: source.japanese, ...normalizeExplanation(row) }
      })
      return Response.json({ segments: results, stage: 'explain' }, { headers: { 'Cache-Control': 'no-store' } })
    } catch (error) {
      if (error instanceof OpenAIFailure) return errorResponse(error.message, error.status)
      console.error('ktf-manga: unexpected function error', String(error).slice(0, 220))
      return errorResponse('Unexpected manga analysis error', 500)
    }
  })
}
