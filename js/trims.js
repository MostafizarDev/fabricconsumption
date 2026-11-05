// Trims Consumption Planner — page-scoped calculations and interactions.
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const num = id => Math.max(0, Number($(id)?.value) || 0);
  const fmt = (value, digits = 1) => Number(value || 0).toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: digits });
  const qty = () => Math.floor(num('tr-order-qty'));
  const val = id => $(id)?.value ?? '';
  const put = (id, value) => { if ($(id)) $(id).textContent = value; };
  const stateIds = ['tr-buyer','tr-style','tr-po','tr-order-qty','th-seam','th-layer','th-spi','th-tps','bt-pp','bt-ex','il-len','il-wid','il-qty'];
  const defaults = {'tr-buyer':'','tr-style':'','tr-po':'','tr-order-qty':'1200','th-seam':'10','th-layer':'2','th-spi':'12','th-tps':'3','bt-pp':'8','bt-ex':'5','il-len':'30','il-wid':'10','il-qty':'2'};
  const recentKey = 'fc-trims-recent-v1';
  let last = null;
  function values() { return Object.fromEntries(stateIds.map(id => [id, val(id)])); }
  function restore(data) { stateIds.forEach(id => { if ($(id) && data[id] !== undefined) $(id).value = data[id]; }); calculateAll(false); }
  function saveRecent() {
    try {
      const list = JSON.parse(localStorage.getItem(recentKey) || '[]');
      const snapshot = values();
      const key = JSON.stringify(snapshot);
      const next = [snapshot, ...list.filter(item => JSON.stringify(item) !== key)].slice(0,5);
      localStorage.setItem(recentKey, JSON.stringify(next));
    } catch (_) {}
  }
  function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function renderRecent() {
    const panel = $('tr-recent-panel');
    if (!panel) return;
    let list = [];
    try { list = JSON.parse(localStorage.getItem(recentKey) || '[]'); } catch (_) {}
    panel.innerHTML = list.length ? list.map((item,i) => '<button type="button" class="trims-recent-item" data-recent-index="'+i+'"><strong>'+escapeHTML(item['tr-style'] || item['tr-po'] || 'Calculation '+(i+1))+'</strong><span>'+Number(item['tr-order-qty']||0).toLocaleString('en-US')+' pcs · '+escapeHTML(item['tr-buyer']||'No buyer')+'</span></button>').join('') : '<p class="trims-recent-empty">No recent calculations saved yet. Calculate your trims to save a recent entry.</p>';
    panel.hidden = false;
    panel.querySelectorAll('[data-recent-index]').forEach(btn => btn.addEventListener('click', () => { restore(list[Number(btn.dataset.recentIndex)]); panel.hidden = true; }));
  }
  function thread() {
    const seam = num('th-seam'), layers = num('th-layer'), spi = num('th-spi'), tps = num('th-tps');
    // Preserve the existing project formula and its current unit convention.
    const pc = (seam * layers * spi * tps) / 39.37;
    const dz = pc * 12, order = pc * qty();
    put('th-pc', fmt(pc,1)+' m'); put('th-dz',fmt(dz,1)+' m'); put('th-order',fmt(order,1)+' m');
    put('tr-summary-thread',fmt(order,1));
    return {seam,layers,spi,tps,pc,dz,order};
  }
  function button() {
    const perPc = num('bt-pp'), extra = num('bt-ex');
    const rawPc = perPc * (1 + extra / 100), dz = Math.ceil(rawPc * 12), order = Math.ceil(rawPc * qty());
    put('bt-pc',fmt(rawPc,2)+' pcs'); put('bt-dz',dz.toLocaleString('en-US')+' pcs'); put('bt-order',order.toLocaleString('en-US')+' pcs');
    put('tr-summary-button',order.toLocaleString('en-US'));
    return {perPc,extra,rawPc,dz,order};
  }
  function interlining() {
    const length=num('il-len'), width=num('il-wid'), pieces=num('il-qty');
    const pc=(length*width*pieces)/10000, dz=pc*12, order=pc*qty();
    put('il-pc',fmt(pc,4)+' m²'); put('il-dz',fmt(dz,3)+' m²'); put('il-order',fmt(order,3)+' m²');
    put('tr-summary-interlining',fmt(order,3));
    return {length,width,pieces,pc,dz,order};
  }
  function calculateAll(save=true) {
    const q=qty();
    const t=thread(), b=button(), i=interlining();
    last={qty:q,thread:t,button:b,interlining:i,values:values()};
    put('tr-status',q>0?'Calculated for '+q.toLocaleString('en-US')+' garments. Results include the existing button spare allowance.':'Enter a valid order quantity greater than zero.');
    if ($('tr-status')) $('tr-status').classList.toggle('is-warning',q===0);
    if(save && q>0) saveRecent();
    if(window.lucide?.createIcons) window.lucide.createIcons();
    return last;
  }
  function reset() { restore(defaults); const p=$('tr-recent-panel'); if(p)p.hidden=true; }
  function demo() { restore({...defaults,'tr-buyer':'DEMO BUYER','tr-style':'DEMO-TRIMS-001','tr-po':'PO-2026-001','tr-order-qty':'10000','th-seam':'10','th-layer':'2','th-spi':'12','th-tps':'3','bt-pp':'8','bt-ex':'5','il-len':'30','il-wid':'10','il-qty':'2'}); saveRecent(); }
  function report(title, heading, rows, result, formula) {
    const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const meta=[['Buyer',val('tr-buyer')],['Style',val('tr-style')],['PO Number',val('tr-po')],['Order Qty',qty()+' pcs']];
    const html='<div class="header"><h1>'+esc(heading)+'</h1><div class="date">Generated: '+new Date().toLocaleString()+'</div></div><div class="box"><div>Order Requirement</div><div class="box-value">'+esc(result)+'</div><div>Full order</div></div><table><thead><tr><th>Parameter</th><th>Value</th></tr></thead><tbody>'+meta.concat(rows).map(r=>'<tr><td>'+esc(r[0])+'</td><td>'+esc(r[1])+'</td></tr>').join('')+'</tbody></table><div style="margin-top:20px;padding:12px;background:#f8fafc;border-radius:8px"><strong>Formula reference:</strong><br>'+esc(formula)+'</div>';
    if(typeof generatePDF==='function') generatePDF(title,html); else window.print();
  }
  function pdfThread(){const r=thread();report('Thread Consumption Report','Thread Consumption Report',[['Seam Length',r.seam+' m/pc'],['Layers',r.layers],['Stitch Density',r.spi+' SPI'],['Thread Per Stitch',r.tps],['Consumption per piece',fmt(r.pc,2)+' m'],['Consumption per dozen',fmt(r.dz,2)+' m']],fmt(r.order,2)+' m','Seam Length × Layers × SPI × Thread Per Stitch ÷ 39.37');}
  function pdfButton(){const r=button();report('Button Consumption Report','Button Consumption Report',[['Buttons per piece',r.perPc],['Extra / Spare',r.extra+'%'],['Requirement per dozen',r.dz+' pcs'],['Order quantity',qty()+' pcs']],r.order+' pcs','Buttons per Piece × Order Qty × (1 + Extra % ÷ 100), rounded up');}
  function pdfInterlining(){const r=interlining();report('Interlining Consumption Report','Interlining Consumption Report',[['Length',r.length+' cm'],['Width',r.width+' cm'],['Quantity per piece',r.pieces],['Area per piece',fmt(r.pc,4)+' m²'],['Area per dozen',fmt(r.dz,3)+' m²']],fmt(r.order,3)+' m²','Length × Width × Quantity ÷ 10,000 × Order Qty');}
  document.addEventListener('DOMContentLoaded', function () {
    ['th-seam','th-layer','th-spi','th-tps','bt-pp','bt-ex','il-len','il-wid','il-qty','tr-order-qty'].forEach(id=>$(id)?.addEventListener('input',()=>calculateAll()));
    ['tr-buyer','tr-style','tr-po'].forEach(id=>$(id)?.addEventListener('change',()=>calculateAll()));
    $('btn-calc-thread')?.addEventListener('click',()=>{calculateAll();});
    $('btn-calc-button')?.addEventListener('click',()=>{calculateAll();});
    $('btn-calc-interlining')?.addEventListener('click',()=>{calculateAll();});
    $('btn-pdf-thread')?.addEventListener('click',pdfThread);
    $('btn-pdf-button')?.addEventListener('click',pdfButton);
    $('btn-pdf-interlining')?.addEventListener('click',pdfInterlining);
    $('tr-demo')?.addEventListener('click',demo);
    $('tr-reset')?.addEventListener('click',reset);
    $('tr-recent')?.addEventListener('click',renderRecent);
    calculateAll(false);
  });
})();
