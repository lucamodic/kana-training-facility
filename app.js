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
// Additional mixed-script vocabulary and short, natural expressions.
// Japanese | accepted romaji readings | English answers | Spanish answers.
// These are still gated by ALL of the written characters the user selects,
// across every tab simultaneously (not just the tab currently visible).
const mixedWordRows = `
このケーキ|kono keeki|this cake|esta torta
そのケーキ|sono keeki|that cake|esa torta
あのバス|ano basu|that bus|ese colectivo
このゲーム|kono geemu|this game|este juego
このアニメ|kono anime|this anime|este anime
わたしのカメラ|watashi no kamera|my camera|mi cámara
わたしのスマホ|watashi no sumaho|my smartphone|mi celular
しろいネコ|shiroi neko|white cat|gato blanco
あおいバス|aoi basu|blue bus|colectivo azul
あたらしいスマホ|atarashii sumaho|new smartphone|celular nuevo
おいしいケーキ|oishii keeki|delicious cake|torta deliciosa
あついコーヒー|atsui koohii|hot coffee|café caliente
ちいさいカメラ|chiisai kamera|small camera|cámara pequeña
パンをたべる|pan o taberu|eat bread|comer pan
ケーキをたべる|keeki o taberu|eat cake|comer torta
ラーメンをたべる|raamen o taberu|eat ramen|comer ramen
コーヒーをのむ|koohii o nomu|drink coffee|beber café
テレビをみる|terebi o miru|watch television;watch tv|mirar televisión;ver televisión
アニメをみる|anime o miru|watch anime|ver anime
マンガをよむ|manga o yomu|read manga|leer manga
ゲームをする|geemu o suru|play games|jugar videojuegos
ホテルにいく|hoteru ni iku|go to the hotel|ir al hotel
レストランにいく|resutoran ni iku|go to a restaurant|ir a un restaurante
スープがすき|suupu ga suki|like soup|me gusta la sopa
パンがすき|pan ga suki|like bread|me gusta el pan
コーヒーがすき|koohii ga suki|like coffee|me gusta el café
おちゃとケーキ|ocha to keeki|tea and cake|té y torta
おちゃとコーヒー|ocha to koohii|tea and coffee|té y café
日本のアニメ|nihon no anime|japanese anime|anime japonés
日本のマンガ|nihon no manga|japanese manga|manga japonés
日本のラーメン|nihon no raamen|japanese ramen|ramen japonés
日本語のゲーム|nihongo no geemu|japanese-language game|videojuego en japonés
日本語のマンガ|nihongo no manga|manga in japanese|manga en japonés
学校のバス|gakkou no basu|school bus|colectivo escolar
新しいスマホ|atarashii sumaho|new smartphone|celular nuevo
大きいカメラ|ookii kamera|big camera|cámara grande
古いテレビ|furui terebi|old television;old tv|televisión vieja
私のカメラ|watashi no kamera|my camera|mi cámara
私のスマホ|watashi no sumaho|my smartphone|mi celular
日本語の先生|nihongo no sensei|japanese language teacher|profesor de japonés
日本語の本|nihongo no hon|japanese-language book|libro en japonés
パンを買う|pan o kau|buy bread|comprar pan
ケーキを買う|keeki o kau|buy cake|comprar torta
スーパーで買う|suupaa de kau|buy at a supermarket|comprar en un supermercado
日本語を話す|nihongo o hanasu|speak japanese|hablar japonés
日本語を学ぶ|nihongo o manabu|study japanese;learn japanese|estudiar japonés;aprender japonés
学校に行く|gakkou ni iku|go to school|ir a la escuela
学校の先生|gakkou no sensei|school teacher|maestro de escuela
本を読む|hon o yomu|read a book|leer un libro
名前を書く|namae o kaku|write a name|escribir un nombre
水を飲む|mizu o nomu|drink water|beber agua
花を見る|hana o miru|look at flowers|mirar flores
電車にのる|densha ni noru|ride the train;take the train|viajar en tren;tomar el tren
今日の天気|kyou no tenki|today's weather|el clima de hoy
明日の朝|ashita no asa|tomorrow morning|mañana a la mañana
雨の日|ame no hi|rainy day|día de lluvia
私の家|watashi no ie|my house|mi casa
私は学生|watashi wa gakusei|i am a student|soy estudiante
私は先生|watashi wa sensei|i am a teacher|soy profesor
友達と話す|tomodachi to hanasu|talk with a friend|hablar con un amigo
山に行く|yama ni iku|go to the mountains|ir a las montañas
海に行く|umi ni iku|go to the sea|ir al mar
今日は休み|kyou wa yasumi|today is a day off|hoy es día libre
お金がない|okane ga nai|have no money;no money|no tengo dinero;sin dinero
空を見る|sora o miru|look at the sky|mirar el cielo
店に入る|mise ni hairu|enter a shop|entrar a una tienda
家に帰る|ie ni kaeru|go home;return home|volver a casa
好きなアニメ|suki na anime|favorite anime;anime i like|anime favorito;anime que me gusta
コーヒー店|koohii ten|coffee shop|cafetería
ラーメン店|raamen ten|ramen restaurant;ramen shop|restaurante de ramen
カメラ店|kamera ten|camera store|tienda de cámaras
私はパンを食べる|watashi wa pan o taberu|i eat bread|yo como pan
私はコーヒーを飲む|watashi wa koohii o nomu|i drink coffee|yo bebo café
私はアニメが好き|watashi wa anime ga suki|i like anime|me gusta el anime
私はコーヒーが好き|watashi wa koohii ga suki|i like coffee|me gusta el café
私の好きなゲーム|watashi no suki na geemu|my favorite game|mi videojuego favorito
日本のアニメを見る|nihon no anime o miru|watch japanese anime|ver anime japonés
友達とゲームをする|tomodachi to geemu o suru|play games with a friend|jugar videojuegos con un amigo
今日はパンを食べる|kyou wa pan o taberu|eat bread today|comer pan hoy
この人は先生|kono hito wa sensei|this person is a teacher|esta persona es profesora
`.trim();
const words = [
  ...wordRows.split('\n').map((line, i) => {
    const [kana, readings, meanings] = line.split('|');
    return { id: `word:${i}`, kana, answer: meanings.split(';')[0], meanings: meanings.split(';'), readings: readings.split(','), kind: 'word' };
  }),
  ...mixedWordRows.split('\n').map((line, i) => {
    const [kana, readings, meanings, meaningsEs] = line.split('|');
    return { id: `word:mixed:${i}`, kana, answer: meanings.split(';')[0],
      meanings: meanings.split(';'), meaningsEs: meaningsEs.split(';'), readings: readings.split(','), kind: 'word' };
  })
];

// Interface translations live alongside the English source strings. Spanish is optional:
// a new visitor always starts in English; the chosen language is saved locally.
const ES_STATIC = {
  'your little Japanese study space':'tu rinconcito para estudiar japonés',
  'In a regular font':'Con una fuente normal', 'Check ↵':'Comprobar ↵', "I don't know":'No sé',
  'Finish lesson & view results':'Terminar y ver resultados',
  'Select all':'Seleccionar todo', 'Clear all':'Borrar todo','Random 10':'10 al azar',
  'Close':'Cerrar', 'Hide clock':'Ocultar reloj','Show clock':'Mostrar reloj',
  'One tiny study session at a time.':'Una sesión cortita a la vez.',
  'LOCAL SETTINGS · OFFLINE READY':'AJUSTES LOCALES · SIN CONEXIÓN',
  'Theme:':'Tema:', '● ready':'● listo', 'CHOOSE A THEME':'ELEGÍ UN TEMA',
  'Lavender':'Lavanda', 'Mint':'Menta', 'Peach':'Durazno', 'Sky':'Cielo',
  'Burgundy':'Bordó', 'Midnight':'Medianoche', 'Trans Pride':'Orgullo trans', 'Bi Pride':'Orgullo bi',
  'Nonbinary Pride':'Orgullo no binario', 'Lesbian Pride':'Orgullo lésbico', 'Language':'Idioma',
  'Word Challenge':'Desafío de palabras',
  'Tap a character or drag your mouse or finger across tiles to select or deselect several.':'Tocá un carácter o arrastrá el mouse o el dedo para marcar o desmarcar varios.',
  'Select all':'Seleccionar todo', 'Clear all':'Borrar todo', 'Random 10':'10 al azar',
  'characters on this tab':'caracteres en esta pestaña',
  'YOUR SELECTION':'TU SELECCIÓN', 'YOUR LITTLE STUDY TIMER':'TU TEMPORIZADOR',
  'Focus time':'Tiempo de estudio', 'Custom countdown':'Cuenta regresiva personalizada',
  'Guess limit':'Límite de respuestas', 'Number of guesses':'Cantidad de respuestas',
  'Please enter between 1 and 10,000 guesses.':'Ingresá un número entre 1 y 10.000 respuestas.', 'Guess limit configuration':'Configuración del límite de respuestas',
  'No countdown':'Sin cuenta regresiva', 'Stopwatch (count up)':'Cronómetro',
  '5-minute countdown':'5 minutos', '10-minute countdown':'10 minutos', '15-minute countdown':'15 minutos',
  'Hours':'Horas', 'Minutes':'Minutos', 'Please choose between 00:01 and 99:59.':'Elegí un tiempo entre 00:01 y 99:59.',
  'Countdowns end your lesson at zero. Pause anytime.':'Al llegar a cero, la lección termina. Podés pausar cuando quieras.',
  'Choose how many answers to practice. Wrong answers and “I don’t know” count too.':'Elegí cuántas respuestas querés practicar. Los errores y «No sé» también cuentan.',
  'Learn my selection →':'Aprender mi selección →',
  '3 guided passes showing the answer, followed by 3 memory-test passes.':'3 vueltas guiadas con las respuestas y 3 vueltas para practicar de memoria.',
  'Infinite character practice →':'Práctica infinita de caracteres →',
  'Shuffled questions until you decide to finish.':'Preguntas mezcladas hasta que decidas terminar.',
  '← Finish lesson':'← Terminar lección', 'Pause':'Pausar',
  'Answered':'Respondidas', 'Correct':'Correctas', 'Accuracy':'Precisión',
  'In a regular font':'Con una fuente normal', 'Your answer in romaji':'Tu respuesta en romaji',
  'Check ↵':'Comprobar ↵', "I don't know":'No sé',
  'Finish lesson & view results':'Terminar y ver resultados',
  "Here's how you did.":'Así te fue.',
  'Your trickiest items':'Los que más te costaron',
  'Ranked by mistakes and “I don\'t know” answers.':'Ordenados por errores y respuestas «No sé».',
  'Back to selection':'Volver a la selección', 'Try again →':'Volver a intentar →',
  'Practice my toughest items →':'Practicar los que más me costaron →',
  'Made for curious minds · No tracking · Works offline':'Para mentes curiosas · Sin seguimiento · Funciona sin conexión',
  'VOCABULARY PRACTICE':'PRÁCTICA DE VOCABULARIO',
  'words unlocked':'palabras disponibles',
  'What would you like to guess?':'¿Qué querés adivinar?',
  'English meaning':'Significado en inglés', 'Romaji reading':'Lectura en romaji',
  'Only vocabulary using your selected characters will appear. Your current timer setting also applies.':'Solo aparecen palabras que usan tus caracteres seleccionados. Se aplica el temporizador actual.',
  'Cancel':'Cancelar', 'Start word practice →':'Empezar con palabras →',
  'A LITTLE EXTRA PRACTICE':'UN POCO MÁS DE PRÁCTICA',
  'Review your toughest items':'Repasá lo que más te costó',
  "Uncheck anything you don't want to practice right now. Your regular selections won't change.":'Desmarcá lo que no quieras practicar ahora. Tu selección habitual no cambia.',
  'Select all':'Seleccionar todo', 'Clear':'Borrar', 'Start review →':'Empezar repaso →',
  'Guided learning':'Aprendizaje guiado', 'Say the reading out loud.':'Decí la lectura en voz alta.',
  'Enter to check / continue · Esc to finish':'Enter para comprobar / continuar · Esc para terminar',
  'Search character, reading, or meaning…':'Buscar carácter, lectura o significado…',
  'Decorative browser bar':'Barra de navegador decorativa',
  'Timer':'Temporizador',
  'Cancel':'Cancelar',
  'Choose your hiragana':'Elegí tus hiragana',
  'Your answer in romaji':'Tu respuesta en romaji',
  'Read the character and its sound out loud.':'Leé el carácter y pronunciá su sonido en voz alta.',
  'Filter characters':'Filtrar caracteres',
  'Change color theme':'Cambiar tema de color',
  'Color theme':'Tema de color',
  'Writing system':'Sistema de escritura',
  'Choose study material':'Elegir qué estudiar',
  'Session options':'Opciones de sesión',
  'Study session':'Sesión de estudio',
  'Session results':'Resultados de la sesión',
  'Close Word Challenge':'Cerrar desafío de palabras',
  'Close review dialog':'Cerrar ventana de repaso',
  'Custom countdown duration':'Duración personalizada',
  'Timer mode':'Modo del temporizador',
  'Lesson progress':'Progreso de la lección',
  'Kana Training Facility, go to selection':'Kana Training Facility, ir a selección',
  'Replace the current selection with up to 10 random visible characters':'Reemplazar la selección por hasta 10 caracteres visibles al azar',
};
const UI_EN = {
  selectedDesc:'{count} selected · ready to study.', emptySelection:'Pick at least one character to begin.',
  wordReady:'Ready to practice {count} {word} from your selections across all three tabs.',
  wordLocked:'No words unlocked yet. Select characters from any tab to unlock words, including mixed-script words.',
  choose:'Choose your {script}', chooseVisible:'Select visible', clearVisible:'Clear visible',
  noneFound:'No characters match this search.', groupSelect:'Select', groupClear:'Clear', selected:'selected', notSelected:'not selected',
  timerGuess:'✧ Little steps, big progress!', toastBadGuesses:'Please enter a number of guesses between 1 and 10,000.',
  guessProgress:'{done} / {total} guesses', guessReached:'Guess goal reached!',
  summaryGuessGoal:'Finished {attempts} of {goal} guesses{timing}.',
  timerNone:'✧ Infinite Practice shows an optional study clock.', timerUp:'✧ Every little minute counts.', timerReady:'✧ You’ve got this!',
  toastSelect:'{count} randomly chosen characters selected.', toastEmpty:'Please select at least one eligible item first.',
  toastBadTimer:'Please enter a valid custom countdown.', toastBadTimerBefore:'Please enter a valid custom countdown before starting.',
  themeAria:'Change color theme, current {name}',
  quizItems:'{label} · {count} {item}{mode}', words:'Vocabulary', learnSuffix:' · Learn', reviewSuffix:' · Review',
  learnPass:'{stage} · Pass {pass} of 3 · Item {item} of {total}', round:'Round {round} · Item {item} of {total}',
  guided:'Guided learning', memory:'Memory practice', headGuided:'Look closely and learn this character',
  headWordsMeaning:'What does this word mean in English?', headWordsReading:'How do you read this word?',
  headCharacter:'How do you read this character?', hintGuided:'Enter to continue · Esc to finish', hintQuiz:'Enter to check / continue · Esc to finish',
  progressGuided:'Stage 1/2 · Guided learning', progressMemory:'Stage 2/2 · Memory practice',
  passCount:'Pass {pass} of 6', guideCaption:'Reading / meaning',
  guideTip1:'Read the character and its sound out loud.',guideTip2:'Try to recall the sound before looking below.',guideTip3:'Say the reading from memory, then double-check it.',
  guideNext:'Got it, next →', guideMemory:'Start memory practice →',
  answerWordsMeaning:'Your answer in English', answerRomaji:'Your answer in romaji',
  answerWordsExample:'e.g. cat, mountain, hello…', answerRomajiWordExample:'e.g. neko, yama…',answerRomajiExample:'e.g. ka, shi, tsu…',
  seeResults:'View results →',next:'Next →',alsoAccepted:' Also accepted: {answers}.',
  correctFeedback:'Correct! {kana} = {answer}{extra}.{alt}',wrongFeedback:'The answer was {answer} ({kana}){extra}.{alt}',
  pause:'Pause', resume:'Resume', timeUp:'Time is up!',lessonComplete:'Lesson complete!',sessionFinished:'Session finished',
  summaryLearn:'Only your memory-test answers count toward accuracy; the three guided passes are for learning.',
  summaryOther:'These results include answers from the session you just finished.',
  timing:' · Time: {time} elapsed',completed:'Completed',reached:'Reached',
  summaryLearning:'{progress} pass {round} of 6{timing}.',summaryReview:'Focused review of {count} item(s){timing}.',summaryDuration:'Session duration{timing}.',
  attemptsCorrect:'{attempts} {attemptLabel} · {correct} correct',errors:'{count} {label}',
  showingSome:'Showing 10 of {count} missed items. All are available in the review dialog.',
  flawless:'Amazing! You had no mistakes this time.',emptySummary:'No answers yet. Try a round to discover what needs practice.',
  repeatLesson:'Repeat lesson →',repeatPractice:'Practice again →',reviewLine:'{errors} {errorLabel} · {attempts} attempts',
  selectedCount:'{count} selected',clockHide:'Hide clock',clockShow:'Show clock',wordSingular:'word',wordPlural:'words',
  itemSingular:'item',itemPlural:'items',attemptSingular:'attempt',attemptPlural:'attempts',mistakeSingular:'mistake',mistakePlural:'mistakes',
};
const UI_ES = {
  selectedDesc:'{count} seleccionados · listos para estudiar.', emptySelection:'Elegí al menos un carácter para empezar.',
  wordReady:'Tenés {count} {word} disponibles, usando lo seleccionado en las tres pestañas.',
  wordLocked:'Todavía no hay palabras disponibles. Seleccioná caracteres de cualquier pestaña para desbloquear palabras, incluso combinadas.',
  choose:'Elegí tus caracteres de {script}', chooseVisible:'Seleccionar visibles', clearVisible:'Borrar visibles',
  noneFound:'No hay caracteres que coincidan con la búsqueda.', groupSelect:'Seleccionar', groupClear:'Borrar', selected:'seleccionado', notSelected:'sin seleccionar',
  timerGuess:'✧ ¡De a poquito, llegás lejos!', toastBadGuesses:'Ingresá una cantidad de respuestas entre 1 y 10.000.',
  guessProgress:'{done} / {total} respuestas', guessReached:'¡Objetivo de respuestas cumplido!',
  summaryGuessGoal:'Completaste {attempts} de {goal} respuestas{timing}.',
  timerNone:'✧ En práctica infinita aparece un reloj opcional.', timerUp:'✧ Cada minutito cuenta.', timerReady:'✧ ¡Vos podés!',
  toastSelect:'Seleccionaste {count} caracteres al azar.',toastEmpty:'Primero seleccioná al menos un elemento.',
  toastBadTimer:'Ingresá un tiempo válido para la cuenta regresiva.',toastBadTimerBefore:'Ingresá un tiempo válido antes de empezar.',
  themeAria:'Cambiar tema de color, actual: {name}',
  quizItems:'{label} · {count} {item}{mode}', words:'Vocabulario',learnSuffix:' · Aprender',reviewSuffix:' · Repaso',
  learnPass:'{stage} · Vuelta {pass} de 3 · Elemento {item} de {total}',round:'Vuelta {round} · Elemento {item} de {total}',
  guided:'Aprendizaje guiado',memory:'Práctica de memoria',headGuided:'Observá y aprendé este carácter',
  headWordsMeaning:'¿Qué significa esta palabra en español?',headWordsReading:'¿Cómo se lee esta palabra?',
  headCharacter:'¿Cómo se lee este carácter?',hintGuided:'Enter para continuar · Esc para terminar',hintQuiz:'Enter para comprobar / continuar · Esc para terminar',
  progressGuided:'Etapa 1/2 · Aprendizaje guiado',progressMemory:'Etapa 2/2 · Práctica de memoria',
  passCount:'Vuelta {pass} de 6',guideCaption:'Lectura / significado',
  guideTip1:'Leé el carácter y pronunciá su sonido en voz alta.',guideTip2:'Intentá recordar el sonido antes de mirar la respuesta.',guideTip3:'Decí la lectura de memoria y después comprobala.',
  guideNext:'Entendido, siguiente →',guideMemory:'Empezar práctica de memoria →',
  answerWordsMeaning:'Tu respuesta en español',answerRomaji:'Tu respuesta en romaji',
  answerWordsExample:'Ej.: gato, montaña, hola…',answerRomajiWordExample:'Ej.: neko, yama…',answerRomajiExample:'Ej.: ka, shi, tsu…',
  seeResults:'Ver resultados →',next:'Siguiente →',alsoAccepted:' También se acepta: {answers}.',
  correctFeedback:'¡Correcto! {kana} = {answer}{extra}.{alt}',wrongFeedback:'La respuesta era {answer} ({kana}){extra}.{alt}',
  pause:'Pausar',resume:'Reanudar',timeUp:'¡Se terminó el tiempo!',lessonComplete:'¡Lección completada!',sessionFinished:'Sesión terminada',
  summaryLearn:'Solo cuentan las respuestas de memoria para la precisión; las tres primeras vueltas son guiadas.',
  summaryOther:'Estos resultados corresponden a la sesión que acabás de terminar.',
  timing:' · Tiempo transcurrido: {time}',completed:'Completaste',reached:'Llegaste a',
  summaryLearning:'{progress} la vuelta {round} de 6{timing}.',summaryReview:'Repaso de {count} elementos{timing}.',summaryDuration:'Duración de la sesión{timing}.',
  attemptsCorrect:'{attempts} {attemptLabel} · {correct} correctas',errors:'{count} {label}',
  showingSome:'Se muestran 10 de {count} elementos con errores. Podés repasarlos todos en la ventana de repaso.',
  flawless:'¡Genial! No tuviste errores esta vez.',emptySummary:'Todavía no respondiste. Probá una vuelta para descubrir qué necesitás practicar.',
  repeatLesson:'Repetir lección →',repeatPractice:'Practicar otra vez →',reviewLine:'{errors} {errorLabel} · {attempts} intentos',
  selectedCount:'{count} seleccionados',clockHide:'Ocultar reloj',clockShow:'Mostrar reloj',wordSingular:'palabra',wordPlural:'palabras',
  itemSingular:'elemento',itemPlural:'elementos',attemptSingular:'intento',attemptPlural:'intentos',mistakeSingular:'error',mistakePlural:'errores',
};
function t(key, args={}) {
  const pattern = (state.language === 'es' ? UI_ES[key] : UI_EN[key]) ?? UI_EN[key] ?? key;
  return String(pattern).replace(/\{([a-zA-Z]+)\}/g, (_, name) => String(args[name] ?? ''));
}
const glossTable = `
I|yo
above|arriba
adult|adulto
after|después
afternoon|tarde
ahead|adelante
air|aire
am|a. m.
anime|anime
apple|manzana
ask|preguntar
autumn|otoño
before|antes
behind|atrás
below|abajo
big|grande
bird|pájaro
birth|nacimiento
black|negro
blue|azul
boat|bote
book|libro
box|caja
boy|chico
bread|pan
bright|brillante
bug|bicho
bus|colectivo
buy|comprar
bye|chau
cake|torta
camera|cámara
candy|caramelo
car|auto
cat|gato
cell phone|celular
character|carácter
cheap|barato
cherry blossom|flor de cerezo
child|niño
clock|reloj
close|cerca
cloud|nube
coffee|café
come|venir
comic|historieta
country|país
cow|vaca
day|día
daytime|día
desk|escritorio
dog|perro
down|abajo
dream|sueño
drink|beber
ear|oreja
earth|tierra
east|este
eat|comer
egg|huevo
eight|ocho
electricity|electricidad
empty|vacío
enter|entrar
exit|salir
eye|ojo
face|cara
fall|otoño
family|familia
father|padre
fire|fuego
fish|pescado
five|cinco
flower|flor
food|comida
foot|pie
four|cuatro
friend|amigo
front|frente
game|juego
girl|chica
go|ir
gold|oro
good afternoon|buenas tardes
good morning|buen día
good night|buenas noches
goodbye|adiós
grass|pasto
half|mitad
hand|mano
hear|oír
heaven|cielo
hello|hola
here|acá
high|alto
home|hogar
hotel|hotel
hour|hora
house|casa
hundred|cien
i|yo
ice cream|helado
insect|insecto
inside|adentro
interval|intervalo
island|isla
japan|Japón
japanese|japonés
japanese language|idioma japonés
language|idioma
leave|irse
left|izquierda
leg|pierna
letter|carta
life|vida
like|gustar
listen|escuchar
long|largo
love|amor
man|hombre
manga|manga
me|mí
meat|carne
middle|medio
minute|minuto
mobile phone|celular
money|dinero
month|mes
moon|luna
morning|mañana
mother|madre
mountain|montaña
mouth|boca
name|nombre
near|cerca
new|nuevo
night|noche
nine|nueve
noon|mediodía
north|norte
nose|nariz
now|ahora
ocean|océano
octopus|pulpo
old|viejo
one|uno
origin|origen
outside|afuera
paper|papel
part|parte
path|camino
peaceful|tranquilo
peach|durazno
person|persona
plural suffix|sufijo plural
pm|p. m.
previous|anterior
radio|radio
rain|lluvia
ramen|ramen
reach|alcanzar
read|leer
red|rojo
rest|descansar
restaurant|restaurante
return|volver
rice field|campo de arroz
right|derecha
river|río
road|camino
robot|robot
room|habitación
salt|sal
sand|arena
school|escuela
sea|mar
see|ver
sentence|oración
seven|siete
ship|barco
shoes|zapatos
shop|tienda
six|seis
sky|cielo
small|pequeño
smartphone|celular
snack|merienda
snow|nieve
soil|suelo
song|canción
soup|sopa
south|sur
speak|hablar
spirit|espíritu
spring|primavera
star|estrella
station|estación
stone|piedra
store|negocio
story|historia
strength|fuerza
student|estudiante
study|estudiar
summer|verano
sun|sol
supermarket|supermercado
sushi|sushi
sweets|dulces
tall|alto
taxi|taxi
tea|té
teacher|profesor
television|televisión
ten|diez
ten thousand|diez mil
thank you|gracias
thanks|gracias
thousand|mil
three|tres
time|tiempo
today|hoy
tomato|tomate
tomorrow|mañana
top|parte superior
town|pueblo
train|tren
tree|árbol
tribe|tribu
tv|televisión
two|dos
umbrella|paraguas
under|debajo
up|arriba
vehicle|vehículo
voice|voz
volcano|volcán
watch|reloj
water|agua
way|camino
week|semana
weekday|día de la semana
west|oeste
what|qué
white|blanco
wind|viento
winter|invierno
woman|mujer
wood|madera
word|palabra
write|escribir
writing|escritura
year|año
yen|yen
yesterday|ayer
`.trim();
const ES_GLOSS = Object.fromEntries(glossTable.split('\n').map(s => s.split('|')));
const toSpanish = english => english.split(';').map(term => ES_GLOSS[term.trim()] || term.trim()).join('; ');
const itemMeaning = item => !item.meaning ? '' : (state.language === 'es' ? toSpanish(item.meaning) : item.meaning);
const wordMeanings = item => state.language === 'es' ? (item.meaningsEs || item.meanings.map(term => ES_GLOSS[term] || term)) : item.meanings;
const localCategory = {basic:['Kana básicos','Los sonidos esenciales'],voiced:['Sonidos sonoros','Sonidos como ga, za, ba y pa'],
  combo:['Combinaciones','Sonidos como kya, sha y cho'],historical:['Históricos','Poco usados en japonés moderno'],
  extra:['Katakana extendido','Frecuentes en palabras extranjeras']};
const localKanjiCategory = {
  'Numbers':['Números','Cantidades y números'],
  'People & learning':['Personas y aprendizaje','Familia, estudio y personas'],
  'Nature':['Naturaleza','El mundo que te rodea'],
  'Time & calendar':['Tiempo y calendario','Días, estaciones y horas'],
  'Places & directions':['Lugares y direcciones','Para orientarte'],
  'Everyday life':['Vida cotidiana','Sustantivos, verbos y adjetivos frecuentes']
};
const STATIC_SELECTOR = [
  '#brandSubtitle','#offlineText','#themeCaption','#browserReady','.theme-menu-label','.palette-name','#languageCaption',
  '#wordsLaunchText','#dragHint','#randomTen','#selectedUnit','.side-label','.timer-card-title',
  '#printedLabel','#checkButton','#skipButton','#guidedCaption','#finishLessonButton',
  '#timerSetting option','.time-caption','#customTimerError','#guessLimitError','#countdownHelp','#learnButton','#learnHelp','#startButton','#practiceHelp',
  '.stat-answered','.stat-correct','.stat-accuracy','#finishLessonButton','#summaryTitle','#hardestHeading','#hardestHelp',
  '#backToSelection','#reviewMistakesButton','#footerText','#wordsDialog .eyebrow','#wordsDialogTitle','#wordsUnlockedUnit',
  '#wordsDialog .small-label','#wordAnswerMode option','#wordsDialogHelp','#cancelWordsDialog','#wordsButton',
  '#reviewDialog .eyebrow','#reviewTitle','#reviewDialogHelp','#reviewSelectAll','#reviewClearAll','#cancelReview','#beginReview'
].join(',');
const STATIC_ATTRIBUTES = [
  ['#search','placeholder'], ['#search','aria-label'], ['#themeMenu','aria-label'],
  ['.tabs','aria-label'], ['#setupScreen','aria-label'], ['#sidePanel','aria-label'], ['.side-panel','aria-label'],
  ['#quizScreen','aria-label'], ['#summaryScreen','aria-label'], ['#homeLink','aria-label'],
  ['#randomTen','title'],['#closeWordsDialog','aria-label'],['#closeReview','aria-label'],
  ['#customTimerFields','aria-label'], ['#guessLimitFields','aria-label'], ['#timerSetting','aria-label'],['#progressTrack','aria-label'],
  ['#timerDisplay','aria-label'], ['.retro-browser','aria-label']
];
const originalText = new WeakMap();
const originalAttrs = new WeakMap();
function translateStatic() {
  document.querySelectorAll(STATIC_SELECTOR).forEach(el => {
    if (!originalText.has(el)) originalText.set(el, el.textContent);
    const source = originalText.get(el);
    el.textContent = state.language === 'es' ? (ES_STATIC[source] || source) : source;
  });
  for (const [selector,attribute] of STATIC_ATTRIBUTES) document.querySelectorAll(selector).forEach(el => {
    let originals = originalAttrs.get(el);
    if (!originals) { originals = {}; originalAttrs.set(el,originals); }
    if (!(attribute in originals)) originals[attribute] = el.getAttribute(attribute);
    const source=originals[attribute];
    if (source !== null) el.setAttribute(attribute,state.language === 'es' ? (ES_STATIC[source] || source) : source);
  });
}
function localThemeName(name) { return state.language === 'es' ? (ES_STATIC[name] || name) : name; }
function changeLanguage(language, persist=true) {
  if (!['en','es'].includes(language)) return;
  state.language = language;
  document.documentElement.lang = language;
  $('languageSelect').value = language;
  translateStatic();
  applyTheme(state.theme);
  updateCustomTimerVisibility();
  render();
  if (state.quiz) refreshQuizLanguage();
  if (state.lastSummary && !$('summaryScreen').hidden) renderSummary(state.lastSummary);
  if (persist) save();
}

const STORAGE_KEY = 'kana-training-facility-v2';
const OLD_STORAGE_KEY = 'kana-lab-selection-v1';
const PALETTES = ['pastel', 'mint', 'peach', 'blue', 'burgundy', 'night', 'trans', 'bi', 'nonbinary', 'lesbian'];
const THEME_NAMES = { pastel: 'Lavender', mint: 'Mint', peach: 'Peach', blue: 'Sky', burgundy: 'Burgundy', night: 'Midnight', trans: 'Trans Pride', bi: 'Bi Pride', nonbinary: 'Nonbinary Pride', lesbian: 'Lesbian Pride' };
const SCRIPTS = ['hiragana', 'katakana', 'kanji'];
const $ = id => document.getElementById(id);
const state = {
  script: 'hiragana', selected: { hiragana: new Set(), katakana: new Set(), kanji: new Set() },
  theme: 'pastel', timerSetting: 'off', customHours: 0, customMinutes: 5, guessLimit: 200, wordAnswerMode: 'meaning',
  language: 'en', showElapsedClock: true,
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
  document.querySelector('meta[name="theme-color"]').content = ({night:'#25283f',burgundy:'#712b4b',trans:'#5bcefa',bi:'#9b4f96',nonbinary:'#fcf434',lesbian:'#d52d00'})[theme] || '#d9cae9';
  document.querySelectorAll('[data-palette]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.palette === theme)));
  $('currentThemeName').textContent = localThemeName(THEME_NAMES[theme]);
  $('themeToggle').setAttribute('aria-label', t('themeAria',{name: localThemeName(THEME_NAMES[theme])}));
}
function setThemeMenu(open) {
  $('themeMenu').hidden = !open;
  $('themeToggle').setAttribute('aria-expanded', String(open));
}
function payload() {
  return { version: 3, script: state.script, theme: state.theme, timerSetting: state.timerSetting,
    customHours: state.customHours, customMinutes: state.customMinutes, guessLimit: state.guessLimit, language: state.language, showElapsedClock: state.showElapsedClock,
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
  // Keep existing users' chosen timer. New visitors start with No countdown.
  const isLegacy = Number(data.version || 1) < 3;
  const oldMode = ['off','up','300','600','900','custom','guesses'].includes(data.timerSetting) ? data.timerSetting : 'off';
  state.timerSetting = oldMode;
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
  state.guessLimit = Number.isInteger(Number(data.guessLimit)) && data.guessLimit !== '' && Number(data.guessLimit) >= 1 && Number(data.guessLimit) <= 10000 ? Number(data.guessLimit) : 200;
  state.wordAnswerMode = ['meaning','reading'].includes(data.wordAnswerMode) ? data.wordAnswerMode : 'meaning';
  state.language = ['en','es'].includes(data.language) ? data.language : 'en';
  state.showElapsedClock = data.showElapsedClock !== false;
  $('timerSetting').value = state.timerSetting;
  $('customHours').value = state.customHours;
  $('customMinutes').value = state.customMinutes;
  $('guessLimit').value = state.guessLimit;
  updateCustomTimerVisibility();
  $('wordAnswerMode').value = state.wordAnswerMode;
}
function updateCustomTimerVisibility() {
  $('customTimerFields').hidden = state.timerSetting !== 'custom';
  $('guessLimitFields').hidden = state.timerSetting !== 'guesses';
  $('customTimerError').hidden = true;
  $('guessLimitError').hidden = true;
  $('countdownHelp').textContent = state.timerSetting === 'guesses'
    ? (state.language === 'es' ? ES_STATIC['Choose how many answers to practice. Wrong answers and “I don’t know” count too.'] : 'Choose how many answers to practice. Wrong answers and “I don’t know” count too.')
    : state.timerSetting === 'off' || state.timerSetting === 'up'
      ? (state.language === 'es' ? 'Practicá sin límite. Podés mostrar u ocultar el reloj durante la práctica infinita.' : 'Practice for as long as you like. You can show or hide the clock in Infinite Practice.')
      : (state.language === 'es' ? ES_STATIC['Countdowns end your lesson at zero. Pause anytime.'] : 'Countdowns end your lesson at zero. Pause anytime.');
  $('timerFootnote').textContent = state.timerSetting === 'guesses' ? t('timerGuess')
    : state.timerSetting === 'off' ? t('timerNone')
    : state.timerSetting === 'up' ? t('timerUp')
    : t('timerReady');
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
function configuredGuessLimit() {
  const raw = $('guessLimit').value.trim();
  const value = Number(raw);
  const valid = /^\d+$/.test(raw) && Number.isSafeInteger(value) && value >= 1 && value <= 10000;
  $('guessLimitError').hidden = valid;
  return valid ? value : null;
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

// Identify the scripts that appear in a given piece of vocabulary.
function scriptsInWord(word) {
  const used = new Set();
  for (const char of word.kana) {
    const cp = char.codePointAt(0);
    if (cp >= 0x4e00 && cp <= 0x9fff) used.add('kanji');
    else if (cp >= 0x3040 && cp <= 0x309f) used.add('hiragana');
    else if (cp >= 0x30a0 && cp <= 0x30ff && char !== 'ー' && char !== '・') used.add('katakana');
  }
  return used;
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
  $('selectionHeading').textContent = t('choose',{script:script[0].toUpperCase()+script.slice(1)});
  $('selectedCount').textContent = selected.size;
  $('selectedDescription').textContent = selected.size ? t('selectedDesc',{count:selected.size}) : t('emptySelection');
  $('learnButton').disabled = !selected.size;
  $('startButton').disabled = !selected.size;
  const unlocked = eligibleWords();
  $('wordsButton').disabled = !unlocked.length;
  $('wordAvailableCount').textContent = unlocked.length;
  $('wordDialogCount').textContent = unlocked.length;
  const multi = unlocked.filter(word => scriptsInWord(word).size > 1);
  const triple = multi.filter(word => scriptsInWord(word).size === 3);
  $('mixedWordCount').textContent = state.language === 'es'
    ? `${multi.length} combinadas · ${triple.length} con los tres sistemas`
    : `${multi.length} mixed-script · ${triple.length} using all three scripts`;
  $('mixedWordExamples').textContent = multi.length
    ? (state.language === 'es' ? 'Ej.: ' : 'e.g. ') + multi.slice(0, 3).map(word => word.kana).join(' · ')
    : (state.language === 'es' ? 'Seleccioná caracteres de otras pestañas para desbloquear palabras mixtas.' : 'Select characters from other tabs to unlock mixed-script words.');
  $('wordCountDescription').textContent = unlocked.length
    ? t('wordReady',{count:unlocked.length,word:unlocked.length===1?t('wordSingular'):t('wordPlural')})
    : t('wordLocked');
  const visible = currentVisible();
  const filtered = !!$('search').value.trim();
  $('selectAll').textContent = filtered ? t('chooseVisible') : (state.language==='es'?'Seleccionar todo':'Select all');
  $('clearAll').textContent = filtered ? t('clearVisible') : (state.language==='es'?'Borrar todo':'Clear all');
  $('randomTen').disabled = !visible.length;
  const categoryNames = script === 'kanji' ? LABELS_KANJI : Object.fromEntries(Object.entries(labels).filter(([key]) => key !== 'extra' || script === 'katakana'));
  let html = '';
  for (const [category, [title, description]] of Object.entries(categoryNames)) {
    const entries = visible.filter(item => item.category === category);
    if (!entries.length) continue;
    const count = entries.filter(item => selected.has(item.kana)).length;
    const [heading, desc] = state.language === 'es' ? (script === 'kanji' ? localKanjiCategory[category] : localCategory[category]) || [title,description] : [title,description];
    html += `<section class="category" aria-label="${escapeHtml(heading)}"><div class="category-heading"><div><h3>${escapeHtml(heading)} <small>${count}/${entries.length} · ${escapeHtml(desc)}</small></h3></div><div class="category-actions"><button class="ghost-button" type="button" data-action="add-group" data-category="${escapeHtml(category)}">${t('groupSelect')}</button><button class="ghost-button" type="button" data-action="clear-group" data-category="${escapeHtml(category)}">${t('groupClear')}</button></div></div><div class="kana-grid">`;
    html += entries.map(item => `<button type="button" class="kana-tile ${script === 'kanji' ? 'kanji-tile' : ''}" data-action="toggle" data-kana="${escapeHtml(item.kana)}" aria-pressed="${selected.has(item.kana)}" aria-label="${escapeHtml(item.kana+', '+item.answer+(item.meaning ? ', '+itemMeaning(item) : '')+', '+(selected.has(item.kana) ? t('selected') : t('notSelected')))}"><span class="glyph" aria-hidden="true">${escapeHtml(item.kana)}</span><span class="roman" aria-hidden="true">${escapeHtml(item.answer)}</span>${item.meaning ? `<span class="tile-meaning" aria-hidden="true">${escapeHtml(itemMeaning(item).split(';')[0])}</span>` : ''}</button>`).join('');
    html += '</div></section>';
  }
  $('categories').innerHTML = html || `<p class="empty">${t('noneFound')}</p>`;
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
  if (quiz.kind === 'words') return quiz.wordAnswerMode === 'reading' ? item.readings : wordMeanings(item);
  return item.answers;
}
function displayAnswer(quiz, item) {
  if (quiz.kind === 'words') return quiz.wordAnswerMode === 'reading' ? item.readings[0] : wordMeanings(item)[0];
  return item.answer;
}
function itemDetail(item, wordMode) {
  if (item.kind === 'word') return `${item.readings[0]} · ${wordMeanings(item)[0]}`;
  return `${item.answer}${item.meaning ? ' · '+itemMeaning(item) : ''}`;
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
  if (!pool.length) { toast(t('toastEmpty')); return; }
  const timerMode = state.timerSetting === 'custom' ? customTimerSeconds() : state.timerSetting;
  if (timerMode === null) { toast(t('toastBadTimer')); $('customMinutes').focus(); return; }
  const guessLimit = state.timerSetting === 'guesses' ? configuredGuessLimit() : null;
  if (state.timerSetting === 'guesses' && guessLimit === null) { toast(t('toastBadGuesses')); $('guessLimit').focus(); return; }
  if (state.quiz) clearQuizTimers(state.quiz);
  const quiz = { mode, kind, script: state.script, pool, deck: [], current: null, last: null,
    attempts: 0, correct: 0, round: 0, seenInRound: 0, phase: 'question', perItem: new Map(),
    wordAnswerMode: wordModeOverride || state.wordAnswerMode, transitionTimeout: null,
    timerInterval: null, timerMode: String(timerMode === 'off' && mode === 'practice' && kind === 'characters' ? 'elapsed' : timerMode),
    elapsedMs: 0, lastTick: performance.now(), paused: false, lastCorrect: null,
    guessLimit, guessLimitReached: false, limitEndTimeout: null };
  state.quiz = quiz;
  $('setupScreen').hidden = true;
  $('summaryScreen').hidden = true;
  $('quizScreen').hidden = false;
  $('kanaDisplay').classList.remove('is-exiting', 'is-entering');
  $('quizPanel').classList.remove('is-paused');
  $('quizPoolLabel').textContent = t('quizItems',{label:kind==='words'?t('words'):quiz.script[0].toUpperCase()+quiz.script.slice(1),count:pool.length,item:pool.length===1?t('itemSingular'):t('itemPlural'),mode:mode==='learn'?t('learnSuffix'):mode==='review'?t('reviewSuffix'):''});
  $('stopButton').textContent = state.language === 'es' ? '← Terminar lección' : '← Finish lesson';
  $('learningProgress').hidden = mode !== 'learn';
  initTimer(quiz);
  nextQuestion();
  centerActiveExercise(quiz);
}
function syncElapsedClock(quiz) {
  const toggle = $('elapsedToggle');
  const canToggle = quiz.mode === 'practice' && quiz.kind === 'characters' && ['elapsed','up','guesses'].includes(quiz.timerMode);
  toggle.hidden = !canToggle;
  toggle.textContent = state.showElapsedClock ? t('clockHide') : t('clockShow');
  toggle.setAttribute('aria-pressed',String(state.showElapsedClock));
  $('timerArea').hidden = quiz.timerMode === 'off' || (canToggle && !state.showElapsedClock);
}
function initTimer(quiz) {
  const enabled = quiz.timerMode !== 'off';
  $('pauseTimerButton').textContent = t('pause');
  $('pauseTimerButton').setAttribute('aria-pressed', 'false');
  syncElapsedClock(quiz);
  if (!enabled) return;
  updateTimer(quiz);
  quiz.lastTick = performance.now();
  quiz.timerInterval = setInterval(() => {
    if (state.quiz !== quiz || quiz.paused) return;
    const now = performance.now();
    quiz.elapsedMs += Math.max(0, now - quiz.lastTick);
    quiz.lastTick = now;
    updateTimer(quiz);
    if (!['up','elapsed','guesses'].includes(quiz.timerMode) && quiz.elapsedMs >= Number(quiz.timerMode) * 1000) stopQuiz(false, true);
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
  const seconds = ['up','elapsed','guesses'].includes(quiz.timerMode) ? Math.floor(quiz.elapsedMs/1000)
    : Math.max(0, Number(quiz.timerMode) - quiz.elapsedMs/1000);
  $('timerDisplay').textContent = formatDuration(seconds);
  $('timerArea').classList.toggle('timer-urgent', !['up','elapsed','guesses'].includes(quiz.timerMode) && seconds <= 30);
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
  $('pauseTimerButton').textContent = quiz.paused ? t('resume') : t('pause');
  $('pauseTimerButton').setAttribute('aria-pressed', String(quiz.paused));
  $('quizPanel').classList.toggle('is-paused', quiz.paused);
  updateTimer(quiz);
  if (!quiz.paused && quiz.phase === 'question') $('answerInput').focus();
}
function clearQuizTimers(quiz) {
  clearInterval(quiz.timerInterval);
  clearTimeout(quiz.transitionTimeout);
  clearTimeout(quiz.limitEndTimeout);
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
  $('printedLabel').textContent = state.language === 'es' ? 'Con una fuente normal' : 'In a regular font';
  $('guidedBlock').hidden = !guided;
  $('answerArea').hidden = guided;
  $('quizStats').hidden = guided;
  updateQuestionLanguage(quiz);
  if (quiz.mode === 'learn') {
    const progress = Math.round(((quiz.round-1)*quiz.pool.length + quiz.seenInRound-1) / (6*quiz.pool.length)*100);
    $('progressFill').style.width = progress+'%';
    $('progressTrack').setAttribute('aria-valuenow', String(progress));
  }
  if (guided) {
    $('guidedReading').textContent = `${quiz.current.answer}${quiz.current.meaning ? ' · '+itemMeaning(quiz.current) : ''}`;
    $('guidedCaption').textContent = t('guideCaption');
    $('guidedTip').textContent = t('guideTip'+quiz.round);
    $('guidedNext').textContent = t(quiz.round === 3 && !quiz.deck.length ? 'guideMemory' : 'guideNext');
    $('guidedNext').disabled = false;
    if (!quiz.paused) $('guidedNext').focus({preventScroll:true});
  } else {
    setAnswerLabels(quiz);
    $('answerInput').value = '';
    $('answerInput').disabled = false;
    $('feedback').hidden = true;
    $('feedback').className = 'feedback';
    $('checkButton').textContent = state.language === 'es' ? 'Comprobar ↵' : 'Check ↵';
    $('checkButton').classList.remove('result-correct', 'result-wrong');
    $('checkButton').disabled = false;
    $('skipButton').hidden = false;
    if (!quiz.paused) $('answerInput').focus({preventScroll:true});
  }
  updateStats();
}
function advanceQuestion() {
  const quiz = state.quiz;
  if (quiz?.guessLimitReached && quiz.phase === 'result') { stopQuiz(false,false,true); return; }
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
function updateGuessProgress(quiz) {
  const pill = $('guessProgress');
  pill.hidden = quiz.guessLimit === null;
  if (!pill.hidden) pill.textContent = t('guessProgress',{done:quiz.attempts,total:quiz.guessLimit});
}
function updateStats() {
  if (!state.quiz) return;
  const {attempts,correct} = state.quiz;
  $('attemptsStat').textContent = attempts;
  $('correctStat').textContent = correct;
  $('accuracyStat').textContent = attempts ? Math.round(correct/attempts*100)+'%' : '—';
  updateGuessProgress(state.quiz);
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
  quiz.lastCorrect = correct;
  showFeedback(quiz);
  $('checkButton').classList.add(correct ? 'result-correct' : 'result-wrong');
  $('skipButton').hidden = true;
  updateStats();
  if (quiz.guessLimit !== null && quiz.attempts >= quiz.guessLimit) {
    quiz.guessLimitReached = true;
    $('checkButton').textContent = t('seeResults');
    // Leave the final answer (and the English meaning in Word Challenge) on
    // screen briefly before taking the student to the results automatically.
    quiz.limitEndTimeout = setTimeout(() => {
      if (state.quiz === quiz && quiz.phase === 'result') stopQuiz(false,false,true);
    }, 1250);
  }
  $('checkButton').focus({preventScroll:true});
}
function stopQuiz(completed = false, timedOut = false, reachedGuessGoal = false) {
  const quiz = state.quiz;
  if (!quiz) return;
  clearQuizTimers(quiz);
  $('kanaDisplay').classList.remove('is-exiting','is-entering');
  const hardest = [...quiz.perItem.values()].filter(x => x.errors > 0)
    .sort((a,b) => b.errors-a.errors || a.correct/a.attempts-b.correct/b.attempts || b.attempts-a.attempts);
  state.lastSummary = { hardest, kind:quiz.kind, mode:quiz.mode, pool:[...quiz.pool], script:quiz.script,
    wordAnswerMode:quiz.wordAnswerMode, timedOut, completed, guessLimitReached:reachedGuessGoal, guessLimit:quiz.guessLimit, round:quiz.round,
    attempts:quiz.attempts, correct:quiz.correct, timerMode:quiz.timerMode,
    elapsedMs:quiz.elapsedMs };
  renderSummary(state.lastSummary);
  state.quiz = null;
  $('quizScreen').hidden = true;
  $('setupScreen').hidden = true;
  $('summaryScreen').hidden = false;
  window.scrollTo({top:0,behavior:'instant'});
}
function setAnswerLabels(quiz) {
  $('answerLabel').textContent = quiz.kind === 'words' && quiz.wordAnswerMode === 'meaning' ? t('answerWordsMeaning') : t('answerRomaji');
  $('answerInput').placeholder = quiz.kind === 'words'
    ? (quiz.wordAnswerMode === 'meaning' ? t('answerWordsExample') : t('answerRomajiWordExample')) : t('answerRomajiExample');
}
function updateQuestionLanguage(quiz) {
  if (!quiz.current) return;
  const guided = quiz.mode === 'learn' && quiz.round <= 3;
  $('printedLabel').textContent = state.language === 'es' ? 'Con una fuente normal' : 'In a regular font';
  $('roundLabel').textContent = quiz.mode === 'learn'
    ? t('learnPass',{stage:t(guided?'guided':'memory'),pass:guided?quiz.round:quiz.round-3,item:quiz.seenInRound,total:quiz.pool.length})
    : t('round',{round:quiz.round,item:quiz.seenInRound,total:quiz.pool.length});
  $('quizHead').textContent = guided ? t('headGuided')
    : quiz.kind === 'words' ? t(quiz.wordAnswerMode === 'meaning'?'headWordsMeaning':'headWordsReading') : t('headCharacter');
  $('quizHint').textContent = t(guided?'hintGuided':'hintQuiz');
  $('learningStage').textContent = t(guided?'progressGuided':'progressMemory');
  $('learningCount').textContent = t('passCount',{pass:quiz.round});
  $('guidedCaption').textContent = t('guideCaption');
  if (guided) {
    $('guidedReading').textContent = `${quiz.current.answer}${quiz.current.meaning ? ' · '+itemMeaning(quiz.current) : ''}`;
    $('guidedTip').textContent = t('guideTip'+quiz.round);
    $('guidedNext').textContent = t(quiz.round === 3 && !quiz.deck.length ? 'guideMemory' : 'guideNext');
  }
  setAnswerLabels(quiz);
}
function showFeedback(quiz) {
  if (!quiz.current || quiz.phase !== 'result') return;
  const item = quiz.current;
  const correct = quiz.lastCorrect;
  const answer = displayAnswer(quiz,item);
  const alt = quiz.kind === 'characters' && item.answers.length > 1 ? t('alsoAccepted',{answers:item.answers.slice(1).join(', ')}) : '';
  const isWordReading = quiz.kind === 'words' && quiz.wordAnswerMode === 'reading';
  const extra = isWordReading ? '' : quiz.kind === 'words'
    ? ` · ${item.readings[0]} · ${wordMeanings(item)[0]}` : (item.meaning ? ` · ${itemMeaning(item)}` : '');
  $('feedback').textContent = correct
    ? t('correctFeedback',{kana:item.kana,answer,extra:quiz.kind==='words' && !isWordReading ? ` (${item.readings[0]})` : '',alt})
    : t('wrongFeedback',{kana:item.kana,answer,extra,alt});
  // In Word Challenge / Romaji Reading, reveal the English definition for
  // both correct and incorrect answers, regardless of the UI language.
  if (isWordReading) {
    const meaning = document.createElement('div');
    meaning.className = 'word-reading-meaning';
    const label = document.createElement('span');
    label.className = 'word-reading-meaning-label';
    label.textContent = state.language === 'es' ? 'Significado en inglés' : 'English meaning';
    const value = document.createElement('strong');
    value.textContent = item.meanings.join(' / ');
    meaning.append(label, value);
    $('feedback').appendChild(meaning);
  }
  $('checkButton').textContent = quiz.mode === 'learn' && quiz.round === 6 && quiz.deck.length === 0 ? t('seeResults') : t('next');
}
function refreshQuizLanguage() {
  const quiz = state.quiz;
  if (!quiz) return;
  $('quizPoolLabel').textContent = t('quizItems',{label:quiz.kind==='words'?t('words'):quiz.script[0].toUpperCase()+quiz.script.slice(1),count:quiz.pool.length,item:quiz.pool.length===1?t('itemSingular'):t('itemPlural'),mode:quiz.mode==='learn'?t('learnSuffix'):quiz.mode==='review'?t('reviewSuffix'):''});
  $('stopButton').textContent = state.language === 'es' ? '← Terminar lección' : '← Finish lesson';
  updateGuessProgress(quiz);
  $('pauseTimerButton').textContent = quiz.paused ? t('resume') : t('pause');
  syncElapsedClock(quiz);
  updateQuestionLanguage(quiz);
  if (quiz.phase === 'question') $('checkButton').textContent = state.language==='es'?'Comprobar ↵':'Check ↵';
  if (quiz.phase === 'result') {
    showFeedback(quiz);
    if (quiz.guessLimitReached) $('checkButton').textContent = t('seeResults');
  }
}
function renderSummary(s) {
  $('summaryEyebrow').textContent = t(s.guessLimitReached?'guessReached':s.timedOut?'timeUp':s.completed?'lessonComplete':'sessionFinished');
  $('summaryDescription').textContent = t(s.mode==='learn'?'summaryLearn':'summaryOther');
  const timing = s.timerMode === 'off' ? '' : t('timing',{time:formatDuration(Math.floor(s.elapsedMs/1000))});
  $('summaryProgress').hidden = !(s.guessLimitReached || s.mode==='learn' || timing || s.mode==='review');
  $('summaryProgress').textContent = s.guessLimitReached ? t('summaryGuessGoal',{attempts:s.attempts,goal:s.guessLimit,timing}) : s.mode==='learn'
    ? t('summaryLearning',{progress:t(s.completed?'completed':'reached'),round:s.round,timing})
    : s.mode==='review' ? t('summaryReview',{count:s.pool.length,timing}) : timing ? t('summaryDuration',{timing}) : '';
  $('summaryAttempts').textContent = s.attempts;
  $('summaryCorrect').textContent = s.correct;
  $('summaryAccuracy').textContent = s.attempts ? Math.round(s.correct/s.attempts*100)+'%' : '—';
  $('hardestResults').innerHTML = s.hardest.length
    ? `<ol class="hardest-list">${s.hardest.slice(0,10).map(x => `<li class="hardest-item"><span class="hardest-glyph" aria-hidden="true">${escapeHtml(x.item.kana)}</span><div class="hardest-info"><strong>${escapeHtml(itemDetail(x.item,s.wordAnswerMode))}</strong><span>${escapeHtml(t('attemptsCorrect',{attempts:x.attempts,attemptLabel:x.attempts===1?t('attemptSingular'):t('attemptPlural'),correct:x.correct}))}</span></div><span class="hardest-count">${escapeHtml(t('errors',{count:x.errors,label:x.errors===1?t('mistakeSingular'):t('mistakePlural')}))}</span></li>`).join('')}</ol>${s.hardest.length>10?`<p class="note">${escapeHtml(t('showingSome',{count:s.hardest.length}))}</p>`:''}`
    : `<p class="summary-empty">${t(s.attempts?'flawless':'emptySummary')}</p>`;
  $('reviewMistakesButton').hidden = s.hardest.length === 0;
  $('practiceAgain').textContent = t(s.mode==='learn'?'repeatLesson':'repeatPractice');
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
  $('reviewItems').innerHTML = state.lastSummary.hardest.map(x => `<label class="review-item"><input type="checkbox" data-review-id="${escapeHtml(x.item.id)}" checked><span class="review-glyph">${escapeHtml(x.item.kana)}</span><span class="review-item-text"><strong>${escapeHtml(itemDetail(x.item,state.lastSummary.wordAnswerMode))}</strong><span>${escapeHtml(t('reviewLine',{errors:x.errors,errorLabel:x.errors===1?t('mistakeSingular'):t('mistakePlural'),attempts:x.attempts}))}</span></span></label>`).join('');
  updateReviewCount();
  $('reviewDialog').showModal();
}
function updateReviewCount() {
  const count = state.reviewSelection.size;
  $('reviewCount').textContent = t('selectedCount',{count});
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
$('languageSelect').addEventListener('change', e => changeLanguage(e.target.value));
$('elapsedToggle').addEventListener('click', () => {
  state.showElapsedClock = !state.showElapsedClock;
  if (state.quiz) syncElapsedClock(state.quiz);
  save();
});
$('timerSetting').addEventListener('change', e => { state.timerSetting = e.target.value; updateCustomTimerVisibility(); save(); });
$('guessLimit').addEventListener('input', () => {
  state.guessLimit = $('guessLimit').value;
  if (state.timerSetting === 'guesses') configuredGuessLimit();
  save();
});
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
// Click-and-drag selection, like painting across cells. The first tile decides
// whether this stroke selects or clears. Each tile is visited at most once.
// We update tile styling in place while dragging so re-rendering cannot interrupt
// the active pointer, then save / update counters once the stroke finishes.
let selectionStroke = null;
let lastConsumedClick = null;
let touchScrollFrame = null;
const categoriesEl = $('categories');
function paintSelectionTile(tile) {
  const stroke = selectionStroke;
  if (!stroke || !tile || !categoriesEl.contains(tile) || !tile.classList.contains('kana-tile')) return;
  const kana = tile.dataset.kana;
  if (stroke.seen.has(kana)) return;
  stroke.seen.add(kana);
  const selected = state.selected[stroke.script];
  if (stroke.selecting) selected.add(kana);
  else selected.delete(kana);
  tile.setAttribute('aria-pressed', String(stroke.selecting));
  const item = catalogMap[stroke.script].get(kana);
  if (item) tile.setAttribute('aria-label', `${kana}, ${item.answer}${item.meaning ? ', '+item.meaning : ''}, ${stroke.selecting ? 'selected' : 'not selected'}`);
}
function paintAcrossPointer(from, to) {
  // Sample between move events so fast swipes don't miss tiles in the middle.
  const distance = Math.hypot(to.x - from.x, to.y - from.y);
  const steps = Math.max(1, Math.ceil(distance / 10));
  for (let i = 1; i <= steps; i++) {
    const x = from.x + (to.x - from.x) * (i / steps);
    const y = from.y + (to.y - from.y) * (i / steps);
    const target = document.elementFromPoint(x, y);
    paintSelectionTile(target?.closest('.kana-tile'));
  }
}
function endSelectionStroke(event) {
  if (!selectionStroke || (event && event.pointerId !== selectionStroke.pointerId)) return;
  const oldStroke = selectionStroke;
  selectionStroke = null;
  if (touchScrollFrame !== null) cancelAnimationFrame(touchScrollFrame);
  touchScrollFrame = null;
  // Pointer-generated click after a paint stroke must not toggle the first tile again.
  lastConsumedClick = {pointerId:oldStroke.pointerId, kana:oldStroke.firstKana, when:performance.now()};
  if (categoriesEl.hasPointerCapture?.(oldStroke.pointerId)) {
    categoriesEl.releasePointerCapture(oldStroke.pointerId);
  }
  save();
  render();
}
categoriesEl.addEventListener('pointerdown', event => {
  // Native touch scrolling is disabled only on tiles; users can still scroll
  // from headings, gaps and the rest of the page. Touch drags paint like mouse drags.
  if (!event.isPrimary || event.button !== 0) return;
  const tile = event.target.closest('.kana-tile');
  if (!tile || !categoriesEl.contains(tile)) return;
  event.preventDefault();
  selectionStroke = {
    pointerId: event.pointerId, script: state.script, pointerType: event.pointerType,
    firstKana: tile.dataset.kana,
    selecting: !state.selected[state.script].has(tile.dataset.kana),
    seen: new Set(), last: { x: event.clientX, y: event.clientY }
  };
  paintSelectionTile(tile);
  categoriesEl.setPointerCapture(event.pointerId);
  // Autoscroll while a finger stays near the viewport edge, so long grids
  // remain navigable without releasing the swipe selection.
  if (event.pointerType === 'touch') {
    const scrollDuringPaint = () => {
      const stroke = selectionStroke;
      if (!stroke || stroke.pointerId !== event.pointerId) { touchScrollFrame = null; return; }
      const vHeight = window.visualViewport?.height || window.innerHeight;
      const lowerEdge = vHeight - 72;
      const y = stroke.last.y;
      const speed = y < 72 ? -Math.min(14, (72 - y) / 5) : y > lowerEdge ? Math.min(14, (y - lowerEdge) / 5) : 0;
      if (speed) {
        const oldScroll = window.scrollY;
        window.scrollBy(0,speed);
        if (window.scrollY !== oldScroll) {
          paintSelectionTile(document.elementFromPoint(stroke.last.x,stroke.last.y)?.closest('.kana-tile'));
        }
      }
      touchScrollFrame = requestAnimationFrame(scrollDuringPaint);
    };
    touchScrollFrame = requestAnimationFrame(scrollDuringPaint);
  }
});
categoriesEl.addEventListener('pointermove', event => {
  if (!selectionStroke || selectionStroke.pointerId !== event.pointerId) return;
  const next = { x: event.clientX, y: event.clientY };
  paintAcrossPointer(selectionStroke.last, next);
  selectionStroke.last = next;
});
categoriesEl.addEventListener('pointerup', event => {
  if (!selectionStroke || selectionStroke.pointerId !== event.pointerId) return;
  paintAcrossPointer(selectionStroke.last, { x: event.clientX, y: event.clientY });
  endSelectionStroke(event);
});
categoriesEl.addEventListener('pointercancel', endSelectionStroke);
categoriesEl.addEventListener('lostpointercapture', endSelectionStroke);
categoriesEl.addEventListener('dragstart', event => {
  if (event.target.closest('.kana-tile')) event.preventDefault();
});
categoriesEl.addEventListener('click',e => {
  const button = e.target.closest('button[data-action]');
  if (!button) return;
  if (button.dataset.action === 'toggle') {
    // Pointer interactions (including taps) were processed at pointerdown.
    // Keep keyboard / accessibility clicks working (detail === 0).
    if (e.detail !== 0 && lastConsumedClick && performance.now() - lastConsumedClick.when < 1200 &&
        (typeof e.pointerId === 'number' ? e.pointerId === lastConsumedClick.pointerId : e.target.closest('.kana-tile')?.dataset.kana === lastConsumedClick.kana)) {
      lastConsumedClick = null;
      return;
    }
    updateSelection([button.dataset.kana], 'toggle');
  } else {
    updateSelection(currentVisible().filter(item => item.category === button.dataset.category).map(item => item.kana), button.dataset.action === 'add-group' ? 'add' : 'remove');
  }
});
$('selectAll').addEventListener('click', () => updateSelection(currentVisible().map(item => item.kana), 'add'));
$('clearAll').addEventListener('click', () => updateSelection(currentVisible().map(item => item.kana), 'remove'));
$('randomTen').addEventListener('click', () => {
  const subset = shuffle(currentVisible()).slice(0,10);
  state.selected[state.script] = new Set(subset.map(x => x.kana));
  save();render();toast(t('toastSelect',{count:subset.length}));
});
$('learnButton').addEventListener('click', () => startQuiz('learn'));
$('startButton').addEventListener('click', () => startQuiz('practice'));
$('openWordsButton').addEventListener('click', () => { render(); $('wordsDialog').showModal(); });
$('closeWordsDialog').addEventListener('click', () => $('wordsDialog').close());
$('cancelWordsDialog').addEventListener('click', () => $('wordsDialog').close());
$('wordsDialog').addEventListener('click', e => { if (e.target === $('wordsDialog')) $('wordsDialog').close(); });
$('wordsButton').addEventListener('click', () => {
  // Keep the dialog visible if the session setting is invalid, so the user can fix it in the sidebar.
  if (state.timerSetting === 'guesses' && configuredGuessLimit() === null) {
    $('wordsDialog').close();
    toast(t('toastBadGuesses'));
    $('guessLimit').focus();
    return;
  }
  if (state.timerSetting === 'custom' && customTimerSeconds() === null) {
    $('wordsDialog').close();
    toast(t('toastBadTimerBefore'));
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
changeLanguage(state.language,false);
save();
