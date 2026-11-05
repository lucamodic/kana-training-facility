"use strict";
(() => {
  const lesson = (id, group, title, titleEs, description, descriptionEs, concept, conceptEs, examples) => ({
    id, group, title:{en:title,es:titleEs},description:{en:description,es:descriptionEs},concept:{en:concept,es:conceptEs},examples:examples.map((entry,index)=>({id:`${id}-${index+1}`,lessonId:id,japanese:entry[0],reading:entry[1],meanings:{es:entry[2].split('|'),en:entry[3].split('|')},breakdown:{es:entry[4],en:entry[5]}}))
  });
  const lessons = [
    lesson('sentence','basics','Sentence order','Orden de las oraciones','The verb or copula usually closes the sentence.','El verbo o la cópula suele ir al final.','Japanese commonly puts the topic first and the verb last. Subjects can be omitted when clear. です is a polite sentence ending, not a universal English “is.”','En japonés se suele presentar el tema primero y el verbo al final. El sujeto puede omitirse si se entiende. です da un cierre cortés; no siempre equivale a «ser».',[
      ['私は学生です。','watashi wa gakusei desu','Soy estudiante|Yo soy estudiante','I am a student', '私 = yo · は = tema · 学生 = estudiante · です = cierre cortés','私 = I · は = topic · 学生 = student · です = polite ending'],
      ['これは本です。','kore wa hon desu','Esto es un libro','This is a book','これ = esto · は = tema · 本 = libro · です = cierre cortés','これ = this · は = topic · 本 = book · です = polite ending'],
      ['あれは猫です。','are wa neko desu','Aquello es un gato|Ese de allá es un gato','That over there is a cat|That is a cat','あれ = aquello · は = tema · 猫 = gato','あれ = that over there · は = topic · 猫 = cat']
    ]),
    lesson('questions','basics','Questions with か','Preguntas con か','Turn statements into polite questions.','Convertí afirmaciones en preguntas corteses.','Place か at the end of a polite statement to ask a question. 何 means “what”; its reading depends on the word it is in.','Poné か al final de una oración cortés para hacer una pregunta. 何 significa «qué» y su lectura depende del contexto.',[
      ['これは何ですか。','kore wa nan desu ka','Qué es esto|¿Qué es esto?','What is this','これ = esto · 何 = qué · ですか = ¿es?','これ = this · 何 = what · ですか = question ending'],
      ['先生ですか。','sensei desu ka','Sos profesor|¿Sos profesor?|Es profesor|¿Es profesor?','Are you a teacher|Is this person a teacher','先生 = docente/profesor · ですか = forma cortés de preguntar','先生 = teacher · ですか = polite question'],
      ['日本語を話しますか。','nihongo o hanashimasu ka','Hablás japonés|¿Hablás japonés?|Habla japonés|¿Habla japonés?','Do you speak Japanese|Does this person speak Japanese','日本語 = japonés · を = objeto · 話します = habla · か = pregunta','日本語 = Japanese · を = object · 話します = speak · か = question']
    ]),
    lesson('demonstratives','basics','This and that','Esto y aquello','Choose これ, それ, あれ and この.','Distinguí これ, それ, あれ y この.','これ = this one (near me); それ = that one (near you); あれ = that one over there. この comes before a noun.','これ = esto (cerca mío); それ = eso (cerca tuyo); あれ = aquello (lejos de ambos). この se usa delante de un sustantivo.',[
      ['これは私のです。','kore wa watashi no desu','Esto es mío|Este es mío','This is mine','これ = esto · 私の = mío · です = cortés','これ = this · 私の = mine · です = polite ending'],
      ['それは何ですか。','sore wa nan desu ka','Qué es eso|¿Qué es eso?','What is that','それ = eso (cerca de la otra persona) · 何 = qué','それ = that (near the listener) · 何 = what'],
      ['この犬は小さいです。','kono inu wa chiisai desu','Este perro es pequeño|Este perro es chico','This dog is small','この = este (antes del sustantivo) · 犬 = perro · 小さい = pequeño','この = this (before a noun) · 犬 = dog · 小さい = small']
    ]),
    lesson('topic','particles','Topic marker は','Partícula de tema は','Introduce what the sentence is about.','Presentá de qué trata la oración.','As a particle, は is pronounced wa, not ha. It marks the topic; it does not always mark the grammatical subject.','Como partícula, は se pronuncia wa, no ha. Marca el tema, que no siempre coincide con el sujeto.',[
      ['私はアキです。','watashi wa aki desu','Soy Aki|Yo soy Aki','I am Aki','私 = yo · は = tema (wa) · アキ = Aki','私 = I · は = topic (wa) · アキ = Aki'],
      ['今日は月曜日です。','kyou wa getsuyoubi desu','Hoy es lunes','Today is Monday','今日 = hoy · は = tema · 月曜日 = lunes','今日 = today · は = topic · 月曜日 = Monday'],
      ['猫はかわいいです。','neko wa kawaii desu','Los gatos son lindos|Los gatos son adorables|El gato es lindo','Cats are cute|The cat is cute','猫 = gato(s) · は = de los gatos hablamos · かわいい = lindo','猫 = cat(s) · は = topic · かわいい = cute']
    ]),
    lesson('possession','particles','Possession with の','Posesión con の','Link nouns together.','Uní sustantivos entre sí.','Noun A の noun B shows belonging or association: A’s B, B of A.','Sustantivo A の sustantivo B indica pertenencia o relación: B de A.',[
      ['これは私の本です。','kore wa watashi no hon desu','Este es mi libro|Esto es mi libro','This is my book','私の = mi · 本 = libro · これは = esto','私の = my · 本 = book · これは = this'],
      ['彼の名前はケンです。','kare no namae wa ken desu','Su nombre es Ken|El nombre de él es Ken','His name is Ken','彼の = de él / su · 名前 = nombre · は = tema','彼の = his · 名前 = name · は = topic'],
      ['日本語の先生です。','nihongo no sensei desu','Soy profesor de japonés|Es profesor de japonés|Soy profesora de japonés','I am a Japanese teacher|This person teaches Japanese','日本語の = de japonés · 先生 = docente','日本語の = of Japanese · 先生 = teacher']
    ]),
    lesson('object','particles','Object marker を','Objeto directo を','Show what an action affects.','Indicá qué recibe la acción.','を marks the direct object of a verb. Its standard pronunciation as a particle is o.','を marca el objeto directo del verbo. Como partícula, habitualmente se pronuncia o.',[
      ['水を飲みます。','mizu o nomimasu','Bebo agua|Tomo agua','I drink water','水 = agua · を = objeto · 飲みます = bebo/tomo','水 = water · を = object · 飲みます = drink'],
      ['本を読みます。','hon o yomimasu','Leo un libro|Leo libros','I read a book|I read books','本 = libro · を = objeto · 読みます = leo','本 = book · を = object · 読みます = read'],
      ['映画を見ます。','eiga o mimasu','Veo una película|Miro una película','I watch a movie|I see a movie','映画 = película · を = objeto · 見ます = veo','映画 = movie · を = object · 見ます = watch']
    ]),
    lesson('place','particles','Where: に and で','Dónde: に y で','Distinguish destinations from action locations.','Distinguí destinos de lugares donde ocurre una acción.','に marks destinations and exact times; へ (pronounced e) emphasizes direction. で marks where an action happens or the means used.','に marca destinos y horas puntuales; へ (se pronuncia e) enfatiza la dirección. で marca dónde ocurre una acción o el medio usado.',[
      ['学校に行きます。','gakkou ni ikimasu','Voy a la escuela|Voy al colegio','I go to school','学校 = escuela · に = destino · 行きます = voy','学校 = school · に = destination · 行きます = go'],
      ['図書館で勉強します。','toshokan de benkyou shimasu','Estudio en la biblioteca','I study at the library|I study in the library','図書館 = biblioteca · で = lugar de la acción · 勉強します = estudio','図書館 = library · で = action location · 勉強します = study'],
      ['電車で行きます。','densha de ikimasu','Voy en tren','I go by train','電車 = tren · で = medio de transporte · 行きます = voy','電車 = train · で = means of transport · 行きます = go']
    ]),
    lesson('ga','particles','Subject marker が','Partícula de sujeto が','Introduce the subject or focus of new information.','Marcá el sujeto o el foco de información nueva.','が often marks the subject, especially in existence, preference and new-information sentences. Contrast its role with は, the topic marker.','が suele marcar el sujeto, especialmente en existencia, preferencias e información nueva. Comparalo con は, que marca el tema.',[
      ['猫がいます。','neko ga imasu','Hay un gato','There is a cat','猫 = gato · が = sujeto · います = hay (seres vivos)','猫 = cat · が = subject · います = there is (living beings)'],
      ['音楽が好きです。','ongaku ga suki desu','Me gusta la música|Me encanta la música','I like music','音楽 = música · が = elemento que gusta · 好き = agradable / que me gusta','音楽 = music · が = marked item · 好き = liked'],
      ['雨が降っています。','ame ga futte imasu','Está lloviendo|Llueve','It is raining','雨 = lluvia · が = sujeto · 降っています = está cayendo/lloviendo','雨 = rain · が = subject · 降っています = is falling']
    ]),
    lesson('polite','verbs','Polite present: ます','Presente cortés: ます','Affirmative and negative polite actions.','Acciones afirmativas y negativas en forma cortés.','ます makes a verb polite in nonpast tense, used for present habits and future events. ません is the polite negative.','ます es la forma cortés no pasada, para hábitos presentes y eventos futuros. ません es su negativa.',[
      ['毎日勉強します。','mainichi benkyou shimasu','Estudio todos los días','I study every day','毎日 = todos los días · 勉強します = estudio','毎日 = every day · 勉強します = study'],
      ['今日は行きません。','kyou wa ikimasen','Hoy no voy','I am not going today|I will not go today','今日は = hoy · 行きません = no voy (cortés)','今日は = today · 行きません = do not go (polite)'],
      ['明日読みます。','ashita yomimasu','Mañana voy a leer|Mañana leeré','I will read tomorrow','明日 = mañana · 読みます = leo / leeré (según contexto)','明日 = tomorrow · 読みます = will read']
    ]),
    lesson('past','verbs','Polite past','Pasado cortés','Recognize ました and ませんでした.','Reconocé ました y ませんでした.','ました makes a polite past affirmative. ませんでした makes a polite past negative. The verb stem stays the same.','ました expresa pasado afirmativo cortés. ませんでした expresa pasado negativo cortés. La raíz del verbo se mantiene.',[
      ['昨日映画を見ました。','kinou eiga o mimashita','Ayer vi una película|Ayer miré una película','I watched a movie yesterday|I saw a movie yesterday','昨日 = ayer · 映画を = película (objeto) · 見ました = vi','昨日 = yesterday · 映画を = movie (object) · 見ました = watched'],
      ['昨日は行きませんでした。','kinou wa ikimasen deshita','Ayer no fui','I did not go yesterday','昨日は = ayer · 行きませんでした = no fui','昨日は = yesterday · 行きませんでした = did not go'],
      ['朝ご飯を食べました。','asagohan o tabemashita','Desayuné|Comí el desayuno','I ate breakfast|I had breakfast','朝ご飯 = desayuno · を = objeto · 食べました = comí','朝ご飯 = breakfast · を = object · 食べました = ate']
    ]),
    lesson('teiru','verbs','Actions in progress: ている','Acciones en progreso: ている','Talk about what is happening right now.','Contá qué está ocurriendo ahora.','The て-form plus いる often describes an ongoing action. ています is its polite counterpart. In other contexts it can describe a resulting state.','La forma て más いる suele expresar una acción en curso. ています es la forma cortés. En otros contextos puede indicar un estado resultante.',[
      ['猫が寝ています。','neko ga nete imasu','El gato está durmiendo','The cat is sleeping','猫が = gato (sujeto) · 寝て = forma て de dormir · います = en curso','猫が = cat (subject) · 寝て = て-form of sleep · います = ongoing'],
      ['今日本語を勉強しています。','ima nihongo o benkyou shite imasu','Ahora estoy estudiando japonés|Estoy estudiando japonés ahora','I am studying Japanese now','今 = ahora · 日本語を = japonés (objeto) · 勉強しています = estoy estudiando','今 = now · 日本語を = Japanese (object) · 勉強しています = am studying'],
      ['本を読んでいます。','hon o yonde imasu','Estoy leyendo un libro','I am reading a book','本を = libro (objeto) · 読んでいます = estoy leyendo','本を = book (object) · 読んでいます = am reading']
    ]),
    lesson('iadjectives','adjectives','い-adjectives','Adjetivos い','Descriptive words that inflect.','Palabras descriptivas que se conjugan.','い-adjectives usually end in い and can directly modify nouns; their negative commonly ends in くない. きれい is an exception: it is a な-adjective.','Los adjetivos い suelen terminar en い y pueden modificar sustantivos directamente; su negativa suele terminar en くない. きれい es una excepción: es un adjetivo な.',[
      ['今日は寒いです。','kyou wa samui desu','Hoy hace frío|Hoy está frío','It is cold today|Today is cold','今日は = hoy · 寒い = hace frío · です = cortés','今日は = today · 寒い = cold · です = polite ending'],
      ['この本は面白いです。','kono hon wa omoshiroi desu','Este libro es interesante|Este libro es entretenido','This book is interesting','この本 = este libro · 面白い = interesante','この本 = this book · 面白い = interesting'],
      ['この犬は大きくないです。','kono inu wa ookikunai desu','Este perro no es grande','This dog is not big','大きい = grande · 大きくない = no es grande','大きい = big · 大きくない = not big']
    ]),
    lesson('naadjectives','adjectives','な-adjectives','Adjetivos な','Describe qualities with な or です.','Describí cualidades con な o です.','な-adjectives take な before a noun (静かな町), but do not use な before a final です (町は静かです).','Los adjetivos な llevan な antes de un sustantivo (静かな町), pero no delante de です al final (町は静かです).',[
      ['この町は静かです。','kono machi wa shizuka desu','Esta ciudad es tranquila|Este pueblo es tranquilo','This town is quiet','この町 = este pueblo/ciudad · 静か = tranquilo','この町 = this town · 静か = quiet'],
      ['静かな部屋です。','shizuka na heya desu','Es una habitación tranquila','It is a quiet room|This is a quiet room','静か = tranquilo · な = une con el sustantivo · 部屋 = habitación','静か = quiet · な = links to noun · 部屋 = room'],
      ['彼は元気です。','kare wa genki desu','Él está bien|Él tiene energía','He is well|He is doing well','彼は = él (tema) · 元気 = con energía/sano','彼は = he (topic) · 元気 = healthy/energetic']
    ])
  ];
  window.KTFGrammarData = {lessons,groups:[{id:'basics',en:'Basics',es:'Bases'},{id:'particles',en:'Particles',es:'Partículas'},{id:'verbs',en:'Verbs',es:'Verbos'},{id:'adjectives',en:'Adjectives',es:'Adjetivos'}]};
})();
