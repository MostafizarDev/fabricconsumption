// Zipper Consumption Planner — page-scoped calculator, history and PDF report.
(function(){
 'use strict';
 const $=id=>document.getElementById(id),root=()=>$('#page-zipper');
 const ids=['zp-buyer','zp-style','zp-po','zp-order-qty','zp-type','zp-material','zp-gauge','zp-color','zp-bl','zp-fnd','zp-hn','zp-shr','zp-direct-length','zp-direct-shr','zp-unit','zp-per-garment','zp-waste','zp-unit-price'];
 const RECENT_KEY='fabricConsumption.zipper.recent.v1';let method='formula',lastResult=null;
 const num=id=>Math.max(0,Number($(id)?.value)||0),val=id=>$(id)?.value??'',fmt=(n,d=1)=>Number(n||0).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d}),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const cmToUnit=cm=>val('zp-unit')==='in'?cm/2.54:cm,unit=()=>val('zp-unit')||'cm',totalQty=()=>Math.floor(num('zp-order-qty')*Math.max(1,Math.floor(num('zp-per-garment'))));
 function status(message,type){const e=$('zp-status');if(e){e.textContent=message;e.className='zipper-inline-status'+(type?' is-'+type:'');}}
 function setText(id,value){const e=$(id);if(e)e.textContent=value;}
 function updateMethod(){
  const direct=method==='direct';$('zp-formula-fields').hidden=direct;$('zp-direct-fields').hidden=!direct;
  document.querySelectorAll('[data-zp-method]').forEach(b=>b.classList.toggle('is-active',b.dataset.zpMethod===method));
  setText('zp-formula-text',direct?'Use the finished zipper length measured from the approved sample. Shrinkage adjustment is applied to this measurement.':'Calculated length = (Body Length + High Neck − Front Neck Drop), adjusted by the entered shrinkage percentage.');
 }
 function updateUnits(){document.querySelectorAll('.zp-unit-label').forEach(e=>e.textContent=unit());}
 function clearResults(){
  ['zp-result','zp-result-cm','zp-with-waste','zp-total-qty','zp-total-length','zp-total-length-unit','zp-total-cost'].forEach(id=>setText(id,'—'));
  setText('zp-result-note','No calculation yet. Complete the order and measurement fields.');
  lastResult=null;
 }
 function collect(){
  const u=unit(),shrink=method==='direct'?num('zp-direct-shr'):num('zp-shr');
  const base=method==='direct'?num('zp-direct-length')*(u==='in'?2.54:1):(num('zp-bl')+num('zp-hn')-num('zp-fnd'))*(u==='in'?2.54:1);
  const finished=base*(1-shrink/100),waste=num('zp-waste');
  const baseQty=totalQty(),qty=Math.ceil(baseQty*(1+waste/100)),extraQty=qty-baseQty,price=num('zp-unit-price');
  return {baseCm:base,finishedCm:finished,baseQty,qty,extraQty,totalLengthCm:finished*qty,price,totalCost:price*qty,shrink,waste,perGarment:Math.max(1,Math.floor(num('zp-per-garment'))),inputUnit:u,method};
 }
 function calculate(save=true){
  if(!root())return null;
  const qtyOrder=Math.floor(num('zp-order-qty'));
  const length=method==='direct'?num('zp-direct-length'):num('zp-bl')+num('zp-hn')-num('zp-fnd');
  const shrink=method==='direct'?num('zp-direct-shr'):num('zp-shr');
  if(!qtyOrder){status('Enter a valid total order quantity.','error');return null;}
  if(!length||length<=0){status(method==='direct'?'Enter a valid finished zipper length.':'Check the body length, high neck and front neck drop. Calculated zipper length must be greater than zero.','error');return null;}
  if(shrink>=100||num('zp-waste')>100){status('Shrinkage must be below 100% and wastage cannot exceed 100%.','error');return null;}
  if(!num('zp-per-garment')){status('Enter at least one zipper per garment.','error');return null;}
  const r=collect(),u=r.inputUnit;
  if(r.finishedCm<=0){status('Adjusted zipper length must be greater than zero.','error');return null;}
  setText('zp-result',fmt(cmToUnit(r.finishedCm),1)+' '+u);
  setText('zp-result-cm',fmt(r.finishedCm,2)+' cm reference');
  setText('zp-with-waste',r.extraQty.toLocaleString('en-US')+' pcs');
  setText('zp-total-qty',Math.round(r.qty).toLocaleString('en-US')+' pcs');
  setText('zp-total-length',fmt(cmToUnit(r.totalLengthCm),2));
  setText('zp-total-length-unit',u+' total incl. wastage');
  setText('zp-total-cost',r.price?fmt(r.totalCost,2):'Not entered');
  setText('zp-result-note','Order: '+qtyOrder.toLocaleString('en-US')+' pcs × '+r.perGarment+' zipper(s) per garment. Includes '+r.extraQty.toLocaleString('en-US')+' extra zipper(s) for wastage.');
  lastResult=r;status('Calculation complete. Review the result before exporting.','success');
  if(save)saveRecent('Zipper calculation');return r;
 }
 function snapshot(){const fields={};ids.forEach(id=>{const e=$(id);if(e)fields[id]=e.value;});return {fields,method};}
 function recentItems(){try{const a=JSON.parse(localStorage.getItem(RECENT_KEY)||'[]');return Array.isArray(a)?a.slice(0,5):[];}catch(_){return [];}}
 function saveRecent(label){
  const item={id:Date.now(),savedAt:new Date().toISOString(),label,buyer:val('zp-buyer'),style:val('zp-style'),po:val('zp-po'),qty:val('zp-order-qty'),snapshot:snapshot()};
  const items=recentItems();items.unshift(item);try{localStorage.setItem(RECENT_KEY,JSON.stringify(items.slice(0,5)));renderRecent();}catch(_){status('Calculation complete, but Recent could not be saved in browser storage.','warning');}
 }
 function renderRecent(){
  const panel=$('zp-recent-panel');if(!panel)return;const items=recentItems();
  if(!items.length){panel.innerHTML='<p class="zipper-recent-empty">No saved calculations yet. Complete a calculation to save it here.</p>';return;}
  panel.innerHTML='<div class="zipper-recent-heading"><strong>Recent Calculations · Last 5</strong><button type="button" data-zp-clear>Clear all</button></div>'+items.map(x=>'<div class="zipper-recent-item"><div><strong>'+esc([x.buyer,x.style].filter(Boolean).join(' · ')||x.label)+'</strong><small>'+esc(x.po||'No PO')+' · '+esc(x.qty||'—')+' pcs · '+esc(new Date(x.savedAt).toLocaleString())+'</small></div><div class="zipper-recent-actions"><button type="button" data-zp-load="'+x.id+'">Load</button><button type="button" data-zp-delete="'+x.id+'" aria-label="Delete recent calculation">×</button></div></div>').join('');
 }
 function loadRecent(id){
  const item=recentItems().find(x=>String(x.id)===String(id));if(!item)return;
  ids.forEach(key=>{const e=$(key);if(e&&item.snapshot.fields[key]!==undefined)e.value=item.snapshot.fields[key];});
  method=item.snapshot.method||'formula';updateMethod();updateUnits();$('zp-recent-panel').hidden=true;$('zp-recent-toggle').setAttribute('aria-expanded','false');calculate(false);
 }
 function demo(){
   const sample={'zp-buyer':'DEMO BUYER','zp-style':'ZIP-DEMO-001','zp-po':'DEMO-PO-1200','zp-order-qty':'1200','zp-type':'Open-end / Separating','zp-material':'Nylon coil','zp-gauge':'#5','zp-color':'Black / 001','zp-bl':'68','zp-fnd':'8','zp-hn':'5','zp-shr':'0','zp-direct-length':'65','zp-direct-shr':'0','zp-unit':'cm','zp-per-garment':'1','zp-waste':'2','zp-unit-price':'18'};
   Object.entries(sample).forEach(([id,v])=>{const el=$(id);if(el){el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));}});
   method='formula';updateMethod();updateUnits();
   const result=calculate(true);
   if(!result){
    const r=collect();
    if(r.finishedCm>0&&r.baseQty>0){
     lastResult=r;
     setText('zp-result',fmt(cmToUnit(r.finishedCm),1)+' '+r.inputUnit);
     setText('zp-result-cm',fmt(r.finishedCm,2)+' cm reference');
     setText('zp-with-waste',r.extraQty.toLocaleString('en-US')+' pcs');
     setText('zp-total-qty',r.qty.toLocaleString('en-US')+' pcs');
     setText('zp-total-length',fmt(cmToUnit(r.totalLengthCm),2));
     setText('zp-total-length-unit',r.inputUnit+' total incl. wastage');
     setText('zp-total-cost',r.price?fmt(r.totalCost,2):'Not entered');
     setText('zp-result-note','Demo order: '+r.baseQty.toLocaleString('en-US')+' base zippers plus '+r.extraQty.toLocaleString('en-US')+' wastage pcs.');
     status('Demo calculation loaded successfully.','success');
    }else status('Demo inputs loaded, but calculation could not be completed. Check order quantity and zipper length.','error');
   }
  }
 function reset(){
  ids.forEach(id=>{const e=$(id);if(e)e.value='';});
  $('zp-type').value='Closed-end';$('zp-material').value='Nylon coil';$('zp-unit').value='cm';$('zp-per-garment').value='1';$('zp-waste').value='';method='formula';updateMethod();updateUnits();clearResults();
  $('zp-recent-panel').hidden=true;$('zp-recent-toggle').setAttribute('aria-expanded','false');status('All order details, specifications and calculation results have been cleared.');
 }
 function downloadReport(){
  const r=lastResult||calculate(false);if(!r)return;
  const u=r.inputUnit,details=[['Buyer',val('zp-buyer')||'—'],['Style',val('zp-style')||'—'],['PO Number',val('zp-po')||'—'],['Order Quantity',Math.floor(num('zp-order-qty')).toLocaleString('en-US')+' pcs'],['Zipper Type',val('zp-type')],['Material / Teeth',val('zp-material')],['Gauge / Size',val('zp-gauge')||'—'],['Color / Code',val('zp-color')||'—'],['Measurement Method',r.method==='direct'?'Direct Measurement':'Body / Neck Formula'],['Measurement Unit',u],['Shrinkage Adjustment',r.shr+'%'],['Wastage Allowance',r.waste+'%'],['Zippers per Garment',r.perGarment],['Base Zipper Quantity',r.baseQty+' pcs'],['Extra Zippers for Wastage',r.extraQty+' pcs'],['Total Zipper Quantity incl. Wastage',r.qty+' pcs'],['Finished Length / Zipper',fmt(cmToUnit(r.finishedCm),1)+' '+u],['Total Length Required',fmt(cmToUnit(r.totalLengthCm),2)+' '+u],['Estimated Total Cost',r.price?fmt(r.totalCost,2):'Not entered']];
  const rows=details.map(x=>'<tr><th>'+esc(x[0])+'</th><td>'+esc(x[1])+'</td></tr>').join('');
  const formula=r.method==='direct'?'Base length = direct finished measurement':'Base length = Body Length + High Neck − Front Neck Drop';
  const report='<div class="header"><h1>Zipper Consumption Report</h1><div class="date">Generated: '+new Date().toLocaleString()+'</div></div><div class="box"><div>Finished Zipper Length</div><div class="box-value">'+fmt(cmToUnit(r.finishedCm),1)+' '+u+'</div><div>Total required: '+r.qty.toLocaleString('en-US')+' pcs</div></div><h2>Order & Zipper Details</h2><table><tbody>'+rows+'</tbody></table><div style="margin-top:18px;padding:14px;background:#f8fafc;border-radius:8px"><strong>Formula Reference</strong><p>'+esc(formula)+'</p><p>Existing shrinkage adjustment: Base length × (1 − shrinkage / 100)</p><p>Total zipper quantity = Base zipper quantity × (1 + wastage / 100), rounded up</p><p>Total length = Finished length × Total zipper quantity</p></div><p style="margin-top:16px;color:#64748b;font-size:11px">Confirm zipper measurement and construction against the approved sample and supplier specification before bulk production.</p>';
  if(typeof generatePDF==='function')generatePDF('Zipper Consumption Report',report);else window.print();
 }
 function init(){
  if(!root()||root().dataset.zipperInitialized==='true')return;
  root().dataset.zipperInitialized='true';
  updateMethod();updateUnits();renderRecent();
  $('zp-demo')?.addEventListener('click',()=>demo());
  $('zp-reset')?.addEventListener('click',()=>reset());
  $('zp-recent-toggle')?.addEventListener('click',()=>{
   const panel=$('zp-recent-panel');if(!panel)return;
   panel.hidden=!panel.hidden;
   $('zp-recent-toggle').setAttribute('aria-expanded',String(!panel.hidden));
   if(!panel.hidden)renderRecent();
  });
  $('btn-calc-zipper')?.addEventListener('click',()=>calculate(true));
  $('btn-pdf-zipper')?.addEventListener('click',downloadReport);
  root().querySelectorAll('[data-zp-method]').forEach(btn=>btn.addEventListener('click',()=>{
   method=btn.dataset.zpMethod;updateMethod();clearResults();
  }));
  if(window.lucide?.createIcons)window.lucide.createIcons();
 }
 // Delegated controls: resilient to page re-rendering and script initialization order.
 if(!window.__zipperPlannerEvents){
  window.__zipperPlannerEvents=true;
  document.addEventListener('click',e=>{
   const t=e.target.closest('#page-zipper button');if(!t)return;
   if(t.id==='zp-demo'){demo();return;}
   if(t.id==='zp-reset'){reset();return;}
   if(t.id==='zp-recent-toggle'){const p=$('zp-recent-panel');p.hidden=!p.hidden;t.setAttribute('aria-expanded',String(!p.hidden));if(!p.hidden)renderRecent();return;}
   if(t.id==='btn-calc-zipper'){calculate(true);return;}
   if(t.id==='btn-pdf-zipper'){downloadReport();return;}
   if(t.dataset.zpMethod){method=t.dataset.zpMethod;updateMethod();clearResults();return;}
   if(t.dataset.zpLoad){loadRecent(t.dataset.zpLoad);return;}
   if(t.dataset.zpDelete){localStorage.setItem(RECENT_KEY,JSON.stringify(recentItems().filter(x=>String(x.id)!==t.dataset.zpDelete)));renderRecent();return;}
   if(t.hasAttribute('data-zp-clear')){localStorage.removeItem(RECENT_KEY);renderRecent();}
  });
  document.addEventListener('input',e=>{if(e.target.closest('#page-zipper')&&lastResult)clearResults();});
  document.addEventListener('change',e=>{if(e.target.id==='zp-unit'){updateUnits();clearResults();}});
 }
 window.calcZipper=()=>calculate(false);
 window.updateZipper=()=>calculate(false);
 window.downloadZipperReport=downloadReport;
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();