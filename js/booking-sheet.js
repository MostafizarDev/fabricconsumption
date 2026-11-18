// FABRIC BOOKING SHEET — Factory workbook based implementation
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const num = (row, key) => {
    const el = row.querySelector('[data-field="' + key + '"]');
    const value = el ? Number(el.value) : 0;
    return Number.isFinite(value) ? value : 0;
  };
  const text = (row, key) => {
    const el = row.querySelector('[data-field="' + key + '"]');
    return el ? String(el.value || '').trim() : '';
  };
  const safe = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const rows = () => Array.from(document.querySelectorAll('#bk-fabric-rows tr'));
  const sizeRows = () => Array.from(document.querySelectorAll('#bk-size-headers .bk-size-item'));
  const ratioTotal = () => sizeRows().reduce((sum,row) => sum + Math.max(0, Number(row.querySelector('[data-ratio]')?.value) || 0), 0);
  // Keep TOTAL PCS as the permanent final column after any size add/remove/preset change.
  function keepTotalLast() {
    const header=$('bk-size-headers'), ratio=$('bk-ratio-row');
    const totalHead=header?.querySelector('.bk-total-head');
    const totalCell=ratio?.querySelector('.bk-total-cell');
    if(totalHead) header.appendChild(totalHead);
    if(totalCell) ratio.appendChild(totalCell);
    header?.querySelectorAll('.bk-size-item').forEach((el,i)=>el.dataset.sizeIndex=i);
    ratio?.querySelectorAll('td[data-ratio]').forEach((el,i)=>el.dataset.ratioIndex=i);
  }
  function sizeBreakdown() {
    const headers=sizeRows();
    const rowsData=headers.map((header,i)=>({header,size:(header.querySelector('[data-size-label]')?.value||'').trim(),ratio:Math.max(0,Number(document.querySelector('[data-ratio-index="'+i+'"] [data-ratio]')?.value)||0)}));
    const totalRatio=rowsData.reduce((sum,x)=>sum+x.ratio,0);
    const orderQty=Math.max(0,Number($('bk-order-qty')?.value)||0);
    rowsData.forEach(x=>{const btn=x.header.querySelector('.bk-size-remove');if(btn)btn.disabled=rowsData.length===1;});
    if($('bk-size-ratio-sum')) $('bk-size-ratio-sum').textContent=totalRatio;
    return {sizes:rowsData.map(({size,ratio})=>({size,ratio})),totalRatio,orderQty};
  }
  const readRow = row => {
    const ml=num(row,'ml'), cla=num(row,'cla'), mw=num(row,'mw'), cwa=num(row,'cwa'), gsm=num(row,'gsm'), pcs=num(row,'pcs'), cut=num(row,'cut');
    const netMarker = ((ml+cla)*(mw+cwa)*gsm)/1550000;
    const netDozen = pcs > 0 ? netMarker*12/pcs : 0;
    const finalDozen = netDozen*(1+cut/100);
    return {parts:text(row,'parts'),fabric:text(row,'fabric'),ml,cla,mw,cwa,gsm,netMarker,pcs,netDozen,cut,finalDozen,dia:num(row,'dia'),diaType:text(row,'diaType')};
  };
  function calculate() {
    const sizing=sizeBreakdown();
    // The total size ratio is the marker's PCS count; keep every fabric row in sync.
    rows().forEach(row=>{
      const pcsInput=row.querySelector('[data-field="pcs"]');
      if(pcsInput){
        const next=String(sizing.totalRatio);
        if(pcsInput.value!==next) pcsInput.value=next;
      }
    });
    const data=rows().map(row=>({row,calc:readRow(row)}));
    let grand=0;
    data.forEach(({row,calc})=>{
      grand+=calc.finalDozen;
      row.querySelector('.bk-net-marker').textContent=calc.netMarker.toFixed(4);
      row.querySelector('.bk-net-dozen').textContent=calc.netDozen.toFixed(4);
      row.querySelector('.bk-final').textContent=calc.finalDozen.toFixed(4);
    });
    sizing.label=($('bk-ratio-label')?.value||'RATIO (BODY+RIB)').trim();
    const totalQty=sizing.orderQty;
    const requirement=grand*totalQty/12;
    $('bk-grand-dozen').textContent=grand.toFixed(4)+' kg/dz';
    $('bk-total-order').textContent=totalQty>0?requirement.toFixed(2)+' kg':'— kg';
    $('bk-summary').innerHTML=data.map(({calc},i)=>'<article class="booking-result-card"><span>'+safe(calc.parts||('Fabric '+(i+1)))+' · '+safe(calc.fabric)+'</span><strong>'+calc.finalDozen.toFixed(4)+' kg/dz</strong><small>Net marker: '+calc.netMarker.toFixed(4)+' kg · Net/dozen: '+calc.netDozen.toFixed(4)+' kg</small></article>').join('');
    return {data:data.map(x=>x.calc),grand,totalQty,requirement,sizing};
  }
  function addRow() {
    const n=rows().length+1;
    const tr=document.createElement('tr');
    tr.innerHTML='<td><input data-field="parts" value="PART '+n+'"></td><td><input data-field="fabric" value="COTTON"></td>'+
      '<td><input data-field="ml" type="number" step="0.01" value="0"></td><td><input data-field="cla" type="number" step="0.01" value="0"></td>'+
      '<td><input data-field="mw" type="number" step="0.01" value="0"></td><td><input data-field="cwa" type="number" step="0.01" value="0"></td>'+
      '<td><input data-field="gsm" type="number" step="0.01" value="0"></td><td class="bk-net-marker">—</td>'+
      '<td><input data-field="pcs" type="number" step="1" value="1"></td><td class="bk-net-dozen">—</td>'+
      '<td><input data-field="cut" type="number" step="0.01" value="0"></td><td class="bk-final">—</td>'+
      '<td><input data-field="dia" type="number" step="0.01" value="0"></td><td><select data-field="diaType"><option>OPEN</option><option>TUBULAR</option></select></td><td><button type="button" class="bk-remove-row">×</button></td>';
    $('bk-fabric-rows').appendChild(tr); calculate();
  }
  function nextPresetSize(key, existing) {
    const normalized=existing.map(x=>String(x||'').trim().toUpperCase().replace(/\\s+/g,''));
    const sequences={
      adult:['XS','S','M','L','XL','2XL','3XL','4XL','5XL','6XL','7XL','8XL','9XL','10XL'],
      kids:['2T','3T','4T','5T','6T','7T','8T','9T','10T','11T','12T'],
      age:['2/3','3/4','4/5','5/6','6/7','7/8','8/9','9/10','10/11','11/12'],
      numeric:['28','30','32','34','36','38','40','42','44','46','48','50']
    };
    const sequence=sequences[key]||sequences.adult;
    return sequence.find(size=>!normalized.includes(size))||'NEW '+(existing.length+1);
  }
  function addSize() {
    const headers=sizeRows(), existing=headers.map(h=>h.querySelector('[data-size-label]')?.value.trim());
    const preset=$('bk-size-preset').value;
    const next=nextPresetSize(preset,existing);
    const th=document.createElement('th'),td=document.createElement('td');
    th.className='bk-size-item';
    th.innerHTML='<div class="bk-size-head-cell"><input data-size-label value="'+safe(next)+'" aria-label="Size label"><button type="button" class="bk-size-remove" aria-label="Remove size">×</button></div>';
    td.dataset.ratioIndex=headers.length;
    td.innerHTML='<input data-ratio type="number" min="0" step="1" value="1" aria-label="Ratio for '+safe(next)+'">';
    const headerRow=$('bk-size-headers'),ratioRow=$('bk-ratio-row');
    headerRow.insertBefore(th,headerRow.lastElementChild);
    ratioRow.insertBefore(td,ratioRow.lastElementChild);
    headerRow.querySelectorAll('.bk-size-item').forEach((el,i)=>el.dataset.sizeIndex=i);
    ratioRow.querySelectorAll('td[data-ratio]').forEach((el,i)=>el.dataset.ratioIndex=i);
    calculate();
  }
  function loadSizePreset(key) {
    const presets = {
      adult: {names:['XS','S','M','L','XL','2XL','3XL','4XL','5XL'], ratios:[1,2,3,3,2,1,1,1,1]},
      kids: {names:['2T','3T','4T','5T','6T','7T'], ratios:[1,2,3,3,2,1]},
      age: {names:['2/3','3/4','4/5','5/6','6/7','7/8'], ratios:[1,1,1,1,1,1]},
      numeric: {names:['28','30','32','34','36','38','40'], ratios:[1,1,1,1,1,1,1]},
      custom: {names:[], ratios:[]}
    };
    const preset=presets[key] || presets.custom;
    if(!preset)return;
    const headerRow=$('bk-size-headers'),ratioRow=$('bk-ratio-row');
    headerRow.querySelectorAll('.bk-size-item').forEach(el=>el.remove());
    ratioRow.querySelectorAll('td[data-ratio-index]').forEach(el=>el.remove());
    preset.names.forEach((name,i)=>{
      const th=document.createElement('th'),td=document.createElement('td');
      th.className='bk-size-item';
      th.innerHTML='<div class="bk-size-head-cell"><input data-size-label value="'+safe(name)+'" aria-label="Size label '+safe(name)+'"><button type="button" class="bk-size-remove" aria-label="Remove '+safe(name)+'">×</button></div>';
      td.dataset.ratioIndex=i;
      td.innerHTML='<input data-ratio type="number" min="0" step="1" value="'+preset.ratios[i]+'" aria-label="Ratio for '+safe(name)+'">';
      headerRow.insertBefore(th,headerRow.lastElementChild);
      ratioRow.insertBefore(td,ratioRow.lastElementChild);
    });
    headerRow.querySelectorAll('.bk-size-item').forEach((el,i)=>el.dataset.sizeIndex=i);
    ratioRow.querySelectorAll('td[data-ratio]').forEach((el,i)=>el.dataset.ratioIndex=i);
    calculate();
  }
  function orderInfo() {
    return [
      ['Calculation Date',new Date().toLocaleDateString('en-GB')],['Buyer',$('bk-buyer').value],['Style / Order No.',$('bk-style').value],['Job / PO No.',$('bk-po').value],
      ['Description',$('bk-description').value],['Body Fabric',$('bk-body-fabric').value],['Order Quantity',$('bk-order-qty').value],['Cutting Quantity',$('bk-cut-qty').value],['Shipment Date',$('bk-shipment').value]
    ];
  }
  function downloadPDF() {
    const result=calculate(), info=orderInfo(), data=result.data;
    const infoHtml=info.filter(x=>x[1]).map(x=>'<div><span>'+safe(x[0])+'</span><strong>'+safe(x[1])+'</strong></div>').join('');
    const body=data.map(x=>'<tr><td>'+safe(x.parts)+'</td><td>'+safe(x.fabric)+'</td><td>'+x.ml+'</td><td>'+x.cla+'</td><td>'+x.mw+'</td><td>'+x.cwa+'</td><td>'+x.gsm+'</td><td>'+x.netMarker.toFixed(4)+'</td><td>'+x.pcs+'</td><td>'+x.netDozen.toFixed(4)+'</td><td>'+x.cut+'%</td><td><strong>'+x.finalDozen.toFixed(4)+'</strong></td><td>'+x.dia+'</td><td>'+safe(x.diaType)+'</td></tr>').join('');
    const sizeCells=result.sizing.sizes.map(x=>'<th>'+safe(x.size)+'</th>').join(''); const ratioCells=result.sizing.sizes.map(x=>'<td>'+x.ratio+'</td>').join('');
    const report='<div class="report booking-pdf-report"><div class="report-header"><div><div class="brand">FABRIC <span>CONSUMPTION</span></div><div class="subtitle">GARMENT CALCULATOR SUITE</div></div><div class="report-title"><div class="eyebrow">FACTORY BOOKING REPORT</div><h1>Style Wise Fabrics Consumption</h1><div class="report-id">BOOKING · '+new Date().toLocaleDateString('en-GB')+'</div></div></div>'+
      '<section class="section"><div class="section-head">ORDER INFORMATION</div><div class="info-grid">'+infoHtml+'</div></section>'+
      '<section class="section"><div class="section-head">FABRIC &amp; MARKER DETAILS</div><table><thead><tr><th>Parts</th><th>Fabric</th><th>ML</th><th>Cut L</th><th>MW</th><th>Cut W</th><th>GSM</th><th>Net/Marker</th><th>PCS</th><th>Net/Doz</th><th>Cut%</th><th>Final/Doz</th><th>DIA</th><th>Type</th></tr></thead><tbody>'+body+'</tbody></table></section>'+
      '<section class="section"><div class="section-head">SIZE RATIO</div><table><thead><tr><th>SIZE</th>'+sizeCells+'<th>PCS</th></tr></thead><tbody><tr><th>RATIO (BODY+RIB)</th>'+ratioCells+'<td><strong>'+result.sizing.totalRatio+'</strong></td></tr></tbody></table></section>'+
      '<div class="summary-grid"><div class="summary-card primary"><div class="metric-head"><span>TOTAL FINAL CONSUMPTION / DOZEN</span></div><strong>'+result.grand.toFixed(4)+' KG</strong></div><div class="summary-card"><div class="metric-head"><span>TOTAL FABRIC REQUIREMENT</span></div><strong>'+(result.totalQty?result.requirement.toFixed(2)+' KG':'—')+'</strong><small>Based on '+result.totalQty+' pcs</small></div></div>'+
      '<section class="section formula"><div class="section-head">CALCULATION FORMULA</div><div class="formula-text"><strong>Net KG / Marker</strong> = (ML + Cut L) × (MW + Cut W) × GSM ÷ 1,550,000<br><strong>Net KG / Dozen</strong> = Net KG / Marker × 12 ÷ PCS / Marker<br><strong>Final KG / Dozen</strong> = Net KG / Dozen × (1 + Cutting % ÷ 100)<br><strong>Total Order Requirement</strong> = Total KG / Dozen × Order Quantity ÷ 12</div></section>'+
      '<div class="report-footer"><span>Fabric Consumption · Factory Booking Sheet</span><span>Generated '+new Date().toLocaleString()+'</span></div></div>';
    if(typeof generatePDF==='function') generatePDF('Fabric Booking Sheet',report);
    else alert('PDF helper is not available. Please refresh and try again.');
  }
  async function loadExcelJS() {
    if(window.ExcelJS) return;
    await new Promise((resolve,reject)=>{
      const script=document.createElement('script'); script.src='https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js';
      script.onload=resolve; script.onerror=()=>reject(new Error('Excel export library could not be loaded')); document.head.appendChild(script);
    });
  }
  async function downloadExcel() {
    try {
      await loadExcelJS();
      const result=calculate(), data=result.data, sizes=result.sizing.sizes, wb=new ExcelJS.Workbook();
      wb.creator='Fabric Consumption'; wb.title='Style Wise Fabrics Consumption';
      const ws=wb.addWorksheet('BOOKING SHEET');
      const navy='17365D',blue='D9EAF7',pale='EAF2F8',green='E2F0D9',white='FFFFFF',ink='1F2937',grey='64748B';
      const edge={style:'thin',color:{argb:'FF9EADBA'}}, border={top:edge,bottom:edge,left:edge,right:edge};
      const fill=c=>({type:'pattern',pattern:'solid',fgColor:{argb:c}});
      const put=(cell,value,opts={})=>{cell.value=value;cell.border=border;cell.alignment={vertical:'middle',horizontal:'center',wrapText:true,...opts.alignment};if(opts.font)cell.font=opts.font;if(opts.fill)cell.fill=opts.fill;};
      [14,18,17,14,17,14,17,10,15,12,15,16,15,16,13].forEach((w,i)=>ws.getColumn(i+1).width=w);
      ws.mergeCells('A2:O2'); put(ws.getCell('A2'),'STYLE WISE FABRICS CONSUMPTION',{font:{name:'Arial',size:16,bold:true,color:{argb:white}},fill:fill(navy)});
      ws.getRow(2).height=30;ws.mergeCells('A3:O3');ws.getRow(3).height=7;
      [['DATE :',new Date().toLocaleDateString('en-GB')],['BUYER :',$('bk-buyer').value],['STYLE/ORD :',$('bk-style').value],['DESCRIPTION:',$('bk-description').value],['BODY FABRIC:',$('bk-body-fabric').value]].forEach((x,i)=>{
        const rr=4+i;put(ws.getCell(rr,1),x[0],{alignment:{horizontal:'left'},font:{name:'Arial',size:10,bold:true,color:{argb:navy}}});
        ws.mergeCells(rr,4,rr,15);put(ws.getCell(rr,4),x[1]||'',{alignment:{horizontal:'left'},font:{name:'Arial',size:10,color:{argb:ink}}});ws.getRow(rr).height=20;
      });
      const heads=['GARMENT SIZE','PARTS','FABRIC TYPE','MARKER LENGTH','CUTTING ALLOWANCE LENGTH','MARKER WIDTH','CUTTING ALLOWANCE WIDTH','GSM','NET CON,MARKER','PCS MARKER','NET,CON,DOZ','FABRIC+ CUTTING%','NET,CON,DOZ','REQ,FINISHED DIA','DIA TYPE'];
      const units=['','','','INCH','INCH','INCH','INCH','','KG','NO','KG','','KG','INCH',''];
      heads.forEach((v,i)=>put(ws.getCell(9,i+1),v,{font:{name:'Arial',size:9,bold:true,color:{argb:white}},fill:fill(navy)}));
      units.forEach((v,i)=>put(ws.getCell(10,i+1),v,{font:{name:'Arial',size:9,bold:true,color:{argb:grey}},fill:fill(pale)}));
      ws.getRow(9).height=48;ws.getRow(10).height=19;
      data.forEach((x,i)=>{
        const rr=11+i, vals=[i===0?'ALL':'',x.parts,x.fabric,x.ml,x.cla,x.mw,x.cwa,x.gsm,
          {formula:`(D${rr}+E${rr})*(F${rr}+G${rr})*H${rr}/1550000`,result:x.netMarker},x.pcs,
          {formula:`IF(J${rr}>0,I${rr}*12/J${rr},0)`,result:x.netDozen},x.cut/100,
          {formula:`K${rr}*(1+L${rr})`,result:x.finalDozen},x.dia,x.diaType];
        vals.forEach((v,j)=>put(ws.getCell(rr,j+1),v,{font:{name:'Arial',size:9,color:{argb:ink}}}));
        [9,11,13].forEach(c=>ws.getCell(rr,c).fill=fill(green));ws.getCell(rr,12).numFmt='0.0%';ws.getRow(rr).height=20;
      });
      const totalRow=Math.max(22,11+data.length);ws.mergeCells(totalRow,1,totalRow,11);
      put(ws.getCell(totalRow,1),'TOTAL FABRIC CONSUMPTION / DOZEN',{alignment:{horizontal:'right'},font:{bold:true,color:{argb:navy}},fill:fill(blue)});
      put(ws.getCell(totalRow,12),'TOTAL =',{font:{bold:true,color:{argb:navy}},fill:fill(blue)});
      put(ws.getCell(totalRow,13),{formula:data.length?data.map((_,i)=>'M'+(11+i)).join('+'):'0',result:result.grand},{font:{bold:true,color:{argb:navy}},fill:fill(blue)});
      put(ws.getCell(totalRow,14),'KG / DOZEN',{font:{bold:true,color:{argb:navy}},fill:fill(blue)});put(ws.getCell(totalRow,15),'',{fill:fill(blue)});
      const sr=totalRow+2,rr=sr+1;
       ws.mergeCells(sr,1,sr,5);ws.mergeCells(rr,1,rr,5);
       put(ws.getCell(sr,1),'SIZE',{font:{bold:true,color:{argb:white}},fill:fill(navy)});
       put(ws.getCell(rr,1),result.sizing.label,{font:{bold:true,color:{argb:navy}},fill:fill(blue)});
       sizes.forEach((x,i)=>{const c=6+i;if(c>15)ws.getColumn(c).width=12;put(ws.getCell(sr,c),x.size,{font:{bold:true,color:{argb:white}},fill:fill(navy)});put(ws.getCell(rr,c),x.ratio,{font:{bold:true,color:{argb:ink}},fill:fill(pale)});});
       const totalCol=6+sizes.length,dt=rr+2;
       put(ws.getCell(sr,totalCol),'TOTAL',{font:{bold:true,color:{argb:white}},fill:fill(navy)});
       put(ws.getCell(rr,totalCol),sizes.reduce((sum,x)=>sum+x.ratio,0)+' PCS',{font:{bold:true,color:{argb:navy}},fill:fill(blue)});
       ws.mergeCells(dt,1,dt,Math.max(15,totalCol));put(ws.getCell(dt,1),'TOTAL FABRIC REQUIREMENT (KG)',{font:{bold:true,color:{argb:navy}},fill:fill(blue)});
       put(ws.getCell(dt,Math.max(15,totalCol)),result.totalQty?result.requirement:'',{font:{bold:true,color:{argb:navy}},fill:fill(blue)});
       ws.views=[{state:'frozen',ySplit:10}];ws.pageSetup={paperSize:ws.PAPER_A4,orientation:'landscape',fitToPage:true,fitToWidth:1,fitToHeight:0};ws.pageSetup.margins={left:0.2,right:0.2,top:0.35,bottom:0.35,header:0.15,footer:0.15};
      ws.printArea='A1:'+ws.getColumn(Math.max(15,totalCol)).letter+dt;ws.headerFooter={oddFooter:'&LFabric Consumption · Factory Booking Sheet&CPage &P of &N'};
      const cs=wb.addWorksheet('CONSUMPTION');cs.getColumn(1).width=4;cs.getColumn(2).width=18;cs.getColumn(5).width=16;
      cs.mergeCells('B2:E2');put(cs.getCell('B2'),'FABRIC CONSUMPTION',{font:{name:'Arial',size:14,bold:true,color:{argb:white}},fill:fill(navy)});
      const first=data[0]||{dia:0,ml:0,cla:0,gsm:0,pcs:0,cut:0};
      [['DIA',first.dia],['LENGTH',first.ml+first.cla],['GSM',first.gsm],['PCS',first.pcs],['WASTAGE',first.cut/100]].forEach((x,i)=>{const row=4+i;cs.mergeCells(row,2,row,4);put(cs.getCell(row,2),x[0],{alignment:{horizontal:'left'},font:{bold:true,color:{argb:navy}}});put(cs.getCell(row,5),x[1]);});
      cs.mergeCells('B9:D9');put(cs.getCell('B9'),'CONSUMPTION',{font:{bold:true,color:{argb:white}},fill:fill(navy)});
      const consumption=first.pcs>0?(first.dia*(first.ml+first.cla)*first.gsm/1550000/first.pcs)*(1+first.cut/100):0;
      put(cs.getCell('E9'),{formula:'IF(E7>0,(E4*E5*E6/1550000/E7)*(1+E8),0)',result:consumption},{fill:fill(green)});cs.getCell('E8').numFmt='0.0%';cs.getCell('E9').numFmt='0.0000';
      cs.pageSetup={paperSize:cs.PAPER_A4,orientation:'portrait',fitToPage:true,fitToWidth:1,fitToHeight:1};cs.printArea='B2:E9';
      const buffer=await wb.xlsx.writeBuffer(),blob=new Blob([buffer],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),url=URL.createObjectURL(blob),a=document.createElement('a');
      a.href=url;a.download='Fabric-Booking-Sheet.xlsx';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    } catch(err) { console.error(err); alert('Excel export failed: '+err.message); }
  }

  const recentKey='fabricBookingRecentV1';
  function snapshot(){
    return {
      order:['bk-buyer','bk-style','bk-po','bk-description','bk-body-fabric','bk-order-qty','bk-cut-qty','bk-shipment'].map(id=>[id,$(id).value]),
      ratioLabel:$('bk-ratio-label').value,
      sizes:sizeRows().map((th,i)=>({name:th.querySelector('[data-size-label]').value,ratio:$('bk-ratio-row').querySelectorAll('[data-ratio]')[i]?.value||''})),
      fabrics:rows().map(row=>Object.fromEntries(['parts','fabric','ml','cla','mw','cwa','gsm','pcs','cut','dia','diaType'].map(key=>[key,row.querySelector('[data-field="'+key+'"]')?.value||''])))
    };
  }
  function applySnapshot(data){
    (data.order||[]).forEach(([id,value])=>{if($(id))$(id).value=value;});
    $('bk-ratio-label').value=data.ratioLabel||'';
    const names=(data.sizes||[]);
    $('bk-size-headers').querySelectorAll('.bk-size-item').forEach((el,i)=>{if(i>=names.length)el.remove();});
    $('bk-ratio-row').querySelectorAll('td[data-ratio]').forEach((el,i)=>{if(i>=names.length)el.remove();});
    keepTotalLast();
    names.forEach((item,i)=>{
      if(i>=sizeRows().length)addSize();
      const th=sizeRows()[i];if(th){th.querySelector('[data-size-label]').value=item.name||'';$('bk-ratio-row').querySelectorAll('[data-ratio]')[i].value=item.ratio||'';}
    });
    const body=$('bk-fabric-rows');
    while(rows().length<(data.fabrics||[]).length)addRow();
    while(rows().length>(data.fabrics||[]).length&&rows().length>1)rows().at(-1).remove();
    (data.fabrics||[]).forEach((item,i)=>Object.entries(item).forEach(([key,value])=>{const el=rows()[i]?.querySelector('[data-field="'+key+'"]');if(el)el.value=value;}));
    $('bk-size-headers').querySelectorAll('.bk-size-item').forEach((el,i)=>{const b=el.querySelector('.bk-size-remove');if(b)b.disabled=sizeRows().length===1;});
    calculate();
  }
  function saveRecent(){
    try{
      const item={savedAt:new Date().toLocaleString(),data:snapshot()};
      const list=JSON.parse(localStorage.getItem(recentKey)||'[]');
      list.unshift(item);localStorage.setItem(recentKey,JSON.stringify(list.slice(0,8)));
    }catch(e){console.warn('Could not save booking recent item',e);}
  }
  function showRecent(){
    const panel=$('bk-recent-panel'),btn=$('bk-recent-open');
    const list=JSON.parse(localStorage.getItem(recentKey)||'[]');
    panel.innerHTML='<div class="booking-recent-head"><strong>Recent Calculations</strong><button type="button" data-recent-close aria-label="Close">×</button></div>'+
      (list.length?list.map((item,i)=>'<button type="button" class="booking-recent-item" data-recent-index="'+i+'"><strong>'+safe(item.data.order.find(x=>x[0]==='bk-style')?.[1]||'Untitled Style')+'</strong><small>'+safe(item.savedAt)+'</small></button>').join(''):'<p class="booking-recent-empty">No recent calculations yet. Click Calculate to save one.</p>');
    panel.hidden=!panel.hidden;btn.setAttribute('aria-expanded',String(!panel.hidden));
  }
  function demoValues(){
    $('bk-buyer').value='ABC Fashions Ltd.';$('bk-style').value='TS-2026-001';$('bk-po').value='PO-45821';
    $('bk-description').value='Men’s Basic T-Shirt';$('bk-body-fabric').value='100% Cotton';
    $('bk-order-qty').value='1200';$('bk-cut-qty').value='1250';$('bk-shipment').value='';
    $('bk-ratio-label').value='RATIO (BODY+RIB)';
    const demoSizes=[['XS','1'],['S','2'],['M','3'],['L','3'],['XL','2'],['2XL','1']];
    const head=$('bk-size-headers'),ratio=$('bk-ratio-row');
    head.querySelectorAll('.bk-size-item').forEach((el,i)=>{if(i>=demoSizes.length)el.remove();});
    ratio.querySelectorAll('td[data-ratio]').forEach((el,i)=>{if(i>=demoSizes.length)el.remove();});
    demoSizes.forEach((x,i)=>{
      if(i>=sizeRows().length)addSize();
      sizeRows()[i].querySelector('[data-size-label]').value=x[0];
      ratio.querySelectorAll('[data-ratio]')[i].value=x[1];
    });
    const fabricDemo=[
      {parts:'BODY',fabric:'COTTON',ml:'92.04',cla:'2',mw:'72',cwa:'2',gsm:'280',pcs:'12',cut:'6',dia:'72',diaType:'OPEN'},
      {parts:'RIB',fabric:'COTTON',ml:'31.11',cla:'2',mw:'52',cwa:'2',gsm:'340',pcs:'12',cut:'6',dia:'52',diaType:'OPEN'}
    ];
    while(rows().length<2)addRow();
    while(rows().length>2)rows().at(-1).remove();
    fabricDemo.forEach((item,i)=>Object.entries(item).forEach(([key,value])=>{const el=rows()[i].querySelector('[data-field="'+key+'"]');if(el)el.value=value;}));
    calculate();$('bk-demo').setAttribute('aria-pressed','true');
  }
  function resetBooking(){
    ['bk-buyer','bk-style','bk-po','bk-description','bk-body-fabric','bk-order-qty','bk-cut-qty','bk-shipment','bk-ratio-label'].forEach(id=>$(id).value='');
    $('bk-size-preset').value='';
    $('bk-size-headers').querySelectorAll('.bk-size-item').forEach(el=>el.remove());
    $('bk-ratio-row').querySelectorAll('td[data-ratio]').forEach(el=>el.remove());
    $('bk-fabric-rows').innerHTML=
      '<tr data-row="1"><td><input data-field="parts" placeholder="BODY"></td><td><input data-field="fabric" placeholder="COTTON"></td><td><input data-field="ml" type="number" step="0.01" placeholder="92.04"></td><td><input data-field="cla" type="number" step="0.01" placeholder="2"></td><td><input data-field="mw" type="number" step="0.01" placeholder="72"></td><td><input data-field="cwa" type="number" step="0.01" placeholder="2"></td><td><input data-field="gsm" type="number" step="0.01" placeholder="280"></td><td class="bk-net-marker">—</td><td><input data-field="pcs" type="number" step="1" placeholder="12"></td><td class="bk-net-dozen">—</td><td><input data-field="cut" type="number" step="0.01" placeholder="6"></td><td class="bk-final">—</td><td><input data-field="dia" type="number" step="0.01" placeholder="72"></td><td><select data-field="diaType"><option>OPEN</option><option>TUBULAR</option></select></td><td><button type="button" class="bk-remove-row" disabled>×</button></td></tr>';
    // Restore one empty size column so users can start from a clean sheet.
    const th=document.createElement('th'),td=document.createElement('td');th.className='bk-size-item';th.dataset.sizeIndex='0';
    th.innerHTML='<div class="bk-size-head-cell"><input data-size-label placeholder="XS" aria-label="Size label"><button type="button" class="bk-size-remove" disabled aria-label="Remove size">×</button></div>';
    td.dataset.ratioIndex='0';td.innerHTML='<input data-ratio type="number" min="0" step="1" placeholder="1" aria-label="Ratio">';
    $('bk-size-headers').insertBefore(th,$('bk-size-headers').lastElementChild);$('bk-ratio-row').insertBefore(td,$('bk-ratio-row').lastElementChild);
    keepTotalLast();
    calculate();$('bk-demo').setAttribute('aria-pressed','false');
  }

  document.addEventListener('DOMContentLoaded',()=>{
    $('bk-fabric-rows').addEventListener('input',calculate);
    $('bk-fabric-rows').addEventListener('change',calculate);
    $('bk-fabric-rows').addEventListener('click',e=>{if(e.target.classList.contains('bk-remove-row')){if(rows().length>1)e.target.closest('tr').remove();calculate();}});
    document.querySelectorAll('#page-booking input,#page-booking select').forEach(el=>el.addEventListener('input',calculate));
    $('bk-add-row').addEventListener('click',addRow);$('bk-add-size').addEventListener('click',addSize);
    $('bk-size-preset').addEventListener('change',e=>{if(e.target.value)loadSizePreset(e.target.value);});
    $('bk-size-headers').addEventListener('click',e=>{
      const remove=e.target.closest('.bk-size-remove');
      if(!remove||sizeRows().length<=1)return;
      const header=remove.closest('.bk-size-item');
      const index=Array.from($('bk-size-headers').querySelectorAll('.bk-size-item')).indexOf(header);
      const ratioCell=$('bk-ratio-row').querySelector('td[data-ratio-index="'+index+'"]');
      // Remove the size header and its matching ratio cell as one pair.
      header.remove();
      if(ratioCell)ratioCell.remove();
      // Re-index only size cells; TOTAL PCS remains the final, permanent column.
      keepTotalLast();
      calculate();
    });
    $('bk-size-headers').addEventListener('input',calculate);$('bk-ratio-row').addEventListener('input',calculate);
    $('bk-calculate').addEventListener('click',()=>{calculate();saveRecent();});
    $('bk-demo').addEventListener('click',demoValues);
    $('bk-reset').addEventListener('click',resetBooking);
    $('bk-recent-open').addEventListener('click',showRecent);
    $('bk-recent-panel').addEventListener('click',e=>{
      if(e.target.closest('[data-recent-close]')){$('bk-recent-panel').hidden=true;$('bk-recent-open').setAttribute('aria-expanded','false');return;}
      const item=e.target.closest('[data-recent-index]');if(item){const list=JSON.parse(localStorage.getItem(recentKey)||'[]');if(list[Number(item.dataset.recentIndex)])applySnapshot(list[Number(item.dataset.recentIndex)].data);$('bk-recent-panel').hidden=true;$('bk-recent-open').setAttribute('aria-expanded','false');}
    });
    $('bk-download-pdf').addEventListener('click',downloadPDF);$('bk-download-excel').addEventListener('click',downloadExcel);
    calculate();
  });
})();