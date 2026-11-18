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
  const sizeRows = () => Array.from(document.querySelectorAll('#bk-size-rows tr'));
  const ratioTotal = () => sizeRows().reduce((sum,row) => sum + Math.max(0, Number(row.querySelector('[data-ratio]')?.value) || 0), 0);
  function sizeBreakdown() {
    const rowsData=sizeRows().map(row=>({row,size:(row.querySelector('[data-size-label]')?.value||'').trim(),ratio:Math.max(0,Number(row.querySelector('[data-ratio]')?.value)||0)}));
    const totalRatio=rowsData.reduce((s,x)=>s+x.ratio,0);
    const useCut=$('bk-ratio-qty-source')?.value==='cut';
    const orderQty=Math.max(0,Number($(useCut?'bk-cut-qty':'bk-order-qty')?.value)||0);
    const raw=rowsData.map(x=>totalRatio>0?orderQty*x.ratio/totalRatio:0);
    const qtys=raw.map(Math.floor);
    let remaining=orderQty-qtys.reduce((s,n)=>s+n,0);
    raw.map((v,i)=>({i,frac:v-Math.floor(v)})).sort((a,b)=>b.frac-a.frac||a.i-b.i).slice(0,remaining).forEach(x=>qtys[x.i]++);
    rowsData.forEach((x,i)=>{
      x.qty=totalRatio>0?qtys[i]:0;
      x.share=totalRatio>0?x.ratio/totalRatio*100:0;
      x.row.querySelector('.bk-size-qty').textContent=totalRatio>0&&orderQty>0?x.qty.toLocaleString():'—';
      x.row.querySelector('.bk-size-share').textContent=totalRatio>0?x.share.toFixed(1)+'%':'—';
      const remove=x.row.querySelector('.bk-size-remove'); if(remove) remove.disabled=rowsData.length===1;
    });
    if($('bk-size-ratio-sum')) $('bk-size-ratio-sum').textContent=totalRatio;
    if($('bk-size-qty-sum')) $('bk-size-qty-sum').textContent=totalRatio>0&&orderQty>0?qtys.reduce((s,n)=>s+n,0).toLocaleString():'—';
    if($('bk-size-share-sum')) $('bk-size-share-sum').textContent=totalRatio>0?'100%':'—';
    if($('bk-ratio-total')) $('bk-ratio-total').textContent='Total Ratio: '+totalRatio;
    return {sizes:rowsData.map(({size,ratio,qty,share})=>({size,ratio,qty,share})),totalRatio,orderQty};
  }
  const readRow = row => {
    const ml=num(row,'ml'), cla=num(row,'cla'), mw=num(row,'mw'), cwa=num(row,'cwa'), gsm=num(row,'gsm'), pcs=num(row,'pcs'), cut=num(row,'cut');
    const netMarker = ((ml+cla)*(mw+cwa)*gsm)/1550000;
    const netDozen = pcs > 0 ? netMarker*12/pcs : 0;
    const finalDozen = netDozen*(1+cut/100);
    return {parts:text(row,'parts'),fabric:text(row,'fabric'),ml,cla,mw,cwa,gsm,netMarker,pcs,netDozen,cut,finalDozen,dia:num(row,'dia'),diaType:text(row,'diaType')};
  };
  function calculate() {
    const data=rows().map(row=>({row,calc:readRow(row)}));
    let grand=0;
    data.forEach(({row,calc})=>{
      grand+=calc.finalDozen;
      row.querySelector('.bk-net-marker').textContent=calc.netMarker.toFixed(4);
      row.querySelector('.bk-net-dozen').textContent=calc.netDozen.toFixed(4);
      row.querySelector('.bk-final').textContent=calc.finalDozen.toFixed(4);
    });
    const qty=Math.max(0,Number($('bk-order-qty')?.value)||0);
    const cutQty=Math.max(0,Number($('bk-cut-qty')?.value)||0);
    const totalQty=cutQty||qty;
    const requirement=grand*totalQty/12;
    $('bk-grand-dozen').textContent=grand.toFixed(4)+' kg/dz';
    $('bk-total-order').textContent=totalQty>0?requirement.toFixed(2)+' kg':'— kg';
    const sizing=sizeBreakdown();
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
  function addSize() {
    const existing=sizeRows().map(row=>row.querySelector('[data-size-label]')?.value.trim());
    let next=existing.length?String(Number(existing[existing.length-1])+6||'NEW'):'74';
    if(existing.includes(next)) next='NEW '+(existing.length+1);
    const tr=document.createElement('tr');
    tr.innerHTML='<td><input data-size-label value="'+safe(next)+'" aria-label="Size label"></td><td><input data-ratio type="number" min="0" step="1" value="0" aria-label="Ratio"></td><td class="bk-size-qty">—</td><td class="bk-size-share">—</td><td><button type="button" class="bk-size-remove" aria-label="Remove size">×</button></td>';
    $('bk-size-rows').appendChild(tr); calculate();
  }
  function orderInfo() {
    return [
      ['Date',$('bk-date').value],['Buyer',$('bk-buyer').value],['Style / Order No.',$('bk-style').value],['Job / PO No.',$('bk-po').value],
      ['Description',$('bk-description').value],['Body Fabric',$('bk-body-fabric').value],['Order Quantity',$('bk-order-qty').value],['Cutting Quantity',$('bk-cut-qty').value],['Shipment Date',$('bk-shipment').value]
    ];
  }
  function downloadPDF() {
    const result=calculate(), info=orderInfo(), data=result.data;
    const infoHtml=info.filter(x=>x[1]).map(x=>'<div><span>'+safe(x[0])+'</span><strong>'+safe(x[1])+'</strong></div>').join('');
    const body=data.map(x=>'<tr><td>'+safe(x.parts)+'</td><td>'+safe(x.fabric)+'</td><td>'+x.ml+'</td><td>'+x.cla+'</td><td>'+x.mw+'</td><td>'+x.cwa+'</td><td>'+x.gsm+'</td><td>'+x.netMarker.toFixed(4)+'</td><td>'+x.pcs+'</td><td>'+x.netDozen.toFixed(4)+'</td><td>'+x.cut+'%</td><td><strong>'+x.finalDozen.toFixed(4)+'</strong></td><td>'+x.dia+'</td><td>'+safe(x.diaType)+'</td></tr>').join('');
    const ratios=result.sizing.sizes.map(x=>'<tr><td>'+safe(x.size)+'</td><td>'+x.ratio+'</td><td>'+x.qty.toLocaleString()+'</td><td>'+x.share.toFixed(1)+'%</td></tr>').join('');
    const report='<div class="report booking-pdf-report"><div class="report-header"><div><div class="brand">FABRIC <span>CONSUMPTION</span></div><div class="subtitle">GARMENT CALCULATOR SUITE</div></div><div class="report-title"><div class="eyebrow">FACTORY BOOKING REPORT</div><h1>Style Wise Fabrics Consumption</h1><div class="report-id">BOOKING · '+new Date().toLocaleDateString('en-GB')+'</div></div></div>'+
      '<section class="section"><div class="section-head">ORDER INFORMATION</div><div class="info-grid">'+infoHtml+'</div></section>'+
      '<section class="section"><div class="section-head">FABRIC &amp; MARKER DETAILS</div><table><thead><tr><th>Parts</th><th>Fabric</th><th>ML</th><th>Cut L</th><th>MW</th><th>Cut W</th><th>GSM</th><th>Net/Marker</th><th>PCS</th><th>Net/Doz</th><th>Cut%</th><th>Final/Doz</th><th>DIA</th><th>Type</th></tr></thead><tbody>'+body+'</tbody></table></section>'+
      '<section class="section"><div class="section-head">SIZE RATIO &amp; ORDER DISTRIBUTION</div><table><thead><tr><th>Size</th><th>Ratio</th><th>Order Qty</th><th>Share</th></tr></thead><tbody>'+ratios+'</tbody></table><p>Total Ratio: '+result.sizing.totalRatio+' · Distributed Qty: '+result.sizing.orderQty+'</p></section>'+
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
      [['DATE :',$('bk-date').value],['BUYER :',$('bk-buyer').value],['STYLE/ORD :',$('bk-style').value],['DESCRIPTION:',$('bk-description').value],['BODY FABRIC:',$('bk-body-fabric').value]].forEach((x,i)=>{
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
      const sr=totalRow+2,rr=sr+1;ws.mergeCells(sr,3,sr,5);ws.mergeCells(rr,3,rr,5);
      put(ws.getCell(sr,3),'SIZE',{font:{bold:true,color:{argb:white}},fill:fill(navy)});
      put(ws.getCell(rr,3),'RATIO (BODY+RIB)',{font:{bold:true,color:{argb:navy}},fill:fill(blue)});
      sizes.forEach((x,i)=>{const c=6+i;if(c>15)ws.getColumn(c).width=12;put(ws.getCell(sr,c),x.size,{font:{bold:true,color:{argb:white}},fill:fill(navy)});put(ws.getCell(rr,c),x.ratio,{font:{bold:true,color:{argb:ink}},fill:fill(pale)});});
      const ratioSum=sizes.reduce((s,x)=>s+x.ratio,0), ratioCol=Math.max(11,6+sizes.length);
      put(ws.getCell(sr,ratioCol),ratioSum+' PCS',{font:{bold:true,color:{argb:white}},fill:fill(navy)});
      put(ws.getCell(rr,ratioCol),ratioSum,{font:{bold:true,color:{argb:navy}},fill:fill(blue)});
      const dt=rr+2;ws.mergeCells(dt,1,dt,15);put(ws.getCell(dt,1),'SIZE-WISE ORDER DISTRIBUTION',{font:{bold:true,color:{argb:white}},fill:fill(navy)});
      ['SIZE','RATIO','ORDER QTY (PCS)','ORDER SHARE'].forEach((v,i)=>put(ws.getCell(dt+1,i+1),v,{font:{bold:true,size:9,color:{argb:white}},fill:fill(navy)}));
      sizes.forEach((x,i)=>{const row=dt+2+i;[x.size,x.ratio,x.qty,x.share/100].forEach((v,j)=>put(ws.getCell(row,j+1),v));ws.getCell(row,4).numFmt='0.0%';});
      const sumRow=dt+3+sizes.length;ws.mergeCells(sumRow,1,sumRow,3);put(ws.getCell(sumRow,1),'TOTAL ORDER QUANTITY',{font:{bold:true,color:{argb:navy}},fill:fill(blue)});put(ws.getCell(sumRow,4),result.sizing.orderQty,{font:{bold:true,color:{argb:navy}},fill:fill(blue)});
      ws.mergeCells(sumRow+1,1,sumRow+1,3);put(ws.getCell(sumRow+1,1),'TOTAL FABRIC REQUIREMENT (KG)',{font:{bold:true,color:{argb:navy}},fill:fill(blue)});put(ws.getCell(sumRow+1,4),result.totalQty?result.requirement:'',{font:{bold:true,color:{argb:navy}},fill:fill(blue)});
      ws.views=[{state:'frozen',ySplit:10}];ws.pageSetup={paperSize:ws.PAPER_A4,orientation:'landscape',fitToPage:true,fitToWidth:1,fitToHeight:0};ws.pageSetup.margins={left:0.2,right:0.2,top:0.35,bottom:0.35,header:0.15,footer:0.15};
      ws.printArea='A1:'+String.fromCharCode(64+Math.min(26,Math.max(15,ratioCol)))+(sumRow+1);ws.headerFooter={oddFooter:'&LFabric Consumption · Factory Booking Sheet&CPage &P of &N'};
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
  document.addEventListener('DOMContentLoaded',()=>{
    const date=$('bk-date'); if(date&&!date.value) date.value=new Date().toISOString().slice(0,10);
    $('bk-fabric-rows').addEventListener('input',calculate);
    $('bk-fabric-rows').addEventListener('change',calculate);
    $('bk-fabric-rows').addEventListener('click',e=>{if(e.target.classList.contains('bk-remove-row')){if(rows().length>1)e.target.closest('tr').remove();calculate();}});
    document.querySelectorAll('#page-booking input,#page-booking select').forEach(el=>el.addEventListener('input',calculate));
    $('bk-add-row').addEventListener('click',addRow);$('bk-add-size').addEventListener('click',addSize);
    $('bk-size-rows').addEventListener('click',e=>{if(e.target.classList.contains('bk-size-remove')&&sizeRows().length>1){e.target.closest('tr').remove();calculate();}});
    $('bk-size-rows').addEventListener('input',calculate);
    $('bk-ratio-qty-source').addEventListener('change',calculate);
    $('bk-calculate').addEventListener('click',calculate);$('bk-download-pdf').addEventListener('click',downloadPDF);$('bk-download-excel').addEventListener('click',downloadExcel);
    calculate();
  });
})();