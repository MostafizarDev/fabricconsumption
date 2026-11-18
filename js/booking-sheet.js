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
  const ratioTotal = () => Array.from(document.querySelectorAll('[data-ratio]')).reduce((sum, el) => sum + Math.max(0, Number(el.value) || 0), 0);
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
    $('bk-ratio-total').textContent='Total Ratio: '+ratioTotal()+' pcs';
    $('bk-summary').innerHTML=data.map(({calc},i)=>'<article class="booking-result-card"><span>'+safe(calc.parts||('Fabric '+(i+1)))+' · '+safe(calc.fabric)+'</span><strong>'+calc.finalDozen.toFixed(4)+' kg/dz</strong><small>Net marker: '+calc.netMarker.toFixed(4)+' kg · Net/dozen: '+calc.netDozen.toFixed(4)+' kg</small></article>').join('');
    return {data:data.map(x=>x.calc),grand,totalQty,requirement};
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
    const sizes=Array.from(document.querySelectorAll('[data-ratio]')).map(x=>Number(x.dataset.ratio));
    const next=(sizes.length?sizes[sizes.length-1]+6:74);
    const head=document.querySelector('.booking-ratio-table thead tr');
    const body=document.querySelector('.booking-ratio-table tbody tr');
    const th=document.createElement('th'); th.textContent=String(next); head.insertBefore(th,head.lastElementChild);
    const td=document.createElement('td'); td.innerHTML='<input data-ratio="'+next+'" type="number" min="0" step="1" value="0">'; body.insertBefore(td,body.lastElementChild);
    calculate();
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
    const ratios=Array.from(document.querySelectorAll('[data-ratio]')).map(x=>'<td>'+safe(x.dataset.ratio)+'</td><td>'+safe(x.value)+'</td>').join('');
    const report='<div class="report booking-pdf-report"><div class="report-header"><div><div class="brand">FABRIC <span>CONSUMPTION</span></div><div class="subtitle">GARMENT CALCULATOR SUITE</div></div><div class="report-title"><div class="eyebrow">FACTORY BOOKING REPORT</div><h1>Style Wise Fabrics Consumption</h1><div class="report-id">BOOKING · '+new Date().toLocaleDateString('en-GB')+'</div></div></div>'+
      '<section class="section"><div class="section-head">ORDER INFORMATION</div><div class="info-grid">'+infoHtml+'</div></section>'+
      '<section class="section"><div class="section-head">FABRIC &amp; MARKER DETAILS</div><table><thead><tr><th>Parts</th><th>Fabric</th><th>ML</th><th>Cut L</th><th>MW</th><th>Cut W</th><th>GSM</th><th>Net/Marker</th><th>PCS</th><th>Net/Doz</th><th>Cut%</th><th>Final/Doz</th><th>DIA</th><th>Type</th></tr></thead><tbody>'+body+'</tbody></table></section>'+
      '<section class="section"><div class="section-head">SIZE RATIO</div><table><tbody><tr>'+ratios+'</tr></tbody></table></section>'+
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
      const result=calculate(), wb=new ExcelJS.Workbook(), ws=wb.addWorksheet('BOOKING SHEET',{views:[{state:'frozen',ySplit:10}]});
      ws.columns=[{width:13},{width:19},{width:13},{width:13},{width:13},{width:13},{width:10},{width:14},{width:12},{width:14},{width:12},{width:14},{width:12},{width:13}];
      const navy='17365D',blue='D9EAF7',light='EAF2F8',green='E2F0D9',white='FFFFFF',border={style:'thin',color:{argb:'FF9EADBA'}};
      const title=(row,label)=>{ws.mergeCells(row,1,row,14);const c=ws.getCell(row,1);c.value=label;c.font={bold:true,size:row===2?15:11,color:{argb:row===2?white:navy}};c.fill={type:'pattern',pattern:'solid',fgColor:{argb:row===2?navy:blue}};c.alignment={vertical:'middle',horizontal:'center'};ws.getRow(row).height=row===2?28:21;};
      title(2,'STYLE WISE FABRICS CONSUMPTION');
      const fields=orderInfo();
      fields.forEach((f,i)=>{const row=4+i;ws.getCell(row,1).value=f[0].toUpperCase();ws.getCell(row,1).font={bold:true,color:{argb:navy}};ws.mergeCells(row,2,row,4);ws.getCell(row,2).value=f[1]||'';});
      title(14,'FABRIC & MARKER DETAILS');
      const headers=['PARTS','FABRIC TYPE','MARKER LENGTH','CUTTING ALLOWANCE L','MARKER WIDTH','CUTTING ALLOWANCE W','GSM','NET CON, MARKER (KG)','PCS / MARKER','NET CON / DOZ (KG)','CUTTING %','FINAL / DOZ (KG)','REQ. FINISHED DIA','DIA TYPE'];
      ws.addRow(headers);const headerRow=ws.getRow(15);headerRow.height=36;headerRow.eachCell(c=>{c.font={bold:true,color:{argb:white},size:9};c.fill={type:'pattern',pattern:'solid',fgColor:{argb:navy}};c.alignment={horizontal:'center',vertical:'middle',wrapText:true};c.border={top:border,bottom:border,left:border,right:border};});
      result.data.forEach((x,i)=>{const r=16+i;ws.addRow([x.parts,x.fabric,x.ml,x.cla,x.mw,x.cwa,x.gsm,{formula:'(C'+r+'+D'+r+')*(E'+r+'+F'+r+')*G'+r+'/1550000',result:x.netMarker},x.pcs,{formula:'IF(I'+r+'>0,H'+r+'*12/I'+r+',0)',result:x.netDozen},x.cut,{formula:'J'+r+'*(1+K'+r+'/100)',result:x.finalDozen},x.dia,x.diaType]);const row=ws.getRow(r);row.eachCell(c=>{c.border={top:border,bottom:border,left:border,right:border};c.alignment={vertical:'middle',horizontal:'center'};if(c.value&&typeof c.value==='object'&&c.value.formula)c.fill={type:'pattern',pattern:'solid',fgColor:{argb:green}};});});
      const sumRow=17+result.data.length;title(sumRow,'SIZE RATIO');const ratioHeads=['SIZE',...Array.from(document.querySelectorAll('[data-ratio]')).map(x=>x.dataset.ratio)];const ratioVals=['RATIO',...Array.from(document.querySelectorAll('[data-ratio]')).map(x=>Number(x.value)||0)];ws.addRow(ratioHeads);ws.addRow(ratioVals);
      const resultRow=sumRow+4;title(resultRow,'BOOKING SUMMARY');ws.getCell(resultRow+1,1).value='TOTAL FINAL CONSUMPTION / DOZEN';ws.getCell(resultRow+1,2).value=result.grand;ws.getCell(resultRow+2,1).value='TOTAL FABRIC REQUIREMENT (KG)';ws.getCell(resultRow+2,2).value=result.totalQty?result.requirement:'';
      ws.eachRow(row=>row.eachCell(c=>{if(!c.border||!c.border.top)c.border={top:border,bottom:border,left:border,right:border};}));
      ws.views=[{state:'frozen',ySplit:15}];ws.pageSetup={paperSize:ws.PAPER_A4,orientation:'landscape',fitToPage:true,fitToWidth:1,fitToHeight:0};ws.pageSetup.margins={left:0.25,right:0.25,top:0.5,bottom:0.5,header:0.2,footer:0.2};ws.printArea='A1:N'+(resultRow+2);
      const buffer=await wb.xlsx.writeBuffer();const blob=new Blob([buffer],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='Fabric-Booking-Sheet.xlsx';a.click();URL.revokeObjectURL(url);
    } catch(err) { console.error(err); alert('Excel export failed: '+err.message); }
  }
  document.addEventListener('DOMContentLoaded',()=>{
    const date=$('bk-date'); if(date&&!date.value) date.value=new Date().toISOString().slice(0,10);
    $('bk-fabric-rows').addEventListener('input',calculate);
    $('bk-fabric-rows').addEventListener('change',calculate);
    $('bk-fabric-rows').addEventListener('click',e=>{if(e.target.classList.contains('bk-remove-row')){if(rows().length>1)e.target.closest('tr').remove();calculate();}});
    document.querySelectorAll('#page-booking input,#page-booking select').forEach(el=>el.addEventListener('input',calculate));
    $('bk-add-row').addEventListener('click',addRow);$('bk-add-size').addEventListener('click',addSize);
    $('bk-calculate').addEventListener('click',calculate);$('bk-download-pdf').addEventListener('click',downloadPDF);$('bk-download-excel').addEventListener('click',downloadExcel);
    calculate();
  });
})();