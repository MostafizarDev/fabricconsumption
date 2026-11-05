// Trims Consumption Planner — page-scoped calculations and interactions.
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const num = id => Math.max(0, Number($(id)?.value) || 0);
  const fmt = (value, digits = 1) => Number(value || 0).toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: digits });
  const qty = () => Math.floor(num('tr-order-qty'));
  const val = id => $(id)?.value ?? '';
  const put = (id, value) => { if ($(id)) $(id).textContent = value; };
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
    put('tr-status',q>0?'Calculated for '+q.toLocaleString('en-US')+' garments. Results include the existing button spare allowance.':'Enter a valid order quantity greater than zero.');
    if ($('tr-status')) $('tr-status').classList.toggle('is-warning',q===0);
    if(window.lucide?.createIcons) window.lucide.createIcons();
    return last;
  }
  function selectCalculator(mode) {
    const modes = ['thread','button','interlining'];
    if (!modes.includes(mode)) return;
    modes.forEach(name => {
      const btn = $('tr-mode-'+name), panel = $('tr-'+name+'-card');
      const active = name === mode;
      if (btn) { btn.classList.toggle('is-active',active); btn.setAttribute('aria-selected',String(active)); }
      if (panel) panel.hidden = !active;
    });
    if (window.lucide?.createIcons) window.lucide.createIcons();
  }
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
    document.querySelectorAll('#page-trims [data-tr-mode]').forEach(btn => btn.addEventListener('click', () => selectCalculator(btn.dataset.trMode)));
    selectCalculator('thread');
    ['th-seam','th-layer','th-spi','th-tps','bt-pp','bt-ex','il-len','il-wid','il-qty','tr-order-qty'].forEach(id=>$(id)?.addEventListener('input',()=>calculateAll()));
    ['tr-buyer','tr-style','tr-po'].forEach(id=>$(id)?.addEventListener('change',()=>calculateAll()));
    $('btn-calc-thread')?.addEventListener('click',()=>{calculateAll();});
    $('btn-calc-button')?.addEventListener('click',()=>{calculateAll();});
    $('btn-calc-interlining')?.addEventListener('click',()=>{calculateAll();});
    $('btn-pdf-thread')?.addEventListener('click',pdfThread);
    $('btn-pdf-button')?.addEventListener('click',pdfButton);
    $('btn-pdf-interlining')?.addEventListener('click',pdfInterlining);
    calculateAll(false);
  });
})();
