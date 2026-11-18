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
    const now=new Date(), reportDate=now.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}), reportTime=now.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});
    const reportId='FC-BKG-'+now.getFullYear()+String(now.getMonth()+1).padStart(2,'0')+String(now.getDate()).padStart(2,'0')+'-'+String(now.getHours()).padStart(2,'0')+String(now.getMinutes()).padStart(2,'0');
    const value=id=>$(id)?.value||'—';
    const orderQty=result.totalQty||0;
    const infoItems=[
      ['BUYER NAME',value('bk-buyer')],['STYLE / ORDER NO.',value('bk-style')],['JOB / PO NO.',value('bk-po')],['DESCRIPTION',value('bk-description')],
      ['BODY FABRIC',value('bk-body-fabric')],['ORDER QUANTITY',orderQty?orderQty.toLocaleString()+' pcs':'—'],
      ['CUTTING QUANTITY',value('bk-cut-qty')?Number(value('bk-cut-qty')).toLocaleString()+' pcs':'—'],['SHIPMENT DATE',value('bk-shipment')]
    ];
    const infoHtml=infoItems.map(([k,v])=>'<div><span>'+safe(k)+'</span><strong>'+safe(v)+'</strong></div>').join('');
    const markerRows=data.map((x,i)=>{
      const netOrder=orderQty?x.netDozen*orderQty/12:0, finalOrder=orderQty?x.finalDozen*orderQty/12:0, waste=Math.max(0,finalOrder-netOrder);
      return '<tr><td>'+(i+1)+'</td><td><strong>'+safe(x.parts||'—')+'</strong></td><td>'+safe(x.fabric||'—')+'</td><td>'+x.ml.toFixed(2)+'</td><td>'+x.cla.toFixed(2)+'</td><td>'+x.mw.toFixed(2)+'</td><td>'+x.cwa.toFixed(2)+'</td><td>'+x.gsm+'</td><td>'+x.pcs+'</td><td>'+x.cut.toFixed(1)+'%</td><td>'+x.finalDozen.toFixed(4)+' kg/dz</td><td><strong>'+finalOrder.toFixed(3)+' kg</strong></td></tr>';
    }).join('');
    const grouped={};
    data.forEach(x=>{
      const key=x.fabric||'Unspecified';
      if(!grouped[key])grouped[key]={parts:[],net:0,waste:0,final:0,perDozen:0};
      const g=grouped[key];g.parts.push(x.parts||'—');
      const net=orderQty?x.netDozen*orderQty/12:0,final=orderQty?x.finalDozen*orderQty/12:0;
      g.net+=net;g.waste+=Math.max(0,final-net);g.final+=final;g.perDozen+=x.finalDozen;
    });
    const fabricRows=Object.entries(grouped).map(([fabric,g],i)=>'<tr><td>'+(i+1)+'</td><td><strong>'+safe(fabric)+'</strong></td><td>'+safe([...new Set(g.parts)].join(', '))+'</td><td>'+g.net.toFixed(3)+' kg</td><td>'+g.waste.toFixed(3)+' kg</td><td>'+g.perDozen.toFixed(4)+' kg/dz</td><td><strong>'+g.final.toFixed(3)+' kg</strong></td><td>'+(result.requirement>0?(g.final/result.requirement*100).toFixed(1)+'%':'—')+'</td></tr>').join('');
    const sizeHeads=result.sizing.sizes.map(x=>'<th>'+safe(x.size||'—')+'</th>').join('');
    const sizeVals=result.sizing.sizes.map(x=>'<td>'+x.ratio+'</td>').join('');
    const totalNet=data.reduce((sum,x)=>sum+(orderQty?x.netDozen*orderQty/12:0),0);
    const totalWaste=Math.max(0,result.requirement-totalNet);
    const totalPerPc=orderQty?result.requirement/orderQty:0;
    const comments='<div class="booking-pdf-comments"><strong>COMMENTS / REMARKS</strong><div></div></div>';
    const report='<div class="report booking-pdf-report">'+
      '<div class="report-header"><div><div class="brand">FABRIC <span>CONSUMPTION</span></div><div class="subtitle">GARMENT CALCULATOR SUITE</div></div><div class="report-title"><div class="eyebrow">FACTORY BOOKING REPORT</div><h1>Fabric Booking Sheet</h1><div class="report-id">'+reportId+'</div></div></div>'+
      '<div class="booking-pdf-meta"><div><span>REPORT DATE</span><strong>'+reportDate+'</strong></div><div><span>TIME</span><strong>'+reportTime+'</strong></div><div><span>RESULT UNIT</span><strong>KG</strong></div><div><span>ORDER QUANTITY</span><strong>'+(orderQty?orderQty.toLocaleString()+' pcs':'—')+'</strong></div></div>'+
      '<section class="section"><div class="section-head">ORDER INFORMATION</div><div class="info-grid booking-pdf-info">'+infoHtml+'</div></section>'+
      '<section class="section"><div class="section-head">FABRIC &amp; MARKER DETAILS</div><table><thead><tr><th>SL</th><th>PART / MARKER</th><th>FABRIC</th><th>ML</th><th>CUT L</th><th>MW</th><th>CUT W</th><th>GSM</th><th>PCS / MARKER</th><th>CUT %</th><th>FINAL / DOZEN</th><th>ORDER TOTAL</th></tr></thead><tbody>'+markerRows+'</tbody></table></section>'+
      '<section class="section"><div class="section-head">SIZE RATIO</div><table><thead><tr><th>SIZE</th>'+sizeHeads+'<th>TOTAL PCS</th></tr></thead><tbody><tr><th>'+safe(result.sizing.label||'RATIO (BODY+RIB)')+'</th>'+sizeVals+'<td><strong>'+result.sizing.totalRatio+'</strong></td></tr></tbody></table></section>'+
      '<section class="section"><div class="section-head">FABRIC-WISE SUMMARY</div><table><thead><tr><th>SL</th><th>FABRIC TYPE</th><th>PARTS</th><th>NET ORDER</th><th>WASTAGE</th><th>FINAL / DOZEN</th><th>ORDER TOTAL</th><th>SHARE</th></tr></thead><tbody>'+fabricRows+'</tbody></table></section>'+
      '<section class="section formula"><div class="section-head">CALCULATION METHOD</div><div class="formula-text"><strong>Net KG / Marker</strong> = (ML + Cut L) × (MW + Cut W) × GSM ÷ 1,550,000<br><strong>Net KG / Dozen</strong> = Net KG / Marker × 12 ÷ PCS / Marker<br><strong>Final KG / Dozen</strong> = Net KG / Dozen × (1 + Cutting % ÷ 100)<br><strong>Fabric Requirement</strong> = Total Final KG / Dozen × Order Quantity ÷ 12</div></section>'+
      '<div class="summary-grid booking-pdf-metrics"><div class="summary-card"><div class="metric-head"><span>NET CONSUMPTION</span></div><strong>'+totalNet.toFixed(3)+' kg</strong><small>Before cutting allowance · whole order</small></div><div class="summary-card"><div class="metric-head"><span>WASTAGE ADDED</span></div><strong>'+totalWaste.toFixed(3)+' kg</strong><small>Applied row by row</small></div><div class="summary-card primary"><div class="metric-head"><span>FINAL FABRIC REQUIREMENT</span></div><strong>'+result.requirement.toFixed(3)+' kg</strong><small>Including cutting allowance</small></div><div class="summary-card"><div class="metric-head"><span>PER GARMENT</span></div><strong>'+totalPerPc.toFixed(4)+' kg/pc</strong><small>Per dozen: '+result.grand.toFixed(4)+' kg/dozen</small></div></div>'+
      comments+
      '<div class="booking-pdf-note"><strong>IMPORTANT:</strong> Consumption estimate only. Verify marker measurements, GSM, cutting allowance, size ratio and order quantity against the approved marker and actual cutting-room consumption.</div>'+
      '<div class="booking-pdf-signatures"><div><span>PREPARED BY</span><i></i><small>Name / Signature / Date</small></div><div><span>CHECKED BY</span><i></i><small>Name / Signature / Date</small></div><div><span>APPROVED BY</span><i></i><small>Name / Signature / Date</small></div></div>'+
      '<div class="report-footer"><span>Fabric Consumption · Garment Calculator Suite</span><span>'+reportDate+' · '+reportTime+' · <a href="https://fabricconsumption.vercel.app/" target="_blank" rel="noopener noreferrer">fabricconsumption.vercel.app</a></span></div></div>';
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
      const now=new Date(), dateText=now.toLocaleDateString('en-GB'), qty=result.totalQty||0;
      const val=id=>$(id)?.value||'';
      wb.creator='Fabric Consumption';wb.lastModifiedBy='Fabric Consumption';wb.title='Style Wise Fabrics Consumption';wb.subject='Fabric Booking Sheet';
      const ws=wb.addWorksheet('BOOKING SHEET');
      const navy='17365D',blue='D9EAF7',pale='EAF2F8',green='E2F0D9',white='FFFFFF',ink='1F2937',grey='64748B',line='9EADBA';
      const edge={style:'thin',color:{argb:'FF'+line}},border={top:edge,bottom:edge,left:edge,right:edge};
      const fill=c=>({type:'pattern',pattern:'solid',fgColor:{argb:'FF'+c}});
      const put=(cell,value,opts={})=>{
        cell.value=value;cell.border=opts.border||border;
        cell.alignment={vertical:'middle',horizontal:'center',wrapText:true,...opts.alignment};
        cell.font={name:opts.font?.name||'Arial',size:opts.font?.size||9,color:{argb:'FF'+(opts.font?.color||ink)},bold:!!opts.font?.bold,italic:!!opts.font?.italic,underline:opts.font?.underline||false};
        if(opts.fill)cell.fill=opts.fill;
        if(opts.numFmt)cell.numFmt=opts.numFmt;
      };
      [15.14,16.86,14.71,14,17,14,17,10,15,12,15,16,15,16,13].forEach((w,i)=>ws.getColumn(i+1).width=w);
      ws.sheetView.showGridLines=false;
      ws.mergeCells('A3:O3');
      put(ws.getCell('A3'),'STYLE WISE FABRICS CONSUMPTION',{font:{name:'Arial',size:16,bold:true,color:white},fill:fill(navy),alignment:{horizontal:'center',vertical:'middle'}});
      ws.getRow(1).height=39.75;ws.getRow(2).height=30;ws.getRow(3).height=30;ws.getRow(4).height=7;
      // Order metadata follows the supplied reference: left and right columns.
      const meta=[
        [5,'DATE :',dateText,'SHIPMENT DT:',val('bk-shipment')],
        [6,'BUYER :',val('bk-buyer'),'ORDER QTY :',qty?qty.toLocaleString()+' PCS':''],
        [7,'STYLE/ORD :',val('bk-style'),'MAIN FABRICS:',val('bk-body-fabric')],
        [8,'JOB / PO NO:',val('bk-po'),'DESCRIPTION:',val('bk-description')]
      ];
      meta.forEach(([r,l1,v1,l2,v2])=>{
        put(ws.getCell(r,2),l1,{font:{size:10,bold:true,color:navy},alignment:{horizontal:'left'}});
        ws.mergeCells(r,3,r,4);put(ws.getCell(r,3),v1,{font:{size:10,color:ink},alignment:{horizontal:'left'}});
        put(ws.getCell(r,11),l2,{font:{size:10,bold:true,color:navy},alignment:{horizontal:'left'}});
        ws.mergeCells(r,12,r,13);put(ws.getCell(r,12),v2,{font:{size:10,color:ink},alignment:{horizontal:'left'}});
        ws.getRow(r).height=20.1;
      });
      const headers=['GARMENT SIZE','PARTS','FABRIC TYPE','MARKER LENGTH','CUTTING ALLOWANCE LENGTH','MARKER WIDTH','CUTTING ALLOWANCE WIDTH','GSM','NET CON,MARKER','PCS MARKER','NET,CON,DOZ','FABRIC+ CUTTING%','NET,CON,DOZ','REQ,FINISHED DIA','DIA TYPE'];
      const units=['','','','INCH','INCH','INCH','INCH','','KG','NO','KG','','KG','INCH',''];
      headers.forEach((v,i)=>put(ws.getCell(10,i+1),v,{font:{size:9,bold:true,color:white},fill:fill(navy)}));
      units.forEach((v,i)=>put(ws.getCell(11,i+1),v,{font:{size:9,bold:true,color:grey},fill:fill(pale)}));
      ws.getRow(10).height=48;ws.getRow(11).height=19;
      data.forEach((x,i)=>{
        const r=12+i;
        const vals=[i===0?'ALL':'',x.parts,x.fabric,x.ml,x.cla,x.mw,x.cwa,x.gsm,
          {formula:`(D${r}+E${r})*(F${r}+G${r})*H${r}/1550000`,result:x.netMarker},
          x.pcs,{formula:`IF(J${r}>0,I${r}*12/J${r},0)`,result:x.netDozen},
          x.cut/100,{formula:`K${r}*(1+L${r})`,result:x.finalDozen},x.dia,x.diaType];
        vals.forEach((v,j)=>put(ws.getCell(r,j+1),v,{font:{size:9,color:ink},fill:[8,10,12].includes(j)?fill(green):undefined,numFmt:[3,4,5,6,7,8,10,12,13].includes(j)?'0.0000':j===11?'0.0%':undefined}));
        ws.getRow(r).height=20.1;
      });
      const totalRow=Math.max(21,12+data.length), dataEnd=11+data.length;
      ws.mergeCells(totalRow,1,totalRow,11);put(ws.getCell(totalRow,1),'TOTAL FABRIC CONSUMPTION / DOZEN',{font:{name:'Calibri',size:11,bold:true,color:navy},fill:fill(blue),alignment:{horizontal:'right'}});
      put(ws.getCell(totalRow,12),'TOTAL =',{font:{name:'Calibri',size:11,bold:true,color:navy},fill:fill(blue)});
      put(ws.getCell(totalRow,13),{formula:data.length?data.map((_,i)=>'M'+(12+i)).join('+'):'0',result:result.grand},{font:{name:'Calibri',size:11,bold:true,color:navy},fill:fill(blue),numFmt:'0.0000'});
      put(ws.getCell(totalRow,14),'KG / DOZEN',{font:{name:'Calibri',size:11,bold:true,color:navy},fill:fill(blue)});
      put(ws.getCell(totalRow,15),'',{fill:fill(blue)});
      ws.getRow(totalRow).height=24;
      const sizeHead=totalRow+2,sizeRow=totalRow+3;
      put(ws.getCell(sizeHead,3),'SIZE',{font:{name:'Calibri',size:11,bold:true,color:white},fill:fill(navy)});
      sizes.forEach((x,i)=>put(ws.getCell(sizeHead,4+i),x.size,{font:{name:'Calibri',size:11,bold:true,color:white},fill:fill(navy)}));
      const totalCol=4+sizes.length;
      put(ws.getCell(sizeHead,totalCol),'TOTAL',{font:{name:'Calibri',size:11,bold:true,color:white},fill:fill(navy)});
      put(ws.getCell(sizeRow,3),result.sizing.label||'RATIO (BODY+RIB)',{font:{name:'Calibri',size:11,bold:true,color:navy},fill:fill(blue)});
      sizes.forEach((x,i)=>put(ws.getCell(sizeRow,4+i),x.ratio,{font:{name:'Calibri',size:11,bold:true,color:ink},fill:fill(pale)}));
      put(ws.getCell(sizeRow,totalCol),result.sizing.totalRatio+' PCS',{font:{name:'Calibri',size:11,bold:true,color:navy},fill:fill(blue)});
      ws.getRow(sizeHead).height=22;ws.getRow(sizeRow).height=22;
      const summaryHead=totalRow+6,summaryValue=totalRow+7,summaryNote=totalRow+8;
      const netTotal=data.reduce((sum,x)=>sum+x.netDozen*qty/12,0),waste=Math.max(0,result.requirement-netTotal),perGarment=qty?result.requirement/qty:0;
      const cards=[
        {col:3,title:'NET CONSUMPTION/DZ',value:netTotal.toFixed(3)+' KG',note:'Before cutting allowance · whole order'},
        {col:5,title:'WASTAGE ADDED',value:waste.toFixed(3)+' KG',note:'Applied row by row'},
        {col:7,title:'PER GARMENTS',value:perGarment.toFixed(4)+' KG/PC',note:'Including cutting allowance'},
        {col:9,title:'FINAL FABRIC REQUIREMENT',value:result.requirement.toFixed(3)+' KG',note:'Per dozen: '+result.grand.toFixed(4)+' kg/dozen'}
      ];
      cards.forEach(card=>{
        const c=card.col, endCol=c+1;
        ws.mergeCells(summaryHead,c,summaryHead,endCol);ws.mergeCells(summaryValue,c,summaryValue,endCol);ws.mergeCells(summaryNote,c,summaryNote,endCol);
        put(ws.getCell(summaryHead,c),card.title,{font:{name:'Calibri',size:9.5,bold:true,color:navy},fill:fill(pale)});
        put(ws.getCell(summaryValue,c),card.value,{font:{name:'Calibri',size:14,bold:true,color:navy},fill:fill(blue)});
        put(ws.getCell(summaryNote,c),card.note,{font:{name:'Calibri',size:8,color:grey},fill:fill(pale)});
      });
      [summaryHead,summaryValue,summaryNote].forEach(r=>ws.getRow(r).height=r===summaryValue?26:21);
      const commentsRow=totalRow+11;
      ws.mergeCells(commentsRow,2,commentsRow,14);put(ws.getCell(commentsRow,2),'Comments : ',{font:{name:'Calibri',size:11,bold:true,color:navy},alignment:{horizontal:'left',vertical:'top'}});
      ws.mergeCells(commentsRow+1,2,commentsRow+3,14);put(ws.getCell(commentsRow+1,2),'',{alignment:{horizontal:'left',vertical:'top'}});
      ws.getRow(commentsRow+1).height=20;ws.getRow(commentsRow+2).height=20;ws.getRow(commentsRow+3).height=20;
      const footerRow=commentsRow+5;ws.mergeCells(footerRow,2,footerRow,14);
      const footerText='Fabric Consumption · Garment Calculator Suite  |  '+dateText+'  |  fabricconsumption.vercel.app';
      put(ws.getCell(footerRow,2),{text:footerText,hyperlink:'https://fabricconsumption.vercel.app/'},{font:{name:'Calibri',size:9,color:'0563C1',underline:true},alignment:{horizontal:'center'}});
      ws.getRow(footerRow).height=22;
      ws.views=[{state:'frozen',ySplit:11}];
      ws.pageSetup={paperSize:ws.PAPER_A4,orientation:'landscape',fitToPage:true,fitToWidth:1,fitToHeight:0};
      ws.pageSetup.margins={left:0.2,right:0.2,top:0.35,bottom:0.35,header:0.15,footer:0.15};
      ws.printArea='A1:O'+footerRow;
      ws.headerFooter={oddFooter:'&LFabric Consumption · Factory Booking Sheet&CPage &P of &N'};
      try{
        const response=await fetch('/favicon.svg');
        if(response.ok){
          const svg=await response.text(),objectUrl=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'})),image=new Image();
          await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;image.src=objectUrl;});
          const canvas=document.createElement('canvas');canvas.width=140;canvas.height=140;canvas.getContext('2d').drawImage(image,0,0,140,140);URL.revokeObjectURL(objectUrl);
          const imageId=wb.addImage({base64:canvas.toDataURL('image/png').split(',')[1],extension:'png'});
          ws.addImage(imageId,{tl:{col:0.18,row:0.12},ext:{width:42,height:42}});
        }
      }catch(imageError){console.warn('Website favicon could not be embedded:',imageError);}
      const cs=wb.addWorksheet('CONSUMPTION');
      cs.getColumn(1).width=4;cs.getColumn(2).width=18;cs.getColumn(5).width=16;cs.sheetView.showGridLines=false;
      cs.mergeCells('B2:E2');put(cs.getCell('B2'),'FABRIC CONSUMPTION',{font:{name:'Arial',size:14,bold:true,color:white},fill:fill(navy)});
      const first=data[0]||{dia:0,ml:0,cla:0,gsm:0,pcs:0,cut:0};
      [['DIA',first.dia],['LENGTH',first.ml+first.cla],['GSM',first.gsm],['PCS',first.pcs],['WASTAGE',first.cut/100]].forEach((x,i)=>{const r=4+i;cs.mergeCells(r,2,r,4);put(cs.getCell(r,2),x[0],{alignment:{horizontal:'left'},font:{bold:true,color:navy}});put(cs.getCell(r,5),x[1]);});
      cs.mergeCells('B9:D9');put(cs.getCell('B9'),'CONSUMPTION',{font:{bold:true,color:white},fill:fill(navy)});
      const consumption=first.pcs>0?(first.dia*(first.ml+first.cla)*first.gsm/1550000/first.pcs)*(1+first.cut/100):0;
      put(cs.getCell('E9'),{formula:'IF(E7>0,(E4*E5*E6/1550000/E7)*(1+E8),0)',result:consumption},{fill:fill(green)});cs.getCell('E8').numFmt='0.0%';cs.getCell('E9').numFmt='0.0000';
      cs.pageSetup={paperSize:cs.PAPER_A4,orientation:'portrait',fitToPage:true,fitToWidth:1,fitToHeight:1};cs.printArea='B2:E9';
      const buffer=await wb.xlsx.writeBuffer(),blob=new Blob([buffer],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),url=URL.createObjectURL(blob),a=document.createElement('a');
      a.href=url;a.download='Fabric-Booking-Sheet.xlsx';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    }catch(err){console.error(err);alert('Excel export failed: '+err.message);}
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
    // Restore the exact initial Booking Sheet state, just like a browser refresh.
    window.location.reload();
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