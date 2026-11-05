const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const window={};vm.runInNewContext(fs.readFileSync('romaji.js','utf8'),{window});
const {matches}=window.KTFRomaji;
test('long vowels accept macrons and equivalent spellings in both directions',()=>{
  for(const [a,b] of [['gakkō','gakkou'],['ōkii','ookii'],['sūgaku','suugaku'],['kā','kaa'],['ī','ii'],['sē','sei'],['sē','see'],['TŌKYŌ!','toukyou'],['to\u0304kyo\u0304','toukyou'],['gakkô','gakkou'],['shi chi tsu fu ji','si ti tu hu zi']]){
    assert.equal(matches(a,b),true,`${a} = ${b}`);assert.equal(matches(b,a),true,`${b} = ${a}`);
  }
});
test('short vowels and literal spellings remain distinct, even around punctuation',()=>{
  for(const [a,b] of [['obasan','obāsan'],['ojisan','ojiisan'],['gakko','gakkou'],['su','sū'],['tokyo','tōkyō'],['oo','ou'],['ee','ei'],['',''],['!!!','a'],['ga校','gakkou']])assert.equal(matches(a,b),false,`${a} != ${b}`);
});
