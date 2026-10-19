// Knit Pant custom fabric groups. Separate storage and dialog from Knit Garments.
(function () {
  'use strict';
  const STORAGE_KEY = 'fc-knit-pant-fabric-groups-v1';
  const $ = id => document.getElementById(id);
  let groups = load();
  let editingId = null;
  let latest = { qty: 0, rows: [] };
  let dialogOpening = false;

  function load() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(value) ? value.filter(g => g && typeof g.id === 'string' && typeof g.name === 'string' && Array.isArray(g.components)).map(g => ({ id:g.id, name:g.name.slice(0,50), components:g.components.filter(k => typeof k === 'string') })) : [];
    } catch (_) { return []; }
  }
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(groups)); return true; }
    catch (_) { showError('Could not save groups in this browser. Check browser storage settings.'); return false; }
  }
  function currentComponents() {
    return Array.from(document.querySelectorAll('#kp-component-rows tr[data-component-row]')).map(row => ({
      id: row.dataset.componentRow,
      name: row.querySelector('[data-field="name"]')?.value.trim() || 'Component'
    }));
  }
  function assignedElsewhere(id, except) { return groups.some(g => g.id !== except && g.components.includes(id)); }
  function showError(message) { const node=$('kp-group-error'); if(node){node.textContent=message;node.hidden=!message;} }
  function selectedIds() { return Array.from(document.querySelectorAll('#kp-group-components input:checked')).map(input=>input.value); }
  function renderChoices(selected=[]) {
    const box=$('kp-group-components'); if(!box)return; box.replaceChildren();
    const components=currentComponents();
    if(!components.length){const empty=document.createElement('p');empty.className='kg-groups-empty';empty.textContent='Select components in Additional Components first.';box.appendChild(empty);return;}
    components.forEach(c=>{
      const assigned=assignedElsewhere(c.id,editingId);
      const label=document.createElement('label');label.className='kg-group-component-option'+(assigned?' is-assigned':'');
      const input=document.createElement('input');input.type='checkbox';input.value=c.id;input.checked=selected.includes(c.id);input.disabled=assigned;input.dataset.pantGroupComponent='true';
      const name=document.createElement('span');name.className='kg-group-component-name';name.textContent=c.name;
      const status=document.createElement('span');status.className='kg-group-component-status';status.textContent=assigned?'In another group':'';
      label.append(input,name,status);box.appendChild(label);
    });
  }
  function clearEditor(){editingId=null;if($('kp-group-name'))$('kp-group-name').value='';if($('kp-group-editor-title'))$('kp-group-editor-title').textContent='Create a group';if($('kp-group-save'))$('kp-group-save').textContent='Create Group';if($('kp-group-cancel'))$('kp-group-cancel').hidden=true;showError('');renderChoices([]);}
  function renderGroups(){
    const list=$('kp-saved-groups-list'),count=$('kp-group-count');if(!list||!count)return;list.replaceChildren();count.textContent=groups.length+(groups.length===1?' group':' groups');
    if(!groups.length){const empty=document.createElement('div');empty.className='kg-groups-empty';empty.textContent='No custom groups yet. Create one above.';list.appendChild(empty);return;}
    const names=new Map(currentComponents().map(c=>[c.id,c.name]));
    groups.forEach(g=>{
      const card=document.createElement('article');card.className='kg-saved-group';
      const info=document.createElement('div');info.className='kg-saved-group-info';
      const title=document.createElement('h4');title.textContent=g.name;
      const members=document.createElement('p');members.textContent=g.components.map(id=>names.get(id)||id).join(' + ');
      info.append(title,members);
      const actions=document.createElement('div');actions.className='kg-saved-group-actions';
      const edit=document.createElement('button');edit.type='button';edit.className='kg-group-edit-btn';edit.textContent='Edit';edit.addEventListener('click',()=>beginEdit(g.id));
      const remove=document.createElement('button');remove.type='button';remove.className='kg-group-delete-btn';remove.textContent='Delete';remove.addEventListener('click',()=>{groups=groups.filter(x=>x.id!==g.id);save();if(editingId===g.id)clearEditor();renderGroups();renderChoices(selectedIds());renderTotals();});
      actions.append(edit,remove);card.append(info,actions);list.appendChild(card);
    });
  }
  function beginEdit(id){const g=groups.find(x=>x.id===id);if(!g)return;editingId=id;$('kp-group-name').value=g.name;$('kp-group-editor-title').textContent='Edit group';$('kp-group-save').textContent='Save Changes';$('kp-group-cancel').hidden=false;showError('');renderChoices(g.components);$('kp-group-name').focus();}
  function saveGroup(){
    const name=$('kp-group-name')?.value.trim()||'',components=selectedIds();
    if(!name){showError('Please enter a group name.');return;}
    if(!components.length){showError('Select at least one component for this group.');return;}
    if(groups.some(g=>g.id!==editingId&&g.name.toLowerCase()===name.toLowerCase())){showError('A group with this name already exists.');return;}
    if(components.some(id=>assignedElsewhere(id,editingId))){showError('A component can belong to only one group.');return;}
    if(editingId)groups=groups.map(g=>g.id===editingId?{...g,name,components}:g);
    else groups.push({id:'kp-group-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7),name,components});
    if(!save())return;clearEditor();renderGroups();renderTotals();
  }
  function openDialog(){
    const d = $('kp-groups-dialog');
    if (!d || dialogOpening || d.open) return;
    dialogOpening = true;
    try {
      editingId = null;
      if ($('kp-group-name')) $('kp-group-name').value = '';
      if ($('kp-group-editor-title')) $('kp-group-editor-title').textContent = 'Create a group';
      if ($('kp-group-save')) $('kp-group-save').textContent = 'Create Group';
      if ($('kp-group-cancel')) $('kp-group-cancel').hidden = true;
      showError('');
      renderGroups();
      renderChoices([]);
      if (typeof d.showModal === 'function') d.showModal();
      else d.setAttribute('open', '');
    } catch (error) {
      console.error('Knit Pant fabric groups could not open:', error);
      showError('Could not open Fabric Groups. Please refresh the page and try again.');
      d.setAttribute('open', '');
    } finally {
      dialogOpening = false;
    }
  }
  function closeDialog(){const d=$('kp-groups-dialog');if(!d)return;if(d.close&&d.open)d.close();else d.removeAttribute('open');}
  function renderTotals(data){
    if(data)latest=data;
    const list=$('kp-breakdown-list'),count=$('kp-breakdown-count');if(!list||!count)return;
    const rows=latest.rows||[],qty=Math.max(0,Number(latest.qty)||0);
    const valid=new Map(rows.map(r=>[r.key,r]));
    const activeGroups=groups.map(g=>({...g,components:g.components.filter(id=>valid.has(id))})).filter(g=>g.components.length);
    list.replaceChildren();count.textContent=activeGroups.length+(activeGroups.length===1?' group':' groups');
    if(!activeGroups.length){const empty=document.createElement('div');empty.className='kg-group-totals-empty';empty.textContent=groups.length?'No grouped components have valid calculations yet.':'No fabric groups yet. Click the gear icon to create a group.';list.appendChild(empty);return;}
    activeGroups.forEach(g=>{
      const members=g.components.map(id=>valid.get(id));
      const before=members.reduce((s,r)=>s+(Number(r.netKg)||0),0);
      const after=members.reduce((s,r)=>s+(Number(r.finalKg??r.kg)||0),0);
      const card=document.createElement('article');card.className='kg-group-total-card';
      const head=document.createElement('div');head.className='kg-group-total-card-head';
      const info=document.createElement('div');const title=document.createElement('h4');title.textContent=g.name;
      const sub=document.createElement('p');sub.className='kg-group-total-members';sub.textContent=members.map(r=>r.name).join(' + ');
      info.append(title,sub);
      const total=document.createElement('strong');total.className='kg-group-total-kg';total.textContent=(after*qty).toFixed(3)+' kg';
      const button=document.createElement('button');button.type='button';button.className='kg-group-total-details-btn';button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10l5 5 5-5"></path></svg>';button.setAttribute('aria-expanded','false');button.setAttribute('aria-label','Show details for '+g.name);button.title='Show details';
      const metrics=document.createElement('div');metrics.className='kg-group-total-metrics';metrics.hidden=true;
      button.addEventListener('click',()=>{const expanded=button.getAttribute('aria-expanded')==='true';button.setAttribute('aria-expanded',String(!expanded));metrics.hidden=expanded;});
      [['Before wastage',(before*qty).toFixed(3)+' kg'],['After wastage',(after*qty).toFixed(3)+' kg'],['Per piece',after.toFixed(4)+' kg/pcs'],['Order quantity',qty+' pcs']].forEach(([labelText,valueText])=>{const metric=document.createElement('div');metric.className='kg-group-total-metric';const label=document.createElement('span');label.textContent=labelText;const value=document.createElement('strong');value.textContent=valueText;metric.append(label,value);metrics.appendChild(metric);});
      head.append(info,total,button);card.append(head,metrics);list.appendChild(card);
    });
  }
  window.updatePantGroupTotals=renderTotals;
  function init(){
    const open=$('kp-manage-groups'),dialog=$('kp-groups-dialog');if(!open||!dialog||open.dataset.groupsReady==='true')return;open.dataset.groupsReady='true';
    open.addEventListener('click',openDialog);$('kp-groups-close')?.addEventListener('click',closeDialog);$('kp-groups-done')?.addEventListener('click',closeDialog);$('kp-group-save')?.addEventListener('click',saveGroup);$('kp-group-cancel')?.addEventListener('click',clearEditor);
    $('kp-group-name')?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();saveGroup();}});
    dialog.addEventListener('click',e=>{if(e.target===dialog)closeDialog();});
    document.addEventListener('change', e => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      if (target.closest('#kp-component-rows') || target.closest('#kp-selected-components')) {
        renderGroups();
        renderChoices(editingId ? (groups.find(g => g.id === editingId)?.components || []) : []);
        renderTotals();
      }
    });
    renderGroups();renderChoices([]);renderTotals({qty:0,rows:[]});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
