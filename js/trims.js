// Trims Consumption Planner — page-scoped calculations and interactions.
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const num = id => Math.max(0, Number($(id)?.value) || 0);
  const fmt = (value, digits = 1) => Number(value || 0).toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: digits });
  const qty = () => Math.floor(num('tr-order-qty'));
  const val = id => $(id)?.value ?? '';
  const put = (id, value) => { if ($(id)) $(id).textContent = value; };
  const complete = ids => ids.every(id => val(id).trim() !== '' && Number.isFinite(Number(val(id))) && Number(val(id)) >= 0);
  const blankResults = ids => {
    if (!complete(ids) || qty() < 1) return true;
    return false;
  };
  function thread() {
    if (blankResults(['th-seam','th-layer','th-spi','th-tps','tr-order-qty'])) {
      ['th-pc','th-dz','th-order','tr-summary-thread'].forEach(id=>put(id,'—'));
      return {seam:0,layers:0,spi:0,tps:0,pc:0,dz:0,order:0};
    }
    const seam = num('th-seam'), layers = num('th-layer'), spi = num('th-spi'), tps = num('th-tps');
    // Preserve the existing project formula and its current unit convention.
    const pc = (seam * layers * spi * tps) / 39.37;
    const dz = pc * 12, order = pc * qty();
    put('th-pc', fmt(pc,1)+' m'); put('th-dz',fmt(dz,1)+' m'); put('th-order',fmt(order,1)+' m');
    put('tr-summary-thread',fmt(order,1));
    return {seam,layers,spi,tps,pc,dz,order};
  }
  function button() {
    if (blankResults(['bt-pp','bt-ex','tr-order-qty'])) {
      ['bt-pc','bt-dz','bt-order','tr-summary-button'].forEach(id=>put(id,'—'));
      return {perPc:0,extra:0,rawPc:0,dz:0,order:0};
    }
    const perPc = num('bt-pp'), extra = num('bt-ex');
    const rawPc = perPc * (1 + extra / 100), dz = Math.ceil(rawPc * 12), order = Math.ceil(rawPc * qty());
    put('bt-pc',fmt(rawPc,2)+' pcs'); put('bt-dz',dz.toLocaleString('en-US')+' pcs'); put('bt-order',order.toLocaleString('en-US')+' pcs');
    put('tr-summary-button',order.toLocaleString('en-US'));
    return {perPc,extra,rawPc,dz,order};
  }
  function interlining() {
    if (blankResults(['il-len','il-wid','il-qty','tr-order-qty'])) {
      ['il-pc','il-dz','il-order','tr-summary-interlining'].forEach(id=>put(id,'—'));
      return {length:0,width:0,pieces:0,pc:0,dz:0,order:0};
    }
    const length=num('il-len'), width=num('il-wid'), pieces=num('il-qty');
    const pc=(length*width*pieces)/10000, dz=pc*12, order=pc*qty();
    put('il-pc',fmt(pc,4)+' m²'); put('il-dz',fmt(dz,3)+' m²'); put('il-order',fmt(order,3)+' m²');
    put('tr-summary-interlining',fmt(order,3));
    return {length,width,pieces,pc,dz,order};
  }
  function calculateAll(save=true) {
    const q=qty();
    const t=thread(), b=button(), i=interlining();
    const ready = q>0 && ['th-seam','th-layer','th-spi','th-tps','bt-pp','bt-ex','il-len','il-wid','il-qty'].some(id=>val(id).trim()!=='');
    put('tr-status',ready?'Results update when you complete the required fields.':'Enter your order quantity and calculator values to see the results.');
    if ($('tr-status')) $('tr-status').classList.toggle('is-warning',q===0);
    if(window.lucide?.createIcons) window.lucide.createIcons();
    return { thread: t, button: b, interlining: i };
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
    function report(title, heading, rows, result, formula, sectionLabel, statusNote) {
    const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const now=new Date();
    const dateText=now.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
    const reportId='FC-TRIMS-'+now.getFullYear()+String(now.getMonth()+1).padStart(2,'0')+String(now.getDate()).padStart(2,'0');
    const iconPaths={
      info:'<circle cx="12" cy="12" r="9"></circle><path d="M12 10v6M12 7h.01"></path>',
      components:'<rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect><rect x="14" y="14" width="7" height="7" rx="1"></rect>',
      summary:'<path d="M4 19V5M4 19h17"></path><path d="m7 15 4-4 3 2 6-7"></path>',
      warning:'<path d="M12 3 2.5 20h19z"></path><path d="M12 9v5M12 17h.01"></path>',
      formula:'<path d="M7 4h10M7 20h10M9 7l6 10M15 7l-6 10"></path>'
    };
    const icon=name=>'<svg class="report-icon" viewBox="0 0 24 24" aria-hidden="true">'+(iconPaths[name]||iconPaths.info)+'</svg>';
    const safeRows=rows.map((r,i)=>'<tr><td>'+(i+1)+'</td><td><strong>'+esc(r[0])+'</strong></td><td>'+esc(r[1])+'</td></tr>').join('');
    const filePart=value=>String(value||'').trim().replace(/[^a-z0-9-_]+/gi,'_').replace(/^_+|_+$/g,'').slice(0,40);
    const filename=['FC_TRIMS',filePart(val('tr-buyer')),filePart(val('tr-style')),filePart(val('tr-po')),heading.replace(/[^a-z0-9]+/gi,'_'),reportId].filter(Boolean).join('_');
    const reportHtml='<div class="report">'+
      '<div class="report-header"><div><div class="brand">FABRiCS <span>CONSUMPTiON</span></div><div class="subtitle">GARMENT CALCULATOR SUITE</div></div><div class="report-title"><div class="eyebrow">CALCULATION REPORT</div><h1>'+esc(heading)+'</h1><div class="report-id">'+reportId+'</div></div></div>'+
      '<section class="section order-information-section"><div class="section-head">'+icon('info')+'<span>ORDER INFORMATION</span></div><div class="info-grid">'+
      '<div><span>Buyer Name</span><strong>'+(esc(val('tr-buyer'))||'________________')+'</strong></div><div><span>Style No.</span><strong>'+(esc(val('tr-style'))||'________________')+'</strong></div><div><span>PO / Order No.</span><strong>'+(esc(val('tr-po'))||'________________')+'</strong></div></div></section>'+
      '<div class="order-quantity-strip"><span>ORDER QUANTITY</span><strong>'+qty().toLocaleString('en-US')+' pcs</strong></div>'+
      '<div class="report-meta-line"><span>'+dateText+'</span><span>TRIMS / '+esc(title.replace(' Consumption Report','').toUpperCase())+'</span></div>'+
      '<section class="section"><div class="section-head">'+icon('components')+'<span>'+esc(sectionLabel)+'</span></div><table class="consumption-table"><thead><tr><th style="width:6%">SL</th><th style="width:34%">Parameter</th><th style="width:60%">Input / Result</th></tr></thead><tbody>'+safeRows+'</tbody></table></section>'+
      '<div class="summary-grid"><div class="summary-card"><div class="metric-head">'+icon('components')+'<span>PER PIECE</span></div><strong>'+esc(result.pc)+'</strong><small>Consumption for one garment</small></div><div class="summary-card"><div class="metric-head">'+icon('components')+'<span>PER DOZEN</span></div><strong>'+esc(result.dz)+'</strong><small>Consumption for 12 garments</small></div><div class="summary-card primary"><div class="metric-head">'+icon('summary')+'<span>FULL ORDER TOTAL</span></div><strong>'+esc(result.order)+'</strong><small>For '+qty().toLocaleString('en-US')+' garments</small></div></div>'+
      '<section class="section"><div class="section-head">'+icon('formula')+'<span>CALCULATION METHOD</span></div><div style="padding:10px 12px;font-size:9px;line-height:1.65"><strong>'+esc(sectionLabel)+'</strong><div style="margin-top:4px;color:#475569">'+esc(formula)+'</div></div></section>'+
      '<section class="comments-section"><div class="comments-title">COMMENTS:</div><div class="comments-writing-area"></div></section>'+
      '<div class="note">'+icon('warning')+'<div><strong>IMPORTANT:</strong> '+esc(statusNote||'Consumption estimate only. Verify trims specifications, approved sample, order quantity and production requirements before bulk purchasing.')+'</div></div>'+
      '<div class="approval-grid"><div><span>PREPARED BY</span><strong></strong></div><div><span>CHECKED BY</span><strong></strong></div><div><span>APPROVED BY</span><strong></strong></div></div>'+
      '<div class="report-footer"><span>Fabrics Consumption - Garment Calculator Suite</span><span>'+dateText+' · <a href="https://fabricconsumption.vercel.app/" target="_blank" rel="noopener noreferrer">fabricconsumption.vercel.app</a></span></div></div>';
    if(typeof generatePDF==='function')generatePDF(filename,reportHtml);else window.print();
  }
  function pdfThread(){
    const r=thread();
    if(blankResults(['th-seam','th-layer','th-spi','th-tps','tr-order-qty'])){alert('Please complete all Thread inputs and enter a valid order quantity before downloading the report.');return;}
    report('Thread Consumption Report','Thread Consumption Report',[
      ['Seam Length',r.seam+' m/pc'],['Number of Layers',r.layers],['Stitch Density',r.spi+' SPI'],['Thread Per Stitch',r.tps]
    ],{pc:fmt(r.pc,2)+' m',dz:fmt(r.dz,2)+' m',order:fmt(r.order,2)+' m'},'Seam Length × Layers × Stitch Density × Thread Per Stitch ÷ 39.37. Per dozen = per piece × 12. Full order = per piece × order quantity.','THREAD CONSUMPTION DETAILS');
  }
  function pdfButton(){
    const r=button();
    if(blankResults(['bt-pp','bt-ex','tr-order-qty'])){alert('Please complete all Button inputs and enter a valid order quantity before downloading the report.');return;}
    report('Button Consumption Report','Button Consumption Report',[
      ['Buttons per Piece',r.perPc],['Extra / Spare',r.extra+'%'],['Adjusted Buttons per Piece',fmt(r.rawPc,2)+' pcs']
    ],{pc:fmt(r.rawPc,2)+' pcs',dz:r.dz.toLocaleString('en-US')+' pcs',order:r.order.toLocaleString('en-US')+' pcs'},'Buttons per piece × (1 + Extra / Spare % ÷ 100). Per dozen and full-order quantities are rounded up to the next whole piece.','BUTTON CONSUMPTION DETAILS');
  }
  function pdfInterlining(){
    const r=interlining();
    if(blankResults(['il-len','il-wid','il-qty','tr-order-qty'])){alert('Please complete all Interlining inputs and enter a valid order quantity before downloading the report.');return;}
    report('Interlining Consumption Report','Interlining Consumption Report',[
      ['Length',r.length+' cm'],['Width',r.width+' cm'],['Quantity per Piece',r.pieces]
    ],{pc:fmt(r.pc,4)+' m²',dz:fmt(r.dz,3)+' m²',order:fmt(r.order,3)+' m²'},'Length × Width × Quantity per Piece ÷ 10,000. Per dozen = per piece × 12. Full order = per piece × order quantity.','INTERLINING CONSUMPTION DETAILS');
  }
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
