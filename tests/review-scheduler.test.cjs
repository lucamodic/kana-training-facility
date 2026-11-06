const {test}=require('node:test');
const assert=require('node:assert/strict');
const {fold,plan}=require('../review-scheduler.js');
const DAY=86400000, base=Date.parse('2026-11-06T12:00:00Z');
const event=(id,time,correct,key='a')=>({id,time:new Date(time).toISOString(),payload:{studyReview:true,key,correct}});
test('review intervals progress only on due answers and errors reset to ten minutes',()=>{
  const events=[event('1',base,true),event('2',base+1000,true)];
  assert.equal(fold(events).get('a').due,base+DAY);
  events.push(event('3',base+DAY,true));
  assert.equal(fold(events).get('a').due,base+4*DAY);
  events.push(event('4',base+2*DAY,false));
  assert.equal(fold(events).get('a').due,base+2*DAY+600000);
  assert.equal(fold(events).get('a').stage,0);
  events.push(event('5',base+2*DAY+600000,true));
  assert.equal(fold(events).get('a').stage,1);
  assert.deepEqual(fold([...events].reverse()),fold([...events,events[0]]));
});
test('automatic plan prioritizes reviews, includes limited new material and excludes not-due mastered cards',()=>{
  const states=fold([event('1',base-2*DAY,true,'due'),event('2',base-1000,false,'error'),event('3',base-1000,true,'later')]);
  const cards=['due','error','later','new1','new2'].map(key=>({key,selected:true,source:'kana'}));
  assert.deepEqual(plan(cards,states,3,base).map(c=>c.key),['due','error','new1']);
  assert.deepEqual(plan(cards,states,1,base).map(c=>c.key),['due']);
  assert.deepEqual(plan(cards,states,10,base,true).map(c=>c.key),['due']);
  assert.deepEqual(plan(cards.filter(c=>c.key!=='due'),states,10,base,true),[]);
});
test('new material balances sources, ignores deselections and deduplicates',()=>{
  const cards=[{key:'a',source:'kana',selected:true},{key:'b',source:'kana',selected:true},{key:'c',source:'custom',selected:true},{key:'d',source:'grammar',selected:false}];
  assert.deepEqual(plan([...cards,cards[0]],new Map(),3,base).map(c=>c.key),['a','c','b']);
  assert.deepEqual(plan(cards,new Map(),3,base,true),[]);
});
