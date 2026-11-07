const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const window={};vm.runInNewContext(fs.readFileSync('meaning.js','utf8'),{window});
const {matches}=window.KTFMeaning;
test('meaning accepts any listed alternative, punctuation and typographic quotes symmetrically',()=>{
  for(const [answer,expected] of [
    ['TASTE!','sense; taste.'],['from time to time','sometimes; from time to time'],
    ["to have on one's mind",'to be interested in; to have on one’s mind'],
    ['good, and…','good, and…; being good and…'],['cat','dog / cat'],
    ['cat','dog\ncat'],['cat','dog；cat'],['looking','watching; looking (casual contraction of 見ている)'],
    ['seeming uninteresting','looking bored; seeming uninteresting (colloquial form of つまらなそう)'],
    ['there is','to exist; there is (for people and animals)'],['or','things like; or; apparently']
  ])assert.equal(matches(answer,expected),true,`${answer} / ${expected}`);
});
test('meaning keeps negatives, qualifiers, tense, accents and whole-answer boundaries',()=>{
  for(const [answer,expected] of [['happy','not happy'],['happy','happy (not sad)'],['go','went'],['and','good, and…'],['fortune','good fortune'],['ano','año'],['','cat'],['cat; wrong','cat; dog']])assert.equal(matches(answer,expected),false,`${answer} / ${expected}`);
});
