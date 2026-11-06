"use strict";
// Deterministic event folding: the same synchronized events produce the same schedule.
((root) => {
  const DAY=86400000;
  function fold(events) {
    const states=new Map();
    const seen=new Set();
    for(const event of [...events].sort((a,b)=>a.time.localeCompare(b.time)||a.id.localeCompare(b.id))){
      const p=event.payload;
      if(!p?.studyReview || !p.key || typeof p.correct!=='boolean' || seen.has(event.id))continue;
      const time=Date.parse(event.time);if(!Number.isFinite(time))continue;
      seen.add(event.id);
      const previous=states.get(p.key);
      // Repeated correct answers before the due date do not inflate mastery.
      const advance=!previous || previous.stage===0 || time>=previous.due;
      const stage=p.correct ? (advance?Math.min(6,(previous?.stage||0)+1):previous.stage) : 0;
      const days=[0,1,3,7,14,30,60][stage];
      states.set(p.key,{key:p.key,stage,correct:p.correct,last:time,
        due:p.correct?(advance?time+days*DAY:previous.due):time+10*60000});
    }
    return states;
  }
  function plan(cards,states,limit,now=Date.now(),onlyDue=false){
    limit=Math.max(1,Math.min(100,Math.floor(Number(limit)||20)));
    const unique=[...new Map(cards.map(card=>[card.key,card])).values()];
    const due=unique.filter(card=>states.has(card.key)&&states.get(card.key).due<=now)
      .sort((a,b)=>states.get(a.key).due-states.get(b.key).due);
    if(onlyDue)return due.slice(0,limit);
    const recent=unique.filter(card=>{const s=states.get(card.key);return s&&!s.correct&&s.due>now;})
      .sort((a,b)=>states.get(b.key).last-states.get(a.key).last);
    const fresh=unique.filter(card=>card.selected&&!states.has(card.key));
    // Rotate sources so a large kana selection doesn't hide Custom or Grammar.
    const groups=new Map();for(const card of fresh){if(!groups.has(card.source))groups.set(card.source,[]);groups.get(card.source).push(card);}
    const balanced=[];while([...groups.values()].some(group=>group.length))for(const group of groups.values())if(group.length)balanced.push(group.shift());
    const review=[...due,...recent];
    const newLimit=review.length?Math.min(limit-1,Math.max(1,Math.floor(limit*.2))):limit;
    const chosen=[...review.slice(0,Math.max(0,limit-Math.min(newLimit,balanced.length))),...balanced.slice(0,newLimit)];
    return chosen.slice(0,limit);
  }
  const api={fold,plan};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.KTFReviewScheduler=api;
})(globalThis);
