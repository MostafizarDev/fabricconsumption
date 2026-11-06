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
  const THREAD_STANDARDS = {
    '301':{name:'301 Lockstitch',ratio:2.5},'101':{name:'101 Chainstitch',ratio:4},
    '401':{name:'401 Two-Thread Chainstitch',ratio:5.5},'304':{name:'304 Zigzag Lockstitch',ratio:7},
    '503':{name:'503 Two-Thread Overedge',ratio:12},'504':{name:'504 Three-Thread Overedge',ratio:14},
    '512':{name:'512 Four-Thread Mock Safety',ratio:18},'516':{name:'516 Five-Thread Safety Stitch',ratio:20},
    '406':{name:'406 Three-Thread Coverstitch',ratio:18},'602':{name:'602 Four-Thread Coverstitch',ratio:25},
    '605':{name:'605 Five-Thread Coverstitch',ratio:28}
  };
  let threadPartSequence=0;
  const stitchOptions='<option value="">Select stitch</option>'+Object.entries(THREAD_STANDARDS).map(([code,item])=>'<option value="'+code+'">'+code+' · '+item.name.replace(/^\\d+ /,'')+'</option>').join('')+'<option value="custom">Custom Ratio</option>';
  function addThreadPartRow(){
    const body=$('th-parts-body');if(!body)return;
    const row=document.createElement('tr');row.dataset.partId=String(++threadPartSequence);
    row.innerHTML='<td><input class="inp-plain th-part-name" type="text" placeholder="e.g. Shoulder Join" aria-label="Garment part"></td>'+
      '<td><input class="inp-plain th-part-length" type="number" min="0" step="any" placeholder="e.g. 0.65" aria-label="Seam length in metres"></td>'+
      '<td><select class="inp-plain th-part-stitch" aria-label="Stitch class">'+stitchOptions+'</select></td>'+
      '<td><input class="inp-plain th-part-spi" type="number" min="1" step="any" placeholder="18" aria-label="Stitches per inch"></td>'+
      '<td><input class="inp-plain th-part-ratio" type="number" min="0" step="any" placeholder="Ratio" aria-label="Thread consumption ratio"></td>'+
      '<td class="th-part-count">—</td><td class="th-part-thread">—</td>'+
      '<td><button type="button" class="th-remove-part" aria-label="Remove part" title="Remove part">×</button></td>';
    body.appendChild(row);return row;
  }
  function threadParts(){
    return Array.from(document.querySelectorAll('#th-parts-body tr')).map(row=>{
      const name=row.querySelector('.th-part-name')?.value.trim()||'';
      const lengthValue=row.querySelector('.th-part-length')?.value.trim()||'';
      const stitch=row.querySelector('.th-part-stitch')?.value||'';
      const spiValue=row.querySelector('.th-part-spi')?.value.trim()||'';
      const ratioValue=row.querySelector('.th-part-ratio')?.value.trim()||'';
      // Ignore untouched extra rows; partially completed rows remain visible and must be completed.
      if(!name&&!lengthValue&&!stitch&&!spiValue&&!ratioValue)return null;
      return {row,name:name||'Unnamed part',length:Number(lengthValue)||0,stitch,spi:Number(spiValue)||0,ratio:Number(ratioValue)||0};
    }).filter(Boolean);
  }
  function syncThreadPartRatio(select){
    const ratio=select.closest('tr')?.querySelector('.th-part-ratio');
    if(!ratio)return;
    ratio.value=THREAD_STANDARDS[select.value]?.ratio??'';
    ratio.readOnly=false;
  }
  function thread(){
    const parts=threadParts(),waste=num('th-waste'),orderQty=qty();
    const valid=parts.length>0&&parts.every(p=>p.length>0&&p.stitch&&p.spi>0&&p.ratio>0)&&orderQty>0&&val('th-waste').trim()!==''&&waste>=0;
    if(!valid){
      parts.forEach(p=>{p.row.querySelector('.th-part-count').textContent='—';p.row.querySelector('.th-part-thread').textContent='—';});
      ['th-pc','th-dz','th-order','tr-summary-thread'].forEach(id=>put(id,'—'));
      return {parts,waste,netPc:0,pc:0,dz:0,order:0,valid:false};
    }
    let stitchCount=0,netPc=0;
    parts.forEach(p=>{
      p.stitchCount=p.length*39.37007874*p.spi;
      p.thread=p.length*p.ratio;
      stitchCount+=p.stitchCount;netPc+=p.thread;
      p.row.querySelector('.th-part-count').textContent=Math.round(p.stitchCount).toLocaleString('en-US');
      p.row.querySelector('.th-part-thread').textContent=fmt(p.thread,3)+' m';
    });
    const pc=netPc*(1+waste/100),dz=pc*12,order=pc*orderQty;
    put('th-pc',fmt(pc,2)+' m');put('th-dz',fmt(dz,2)+' m');put('th-order',fmt(order,2)+' m');put('tr-summary-thread',fmt(order,2));
    return {parts,waste,stitchCount,netPc,pc,dz,order,valid:true};
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
    const length=num('il-len'), width=num('il-wid'), pieces=num('il-qty'), waste=num('il-waste');
    const netPc=(length*width*pieces)/10000,pc=netPc*(1+waste/100),dz=pc*12,order=pc*qty();
    put('il-pc',fmt(pc,4)+' m²'); put('il-dz',fmt(dz,3)+' m²'); put('il-order',fmt(order,3)+' m²');
    put('tr-summary-interlining',fmt(order,3));
    return {length,width,pieces,waste,netPc,pc,dz,order};
  }
  function updateOrderQuantityState(){
    const input=$('tr-order-qty');
    if(!input)return false;
    const label=input.closest('label');
    const missing=input.value.trim()===''||!Number.isFinite(Number(input.value))||Number(input.value)<1||!Number.isInteger(Number(input.value));
    input.classList.toggle('is-missing',missing);
    input.setAttribute('aria-invalid',String(missing));
    input.setAttribute('aria-required','true');
    if(label){
      label.classList.toggle('is-missing',missing);
      let hint=label.querySelector('.tr-order-required-hint');
      if(missing){
        if(!hint){hint=document.createElement('small');hint.className='tr-order-required-hint';hint.textContent='Required — enter total order quantity';label.appendChild(hint);}
      }else if(hint){hint.remove();}
    }
    return !missing;
  }
  function calculateAll(save=true) {
    const orderQtyValid=updateOrderQuantityState();
    const q=qty();
    const t=thread(), b=button(), i=interlining();
    const ready = q>0 && (t.valid || ['bt-pp','bt-ex','il-len','il-wid','il-qty','il-waste'].some(id=>val(id).trim()!==''));
    put('tr-status',!orderQtyValid?'Order quantity is required. Enter the total quantity in Order Information above.':ready?'Results update when you complete the required fields.':'Enter your calculator values to see the results.');
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
    const formulaItems=Array.isArray(formula)?formula:String(formula||'').split('|').filter(Boolean);
    const formulaList='<ul class="formula-points">'+formulaItems.map(item=>'<li>'+esc(item)+'</li>').join('')+'</ul>';
    const filePart=value=>String(value||'').trim().replace(/[^a-z0-9-_]+/gi,'_').replace(/^_+|_+$/g,'').slice(0,40);
    const filename=['FC_TRIMS',filePart(val('tr-buyer')),filePart(val('tr-style')),filePart(val('tr-po')),heading.replace(/[^a-z0-9]+/gi,'_'),reportId].filter(Boolean).join('_');
    const reportCss='<style>'+
      '.report{font-family:Arial,Helvetica,sans-serif;color:#17243a;font-size:10px;line-height:1.45;background:#fff;padding:30px 34px;box-sizing:border-box}'+
      '.report-header{display:flex;justify-content:space-between;align-items:center;gap:24px;padding:4px 0 20px;border-bottom:3px solid #2563eb;margin-bottom:18px}'+
      '.report-header .brand{font-size:25px;font-weight:900;letter-spacing:-1px;color:#101b30}.report-header .brand span{color:#168bd2}'+
      '.report-header .subtitle{font-size:8px;letter-spacing:3px;font-weight:700;color:#8192aa;margin-top:3px}'+
      '.report-title{text-align:right;max-width:55%}.report-title .eyebrow{font-size:8px;letter-spacing:2px;color:#2563eb;font-weight:800}.report-title h1{font-size:20px;line-height:1.2;margin:5px 0;color:#111d32}.report-id{font-size:8px;color:#8492a6;letter-spacing:.5px}'+
      '.section{border:1px solid #d9e3ef;border-radius:9px;overflow:hidden;margin:0 0 14px;page-break-inside:avoid}.section-head{display:flex;align-items:center;gap:8px;padding:9px 12px;background:#f0f5ff;border-bottom:1px solid #d8e4f6;color:#172b4d;font-size:9px;font-weight:800;letter-spacing:1px}.report-icon{width:13px;height:13px;flex:0 0 13px;fill:none;stroke:#2563eb;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}'+
      '.info-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;padding:15px 14px}.info-grid>div{min-width:0}.info-grid span,.order-quantity-strip span{display:block;font-size:8px;letter-spacing:1px;color:#71819a;font-weight:700;text-transform:uppercase;margin-bottom:6px}.info-grid strong{font-size:11px;color:#15233a;overflow-wrap:anywhere}'+
      '.order-quantity-strip{display:grid;grid-template-columns:1.25fr 1fr 1fr;align-items:center;gap:14px;padding:12px 15px;margin:-2px 0 13px;border:1px solid #cfe1f6;border-radius:9px;background:#f7faff}.order-quantity-strip span{display:block;margin:0 0 5px;font-size:7px;letter-spacing:1px;color:#71819a;font-weight:800}.order-quantity-strip strong{display:block;font-size:10px;color:#253650;font-weight:750}.order-quantity-strip .quantity-main strong{font-size:16px;color:#1769bd;font-weight:850}.quantity-meta{border-left:1px solid #dce7f4;padding-left:14px;min-width:0}.quantity-meta strong{overflow-wrap:anywhere}'+
      '@media(max-width:600px){.order-quantity-strip{grid-template-columns:1fr 1fr;gap:10px}.order-quantity-strip .quantity-main{grid-column:1/-1}.quantity-meta{padding-left:0;border-left:0}}'+
      '.consumption-table{width:100%;border-collapse:collapse;font-size:9px}.consumption-table th{padding:8px;background:#f4f7fb;color:#4b5d75;text-align:left;font-size:8px;letter-spacing:.5px}.consumption-table td{padding:8px;border-top:1px solid #e2e8f0;color:#26364d}.consumption-table td:first-child,.consumption-table th:first-child{text-align:center}.consumption-table td:last-child{text-align:center}'+
      '.summary-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:14px 0}.summary-card{border:1px solid #dce5ef;border-radius:9px;padding:12px;background:#fff;min-width:0}.summary-card.primary{border-color:#91bdff;background:#eff6ff}.metric-head{display:flex;align-items:center;gap:6px;font-size:8px;font-weight:800;letter-spacing:.8px;color:#60718a}.summary-card strong{display:block;margin:8px 0 3px;font-size:19px;line-height:1.1;color:#15233a;font-variant-numeric:tabular-nums}.summary-card.primary strong{color:#2563eb}.summary-card small{font-size:8px;color:#71819a}'+
      '.formula-content{padding:11px 13px;font-size:9px;line-height:1.6}.formula-points{margin:7px 0 0;padding:0;list-style:none;display:grid;gap:5px}.formula-points li{position:relative;padding:5px 8px 5px 20px;border-radius:5px;background:#f7f9fc;color:#475569}.formula-points li:before{content:"";position:absolute;left:9px;top:11px;width:4px;height:4px;border-radius:50%;background:#2563eb}'+
      '.comments-section{border:1px solid #d4deeb;border-radius:8px;padding:11px 13px;margin:12px 0 14px;min-height:52px;page-break-inside:avoid}.comments-title{font-size:8px;letter-spacing:1px;font-weight:800;color:#53647d}.comments-writing-area{height:35px}'+
      '.note{display:flex;gap:8px;padding:10px 12px;border:1px solid #f4d37b;border-radius:8px;background:#fffbeb;color:#8a4b08;font-size:8px;margin:12px 0 22px;page-break-inside:avoid}.approval-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:22px;page-break-inside:avoid}.approval-grid>div{border-bottom:1px solid #b8c5d6;padding:0 0 6px}.approval-grid span{font-size:7px;letter-spacing:1px;color:#64748b;font-weight:800}'+
      '.report-footer{display:flex;justify-content:space-between;gap:12px;border-top:1px solid #e2e8f0;margin-top:17px;padding-top:8px;color:#8492a6;font-size:7px}.report-footer a{color:#64748b;text-decoration:none}'+
      '@media(max-width:600px){.report{padding:20px}.report-header .brand{font-size:19px}.report-title h1{font-size:16px}.summary-card strong{font-size:15px}}'+
      '</style>';
    const reportHtml='<div class="report">'+reportCss+
      '<div class="report-header"><div><div class="brand">FABRiCS <span>CONSUMPTiON</span></div><div class="subtitle">GARMENT CALCULATOR SUITE</div></div><div class="report-title"><div class="eyebrow">CALCULATION REPORT</div><h1>'+esc(heading)+'</h1><div class="report-id">'+reportId+'</div></div></div>'+
      '<section class="section order-information-section"><div class="section-head">'+icon('info')+'<span>ORDER INFORMATION</span></div><div class="info-grid">'+
      '<div><span>Buyer Name</span><strong>'+(esc(val('tr-buyer'))||'________________')+'</strong></div><div><span>Style No.</span><strong>'+(esc(val('tr-style'))||'________________')+'</strong></div><div><span>PO / Order No.</span><strong>'+(esc(val('tr-po'))||'________________')+'</strong></div></div></section>'+
      '<div class="order-quantity-strip"><div class="quantity-main"><span>ORDER QUANTITY</span><strong>'+qty().toLocaleString('en-US')+' pcs</strong></div><div class="quantity-meta"><span>DATE</span><strong>'+dateText+'</strong></div><div class="quantity-meta"><span>CATEGORY</span><strong>TRIMS / '+esc(title.replace(' Consumption Report','').toUpperCase())+'</strong></div></div>'+
      '<section class="section"><div class="section-head">'+icon('components')+'<span>'+esc(sectionLabel)+'</span></div><table class="consumption-table"><thead><tr><th style="width:6%">SL</th><th style="width:34%">Parameter</th><th style="width:60%">Input / Result</th></tr></thead><tbody>'+safeRows+'</tbody></table></section>'+
      '<div class="summary-grid"><div class="summary-card"><div class="metric-head">'+icon('components')+'<span>PER PIECE</span></div><strong>'+esc(result.pc)+'</strong><small>Consumption for one garment</small></div><div class="summary-card"><div class="metric-head">'+icon('components')+'<span>PER DOZEN</span></div><strong>'+esc(result.dz)+'</strong><small>Consumption for 12 garments</small></div><div class="summary-card primary"><div class="metric-head">'+icon('summary')+'<span>FULL ORDER TOTAL</span></div><strong>'+esc(result.order)+'</strong><small>For '+qty().toLocaleString('en-US')+' garments</small></div></div>'+
      '<section class="section"><div class="section-head">'+icon('formula')+'<span>CALCULATION METHOD</span></div><div class="formula-content"><strong>'+esc(sectionLabel)+'</strong>'+formulaList+'</div></section>'+
      '<section class="comments-section"><div class="comments-title">COMMENTS:</div><div class="comments-writing-area"></div></section>'+
      '<div class="note">'+icon('warning')+'<div><strong>IMPORTANT:</strong> '+esc(statusNote||'Consumption estimate only. Verify trims specifications, approved sample, order quantity and production requirements before bulk purchasing.')+'</div></div>'+
      '<div class="approval-grid"><div><span>PREPARED BY</span><strong></strong></div><div><span>CHECKED BY</span><strong></strong></div><div><span>APPROVED BY</span><strong></strong></div></div>'+
      '<div class="report-footer"><span>Fabrics Consumption - Garment Calculator Suite</span><span>'+dateText+' · <a href="https://fabricconsumption.vercel.app/" target="_blank" rel="noopener noreferrer">fabricconsumption.vercel.app</a></span></div></div>';
    if(typeof generatePDF==='function')generatePDF(filename,reportHtml);else window.print();
  }
  function pdfThread(){
    const r=thread();
    if(!r.valid){alert('Please complete every Thread part row (seam length, stitch class, SPI and thread ratio) and enter order quantity and wastage before downloading.');return;}
    const rows=r.parts.map((p,i)=>['Part '+(i+1)+' · '+p.name,'Seam: '+p.length+' m | Stitch: '+(THREAD_STANDARDS[p.stitch]?.name||'Custom')+' | SPI: '+p.spi+' | Ratio: '+p.ratio+' m/m | Stitch count: '+Math.round(p.stitchCount).toLocaleString('en-US')+' | Thread: '+fmt(p.thread,3)+' m']);
    rows.push(['Total stitch count',Math.round(r.stitchCount).toLocaleString('en-US')+' stitches'],['Thread wastage',r.waste+'%'],['Net thread per piece',fmt(r.netPc,3)+' m']);
    report('Thread Consumption Report','Thread Consumption Report',rows,{pc:fmt(r.pc,2)+' m',dz:fmt(r.dz,2)+' m',order:fmt(r.order,2)+' m'},['Stitch count per part = Seam length (m) × 39.3701 × SPI (stitches/inch)','Net thread per piece (m) = Σ [Part seam length (m) × Thread ratio (m thread / m seam)]','Final thread per piece = Net thread × (1 + Wastage % ÷ 100)','Per dozen = Final per piece × 12','Full order = Final per piece × Order quantity'],'THREAD PART-WISE CONSUMPTION DETAILS','Coats reference ratios are based on 18 SPI and are estimates. For a different SPI or production fabric, enter a measured ratio from an actual seam sample; do not assume the 18-SPI ratio is exact.');
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
      ['Length',r.length+' cm'],['Width',r.width+' cm'],['Quantity per Piece',r.pieces],['Wastage',r.waste+'%'],['Net Area per Piece',fmt(r.netPc,4)+' m²']
    ],{pc:fmt(r.pc,4)+' m²',dz:fmt(r.dz,3)+' m²',order:fmt(r.order,3)+' m²'},'Net area = Length × Width × Quantity per Piece ÷ 10,000. Final area = Net area × (1 + Wastage % ÷ 100). Per dozen = final area × 12. Full order = final area × order quantity.','INTERLINING CONSUMPTION DETAILS');
  }
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('#page-trims [data-tr-mode]').forEach(btn => btn.addEventListener('click', () => selectCalculator(btn.dataset.trMode)));
    selectCalculator('thread');
    addThreadPartRow();
    $('th-add-part')?.addEventListener('click',()=>addThreadPartRow());
    $('th-parts-body')?.addEventListener('input',e=>{if(e.target.matches('.th-part-length,.th-part-spi,.th-part-ratio,.th-part-name'))calculateAll();});
    $('th-parts-body')?.addEventListener('change',e=>{if(e.target.matches('.th-part-stitch')){syncThreadPartRatio(e.target);calculateAll();}});
    $('th-parts-body')?.addEventListener('click',e=>{const btn=e.target.closest('.th-remove-part');if(btn){const rows=$('th-parts-body').querySelectorAll('tr');if(rows.length>1)btn.closest('tr').remove();else{btn.closest('tr').querySelectorAll('input').forEach(input=>input.value='');btn.closest('tr').querySelector('select').value='';}calculateAll();}});
    ['th-waste','bt-pp','bt-ex','il-len','il-wid','il-qty','il-waste','tr-order-qty'].forEach(id=>$(id)?.addEventListener('input',()=>calculateAll()));
    ['tr-buyer','tr-style','tr-po','tr-order-qty'].forEach(id=>$(id)?.addEventListener('change',()=>calculateAll()));
    $('btn-calc-thread')?.addEventListener('click',()=>{calculateAll();});
    $('btn-calc-button')?.addEventListener('click',()=>{calculateAll();});
    $('btn-calc-interlining')?.addEventListener('click',()=>{calculateAll();});
    $('btn-pdf-thread')?.addEventListener('click',pdfThread);
    $('btn-pdf-button')?.addEventListener('click',pdfButton);
    $('btn-pdf-interlining')?.addEventListener('click',pdfInterlining);
    calculateAll(false);
  });
})();
