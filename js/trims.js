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
  const THREAD_RATIO_REFERENCE={'301':{name:'301 Lockstitch',ratio:2.5},'101':{name:'101 Chainstitch',ratio:4},'401':{name:'401 Two-thread Chainstitch',ratio:5.5},'304':{name:'304 Zigzag Lockstitch',ratio:7},'503':{name:'503 Two-thread Overedge',ratio:12},'504':{name:'504 Three-thread Overedge',ratio:14},'512':{name:'512 Four-thread Mock Safety',ratio:18},'516':{name:'516 Five-thread Safety',ratio:20},'406':{name:'406 Three-thread Coverstitch',ratio:18},'602':{name:'602 Four-thread Coverstitch',ratio:25},'605':{name:'605 Five-thread Coverstitch',ratio:28}};
  let threadMethod='standard',threadRowSequence=0;
  const threadOptions='<option value="">Select stitch</option>'+Object.entries(THREAD_RATIO_REFERENCE).map(([code,item])=>'<option value="'+code+'">'+item.name+'</option>').join('')+'<option value="custom">Custom stitch</option>';
  function addThreadOperation(data={}){
    const body=$('th-operations-body');if(!body)return;
    const row=document.createElement('tr');row.dataset.rowId=String(++threadRowSequence);
    row.innerHTML='<td><input class="inp-plain th-op-name" placeholder="e.g. Side seam"></td><td><select class="inp-plain th-op-stitch">'+threadOptions+'</select></td><td><input class="inp-plain th-op-ratio" type="number" min="0" step="any" placeholder="Ratio"></td><td><input class="inp-plain th-op-length" type="number" min="0" step="any" placeholder="0.65"></td><td><input class="inp-plain th-op-rows" type="number" min="1" step="1" value="1"></td><td class="th-actual-col"><input class="inp-plain th-op-sample" type="number" min="0" step="any" placeholder="0.10"></td><td class="th-actual-col"><input class="inp-plain th-op-measured" type="number" min="0" step="any" placeholder="0.52"></td><td class="th-advanced-col"><input class="inp-plain th-op-spi" type="number" min="1" step="any" placeholder="18"></td><td class="th-advanced-col"><input class="inp-plain th-op-thickness" type="number" min="0" step="any" placeholder="Optional"></td><td class="th-op-result">—</td><td><button type="button" class="th-remove-operation">×</button></td>';
    body.appendChild(row);row.querySelector('.th-op-stitch').value=data.stitch||'';row.querySelector('.th-op-length').value=data.length||'';row.querySelector('.th-op-rows').value=data.rows||1;row.querySelector('.th-op-ratio').value=data.ratio||'';
    if(data.spi)row.querySelector('.th-op-spi').value=data.spi;if(data.thickness)row.querySelector('.th-op-thickness').value=data.thickness;
    if(data.stitch&&THREAD_RATIO_REFERENCE[data.stitch]&&!data.ratio)row.querySelector('.th-op-ratio').value=THREAD_RATIO_REFERENCE[data.stitch].ratio;
    return row;
  }
  function setThreadMethod(method){
    threadMethod=['standard','actual','advanced','custom'].includes(method)?(method==='custom'?'standard':method):'standard';
    document.querySelectorAll('[data-thread-method]').forEach(btn=>btn.classList.toggle('is-active',btn.dataset.threadMethod===threadMethod));
    document.querySelectorAll('.th-advanced-col').forEach(el=>el.classList.toggle('is-visible',threadMethod==='advanced'));
    document.querySelectorAll('.th-actual-col').forEach(el=>el.classList.toggle('is-visible',threadMethod==='actual'));
    const notes={standard:'Choose a stitch class to load its reference ratio. You can edit that ratio to match your validated factory value.',actual:'Enter sample seam length and measured total thread length. The calculator derives the ratio automatically.',advanced:'SPI and seam thickness are reference inputs only. Enter a validated stitch-specific ratio; no universal engineering formula is assumed.'};
    const note=$('th-method-note');if(note){note.textContent=notes[threadMethod];note.dataset.noteType=threadMethod==='actual'?'success':threadMethod==='advanced'?'warning':'info';}
    calculateAll();
  }
  function threadRows(){
    return Array.from(document.querySelectorAll('#th-operations-body tr')).map(row=>{
      const name=row.querySelector('.th-op-name').value.trim(),stitch=row.querySelector('.th-op-stitch').value,lengthText=row.querySelector('.th-op-length').value.trim(),ratioText=row.querySelector('.th-op-ratio').value.trim();
      if(!name&&!stitch&&!lengthText&&!ratioText)return null;
      const sample=Number(row.querySelector('.th-op-sample').value)||0,measured=Number(row.querySelector('.th-op-measured').value)||0;
      const actualRatio=sample>0&&measured>0?measured/sample:0;
      return {row,name:name||'Unnamed operation',stitch,length:Number(lengthText)||0,rows:Number(row.querySelector('.th-op-rows').value)||0,ratio:threadMethod==='actual'?actualRatio:(Number(ratioText)||0),spi:Number(row.querySelector('.th-op-spi').value)||0,thickness:Number(row.querySelector('.th-op-thickness').value)||0,sample,measured};
    }).filter(Boolean);
  }
  function thread(){
    const operations=threadRows(),waste=num('th-waste'),orderQty=qty(),useComponents=$('th-use-components')?.checked||false;
    const components=Array.from(document.querySelectorAll('.th-component')).map(el=>({name:el.dataset.component,ratio:Number(el.value)||0,provided:el.value.trim()!==''}));
    const componentMode=useComponents&&components.some(c=>c.provided);
    const valid=operations.length>0&&operations.every(o=>o.length>0&&o.rows>0&&(componentMode||o.ratio>0)&&o.stitch&&(threadMethod!=='actual'||(o.sample>0&&o.measured>0)))&&orderQty>0&&val('th-waste').trim()!==''&&waste>=0&&(!componentMode||components.some(c=>c.provided));
    if(!valid){operations.forEach(o=>o.row.querySelector('.th-op-result').textContent='—');['th-pc','th-dz','th-order','tr-summary-thread'].forEach(id=>put(id,'—'));put('th-breakdown','');return {operations,waste,pc:0,dz:0,order:0,valid:false};}
    let netPc=0;const componentTotals={};
    operations.forEach(o=>{const base=o.length*o.rows;o.net=componentMode?components.reduce((sum,c)=>sum+(c.provided?base*c.ratio:0),0):base*o.ratio;netPc+=o.net;o.row.querySelector('.th-op-result').textContent=fmt(o.net,3)+' m';});
    if(componentMode)components.forEach(c=>{if(c.provided)componentTotals[c.name]=operations.reduce((sum,o)=>sum+o.length*o.rows*c.ratio,0);});
    const pc=netPc*(1+waste/100),dz=pc*12,order=pc*orderQty,unit=$('th-output-unit')?.value||'m',factor=unit==='yd'?1.093613298:1;
    const display=v=>fmt(v*factor,2)+' '+unit;
    put('th-pc',display(pc));put('th-dz',display(dz));put('th-order',display(order));put('tr-summary-thread',fmt(order*factor,2));
    const coneLength=num('th-cone-length'),conePrice=num('th-cone-price'),cones=coneLength>0?Math.ceil(order/coneLength):null,cost=coneLength>0&&val('th-cone-price').trim()!==''?(order/coneLength)*conePrice:null;
    const breakdown=$('th-breakdown');
    if(breakdown){const parts=Object.entries(componentTotals).map(([name,value])=>'<div><span>'+name+'</span><strong>'+display(value*(1+waste/100))+'</strong></div>').join('');
      breakdown.innerHTML='<div class="thread-summary-line"><span>Net per piece</span><strong>'+display(netPc)+'</strong></div><div class="thread-summary-line"><span>Wastage</span><strong>'+fmt(waste,1)+'%</strong></div>'+
      (parts?'<div class="thread-component-results">'+parts+'</div>':'<p class="trims-field-note">Component split not supplied. Total consumption is shown without guessing Needle / Bobbin / Looper shares.</p>')+
      (cones!==null?'<div class="thread-summary-line"><span>Estimated cones</span><strong>'+cones.toLocaleString('en-US')+'</strong></div>':'')+(cost!==null?'<div class="thread-summary-line"><span>Estimated thread cost</span><strong>'+fmt(cost,2)+' '+(val('th-currency')||'BDT')+'</strong></div>':'');}
    return {operations,waste,netPc,pc,dz,order,components,componentTotals,componentMode,cones,cost,valid:true,unit,factor};
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
      label.querySelector('.tr-order-required-hint')?.remove();
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
    const r=thread();if(!r.valid){alert('Complete each operation with name, stitch class, seam length, rows, ratio, wastage and order quantity.');return;}
    const rows=r.operations.map((o,i)=>['Operation '+(i+1)+' — '+o.name,'Stitch: '+(THREAD_RATIO_REFERENCE[o.stitch]?.name||'Custom')+' | Seam: '+o.length+' m × '+o.rows+' row(s) | Ratio: '+o.ratio+' | Net thread: '+fmt(o.net,3)+' m']);
    rows.push(['Thread wastage',r.waste+'%'],['Net thread per piece',fmt(r.netPc,3)+' m'],['Calculation method',threadMethod.toUpperCase()]);
    if(r.cones!==null)rows.push(['Estimated cones',r.cones]);if(r.cost!==null)rows.push(['Estimated thread cost',fmt(r.cost,2)+' '+(val('th-currency')||'BDT')]);
    report('Thread Consumption Report','Thread Consumption Report',rows,{pc:fmt(r.pc*r.factor,2)+' '+r.unit,dz:fmt(r.dz*r.factor,2)+' '+r.unit,order:fmt(r.order*r.factor,2)+' '+r.unit},
    ['Operation net thread = Seam length (m) × Rows × Thread ratio (m thread / m seam)','Net per piece = Sum of all operation thread','Final per piece = Net per piece × (1 + Wastage % ÷ 100)','Per dozen = Final per piece × 12','Full order = Final per piece × Order quantity'],'SEWING OPERATION THREAD CONSUMPTION','Estimate only. Validate standard ratios with an actual production sample.');
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
    addThreadOperation();
    document.querySelectorAll('[data-thread-method]').forEach(btn=>btn.addEventListener('click',()=>setThreadMethod(btn.dataset.threadMethod)));
    $('th-add-operation')?.addEventListener('click',()=>addThreadOperation());
    $('th-operations-body')?.addEventListener('input',()=>calculateAll());
    $('th-operations-body')?.addEventListener('change',e=>{if(e.target.matches('.th-op-stitch')){const ratio=e.target.closest('tr')?.querySelector('.th-op-ratio');if(ratio&&THREAD_RATIO_REFERENCE[e.target.value])ratio.value=THREAD_RATIO_REFERENCE[e.target.value].ratio;calculateAll();}});
    $('th-operations-body')?.addEventListener('click',e=>{const btn=e.target.closest('.th-remove-operation');if(btn){const rows=$('th-operations-body').querySelectorAll('tr');if(rows.length>1)btn.closest('tr').remove();else{btn.closest('tr').querySelectorAll('input').forEach(i=>i.value='');btn.closest('tr').querySelector('select').value='';}calculateAll();}});
    document.querySelectorAll('.th-component,#th-use-components,#th-cone-length,#th-cone-price,#th-currency,#th-waste,#th-output-unit').forEach(el=>{el.addEventListener('input',()=>calculateAll());el.addEventListener('change',()=>calculateAll());});
    ['bt-pp','bt-ex','il-len','il-wid','il-qty','il-waste','tr-order-qty'].forEach(id=>$(id)?.addEventListener('input',()=>calculateAll()));
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
