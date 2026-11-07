"use strict";
(() => {
  const collection=window.KTFCustomCollection,cloud=window.KTFCloud;
  const tr=(en,es)=>document.documentElement.lang==='es'?es:en;
  const actions=document.createElement('div');actions.className='custom-json-actions';
  actions.hidden=true;
  actions.innerHTML='<button type="button" class="mini-button" id="customJsonExport"></button><button type="button" class="mini-button" id="customJsonImport"></button><input type="file" id="customJsonFile" accept=".json,application/json" hidden><p id="customJsonStatus" role="status"></p>';
  document.querySelector('.custom-library-head').after(actions);
  const dialog=document.createElement('dialog');dialog.className='review-dialog';dialog.id='customJsonDialog';dialog.setAttribute('aria-labelledby','customJsonTitle');
  dialog.innerHTML='<h2 id="customJsonTitle"></h2><p id="customJsonDescription"></p><ul id="customJsonChanges"></ul><div class="summary-actions"><button type="button" class="button-secondary" id="customJsonCancel"></button><button type="button" class="button-primary" id="customJsonApply"></button></div><p id="customJsonError" role="status"></p>';
  document.body.append(dialog);
  const $=id=>document.getElementById(id);
  let pending=null,busy=false;
  function labels(){
    $('customJsonExport').textContent=tr('Export JSON','Exportar JSON');
    $('customJsonImport').textContent=tr('Update from JSON','Actualizar desde JSON');
    $('customJsonTitle').textContent=tr('Review collection changes','Revisar cambios en la colección');
    $('customJsonDescription').textContent=tr('Only existing items are updated. IDs and study history are preserved. A backup downloads before saving.','Solo se actualizan elementos existentes. Se conservan los ID y el historial de estudio. Se descarga un respaldo antes de guardar.');
    $('customJsonCancel').textContent=tr('Cancel','Cancelar');
    $('customJsonApply').textContent=tr('Back up and apply changes','Respaldar y aplicar cambios');
  }
  function download(items,name){
    const url=URL.createObjectURL(new Blob([JSON.stringify(items,null,2)],{type:'application/json'}));
    const link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
  }
  function checkAccount(account){
    if(account!==cloud.getStatus().owner)throw new Error(tr('Account changed. Choose the file again.','Cambiaste de cuenta. Elegí el archivo otra vez.'));
    if(window.KTFNavigation.active())throw new Error(tr('Finish your practice first.','Terminá primero la práctica.'));
  }
  function prepare(rows,current){
    if(!Array.isArray(rows)||!rows.length||rows.length>2000)throw new Error(tr('Expected a list of 1–2000 items.','Se esperaba una lista de 1 a 2000 elementos.'));
    const byId=new Map(current.map(item=>[item.id,item])),seen=new Set(),changes=[];
    for(const row of rows){
      if(!row||typeof row.id!=='string'||seen.has(row.id))throw new Error(tr('Invalid or duplicate ID.','ID inválido o repetido.'));
      seen.add(row.id);const previous=byId.get(row.id);
      if(!previous||previous.kind!==row.kind||previous.surface!==row.surface)throw new Error(tr('Item does not match this collection: ','El elemento no coincide con esta colección: ')+(row.surface||row.id));
      const patch={};
      for(const [field,max] of [['romaji',200],['kana',200],['meaning',300],['notes',300]]){
        if(typeof row[field]!=='string'||row[field].length>max)throw new Error(tr('Invalid field: ','Campo inválido: ')+field+' · '+row.surface);
        patch[field]=row[field];
      }
      const fields=Object.keys(patch).filter(key=>previous[key]!==patch[key]);
      if(fields.length)changes.push({previous,item:{...previous,...patch},fields});
    }
    return changes;
  }
  $('customJsonExport').onclick=async()=>{
    const account=cloud.getStatus().owner;
    try{await collection.refresh();checkAccount(account);download(collection.getItems(),'custom-collection.json');}
    catch(error){$('customJsonStatus').textContent=error.message;}
  };
  $('customJsonImport').onclick=()=>{if(!busy){$('customJsonFile').value='';$('customJsonFile').click();}};
  $('customJsonFile').onchange=async()=>{
    const file=$('customJsonFile').files[0];if(!file||busy)return;
    const account=cloud.getStatus().owner;busy=true;$('customJsonStatus').textContent='';
    try{
      if(file.size>2*1024*1024)throw new Error(tr('Maximum file size: 2 MB.','Tamaño máximo: 2 MB.'));
      let rows;try{rows=JSON.parse(await file.text());}catch(_){throw new Error(tr('The file is not valid JSON.','El archivo no contiene JSON válido.'));}
      await collection.refresh();checkAccount(account);
      const current=collection.getItems(),changes=prepare(rows,current);
      if(!changes.length){$('customJsonStatus').textContent=tr('No changes to apply.','No hay cambios para aplicar.');return;}
      pending={account,changes};$('customJsonError').textContent='';$('customJsonChanges').replaceChildren();
      const fieldLabels={romaji:'Romaji',kana:'Kana',meaning:tr('Meaning','Significado'),notes:tr('Notes','Notas')};
      for(const change of changes){
        const li=document.createElement('li');const title=document.createElement('strong');title.textContent=change.item.surface;li.append(title);
        for(const field of change.fields){const line=document.createElement('p');line.textContent=`${fieldLabels[field]}: ${change.previous[field]||'—'} → ${change.item[field]||'—'}`;li.append(line);}
        $('customJsonChanges').append(li);
      }
      dialog.showModal();
    }catch(error){pending=null;$('customJsonStatus').textContent=error.message;}
    finally{busy=false;}
  };
  $('customJsonCancel').onclick=()=>dialog.close();
  dialog.addEventListener('close',()=>{pending=null;});
  dialog.addEventListener('cancel',event=>{if(busy)event.preventDefault();});
  $('customJsonApply').onclick=async()=>{
    if(!pending||busy)return;busy=true;$('customJsonApply').disabled=true;$('customJsonCancel').disabled=true;
    const draft=pending;
    try{
      await collection.refresh();checkAccount(draft.account);
      const current=collection.getItems(),byId=new Map(current.map(item=>[item.id,item]));
      if(draft.changes.some(change=>JSON.stringify(byId.get(change.item.id))!==JSON.stringify(change.previous)))throw new Error(tr('The collection changed. Cancel and choose the file again.','La colección cambió. Cancelá y elegí el archivo otra vez.'));
      download(current,'custom-antes-de-corregir.json');
      const now=new Date().toISOString();
      await cloud.addCustomEvents(draft.changes.map(({item})=>({type:'custom_upsert',payload:{item:{...item,updatedAt:now}}})));
      await collection.refresh();checkAccount(draft.account);
      dialog.close();$('customJsonStatus').textContent=`${draft.changes.length} ${tr('items updated.','elementos actualizados.')}`;
    }catch(error){$('customJsonError').textContent=error.message;}
    finally{busy=false;$('customJsonApply').disabled=false;$('customJsonCancel').disabled=false;}
  };
  document.addEventListener('ktf:languagechange',labels);labels();
})();
