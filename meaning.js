"use strict";
(() => {
  const normalize=value=>String(value??'').normalize('NFKC').toLowerCase()
    .replace(/[’‘]/g,"'").replace(/[“”]/g,'"')
    .replace(/\s+/g,' ').trim()
    .replace(/^[\s"'¿¡]+|[\s"'.!?。！？…]+$/g,'').trim();
  function split(value,commas=true){
    const result=[];let part='',depth=0;
    for(const char of String(value??'').normalize('NFKC')){
      if(char==='('||char==='[')depth++;
      if(char===')'||char===']')depth=Math.max(0,depth-1);
      if(!depth&&(/[;/|\n\r]/.test(char)||(commas&&/[,、]/.test(char)))){if(part.trim())result.push(part.trim());part='';}
      else part+=char;
    }
    if(part.trim())result.push(part.trim());
    return result;
  }
  // Only recognized editorial annotations are optional. Never discard an
  // arbitrary qualifier such as "not happy" or infer synonyms from substrings.
  const annotation=/\s*\((?:colloquial form of|casual (?:contraction|form) of|contraction of|depending on context|for people and animals|hearsay|sentence-ending emphasis)[^()]*\)\s*$/i;
  function variants(expected){
    const values=Array.isArray(expected)?expected:[expected];
    const options=values.flatMap(value=>[String(value??''),...split(value,false),...split(value).filter(option=>!/^(?:and|or|etc)$/.test(normalize(option)))]);
    return [...new Set(options.flatMap(value=>[normalize(value),normalize(value.replace(annotation,''))]))]
      .filter(Boolean);
  }
  function matches(input,expected){const answer=normalize(input);return Boolean(answer)&&variants(expected).includes(answer);}
  window.KTFMeaning={normalize,split,variants,matches};
})();
