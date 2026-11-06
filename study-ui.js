"use strict";
(() => {
  const $=id=>document.getElementById(id);
  const positions=new Map();
  let current='setupScreen', pending=false, restoring=false, library='kana';
  const routes={setupScreen:'homeLink',grammarScreen:'openGrammarButton',mangaScreen:'openMangaButton'};
  const active=()=>Boolean(window.KTFBridge?.isQuizActive() || window.KTFCustomCollection?.isActive?.() || window.KTFGrammar?.isActive?.() || window.KTFLearning?.isActive?.());
  function remember(){if(!pending)positions.set(current,{x:window.scrollX,y:window.scrollY});pending=true;}
  function track(id){remember();current=id;pending=false;}
  function alignCustomPanel(){
    if(library!=='custom'||$('setupScreen').hidden)return;
    const content=document.querySelector('.study-content');
    $('customSessionOptions').style.marginTop=`${$('customBrowse').offsetTop-content.offsetTop}px`;
  }
  function syncTabs(){
    document.querySelectorAll('#studyTabs [role=tab]').forEach(button=>{
      const selected=library==='custom'?button.id==='openCustomButton':button.dataset.script===window.KTFBridge?.getSettings().script;
      button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1;
    });
  }
  function selectLibrary(kind,updateHistory=true){
    library=kind==='custom'?'custom':'kana';
    const custom=library==='custom';
    $('setupScreen').classList.toggle('custom-screen',custom);
    $('setupScreen').dataset.library=library;
    $('characterPanel').hidden=custom;$('originalSessionOptions').hidden=custom;
    $('customBrowse').hidden=!custom;$('customSessionOptions').hidden=!custom;
    syncTabs();alignCustomPanel();pending=false;
    if(updateHistory&&!$('setupScreen').hidden&&!restoring)history.replaceState({...history.state,ktfView:'setupScreen',library},'');
  }
  function openCustom(){
    if(!$('setupScreen').hidden){selectLibrary('custom');return;}
    reveal('setupScreen',{restore:true,selection:'custom'});
  }
  function reveal(id,{restore=false,selection=library}={}) {
    const el=$(id);if(!el)return;
    if(!pending)remember();
    pending=false;current=id;
    const screen=el.closest('main > section') || el;
    for(const other of document.querySelectorAll('main > section'))other.hidden=other!==screen;
    // The existing study tabs move with the library; the original home panel is untouched.
    const switcher=document.querySelector('.study-switcher');
    const host=id==='grammarScreen'?$('grammarBrowse'):document.querySelector('.study-content');
    if(host && switcher)host.prepend(switcher);
    if(id==='setupScreen')selectLibrary(selection,false);
    if(switcher){
      syncTabs();
      for(const [route,button] of Object.entries(routes))if($(button))$(button).setAttribute('aria-current',route===id?'page':'false');
    }
    const pos=restore?positions.get(id):null;
    window.scrollTo({left:pos?.x||0,top:pos?.y??Math.max(0,screen.getBoundingClientRect().top+window.scrollY-16),behavior:'instant'});
    if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)el.animate?.([{opacity:0,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:180,easing:'ease-out'});
    if(!el.contains(document.activeElement)){el.setAttribute('tabindex','-1');el.focus({preventScroll:true});}
    const route=screen.id;
    if(routes[route] && !restoring && history.state?.ktfView!==route)history.pushState({ktfView:route,library},'',`#${route.replace('Screen','')}`);
  }
  function canLeave(){
    if(!active())return true;
    window.alert(document.documentElement.lang==='es'?'Terminá la práctica actual para ver tus resultados antes de cambiar de sección.':'Finish your current practice and view your results before switching sections.');
    return false;
  }
  window.KTFNavigation={remember,reveal,track,active,canLeave,openCustom,selectLibrary,isCustomSelected:()=>library==='custom'};
  const tr=(en,es)=>document.documentElement.lang==='es'?es:en;
  function review(items,onStart) {
    const dialog=document.createElement('dialog');dialog.className='review-dialog';
    const title=document.createElement('h2');title.textContent=tr('Choose what to review','Elegí qué repasar');title.id='studyReviewTitle';dialog.setAttribute('aria-labelledby',title.id);
    const list=document.createElement('div');list.className='review-items';
    const checks=items.map(item=>{
      const label=document.createElement('label');label.className='review-item';
      const input=document.createElement('input');input.type='checkbox';input.checked=true;
      const text=document.createElement('span');text.textContent=item.label;
      label.append(input,text);list.append(label);return input;
    });
    const actions=document.createElement('div');actions.className='summary-actions';
    const all=document.createElement('button');all.type='button';all.className='mini-button';all.textContent=tr('Select all','Seleccionar todos');
    const none=document.createElement('button');none.type='button';none.className='mini-button';none.textContent=tr('Clear selection','Limpiar selección');
    const cancel=document.createElement('button');cancel.type='button';cancel.className='button-secondary';cancel.textContent=tr('Cancel','Cancelar');
    const start=document.createElement('button');start.type='button';start.className='button-primary';
    const update=()=>{const count=checks.filter(el=>el.checked).length;start.disabled=!count;start.textContent=`${tr('Practice selected','Practicar selección')} (${count}) →`;};
    list.addEventListener('change',update);all.onclick=()=>{checks.forEach(el=>el.checked=true);update();};none.onclick=()=>{checks.forEach(el=>el.checked=false);update();};
    cancel.onclick=()=>dialog.close();start.onclick=()=>{const chosen=items.filter((_,i)=>checks[i].checked);dialog.close();onStart(chosen);};
    dialog.addEventListener('close',()=>dialog.remove());actions.append(cancel,start);dialog.append(title,all,none,list,actions);document.body.append(dialog);update();dialog.showModal();
  }
  function progress(id,done,total,label){
    const host=$(id);if(!host)return;
    host.hidden=!total;
    if(!total)return;
    const count=Math.min(total,Math.max(0,done)), percent=Math.round(count/total*100);
    const key=`${count}:${total}:${label}`;if(host.dataset.progress===key)return;host.dataset.progress=key;
    host.replaceChildren();
    const row=document.createElement('div');row.className='progress-row';
    const caption=document.createElement('strong');caption.textContent=label;
    const text=document.createElement('span');text.textContent=`${count} / ${total}`;row.append(caption,text);
    const track=document.createElement('div');track.className='progress-track';track.setAttribute('role','progressbar');track.setAttribute('aria-label',label);track.setAttribute('aria-valuemin','0');track.setAttribute('aria-valuemax',String(total));track.setAttribute('aria-valuenow',String(count));
    const fill=document.createElement('div');fill.className='progress-fill';fill.style.width=`${percent}%`;track.append(fill);host.append(row,track);
  }
  window.KTFStudyUI={review,progress,tr};
  document.addEventListener('DOMContentLoaded',()=>{
    history.scrollRestoration='manual';
    history.replaceState({...history.state,ktfView:'setupScreen'},'');
    document.addEventListener('click',event=>{
      const button=event.target.closest('button,a');
      if(!button)return;
      if(Object.values(routes).includes(button.id) || button.id==='openCustomButton' || button.matches('[data-script]')){
        if(!canLeave()){event.preventDefault();event.stopImmediatePropagation();return;}
        remember();
        if(button.matches('[data-script]')){
          if($('setupScreen').hidden)reveal('setupScreen',{restore:true,selection:'kana'});
          else selectLibrary('kana');
        }
        if(button.id==='homeLink')library='kana';
      }
    },true);
    window.addEventListener('popstate',event=>{
      const route=event.state?.ktfView||'setupScreen';
      if(!routes[route])return;
      if(active()){history.pushState({ktfView:$(current)?.closest('main > section')?.id||'setupScreen'},'');canLeave();return;}
      const trigger=$(routes[route]);
      if(!trigger || trigger.hidden)return;
      restoring=true;library=event.state?.library||'kana';
      if(route==='setupScreen')reveal('setupScreen',{restore:true});else trigger.click();
      restoring=false;
    });
    document.addEventListener('keydown',event=>{
      const tab=event.target.closest('#studyTabs [role=tab]');
      if(!tab||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
      event.preventDefault();event.stopImmediatePropagation();
      const tabs=[...document.querySelectorAll('#studyTabs [role=tab]')],index=tabs.indexOf(tab);
      const target=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
      tabs[target].focus({preventScroll:true});tabs[target].click();
    },true);
    new ResizeObserver(alignCustomPanel).observe(document.querySelector('.study-switcher'));
    const hint=()=>{
      document.querySelectorAll('[data-romaji-hint]').forEach(el=>el.textContent=window.KTFRomaji.hint());
      document.querySelectorAll('[data-focus-label]').forEach(el=>el.textContent=tr('Focus time','Tiempo de estudio'));
      document.querySelectorAll('[data-rapid-help]').forEach(el=>el.textContent=tr('A timed challenge for each answer','Un desafío contrarreloj por respuesta'));
    };
    hint();document.addEventListener('ktf:languagechange',hint);
  });
})();
