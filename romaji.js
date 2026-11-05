"use strict";
(() => {
  // Keep long vowels intact. In particular, o/ō and u/ū are not interchangeable.
  const longVowels = {ā:['aa'],ī:['ii'],ū:['uu'],ē:['ee','ei'],ō:['oo','ou']};
  function normalize(value) {
    return String(value ?? '').normalize('NFKC').toLowerCase()
      .replace(/[âîûêô]/g, c => ({â:'ā',î:'ī',û:'ū',ê:'ē',ô:'ō'})[c])
      .replace(/[\s\-_'’.,!?。、！？]/g,'')
      .replace(/shi/g,'si').replace(/chi/g,'ti').replace(/tsu/g,'tu').replace(/fu/g,'hu').replace(/ji/g,'zi');
  }
  function matches(input, expected) {
    const a=normalize(input), b=normalize(expected);
    if (!a || !b) return false;
    const memo=new Map();
    function match(i,j) {
      const key=`${i}:${j}`;
      if(memo.has(key))return memo.get(key);
      let ok=i===a.length && j===b.length;
      if(i<a.length && j<b.length) {
        if(a[i]===b[j])ok=match(i+1,j+1);
        if(!ok && longVowels[a[i]])ok=longVowels[a[i]].some(v=>b.startsWith(v,j)&&match(i+1,j+v.length));
        if(!ok && longVowels[b[j]])ok=longVowels[b[j]].some(v=>a.startsWith(v,i)&&match(i+v.length,j+1));
      }
      memo.set(key,ok);return ok;
    }
    return match(0,0);
  }
  const hint=()=>document.documentElement.lang==='es'
    ? 'Podés usar vocales largas: ō = ou/oo, ū = uu, ā = aa, ī = ii, ē = ee/ei, según la palabra.'
    : 'Long vowels are accepted: ō = ou/oo, ū = uu, ā = aa, ī = ii, ē = ee/ei, depending on the word.';
  window.KTFRomaji={matches,normalize,hint};
})();
