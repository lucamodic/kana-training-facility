/* Japanese speech comparison helpers for Kana Training Facility.
 * No dependencies, external requests, or stored audio. Works offline for
 * normalization; actual speech-to-text depends on browser support.
 */
(function (root, factory) {
  const tools = factory();
  if (typeof module === 'object' && module.exports) module.exports = tools;
  if (root) root.KTFSpeech = tools;
})(typeof globalThis !== 'undefined' ? globalThis : undefined, function () {
  'use strict';

  const SPECIAL_SPEECH_READINGS = {
    // A Japanese recognizer often transcribes a homophone with kanji instead
    // of writing it as kana. These are readings, NOT translation synonyms.
    '血':['chi'], '地':['chi','ji'], '知':['chi'], '値':['chi','ne'],
    '茶':['cha'], 'お茶':['ocha'], '御茶':['ocha'],
    '今日は':['konnichiwa','kyouwa'], '今晩は':['konbanwa'],
    '字':['ji'], '時':['ji','toki'], '日':['hi','nichi'],
    '木':['ki'], '気':['ki'], '聞く':['kiku'], '機':['ki'],
    '四':['shi','yon'], '死':['shi'], '市':['shi'],
    '目':['me'], '芽':['me'], '手':['te'], '歯':['ha'], '葉':['ha'],
    '子':['ko'], '湖':['ko'], '火':['hi'], '花':['hana'],
    'お早う':['ohayou'], '有難う':['arigatou'], 'ありがとう':['arigatou'],
    'コンニチハ':['konnichiwa'], 'こんにちわ':['konnichiwa']
  };

  // Normalize romanizations conservatively. We equate the common Japanese
  // spelling variants, but do NOT accept edit-distance guesses such as
  // chi/chii: vowel length and small kana can distinguish real words.
  function romajiKey(value) {
    return String(value ?? '')
      .toLowerCase()
      .replace(/ā/g,'aa').replace(/ī/g,'ii').replace(/ū/g,'uu')
      .replace(/ē/g,'ee').replace(/ō/g,'oo')
      .normalize('NFKC').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
      .replace(/[\s'’`\-‐‑.,!?。！？、，・]/g,'')
      .replace(/shya/g,'sha').replace(/shyu/g,'shu').replace(/shyo/g,'sho')
      .replace(/sya/g,'sha').replace(/syu/g,'shu').replace(/syo/g,'sho')
      .replace(/tya/g,'cha').replace(/tyu/g,'chu').replace(/tyo/g,'cho')
      .replace(/jya|zya/g,'ja').replace(/jyu|zyu/g,'ju').replace(/jyo|zyo/g,'jo')
      .replace(/shi|si/g,'shi').replace(/chi|ti/g,'chi')
      .replace(/tsu|tu/g,'tsu').replace(/fu|hu/g,'fu')
      .replace(/ji|zi/g,'ji')
      .replace(/ou/g,'oo').replace(/ei/g,'ee');
  }
  function japaneseKey(text) {
    return String(text ?? '').normalize('NFKC')
      .replace(/[\s\u3000。、！？!?.,，・「」『』（）()\-ー?]/g, m => m === 'ー' ? 'ー' : '');
  }
  function isRomaji(text) { return /^[a-zāīūēō\s'’.,!?\-]+$/i.test(text); }

  function build(catalog, words) {
    const kana = new Map();
    for (const script of ['hiragana','katakana']) for (const item of catalog[script] || []) {
      kana.set(item.kana, item.answer);
    }
    for (const [small, full] of Object.entries({
      'ぁ':'あ','ぃ':'い','ぅ':'う','ぇ':'え','ぉ':'お',
      'ァ':'ア','ィ':'イ','ゥ':'ウ','ェ':'エ','ォ':'オ',
      'ゎ':'わ','ヮ':'ワ'
    })) if (kana.has(full)) kana.set(small,kana.get(full));

    const lexicon = new Map();
    function add(word, readings) {
      const key = japaneseKey(word);
      if (!key) return;
      const set = lexicon.get(key) || new Set();
      for (const reading of readings) if (reading) set.add(reading);
      lexicon.set(key,set);
    }
    for (const word of words || []) add(word.kana,word.readings || []);
    for (const entry of catalog.kanji || []) add(entry.kana,entry.answers || [entry.answer]);
    for (const [text,readings] of Object.entries(SPECIAL_SPEECH_READINGS)) add(text,readings);

    function kanaToRomaji(input) {
      const text = japaneseKey(input);
      if (!text) return null;
      let result='';
      for(let i=0;i<text.length;) {
        const char = text[i];
        if (char === 'ー') {
          const vowel = result.match(/[aeiou]$/)?.[0];
          if (!vowel) return null;
          result += vowel; i++; continue;
        }
        if (char === 'っ' || char === 'ッ') {
          const next = kana.get(text.slice(i+1,i+3)) || kana.get(text[i+1]);
          if (!next) return null;
          result += next.startsWith('ch') ? 't' : next.startsWith('sh') ? 's' : next[0];
          i++; continue;
        }
        const pair = kana.get(text.slice(i,i+2));
        if (pair) { result+=pair;i+=2;continue; }
        const single = kana.get(char);
        if (!single) return null;
        result+=single;i++;
      }
      return result;
    }
    function spokenReadings(text) {
      const readings = new Set();
      const input = japaneseKey(text);
      if (!input) return [];
      if (isRomaji(input)) readings.add(input);
      const romanized = kanaToRomaji(input);
      if (romanized) readings.add(romanized);
      for (const reading of lexicon.get(input) || []) readings.add(reading);
      // If the recognized phrase has a Japanese topic particle at the end,
      // also try the grammatical "wa" reading. Kana as part of a word
      // still retains its usual "ha" reading.
      if (romanized && input.endsWith('は') && romanized.endsWith('ha')) {
        readings.add(romanized.slice(0,-2)+'wa');
      }
      return [...readings];
    }
    function inspect(rawAlternatives, target) {
      const expected = new Set((target.readings || []).map(romajiKey));
      const exactSurface = japaneseKey(target.kana);
      const alternatives = (rawAlternatives || []).map(alt =>
        typeof alt === 'string' ? {transcript:alt} : alt
      ).filter(alt => typeof alt?.transcript === 'string' && alt.transcript.trim());
      const seen = new Set();
      const inspected = [];
      for (const alt of alternatives) {
        const key = japaneseKey(alt.transcript);
        if (seen.has(key)) continue;
        seen.add(key);
        const interpretations=spokenReadings(alt.transcript);
        const matchingReading=interpretations.find(reading => expected.has(romajiKey(reading)));
        const matched = key===exactSurface || !!matchingReading;
        inspected.push({ transcript:alt.transcript, interpretations, matched,
          matchingReading: matchingReading || null, confidence:alt.confidence });
      }
      return {matched:inspected.some(entry=>entry.matched), results:inspected,
        best:inspected.find(entry=>entry.matched) || inspected[0] || null};
    }
    function biasedPhrases(target, pool) {
      // Phrases may be ignored by browsers; avoid very high boosts to keep
      // unrelated speech from being "forced" into the correct answer.
      const phrases = new Map();
      function put(value, boost) {
        const text = String(value || '').trim();
        if (!text || text.length>35 || phrases.has(text)) return;
        phrases.set(text, boost);
      }
      // Add a mix of plausible answers, not only the right one.
      put(target.kana, 3.0);
      const distractors=(pool||[]).filter(item=>item.id!==target.id).slice(0,18);
      for (const word of distractors) put(word.kana, 1.1);
      return [...phrases].map(([phrase,boost])=>({phrase,boost}));
    }
    return {romajiKey, japaneseKey, kanaToRomaji,spokenReadings,inspect,biasedPhrases};
  }
  return {build,romajiKey,japaneseKey};
});
