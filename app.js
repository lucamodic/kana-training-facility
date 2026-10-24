"use strict";
// Standalone, offline-ready: no libraries or external API calls.
    const toKatakana = text => [...text].map(char => {
      const code = char.codePointAt(0);
      return code >= 0x3041 && code <= 0x3096 ? String.fromCodePoint(code + 0x60) : char;
    }).join('');

    const coreRows = [
      [['あ','a'],['い','i'],['う','u'],['え','e'],['お','o']],
      [['か','ka'],['き','ki'],['く','ku'],['け','ke'],['こ','ko']],
      [['さ','sa'],['し','shi','si'],['す','su'],['せ','se'],['そ','so']],
      [['た','ta'],['ち','chi','ti'],['つ','tsu','tu'],['て','te'],['と','to']],
      [['な','na'],['に','ni'],['ぬ','nu'],['ね','ne'],['の','no']],
      [['は','ha'],['ひ','hi'],['ふ','fu','hu'],['へ','he'],['ほ','ho']],
      [['ま','ma'],['み','mi'],['む','mu'],['め','me'],['も','mo']],
      [['や','ya'],['ゆ','yu'],['よ','yo']],
      [['ら','ra'],['り','ri'],['る','ru'],['れ','re'],['ろ','ro']],
      [['わ','wa'],['を','wo','o'],['ん','n','nn']]
    ];
    const voicedRows = [
      [['が','ga'],['ぎ','gi'],['ぐ','gu'],['げ','ge'],['ご','go']],
      [['ざ','za'],['じ','ji','zi'],['ず','zu'],['ぜ','ze'],['ぞ','zo']],
      [['だ','da'],['ぢ','ji','di','dji'],['づ','zu','du'],['で','de'],['ど','do']],
      [['ば','ba'],['び','bi'],['ぶ','bu'],['べ','be'],['ぼ','bo']],
      [['ぱ','pa'],['ぴ','pi'],['ぷ','pu'],['ぺ','pe'],['ぽ','po']]
    ];
    const combinations = [
      ['き',['kya','kyu','kyo']],
      ['し',['sha|sya','shu|syu','sho|syo']],
      ['ち',['cha|tya','chu|tyu','cho|tyo']],
      ['に',['nya','nyu','nyo']],
      ['ひ',['hya','hyu','hyo']],
      ['み',['mya','myu','myo']],
      ['り',['rya','ryu','ryo']],
      ['ぎ',['gya','gyu','gyo']],
      ['じ',['ja|jya|zya','ju|jyu|zyu','jo|jyo|zyo']],
      ['ぢ',['dya|dja','dyu|dju','dyo|djo']],
      ['び',['bya','byu','byo']],
      ['ぴ',['pya','pyu','pyo']]
    ];
    const katakanaExtras = [
      ['ファ','fa'],['フィ','fi'],['フェ','fe'],['フォ','fo'],
      ['ウィ','wi'],['ウェ','we'],['ウォ','wo'],
      ['ティ','ti'],['トゥ','tu'],['ディ','di'],['ドゥ','du'],
      ['シェ','she'],['チェ','che'],['ジェ','je'],
      ['ヴ','vu'],['ヴァ','va'],['ヴィ','vi'],['ヴェ','ve'],['ヴォ','vo'],
      ['ツァ','tsa'],['ツィ','tsi'],['ツェ','tse'],['ツォ','tso'],
      ['クァ','kwa'],['グァ','gwa'],['イェ','ye']
    ];

    const byCategory = {
      basic: coreRows.flat(),
      voiced: voicedRows.flat(),
      combo: combinations.flatMap(([stem, forms]) => ['ゃ','ゅ','ょ'].map((ending,i) => [stem + ending, ...forms[i].split('|')])),
      historical: [['ゐ','wi'],['ゑ','we']],
      extra: katakanaExtras
    };
    const labels = {
      basic: ['Basic kana', 'The essential sounds'],
      voiced: ['Voiced sounds', 'Sounds like ga, za, ba, and pa'],
      combo: ['Combinations', 'Sounds like kya, sha, and cho'],
      historical: ['Historical', 'Rarely used in modern Japanese'],
      extra: ['Extended katakana', 'Often used in loanwords']
    };
    const makeEntries = script => Object.entries(byCategory)
      .filter(([category]) => category !== 'extra' || script === 'katakana')
      .flatMap(([category, rows]) => rows.map(([hira, ...answers]) => ({
        kana: script === 'katakana' ? (category === 'extra' ? hira : toKatakana(hira)) : hira,
        answer: answers[0],
        answers,
        category
      })));

// Beginner-friendly kanji sampler. Multiple valid romaji readings are accepted.
// Extend this table to add more kanji: character | readings (comma-separated) | meaning | category.
const kanjiRows = `
一|ichi|one|Numbers
二|ni|two|Numbers
三|san|three|Numbers
四|yon,shi|four|Numbers
五|go|five|Numbers
六|roku|six|Numbers
七|nana,shichi|seven|Numbers
八|hachi|eight|Numbers
九|kyuu,ku|nine|Numbers
十|juu|ten|Numbers
百|hyaku|hundred|Numbers
千|sen|thousand|Numbers
万|man|ten thousand|Numbers
円|en|yen|Numbers
半|han|half|Numbers
人|hito,jin,nin|person|People & learning
男|otoko,dan|man|People & learning
女|onna,jo|woman|People & learning
子|ko,shi|child|People & learning
父|chichi,fuu|father|People & learning
母|haha,bo|mother|People & learning
友|tomo,yuu|friend|People & learning
名|na,mei|name|People & learning
私|watashi,shi|I; me|People & learning
先|saki,sen|before; ahead|People & learning
生|sei,shou,ikiru|life; birth|People & learning
学|gaku,manabu|study|People & learning
校|kou|school|People & learning
本|hon,moto|book; origin|People & learning
語|go,kataru|language; word|People & learning
字|ji|character|People & learning
文|bun,fumi|sentence; writing|People & learning
達|tachi,tatsu|plural suffix; reach|People & learning
家|ie,ka|house; home|People & learning
族|zoku|family; tribe|People & learning
日|hi,nichi,jitsu|sun; day|Time & calendar
月|tsuki,getsu,gatsu|moon; month|Time & calendar
火|hi,ka|fire|Nature
水|mizu,sui|water|Nature
木|ki,moku,boku|tree; wood|Nature
金|kane,kin|gold; money|Nature
土|tsuchi,do|earth; soil|Nature
山|yama,san|mountain|Nature
川|kawa,sen|river|Nature
田|ta,den|rice field|Nature
空|sora,kuu|sky; empty|Nature
雨|ame,u|rain|Nature
花|hana,ka|flower|Nature
草|kusa,sou|grass|Nature
石|ishi,seki|stone|Nature
海|umi,kai|sea|Nature
天|ten,ama|sky; heaven|Nature
気|ki,ke|spirit; air|Nature
今|ima,kon|now|Time & calendar
昨|saku|previous|Time & calendar
明|aka,mei,myou|bright|Time & calendar
年|toshi,nen|year|Time & calendar
時|toki,ji|time; hour|Time & calendar
分|fun,bun,wakaru|minute; part|Time & calendar
間|aida,kan,ma|interval|Time & calendar
午|go|noon|Time & calendar
前|mae,zen|before; front|Time & calendar
後|ato,go,ushiro|after; behind|Time & calendar
朝|asa,chou|morning|Time & calendar
昼|hiru,chuu|daytime; noon|Time & calendar
夜|yoru,ya|night|Time & calendar
週|shuu|week|Time & calendar
曜|you|weekday|Time & calendar
春|haru,shun|spring|Time & calendar
夏|natsu,ka|summer|Time & calendar
秋|aki,shuu|autumn|Time & calendar
冬|fuyu,tou|winter|Time & calendar
上|ue,jou|up; above|Places & directions
下|shita,ka,ge|down; below|Places & directions
中|naka,chuu|inside; middle|Places & directions
外|soto,gai|outside|Places & directions
左|hidari,sa|left|Places & directions
右|migi,u|right|Places & directions
東|higashi,tou|east|Places & directions
西|nishi,sei,sai|west|Places & directions
南|minami,nan|south|Places & directions
北|kita,hoku|north|Places & directions
国|kuni,koku|country|Places & directions
道|michi,dou|road; way|Places & directions
駅|eki|station|Places & directions
店|mise,ten|shop|Places & directions
町|machi,chou|town|Places & directions
大|oo,dai,tai|big|Everyday life
小|chii,shou|small|Everyday life
高|taka,kou|high; tall|Everyday life
安|yasu,an|cheap; peaceful|Everyday life
新|atara,shin|new|Everyday life
古|furu,ko|old|Everyday life
長|naga,chou|long|Everyday life
白|shiro,haku|white|Everyday life
黒|kuro,koku|black|Everyday life
赤|aka,seki|red|Everyday life
青|ao,sei|blue|Everyday life
車|kuruma,sha|vehicle; car|Everyday life
電|den|electricity|Everyday life
食|ta,shoku|eat; food|Everyday life
飲|no,in|drink|Everyday life
見|mi,ken|see|Everyday life
行|i,kou,gyou|go|Everyday life
来|ku,rai|come|Everyday life
帰|kae,ki|return|Everyday life
読|yo,doku|read|Everyday life
書|ka,sho|write|Everyday life
話|hana,wa|speak; story|Everyday life
聞|ki,bun|hear; ask|Everyday life
買|ka,bai|buy|Everyday life
休|yasu,kyuu|rest|Everyday life
入|hai,nyuu,i|enter|Everyday life
出|de,shu,da|exit; leave|Everyday life
手|te,shu|hand|Everyday life
目|me,moku|eye|Everyday life
耳|mimi,ji|ear|Everyday life
口|kuchi,kou|mouth|Everyday life
足|ashi,soku|foot; leg|Everyday life
力|chikara,ryoku,riki|strength|Everyday life
好|su,kou|like|Everyday life
何|nani,nan,ka|what|Everyday life
`.trim();
const kanjiEntries = kanjiRows.split('\n').map(line => {
  const [kana, readings, meaning, category] = line.split('|');
  return { kana, answer: readings.split(',')[0], answers: readings.split(','), meaning, category, id: `kanji:${kana}`, kind: 'character', script: 'kanji' };
});
const catalog = {
  hiragana: makeEntries('hiragana').map(item => ({ ...item, id: `hiragana:${item.kana}`, kind: 'character', script: 'hiragana' })),
  katakana: makeEntries('katakana').map(item => ({ ...item, id: `katakana:${item.kana}`, kind: 'character', script: 'katakana' })),
  kanji: kanjiEntries
};
const catalogMap = Object.fromEntries(Object.entries(catalog).map(([script, list]) => [script, new Map(list.map(item => [item.kana, item]))]));
const LABELS_KANJI = {
  'Numbers': ['Numbers', 'Counting and quantities'],
  'People & learning': ['People & learning', 'Everyday people, study, and family'],
  'Nature': ['Nature', 'The world around you'],
  'Time & calendar': ['Time & calendar', 'Days, seasons, and hours'],
  'Places & directions': ['Places & directions', 'Finding your way'],
  'Everyday life': ['Everyday life', 'Common nouns, verbs, and adjectives']
};

// Curated offline word bank; Japanese | romaji | accepted English meanings, separated by semicolons.
// Words unlock only when every written Japanese character is covered by the user's selections.
const wordRows = `
あい|ai|love
あお|ao|blue
あか|aka|red
いえ|ie|house;home
いぬ|inu|dog
うえ|ue|above;up;top
うし|ushi|cow
うた|uta|song
うみ|umi|sea;ocean
えき|eki|station
おかし|okashi|snack;sweets;candy
おかね|okane|money
おちゃ|ocha|tea
かお|kao|face
かさ|kasa|umbrella
かぜ|kaze|wind
かみ|kami|paper
かわ|kawa|river
きく|kiku|listen;hear
くつ|kutsu|shoes
くも|kumo|cloud
こえ|koe|voice
ここ|koko|here
さかな|sakana|fish
さくら|sakura|cherry blossom
しお|shio|salt
した|shita|below;under
しま|shima|island
しろ|shiro|white
すし|sushi|sushi
すな|suna|sand
そら|sora|sky
たこ|tako|octopus
たまご|tamago|egg
ちかい|chikai|near;close
つき|tsuki|moon
つくえ|tsukue|desk
て|te|hand
てがみ|tegami|letter
とけい|tokei|clock;watch
とり|tori|bird
なつ|natsu|summer
なまえ|namae|name
にく|niku|meat
ねこ|neko|cat
はこ|hako|box
はな|hana|flower;nose
はる|haru|spring
ひと|hito|person
ひる|hiru|noon;daytime
ふね|fune|boat;ship
ふゆ|fuyu|winter
へや|heya|room
ほし|hoshi|star
ほん|hon|book
まち|machi|town
みず|mizu|water
みせ|mise|shop;store
みち|michi|road;path
むし|mushi|insect;bug
め|me|eye
もも|momo|peach
やま|yama|mountain
ゆき|yuki|snow
ゆめ|yume|dream
よる|yoru|night
りんご|ringo|apple
わたし|watashi|i;me
ありがとう|arigatou|thank you;thanks
おはよう|ohayou|good morning
おやすみ|oyasumi|good night
こんにちは|konnichiwa|hello;good afternoon
さようなら|sayounara|goodbye;bye
ラーメン|raamen|ramen
カメラ|kamera|camera
テレビ|terebi|television;tv
バス|basu|bus
タクシー|takushii|taxi
ホテル|hoteru|hotel
コーヒー|koohii|coffee
パン|pan|bread
ケーキ|keeki|cake
アイス|aisu|ice cream
ロボット|robotto|robot
トマト|tomato|tomato
スープ|suupu|soup
スマホ|sumaho|smartphone;mobile phone;cell phone
ゲーム|geemu|game
アニメ|anime|anime
マンガ|manga|manga;comic
ラジオ|rajio|radio
レストラン|resutoran|restaurant
スーパー|suupaa|supermarket
日本|nihon,nippon|japan
日本語|nihongo|japanese language;japanese
学生|gakusei|student
学校|gakkou|school
先生|sensei|teacher
友達|tomodachi|friend
家族|kazoku|family
今日|kyou|today
明日|ashita,asu|tomorrow
昨日|kinou|yesterday
時間|jikan|time
午前|gozen|morning;am
午後|gogo|afternoon;pm
名前|namae|name
大人|otona|adult
女の子|onnanoko|girl
男の子|otokonoko|boy
お金|okane|money
電車|densha|train
火山|kazan|volcano
山|yama|mountain
川|kawa|river
水|mizu|water
海|umi|sea;ocean
空|sora|sky
花|hana|flower
本|hon|book
車|kuruma|car
家|ie|house;home
私|watashi|i;me
男|otoko|man
女|onna|woman
人|hito|person
月|tsuki|moon
日|hi|sun;day
雨|ame|rain
春|haru|spring
夏|natsu|summer
秋|aki|autumn;fall
冬|fuyu|winter
右|migi|right
左|hidari|left
上|ue|up;above
下|shita|down;below
中|naka|inside;middle
外|soto|outside
駅|eki|station
店|mise|shop;store
`.trim();
const words = wordRows.split('\n').map((line, i) => {
  const [kana, readings, meanings] = line.split('|');
  return { id: `word:${i}`, kana, answer: meanings.split(';')[0], meanings: meanings.split(';'), readings: readings.split(','), kind: 'word' };
});

const STORAGE_KEY = 'kana-training-facility-v2';
const OLD_STORAGE_KEY = 'kana-lab-selection-v1';
const PALETTES = ['pastel', 'mint', 'peach', 'blue', 'burgundy', 'night'];
const THEME_NAMES = { pastel: 'Lavender', mint: 'Mint', peach: 'Peach', blue: 'Sky', burgundy: 'Burgundy', night: 'Midnight' };
const SCRIPTS = ['hiragana', 'katakana', 'kanji'];
const $ = id => document.getElementById(id);
const state = {
  script: 'hiragana', selected: { hiragana: new Set(), katakana: new Set(), kanji: new Set() },
  theme: 'pastel', timerSetting: 'custom', customHours: 0, customMinutes: 5, wordAnswerMode: 'meaning',
  storageOk: true, quiz: null, lastSummary: null, reviewSelection: new Set()
};
const escapeHtml = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const normalized = value => String(value || '').normalize('NFKC').toLowerCase().trim().replace(/[\s\-_'’.,!?。]/g, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const shuffle = input => {
  const result = [...input];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};
function toast(message) {
  const el = $('toast'); el.textContent = message; el.hidden = false;
  clearTimeout(toast.timeout); toast.timeout = setTimeout(() => { el.hidden = true; }, 3400);
}
function applyTheme(theme) {
  if (!PALETTES.includes(theme)) return;
  state.theme = theme;
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]').content = ({night:'#25283f',burgundy:'#712b4b'})[theme] || '#d9cae9';
  document.querySelectorAll('[data-palette]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.palette === theme)));
  $('currentThemeName').textContent = THEME_NAMES[theme];
  $('themeToggle').setAttribute('aria-label', `Change color theme, current ${THEME_NAMES[theme]}`);
}
function setThemeMenu(open) {
  $('themeMenu').hidden = !open;
  $('themeToggle').setAttribute('aria-expanded', String(open));
}
function payload() {
  return { version: 3, script: state.script, theme: state.theme, timerSetting: state.timerSetting,
    customHours: state.customHours, customMinutes: state.customMinutes,
    wordAnswerMode: state.wordAnswerMode, selected: Object.fromEntries(SCRIPTS.map(script => [script, [...state.selected[script]]])) };
}
function applySavedData(data) {
  if (!data || typeof data !== 'object' || !data.selected || typeof data.selected !== 'object') throw Error('Invalid settings');
  for (const script of ['hiragana','katakana']) {
    if (!Array.isArray(data.selected[script])) throw Error('Missing character list');
  }
  const imported = Object.fromEntries(SCRIPTS.map(script => [script, new Set(
    (Array.isArray(data.selected[script]) ? data.selected[script] : [])
      .filter(ch => typeof ch === 'string' && catalogMap[script].has(ch))
  )]));
  state.selected = imported;
  state.script = SCRIPTS.includes(data.script) ? data.script : 'hiragana';
  applyTheme(PALETTES.includes(data.theme) ? data.theme : 'pastel');
  // Existing users keep their explicit timer choices. On the first migration from
  // the older release, its default "off" becomes the new custom default.
  const isLegacy = Number(data.version || 1) < 3;
  const oldMode = ['off','up','300','600','900','custom'].includes(data.timerSetting) ? data.timerSetting : 'custom';
  state.timerSetting = isLegacy && oldMode === 'off' ? 'custom' : oldMode;
  if (isLegacy) {
    const oldMinutes = Number(data.customMinutes);
    const oldSeconds = Number(data.customSeconds);
    const total = (Number.isInteger(oldMinutes) && oldMinutes >= 0 ? oldMinutes * 60 : 300)
      + (Number.isInteger(oldSeconds) && oldSeconds >= 0 && oldSeconds <= 59 ? oldSeconds : 0);
    const totalMins = Math.min(99 * 60 + 59, Math.max(1, Math.ceil(total / 60)));
    state.customHours = Math.floor(totalMins / 60);
    state.customMinutes = totalMins % 60;
  } else {
    state.customHours = Number.isInteger(Number(data.customHours)) && data.customHours !== '' && Number(data.customHours) >= 0 && Number(data.customHours) <= 99 ? Number(data.customHours) : 0;
    state.customMinutes = Number.isInteger(Number(data.customMinutes)) && data.customMinutes !== '' && Number(data.customMinutes) >= 0 && Number(data.customMinutes) <= 59 ? Number(data.customMinutes) : 5;
  }
  state.wordAnswerMode = ['meaning','reading'].includes(data.wordAnswerMode) ? data.wordAnswerMode : 'meaning';
  $('timerSetting').value = state.timerSetting;
  $('customHours').value = state.customHours;
  $('customMinutes').value = state.customMinutes;
  updateCustomTimerVisibility();
  $('wordAnswerMode').value = state.wordAnswerMode;
}
function updateCustomTimerVisibility() {
  $('customTimerFields').hidden = state.timerSetting !== 'custom';
  $('customTimerError').hidden = true;
  $('timerFootnote').textContent = state.timerSetting === 'off' ? '✧ No rush — take your time.'
    : state.timerSetting === 'up' ? '✧ Every little minute counts.'
    : '✧ You’ve got this!';
}
function customTimerSeconds() {
  const hourString = $('customHours').value;
  const minString = $('customMinutes').value;
  const hours = Number(hourString);
  const minutes = Number(minString);
  const valid = /^\d+$/.test(hourString) && /^\d+$/.test(minString)
    && Number.isInteger(hours) && Number.isInteger(minutes)
    && hours >= 0 && hours <= 99 && minutes >= 0 && minutes <= 59
    && hours * 60 + minutes > 0;
  $('customTimerError').hidden = valid;
  if (!valid) return null;
  return (hours * 60 + minutes) * 60;
}
function restore() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(OLD_STORAGE_KEY);
    if (saved) applySavedData(JSON.parse(saved));
  } catch (_) { state.storageOk = false; }
}
function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(payload())); state.storageOk = true; }
  catch (_) { state.storageOk = false; }
}

// Small kana count as their full-size counterparts for word eligibility.
// Long vowel marks in katakana are orthography, not separately selectable characters.
const SMALL_TO_BIG = { 'ぁ':'あ','ぃ':'い','ぅ':'う','ぇ':'え','ぉ':'お','ゃ':'や','ゅ':'ゆ','ょ':'よ','っ':'つ','ゎ':'わ',
  'ァ':'ア','ィ':'イ','ゥ':'ウ','ェ':'エ','ォ':'オ','ャ':'ヤ','ュ':'ユ','ョ':'ヨ','ッ':'ツ','ヮ':'ワ' };
function wordIsUnlocked(word) {
  const spelling = [...word.kana];
  for (let i = 0; i < spelling.length; i++) {
    const char = spelling[i];
    if (char === 'ー' || char === '・' || char === '々') continue;
    const cp = char.codePointAt(0);
    const script = cp >= 0x4e00 && cp <= 0x9fff ? 'kanji'
      : cp >= 0x3040 && cp <= 0x309f ? 'hiragana'
      : cp >= 0x30a0 && cp <= 0x30ff ? 'katakana' : null;
    if (!script) return false;
    if (script !== 'kanji' && i + 1 < spelling.length && state.selected[script].has(char + spelling[i+1])) { i++; continue; }
    if (!state.selected[script].has(char) && !state.selected[script].has(SMALL_TO_BIG[char])) return false;
  }
  return true;
}
const eligibleWords = () => words.filter(wordIsUnlocked);
function currentVisible() {
  const query = normalized($('search').value);
  return catalog[state.script].filter(item => !query || [item.kana, item.answer, ...(item.answers || []), item.meaning || ''].some(x => normalized(x).includes(query)));
}
function render() {
  const script = state.script;
  const selected = state.selected[script];
  SCRIPTS.forEach((s, i) => {
    const tab = $(`tab${s[0].toUpperCase()}${s.slice(1)}`);
    tab.setAttribute('aria-selected', String(s === script));
    tab.tabIndex = s === script ? 0 : -1;
    $(({hiragana:'hCount',katakana:'kCount',kanji:'jCount'})[s]).textContent = state.selected[s].size;
  });
  $('characterPanel').setAttribute('aria-labelledby', `tab${script[0].toUpperCase()}${script.slice(1)}`);
  $('selectionHeading').textContent = `Choose your ${script}`;
  $('selectedCount').textContent = selected.size;
  $('selectedDescription').textContent = selected.size ? `${selected.size} selected · ready to study.` : 'Pick at least one character to begin.';
  $('learnButton').disabled = !selected.size;
  $('startButton').disabled = !selected.size;
  const unlocked = eligibleWords();
  $('wordsButton').disabled = !unlocked.length;
  $('wordAvailableCount').textContent = unlocked.length;
  $('wordDialogCount').textContent = unlocked.length;
  $('wordCountDescription').textContent = unlocked.length
    ? `Ready to practice ${unlocked.length} word${unlocked.length === 1 ? '' : 's'} using your current character selection.`
    : 'No words unlocked yet. Try choosing ね and こ in Hiragana to unlock ねこ (cat), or 日 and 本 in Kanji to unlock 日本 (Japan).';
  const visible = currentVisible();
  const filtered = !!$('search').value.trim();
  $('selectAll').textContent = filtered ? 'Select visible' : 'Select all';
  $('clearAll').textContent = filtered ? 'Clear visible' : 'Clear all';
  $('randomTen').disabled = !visible.length;
  const categoryNames = script === 'kanji' ? LABELS_KANJI : Object.fromEntries(Object.entries(labels).filter(([key]) => key !== 'extra' || script === 'katakana'));
  let html = '';
  for (const [category, [title, description]] of Object.entries(categoryNames)) {
    const entries = visible.filter(item => item.category === category);
    if (!entries.length) continue;
    const count = entries.filter(item => selected.has(item.kana)).length;
    html += `<section class="category" aria-label="${escapeHtml(title)}"><div class="category-heading"><div><h3>${escapeHtml(title)} <small>${count}/${entries.length} · ${escapeHtml(description)}</small></h3></div><div class="category-actions"><button class="ghost-button" type="button" data-action="add-group" data-category="${escapeHtml(category)}">Select</button><button class="ghost-button" type="button" data-action="clear-group" data-category="${escapeHtml(category)}">Clear</button></div></div><div class="kana-grid">`;
    html += entries.map(item => `<button type="button" class="kana-tile ${script === 'kanji' ? 'kanji-tile' : ''}" data-action="toggle" data-kana="${escapeHtml(item.kana)}" aria-pressed="${selected.has(item.kana)}" aria-label="${escapeHtml(item.kana+', '+item.answer+(item.meaning ? ', '+item.meaning : '')+', '+(selected.has(item.kana) ? 'selected' : 'not selected'))}"><span class="glyph" aria-hidden="true">${escapeHtml(item.kana)}</span><span class="roman" aria-hidden="true">${escapeHtml(item.answer)}</span>${item.meaning ? `<span class="tile-meaning" aria-hidden="true">${escapeHtml(item.meaning.split(';')[0])}</span>` : ''}</button>`).join('');
    html += '</div></section>';
  }
  $('categories').innerHTML = html || '<p class="empty">No characters match this search.</p>';
}
function selectScript(script) {
  if (!SCRIPTS.includes(script)) return;
  state.script = script;
  $('search').value = '';
  save(); render();
}
function updateSelection(characters, mode) {
  const selected = state.selected[state.script];
  characters.forEach(ch => {
    if (mode === 'add') selected.add(ch);
    else if (mode === 'remove') selected.delete(ch);
    else if (selected.has(ch)) selected.delete(ch);
    else selected.add(ch);
  });
  save(); render();
}

function answersFor(quiz, item) {
  if (quiz.kind === 'words') return quiz.wordAnswerMode === 'reading' ? item.readings : item.meanings;
  return item.answers;
}
function displayAnswer(quiz, item) {
  if (quiz.kind === 'words') return quiz.wordAnswerMode === 'reading' ? item.readings[0] : item.meanings[0];
  return item.answer;
}
function itemDetail(item, wordMode) {
  if (item.kind === 'word') return `${item.readings[0]} · ${item.meanings[0]}`;
  return `${item.answer}${item.meaning ? ' · '+item.meaning : ''}`;
}
// Center the active exercise when a session opens, without scrolling to the page header.
// For tall cards (especially on phones), show the top of the card rather than
// cropping the prompt just to center it. Honor reduced-motion preferences.
function centerActiveExercise(quiz) {
  requestAnimationFrame(() => {
    if (state.quiz !== quiz || $('quizScreen').hidden) return;
    const bounds = $('quizPanel').getBoundingClientRect();
    const viewportHeight = window.visualViewport?.height || window.innerHeight;
    const padding = 20;
    const desiredTop = bounds.height <= viewportHeight - 2 * padding
      ? (viewportHeight - bounds.height) / 2
      : padding;
    const target = window.scrollY + bounds.top - desiredTop;
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    window.scrollTo({
      top: Math.max(0, Math.min(target, maxScroll)),
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    });
  });
}

function startQuiz(mode = 'practice', suppliedPool = null, kindOverride = null, wordModeOverride = null) {
  const kind = kindOverride || (mode === 'words' ? 'words' : 'characters');
  const pool = suppliedPool ? [...suppliedPool] : (kind === 'words' ? eligibleWords() : catalog[state.script].filter(e => state.selected[state.script].has(e.kana)));
  if (!pool.length) { toast('Please select at least one eligible item first.'); return; }
  const timerMode = state.timerSetting === 'custom' ? customTimerSeconds() : state.timerSetting;
  if (timerMode === null) { toast('Please enter a valid custom countdown.'); $('customMinutes').focus(); return; }
  if (state.quiz) clearQuizTimers(state.quiz);
  const quiz = { mode, kind, script: state.script, pool, deck: [], current: null, last: null,
    attempts: 0, correct: 0, round: 0, seenInRound: 0, phase: 'question', perItem: new Map(),
    wordAnswerMode: wordModeOverride || state.wordAnswerMode, transitionTimeout: null,
    timerInterval: null, timerMode: String(timerMode), elapsedMs: 0, lastTick: performance.now(), paused: false };
  state.quiz = quiz;
  $('setupScreen').hidden = true;
  $('summaryScreen').hidden = true;
  $('quizScreen').hidden = false;
  $('kanaDisplay').classList.remove('is-exiting', 'is-entering');
  $('quizPanel').classList.remove('is-paused');
  $('quizPoolLabel').textContent = `${kind === 'words' ? 'Vocabulary' : quiz.script[0].toUpperCase()+quiz.script.slice(1)} · ${pool.length} item${pool.length === 1 ? '' : 's'}${mode === 'learn' ? ' · Learn' : mode === 'review' ? ' · Review' : ''}`;
  $('stopButton').textContent = '← Finish lesson';
  $('learningProgress').hidden = mode !== 'learn';
  initTimer(quiz);
  nextQuestion();
  centerActiveExercise(quiz);
}
function initTimer(quiz) {
  const enabled = quiz.timerMode !== 'off';
  $('timerArea').hidden = !enabled;
  $('pauseTimerButton').textContent = 'Pause';
  $('pauseTimerButton').setAttribute('aria-pressed', 'false');
  if (!enabled) return;
  updateTimer(quiz);
  quiz.lastTick = performance.now();
  quiz.timerInterval = setInterval(() => {
    if (state.quiz !== quiz || quiz.paused) return;
    const now = performance.now();
    quiz.elapsedMs += Math.max(0, now - quiz.lastTick);
    quiz.lastTick = now;
    updateTimer(quiz);
    if (quiz.timerMode !== 'up' && quiz.elapsedMs >= Number(quiz.timerMode) * 1000) stopQuiz(false, true);
  }, 150);
}
function formatDuration(totalSeconds) {
  const secs = Math.max(0, Math.ceil(totalSeconds));
  const hours = Math.floor(secs / 3600);
  const minutes = Math.floor((secs % 3600) / 60);
  const seconds = secs % 60;
  return hours > 0 ? `${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`
    : `${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`;
}
function updateTimer(quiz) {
  if (quiz.timerMode === 'off') return;
  const seconds = quiz.timerMode === 'up' ? Math.floor(quiz.elapsedMs/1000)
    : Math.max(0, Number(quiz.timerMode) - quiz.elapsedMs/1000);
  $('timerDisplay').textContent = formatDuration(seconds);
  $('timerArea').classList.toggle('timer-urgent', quiz.timerMode !== 'up' && seconds <= 30);
}
function toggleTimerPause() {
  const quiz = state.quiz;
  if (!quiz || quiz.timerMode === 'off') return;
  if (!quiz.paused) {
    const now = performance.now();
    quiz.elapsedMs += Math.max(0, now - quiz.lastTick);
    quiz.paused = true;
  } else {
    quiz.lastTick = performance.now();
    quiz.paused = false;
  }
  $('pauseTimerButton').textContent = quiz.paused ? 'Resume' : 'Pause';
  $('pauseTimerButton').setAttribute('aria-pressed', String(quiz.paused));
  $('quizPanel').classList.toggle('is-paused', quiz.paused);
  updateTimer(quiz);
  if (!quiz.paused && quiz.phase === 'question') $('answerInput').focus();
}
function clearQuizTimers(quiz) {
  clearInterval(quiz.timerInterval);
  clearTimeout(quiz.transitionTimeout);
}
function nextQuestion() {
  const quiz = state.quiz;
  if (!quiz) return;
  if (!quiz.deck.length) {
    if (quiz.mode === 'learn' && quiz.round === 6) { stopQuiz(true); return; }
    quiz.deck = shuffle(quiz.pool);
    if (quiz.deck.length > 1 && quiz.last && quiz.deck[0].id === quiz.last.id) {
      const other = quiz.deck.findIndex(item => item.id !== quiz.last.id);
      [quiz.deck[0], quiz.deck[other]] = [quiz.deck[other], quiz.deck[0]];
    }
    quiz.round++;
    quiz.seenInRound = 0;
  }
  quiz.current = quiz.deck.shift();
  quiz.last = quiz.current;
  quiz.seenInRound++;
  const guided = quiz.mode === 'learn' && quiz.round <= 3;
  quiz.phase = guided ? 'guided' : 'question';
  $('quizSymbol').textContent = quiz.current.kana;
  $('printedKana').textContent = quiz.current.kana;
  $('printedLabel').textContent = 'In a regular font';
  $('roundLabel').textContent = quiz.mode === 'learn'
    ? `${guided ? 'Guided learning' : 'Memory practice'} · Pass ${guided ? quiz.round : quiz.round - 3} of 3 · Item ${quiz.seenInRound} of ${quiz.pool.length}`
    : `Round ${quiz.round} · Item ${quiz.seenInRound} of ${quiz.pool.length}`;
  $('quizHead').textContent = guided ? 'Look closely and learn this character'
    : quiz.kind === 'words' ? (quiz.wordAnswerMode === 'meaning' ? 'What does this word mean in English?' : 'How do you read this word?')
    : 'How do you read this character?';
  $('guidedBlock').hidden = !guided;
  $('answerArea').hidden = guided;
  $('quizStats').hidden = guided;
  $('quizHint').textContent = guided ? 'Enter to continue · Esc to finish'
    : 'Enter to check / continue · Esc to finish';
  if (quiz.mode === 'learn') {
    $('learningStage').textContent = guided ? 'Stage 1/2 · Guided learning' : 'Stage 2/2 · Memory practice';
    $('learningCount').textContent = `Pass ${quiz.round} of 6`;
    const progress = Math.round(((quiz.round-1)*quiz.pool.length + quiz.seenInRound-1) / (6*quiz.pool.length)*100);
    $('progressFill').style.width = progress+'%';
    $('progressTrack').setAttribute('aria-valuenow', String(progress));
  }
  if (guided) {
    $('guidedReading').textContent = `${quiz.current.answer}${quiz.current.meaning ? ' · '+quiz.current.meaning : ''}`;
    $('guidedCaption').textContent = 'Reading / meaning';
    $('guidedTip').textContent = [
      'Read the character and its sound out loud.',
      'Try to recall the sound before looking below.',
      'Say the reading from memory, then double-check it.'
    ][quiz.round-1];
    $('guidedNext').textContent = quiz.round === 3 && !quiz.deck.length ? 'Start memory practice →' : 'Got it, next →';
    $('guidedNext').disabled = false;
    if (!quiz.paused) $('guidedNext').focus({preventScroll:true});
  } else {
    $('answerLabel').textContent = quiz.kind === 'words' ? (quiz.wordAnswerMode === 'meaning' ? 'Your answer in English' : 'Your answer in romaji') : 'Your answer in romaji';
    $('answerInput').placeholder = quiz.kind === 'words' ? (quiz.wordAnswerMode === 'meaning' ? 'e.g. cat, mountain, hello…' : 'e.g. neko, yama…') : 'e.g. ka, shi, tsu…';
    $('answerInput').value = '';
    $('answerInput').disabled = false;
    $('feedback').hidden = true;
    $('feedback').className = 'feedback';
    $('checkButton').textContent = 'Check ↵';
    $('checkButton').classList.remove('result-correct', 'result-wrong');
    $('checkButton').disabled = false;
    $('skipButton').hidden = false;
    if (!quiz.paused) $('answerInput').focus({preventScroll:true});
  }
  updateStats();
}
function advanceQuestion() {
  const quiz = state.quiz;
  if (!quiz || quiz.paused || !['result','guided'].includes(quiz.phase)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { nextQuestion(); return; }
  quiz.phase = 'transition';
  $('checkButton').disabled = true;
  $('guidedNext').disabled = true;
  $('kanaDisplay').classList.add('is-exiting');
  const completeTransition = () => {
    if (state.quiz !== quiz) return;
    if (quiz.paused) { quiz.transitionTimeout = setTimeout(completeTransition,125); return; }
    $('kanaDisplay').classList.remove('is-exiting');
    $('kanaDisplay').classList.add('is-entering');
    nextQuestion();
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (state.quiz === quiz) $('kanaDisplay').classList.remove('is-entering');
    }));
  };
  quiz.transitionTimeout = setTimeout(completeTransition,165);
}
function updateStats() {
  if (!state.quiz) return;
  const {attempts,correct} = state.quiz;
  $('attemptsStat').textContent = attempts;
  $('correctStat').textContent = correct;
  $('accuracyStat').textContent = attempts ? Math.round(correct/attempts*100)+'%' : '—';
}
function reveal(skipped = false) {
  const quiz = state.quiz;
  if (!quiz || quiz.paused || quiz.phase !== 'question') return;
  const entered = normalized($('answerInput').value);
  if (!skipped && !entered) { $('answerInput').focus(); return; }
  const correct = !skipped && answersFor(quiz, quiz.current).some(answer => normalized(answer) === entered);
  quiz.attempts++;
  if (correct) quiz.correct++;
  const item = quiz.current;
  const stats = quiz.perItem.get(item.id) || {item, attempts:0, correct:0, errors:0};
  stats.attempts++;
  if (correct) stats.correct++; else stats.errors++;
  quiz.perItem.set(item.id,stats);
  quiz.phase = 'result';
  $('answerInput').disabled = true;
  $('feedback').hidden = false;
  $('feedback').className = 'feedback '+(correct ? 'correct':'wrong');
  const answer = displayAnswer(quiz,item);
  const alternative = quiz.kind === 'characters' && item.answers.length > 1 ? ` Also accepted: ${item.answers.slice(1).join(', ')}.` : '';
  const extra = quiz.kind === 'words' ? ` · ${item.readings[0]} · ${item.meanings[0]}` : (item.meaning ? ` · ${item.meaning}` : '');
  $('feedback').textContent = correct
    ? `Correct! ${item.kana} = ${answer}${extra && quiz.kind === 'words' ? ' ('+item.readings[0]+')' : ''}.${alternative}`
    : `The answer was ${answer} (${item.kana})${extra ? ' · '+extra.replace(/^ · /,'') : ''}.${alternative}`;
  $('checkButton').textContent = quiz.mode === 'learn' && quiz.round === 6 && quiz.deck.length === 0 ? 'View results →' : 'Next →';
  $('checkButton').classList.add(correct ? 'result-correct' : 'result-wrong');
  $('skipButton').hidden = true;
  updateStats();
  $('checkButton').focus({preventScroll:true});
}
function stopQuiz(completed = false, timedOut = false) {
  const quiz = state.quiz;
  if (!quiz) return;
  clearQuizTimers(quiz);
  $('kanaDisplay').classList.remove('is-exiting','is-entering');
  const learning = quiz.mode === 'learn';
  $('summaryEyebrow').textContent = timedOut ? 'Time is up!' : completed ? 'Lesson complete!' : 'Session finished';
  $('summaryDescription').textContent = learning
    ? 'Only your memory-test answers count toward accuracy; the three guided passes are for learning.'
    : 'These results include answers from the session you just finished.';
  const timing = quiz.timerMode === 'off' ? '' : ` · Time: ${formatDuration(Math.floor(quiz.elapsedMs/1000))} elapsed`;
  $('summaryProgress').hidden = !(learning || timing || quiz.mode === 'review');
  $('summaryProgress').textContent = learning
    ? `${completed ? 'Completed' : 'Reached'} pass ${quiz.round} of 6${timing}.`
    : quiz.mode === 'review' ? `Focused review of ${quiz.pool.length} item(s)${timing}.` : timing ? `Session duration${timing}.` : '';
  $('summaryAttempts').textContent = quiz.attempts;
  $('summaryCorrect').textContent = quiz.correct;
  $('summaryAccuracy').textContent = quiz.attempts ? Math.round(quiz.correct/quiz.attempts*100)+'%' : '—';
  const hardest = [...quiz.perItem.values()].filter(x => x.errors > 0)
    .sort((a,b) => b.errors-a.errors || a.correct/a.attempts-b.correct/b.attempts || b.attempts-a.attempts);
  if (hardest.length) {
    $('hardestResults').innerHTML = `<ol class="hardest-list">${hardest.slice(0,10).map(x => `<li class="hardest-item"><span class="hardest-glyph" aria-hidden="true">${escapeHtml(x.item.kana)}</span><div class="hardest-info"><strong>${escapeHtml(itemDetail(x.item, quiz.wordAnswerMode))}</strong><span>${x.attempts} attempt${x.attempts === 1 ? '' : 's'} · ${x.correct} correct</span></div><span class="hardest-count">${x.errors} mistake${x.errors === 1 ? '' : 's'}</span></li>`).join('')}</ol>${hardest.length > 10 ? `<p class="note">Showing 10 of ${hardest.length} missed items. All are available in the review dialog.</p>` : ''}`;
  } else {
    $('hardestResults').innerHTML = `<p class="summary-empty">${quiz.attempts ? 'Amazing! You had no mistakes this time.' : 'No answers yet. Try a round to discover what needs practice.'}</p>`;
  }
  $('reviewMistakesButton').hidden = hardest.length === 0;
  $('practiceAgain').textContent = learning ? 'Repeat lesson →' : 'Practice again →';
  state.lastSummary = { hardest, kind:quiz.kind, mode:quiz.mode, pool:[...quiz.pool], script:quiz.script, wordAnswerMode:quiz.wordAnswerMode };
  state.quiz = null;
  $('quizScreen').hidden = true;
  $('setupScreen').hidden = true;
  $('summaryScreen').hidden = false;
  window.scrollTo({top:0,behavior:'instant'});
}
function backToSelection() {
  if (state.quiz) clearQuizTimers(state.quiz);
  state.quiz = null;
  $('kanaDisplay').classList.remove('is-exiting','is-entering');
  $('quizScreen').hidden = true;
  $('summaryScreen').hidden = true;
  $('setupScreen').hidden = false;
  window.scrollTo({top:0,behavior:'instant'});
  render();
}
function openReviewDialog() {
  if (!state.lastSummary || !state.lastSummary.hardest.length) return;
  state.reviewSelection = new Set(state.lastSummary.hardest.map(x => x.item.id));
  $('reviewItems').innerHTML = state.lastSummary.hardest.map(x => `<label class="review-item"><input type="checkbox" data-review-id="${escapeHtml(x.item.id)}" checked><span class="review-glyph">${escapeHtml(x.item.kana)}</span><span class="review-item-text"><strong>${escapeHtml(itemDetail(x.item,state.lastSummary.wordAnswerMode))}</strong><span>${x.errors} mistake${x.errors === 1 ? '' : 's'} · ${x.attempts} attempts</span></span></label>`).join('');
  updateReviewCount();
  $('reviewDialog').showModal();
}
function updateReviewCount() {
  const count = state.reviewSelection.size;
  $('reviewCount').textContent = `${count} selected`;
  $('beginReview').disabled = count === 0;
}
function beginReview() {
  const summary = state.lastSummary;
  if (!summary) return;
  const pool = summary.hardest.filter(x => state.reviewSelection.has(x.item.id)).map(x => x.item);
  if (!pool.length) return;
  $('reviewDialog').close();
  state.script = summary.script;
  startQuiz('review',pool,summary.kind,summary.wordAnswerMode);
}

// Theme + settings
$('themeToggle').addEventListener('click', () => setThemeMenu($('themeMenu').hidden));
for (const button of document.querySelectorAll('[data-palette]')) button.addEventListener('click', () => {
  applyTheme(button.dataset.palette); save(); setThemeMenu(false); $('themeToggle').focus();
});
document.addEventListener('pointerdown', event => {
  if (!$('themePicker').contains(event.target)) setThemeMenu(false);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !$('themeMenu').hidden) {
    setThemeMenu(false);
    $('themeToggle').focus();
    event.preventDefault();
    event.stopPropagation();
  }
}, true);
$('timerSetting').addEventListener('change', e => { state.timerSetting = e.target.value; updateCustomTimerVisibility(); save(); });
for (const id of ['customHours','customMinutes']) $(id).addEventListener('input', () => {
  state.customHours = $('customHours').value;
  state.customMinutes = $('customMinutes').value;
  if (state.timerSetting === 'custom') customTimerSeconds();
  save();
});
$('wordAnswerMode').addEventListener('change', e => { state.wordAnswerMode = e.target.value; save(); });
for (const script of SCRIPTS) $('tab'+script[0].toUpperCase()+script.slice(1)).addEventListener('click', () => selectScript(script));
document.querySelector('.tabs').addEventListener('keydown', e => {
  if (!['ArrowLeft','ArrowRight'].includes(e.key)) return;
  e.preventDefault();
  const direction = e.key === 'ArrowRight' ? 1 : -1;
  selectScript(SCRIPTS[(SCRIPTS.indexOf(state.script)+direction+SCRIPTS.length)%SCRIPTS.length]);
  $('tab'+state.script[0].toUpperCase()+state.script.slice(1)).focus();
});
$('search').addEventListener('input',render);
$('categories').addEventListener('click',e => {
  const button = e.target.closest('button[data-action]');
  if (!button) return;
  if (button.dataset.action === 'toggle') updateSelection([button.dataset.kana], 'toggle');
  else updateSelection(currentVisible().filter(item => item.category === button.dataset.category).map(item => item.kana), button.dataset.action === 'add-group' ? 'add' : 'remove');
});
$('selectAll').addEventListener('click', () => updateSelection(currentVisible().map(item => item.kana), 'add'));
$('clearAll').addEventListener('click', () => updateSelection(currentVisible().map(item => item.kana), 'remove'));
$('randomTen').addEventListener('click', () => {
  const subset = shuffle(currentVisible()).slice(0,10);
  state.selected[state.script] = new Set(subset.map(x => x.kana));
  save();render();toast(`${subset.length} randomly chosen characters selected.`);
});
$('learnButton').addEventListener('click', () => startQuiz('learn'));
$('startButton').addEventListener('click', () => startQuiz('practice'));
$('openWordsButton').addEventListener('click', () => { render(); $('wordsDialog').showModal(); });
$('closeWordsDialog').addEventListener('click', () => $('wordsDialog').close());
$('cancelWordsDialog').addEventListener('click', () => $('wordsDialog').close());
$('wordsDialog').addEventListener('click', e => { if (e.target === $('wordsDialog')) $('wordsDialog').close(); });
$('wordsButton').addEventListener('click', () => {
  // Keep the dialog visible if the custom time is invalid, so the user can fix it in the sidebar.
  if (state.timerSetting === 'custom' && customTimerSeconds() === null) {
    $('wordsDialog').close();
    toast('Please enter a valid custom countdown before starting.');
    $('customMinutes').focus();
    return;
  }
  $('wordsDialog').close();
  startQuiz('words');
});
$('guidedNext').addEventListener('click', advanceQuestion);
$('stopButton').addEventListener('click', () => stopQuiz());
$('finishLessonButton').addEventListener('click', () => stopQuiz());
$('pauseTimerButton').addEventListener('click', toggleTimerPause);
$('backToSelection').addEventListener('click', backToSelection);
$('practiceAgain').addEventListener('click', () => {
  const last = state.lastSummary;
  if (!last) return;
  state.script = last.script;
  startQuiz(last.mode, last.pool, last.kind, last.wordAnswerMode);
});
$('reviewMistakesButton').addEventListener('click',openReviewDialog);
$('homeLink').addEventListener('click', e => {e.preventDefault(); backToSelection();});
$('answerForm').addEventListener('submit', e => {
  e.preventDefault();
  if (state.quiz?.phase === 'result') advanceQuestion();
  else if (state.quiz?.phase === 'question') reveal(false);
});
$('skipButton').addEventListener('click', () => reveal(true));
document.addEventListener('keydown',e => {
  if (e.key === 'Escape' && state.quiz) { e.preventDefault();stopQuiz(); }
  if (e.key === 'Enter' && state.quiz?.phase === 'guided' && !e.repeat && e.target !== $('guidedNext')) {
    e.preventDefault();advanceQuestion();
  }
});
$('closeReview').addEventListener('click', () => $('reviewDialog').close());
$('cancelReview').addEventListener('click', () => $('reviewDialog').close());
$('reviewItems').addEventListener('change', e => {
  const input = e.target.closest('[data-review-id]');
  if (!input) return;
  if (input.checked) state.reviewSelection.add(input.dataset.reviewId);
  else state.reviewSelection.delete(input.dataset.reviewId);
  updateReviewCount();
});
function setReviewSelection(checked) {
  state.reviewSelection = new Set(checked ? state.lastSummary.hardest.map(x => x.item.id) : []);
  $('reviewItems').querySelectorAll('input').forEach(input => { input.checked = checked; });
  updateReviewCount();
}
$('reviewSelectAll').addEventListener('click', () => setReviewSelection(true));
$('reviewClearAll').addEventListener('click', () => setReviewSelection(false));
$('beginReview').addEventListener('click',beginReview);
restore();
applyTheme(state.theme);
updateCustomTimerVisibility();
save();
render();
