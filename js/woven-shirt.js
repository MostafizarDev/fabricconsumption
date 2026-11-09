// Woven Shirt consumption — length-based woven fabric calculation.
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const number = id => { const node=$(id); if(!node || node.value.trim()==='') return null; const n=Number(node.value); return Number.isFinite(n)?n:null; };
  const value = id => number(id) ?? 0;
  const fmt = (n,d=3) => Number.isFinite(n) ? n.toLocaleString(undefined,{minimumFractionDigits:d,maximumFractionDigits:d}) : '—';
  const unit = () => $('ws-unit')?.value === 'inch' ? 'inch' : 'cm';
  const cm = n => unit()==='inch' ? n*2.54 : n;
  const ids=['ws-bl','ws-bla','ws-hc','ws-hca','ws-sl','ws-sla','ws-ah','ws-aha','ws-fw','ws-waste','ws-order-qty'];
  const RECENT='fabricConsumption.wovenShirtRecent.v2', REPORT='fabricConsumption.wovenShirtReportInfo.v1';
  let components=[], lastResult=null, demoSnapshot=null;
  const reportInfo=()=>{try{return JSON.parse(localStorage.getItem(REPORT)||'{}')}catch(_){return {}}};
  const set=(id,text)=>{if($(id))$(id).textContent=text;};
  function updateUnitUI(){
    document.querySelectorAll('[data-ws-unit]').forEach(b=>{const active=b.dataset.wsUnit===unit();b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
    document.querySelectorAll('.ws-unit-label').forEach(n=>n.textContent=unit());
    updateMeasurementTotals();
    renderComponents();
  }
  function updateMeasurementTotals(){
    [['ws-bl','ws-bla','ws-blt'],['ws-hc','ws-hca','ws-hct'],['ws-sl','ws-sla','ws-slt'],['ws-ah','ws-aha','ws-aht']].forEach(([a,b,t])=>set(t,fmt(value(a)+value(b),1)+' '+unit()));
  }
  const escapeHtml = s => String(s ?? '').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  function renderComponents(){
    const host=$('ws-selected-components'); if(!host)return;
    if(!components.length){host.innerHTML='<p class="ws-components-empty">Select components above to add measurements.</p>';return;}
    host.innerHTML=components.map((c,i)=>'<div class="pant-component-card ws-added-component" data-ws-component="'+i+'"><div class="pant-component-card-head"><input class="ws-component-name" type="text" data-field="name" aria-label="Component name" placeholder="Enter component name" value="'+escapeHtml(c.name)+'"><button type="button" class="pant-row-remove" data-ws-remove="'+i+'" aria-label="Remove component">×</button></div><div class="pant-component-measure-grid"><label class="pant-component-measure"><span>Length ('+unit()+')</span><div class="pant-measure-pair"><input type="number" min="0" step="any" data-field="length" placeholder="e.g. 12" value="'+(c.length??'')+'"><span>+</span><input type="number" min="0" step="any" data-field="lengthSA" placeholder="SA" value="'+(c.lengthSA??0)+'"><span>=</span><span class="pant-measure-total" data-total="length">0.0 '+unit()+'</span></div></label><label class="pant-component-measure"><span>Width ('+unit()+')</span><div class="pant-measure-pair"><input type="number" min="0" step="any" data-field="width" placeholder="e.g. 8" value="'+(c.width??'')+'"><span>+</span><input type="number" min="0" step="any" data-field="widthSA" placeholder="SA" value="'+(c.widthSA??0)+'"><span>=</span><span class="pant-measure-total" data-total="width">0.0 '+unit()+'</span></div></label></div><div class="pant-component-meta-grid"><label><span>Qty / garment</span><input type="number" min="1" step="1" data-field="qty" value="'+(c.qty??1)+'"></label><label><span>Wastage (%)</span><input type="number" min="0" max="100" step="any" data-field="waste" value="'+(c.waste??5)+'"></label></div><div class="ws-component-live-result">Consumption (with wastage): <strong>'+fmt(c.finalYardsDz??0,3)+' yds/dozen</strong></div></div>').join('');
    host.querySelectorAll('[data-ws-remove]').forEach(b=>b.addEventListener('click',()=>{components.splice(Number(b.dataset.wsRemove),1);renderComponents();calculate();}));
    host.querySelectorAll('input').forEach(input=>input.addEventListener('input',()=>{const card=input.closest('[data-ws-component]'),i=Number(card.dataset.wsComponent),field=input.dataset.field;components[i][field]=field==='name'?input.value:(input.value===''?'':Number(input.value));updateComponentTotals(card);calculate();}));
    host.querySelectorAll('[data-ws-component]').forEach(updateComponentTotals);
  }
  function updateComponentTotals(card){
    ['length','width'].forEach(k=>{const a=Number(card.querySelector('[data-field="'+k+'"]')?.value||0),b=Number(card.querySelector('[data-field="'+k+'SA"]')?.value||0);const node=card.querySelector('[data-total="'+k+'"]');if(node)node.textContent=fmt(a+b,1)+' '+unit();});
  }
  function addComponent(){
    const select=$('ws-component-select'),name=select?.value;if(!name)return;
    if(components.some(c=>c.name===name)){alert(name+' is already added.');return;}
    components.push({name,length:'',lengthSA:0,width:'',widthSA:0,qty:1,waste:5});select.value='';renderComponents();calculate();
  }
  function capture(){return {values:Object.fromEntries(ids.map(id=>[id,$(id)?.value??''])),unit:unit(),components:JSON.parse(JSON.stringify(components)),savedAt:new Date().toISOString()};}
  function apply(state){if(!state)return;Object.entries(state.values||{}).forEach(([id,v])=>{if($(id))$(id).value=v;});$('ws-unit').value=state.unit==='inch'?'inch':'cm';components=Array.isArray(state.components)?state.components:[];updateUnitUI();renderComponents();calculate();}
  function recent(){try{return JSON.parse(localStorage.getItem(RECENT)||'[]')}catch(_){return[]}}
  function renderRecent(){
    const panel=$('ws-recent-panel');if(!panel)return;const list=recent();
    panel.innerHTML='<div class="knit-recent-head"><span>Recent Calculations · Last 5</span><button type="button" class="knit-recent-load" id="ws-save-current">Save Current</button></div>'+(list.length?list.map(x=>'<div class="knit-recent-item"><div class="knit-recent-info"><strong>'+String(x.title||'Woven Shirt').replace(/[<>]/g,'')+'</strong><small>'+new Date(x.state.savedAt).toLocaleString()+'</small></div><div class="knit-recent-actions"><button type="button" class="knit-recent-load" data-ws-load="'+x.id+'">Load</button><button type="button" class="knit-recent-delete" data-ws-delete="'+x.id+'">×</button></div></div>').join(''):'<div class="knit-recent-empty">No saved calculations yet.</div>');
    $('ws-save-current').onclick=()=>{const info=reportInfo();localStorage.setItem(RECENT,JSON.stringify([{id:'ws-'+Date.now(),title:info.style||'Woven Shirt',state:capture()},...recent()].slice(0,5)));renderRecent();};
    panel.querySelectorAll('[data-ws-load]').forEach(b=>b.onclick=()=>{const item=recent().find(x=>x.id===b.dataset.wsLoad);if(item)apply(item.state);panel.hidden=true;});
    panel.querySelectorAll('[data-ws-delete]').forEach(b=>b.onclick=()=>{localStorage.setItem(RECENT,JSON.stringify(recent().filter(x=>x.id!==b.dataset.wsDelete)));renderRecent();});
  }
  function resetResults(message){
    ['ws-r-order','ws-r-pc','ws-r-before','ws-r-after','ws-r-total'].forEach(id=>set(id,'—'));
    set('ws-result-note',message||'Enter the required data to calculate. Incomplete inputs will not produce a confirmed result.');
    const pending=components.map(c=>'<div class="pant-kg-component-row"><span class="pant-kg-component-name">'+escapeHtml(c.name||'Component')+'</span><strong>— yds | — yds/pcs</strong></div>').join('');
    set('ws-summary-components',pending);
    set('ws-component-count',components.length+' components');
    $('ws-component-breakdown').innerHTML=components.length?components.map(c=>'<div class="kg-group-total-row"><span>'+escapeHtml(c.name||'Component')+'</span><strong>— yds</strong></div>').join(''):'<div class="kg-group-totals-empty">No calculated components yet.</div>';
    lastResult=null;
  }
  function calculate(){
    updateMeasurementTotals();
    const required=['ws-bl','ws-hc','ws-sl','ws-ah','ws-fw','ws-order-qty'];
    const missing=required.filter(id=>number(id)===null||number(id)<=0);
    const waste=number('ws-waste');
    if(missing.length||waste===null||waste<0||waste>100){resetResults(missing.length?'Enter body, sleeve, fabric width and order quantity.':'Wastage must be between 0% and 100%.');return;}
    const width=value('ws-fw'),divider=width*36*2.54,qty=value('ws-order-qty');
    const BL=cm(value('ws-bl')+value('ws-bla')),HC=cm(value('ws-hc')+value('ws-hca'));
    const SL=cm(value('ws-sl')+value('ws-sla')),AH=cm(value('ws-ah')+value('ws-aha'));
    const bodyDz=BL*HC*2*12/divider,sleeveDz=SL*AH*4*12/divider;
    const baseDz=bodyDz+sleeveDz;
    const rows=[
      {name:'Main Body',yardsDz:bodyDz,waste,netOrder:bodyDz/12*qty,finalOrder:bodyDz/12*qty*(1+waste/100)},
      {name:'Sleeve',yardsDz:sleeveDz,waste,netOrder:sleeveDz/12*qty,finalOrder:sleeveDz/12*qty*(1+waste/100)}
    ];
    let componentDz=0,componentNetOrder=0,componentFinalOrder=0;
    for(const c of components){
      const l=Number(c.length),w=Number(c.width),q=Number(c.qty),cw=Number(c.waste??5);
      if(!Number.isFinite(l)||l<=0||!Number.isFinite(w)||w<=0||!Number.isFinite(q)||q<=0||!Number.isFinite(cw)||cw<0||cw>100){resetResults('Complete each component\'s length, width, quantity and valid wastage (0–100%).');return;}
      const amount=cm(l+Number(c.lengthSA||0))*cm(w+Number(c.widthSA||0))*q*12/divider;
      const net=amount/12*qty,final=net*(1+cw/100);
      c.name=String(c.name||'Component').trim()||'Component';c.yardsDz=amount;c.finalYardsDz=amount*(1+cw/100);
      componentDz+=amount;componentNetOrder+=net;componentFinalOrder+=final;
      rows.push({name:c.name,yardsDz:amount,waste:cw,netOrder:net,finalOrder:final});
    }
    const baseNetOrder=baseDz/12*qty,baseFinalOrder=baseNetOrder*(1+waste/100);
    const netDz=baseDz+componentDz,netOrder=baseNetOrder+componentNetOrder,finalOrder=baseFinalOrder+componentFinalOrder,finalPc=finalOrder/qty;
    const finalDz=finalOrder/qty*12;
    set('ws-r-order',fmt(finalOrder,3)+' yds');set('ws-r-pc',fmt(finalPc,4)+' yds/pcs');
    set('ws-r-before',fmt(netOrder,3)+' yds');set('ws-r-after',fmt(finalOrder,3)+' yds');set('ws-r-total',fmt(finalDz,3)+' yds/dz');
    set('ws-result-note','Calculated for '+fmt(qty,0)+' pcs. Main body and sleeve wastage: '+fmt(waste,2)+'%; each additional component uses its own wastage. GSM is not required for woven length consumption.');
    const summaryRows=rows.map(r=>'<div class="pant-kg-component-row"><span class="pant-kg-component-name">'+escapeHtml(r.name)+'</span><strong>'+fmt(r.finalOrder,3)+' yds | '+fmt(r.finalOrder/qty,4)+' yds/pcs</strong></div>').join('');
    set('ws-summary-components',summaryRows);
    $('ws-component-count').textContent=components.length+' components';
    $('ws-component-breakdown').innerHTML=rows.map(r=>'<div class="kg-group-total-row"><span>'+escapeHtml(r.name)+' <small>('+fmt(r.waste,1)+'% waste)</small></span><strong>'+fmt(r.finalOrder,3)+' yds</strong></div>').join('');
    document.querySelectorAll('[data-ws-component]').forEach((card,i)=>{const node=card.querySelector('.ws-component-live-result strong');if(node)node.textContent=fmt(components[i]?.finalYardsDz||0,3)+' yds/dozen';});
    lastResult={qty,waste,width,bodyDz,sleeveDz,componentDz,netDz,netOrder,finalOrder,finalPc,finalDz,rows,unit:unit(),inputs:capture()};
  }
  function downloadReport(){
    if(!lastResult){calculate();if(!lastResult){alert('Please complete the required inputs before downloading the report.');return;}}
    const r=lastResult,info=reportInfo(),safe=s=>String(s||'—').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
    const measurements=[['Body Length',value('ws-bl'),value('ws-bla')],['½ Chest',value('ws-hc'),value('ws-hca')],['Sleeve Length',value('ws-sl'),value('ws-sla')],['Armhole Straight',value('ws-ah'),value('ws-aha')]];
    const table=measurements.map(x=>'<tr><td>'+x[0]+'</td><td>'+x[1]+'</td><td>'+x[2]+'</td><td>'+fmt(x[1]+x[2],1)+' '+r.unit+'</td></tr>').join('');
    const parts=r.rows.map(x=>'<tr><td>'+safe(x.name)+'</td><td>'+fmt(x.yardsDz,3)+' yds/dz</td><td>'+fmt(x.waste,2)+'%</td><td>'+fmt(x.netOrder,3)+' yds</td><td>'+fmt(x.finalOrder,3)+' yds</td></tr>').join('');
    const html='<div class="header"><h1>Woven Shirt Fabric Consumption Report</h1><div class="date">Generated: '+new Date().toLocaleString()+'</div></div><div class="box"><div>Total Fabric Requirement</div><div class="box-value">'+fmt(r.finalOrder,3)+' yds</div><div>'+fmt(r.finalPc,4)+' yds per piece · '+fmt(r.qty,0)+' pcs</div></div><h3>Measurements ('+r.unit+')</h3><table><thead><tr><th>Measurement</th><th>Actual</th><th>Allowance</th><th>Total</th></tr></thead><tbody>'+table+'</tbody></table><h3>Component Breakdown</h3><table><thead><tr><th>Component</th><th>Consumption</th><th>Wastage</th><th>Before Waste</th><th>Final Requirement</th></tr></thead><tbody>'+parts+'</tbody></table><p>Fabric width: '+r.width+' inch | Order quantity: '+r.qty+' pcs | Wastage: '+r.waste+'%</p><p>Total before wastage: '+fmt(r.netOrder,3)+' yds<br>Total after wastage: '+fmt(r.finalOrder,3)+' yds</p><p>Formula: Yards/dozen = (Length cm × Width cm × panel quantity × 12) ÷ (Fabric width inch × 36 × 2.54). Order yards = Yards/dozen × order quantity ÷ 12. Wastage is applied to the net order requirement.</p>';
    generatePDF('Woven Shirt Report',html);
  }
  document.addEventListener('DOMContentLoaded',()=>{
    document.querySelectorAll('[data-ws-unit]').forEach(b=>b.addEventListener('click',()=>{$('ws-unit').value=b.dataset.wsUnit;updateUnitUI();calculate();}));
    ids.forEach(id=>$(id)?.addEventListener('input',calculate));
    $('ws-add-component')?.addEventListener('click',addComponent);
    $('btn-calc-woven')?.addEventListener('click',calculate);
    $('btn-pdf-woven')?.addEventListener('click',downloadReport);
    $('ws-recent-open')?.addEventListener('click',()=>{const p=$('ws-recent-panel'),open=p.hidden;renderRecent();p.hidden=!open;$('ws-recent-open').setAttribute('aria-expanded',String(open));});
    $('ws-report-settings')?.addEventListener('click',()=>{const x=reportInfo();['buyer','style','po','type'].forEach(k=>$('ws-report-'+k).value=x[k]||(k==='type'?'Woven Shirt':''));$('ws-report-modal').hidden=false;});
    document.querySelectorAll('[data-close-ws-modal]').forEach(b=>b.addEventListener('click',()=>$('ws-report-modal').hidden=true));
    $('ws-report-save')?.addEventListener('click',()=>{const x={};['buyer','style','po','type'].forEach(k=>x[k]=$('ws-report-'+k).value.trim());localStorage.setItem(REPORT,JSON.stringify(x));$('ws-report-modal').hidden=true;});
    $('ws-demo')?.addEventListener('click',()=>{const b=$('ws-demo');if(b.getAttribute('aria-pressed')==='true'){apply(demoSnapshot);demoSnapshot=null;b.setAttribute('aria-pressed','false');return;}demoSnapshot=capture();[['ws-bl',79],['ws-bla',6],['ws-hc',52],['ws-hca',6],['ws-sl',59],['ws-sla',6],['ws-ah',20],['ws-aha',5],['ws-fw',55],['ws-waste',5],['ws-order-qty',1000]].forEach(([id,v])=>$(id).value=v);$('ws-unit').value='cm';components=[];updateUnitUI();renderComponents();calculate();b.setAttribute('aria-pressed','true');});
    renderRecent();updateUnitUI();renderComponents();calculate();
  });
})();
