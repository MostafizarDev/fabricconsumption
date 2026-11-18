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
      const now=new Date(), dateText=now.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}), timeText=now.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});
      const reportId='FC-BKG-'+now.getFullYear()+String(now.getMonth()+1).padStart(2,'0')+String(now.getDate()).padStart(2,'0')+'-'+String(now.getHours()).padStart(2,'0')+String(now.getMinutes()).padStart(2,'0');
      const val=id=>$(id)?.value||'—', qty=result.totalQty||0;
      wb.creator='Fabric Consumption';wb.lastModifiedBy='Fabric Consumption';wb.title='Fabric Booking Sheet';wb.subject='Factory Fabric Booking Report';wb.company='Fabric Consumption';wb.created=now;wb.modified=now;
      const navy='17365D',blue='D9EAF7',pale='EFF5FB',green='E2F0D9',white='FFFFFF',ink='1F2937',grey='64748B',line='CBD5E1',amber='FFF7E6';
      const edge={style:'thin',color:{argb:'FF'+line}},border={top:edge,bottom:edge,left:edge,right:edge};
      const fill=c=>({type:'pattern',pattern:'solid',fgColor:{argb:'FF'+c}});
      const ws=wb.addWorksheet('BOOKING REPORT',{views:[{state:'frozen',ySplit:10}]});
      [8,16,16,12,12,12,12,10,13,11,13,13,13,13,12].forEach((w,i)=>ws.getColumn(i+1).width=w);
      const safeMerge=(...args)=>{try{ws.mergeCells(...args);return true;}catch(error){console.warn('Skipped overlapping Excel merge:',args,error.message);return false;}};
      const put=(cell,value,opts={})=>{
        cell.value=value;cell.border=border;
        cell.alignment={vertical:'middle',horizontal:'center',wrapText:true,...opts.alignment};
        cell.font={name:'Arial',size:9,color:{argb:'FF'+ink},...(opts.font||{})};
        if(opts.fill)cell.fill=opts.fill;
        if(opts.numFmt)cell.numFmt=opts.numFmt;
      };
      const mergeText=(range,value,opts={})=>{safeMerge(range);put(ws.getCell(range.split(':')[0]),value,opts);};
      mergeText('A1:O1','FABRIC CONSUMPTION  |  GARMENT CALCULATOR SUITE',{font:{size:17,bold:true,color:{argb:'FF'+white}},fill:fill(navy),alignment:{horizontal:'left',vertical:'middle',indent:1}});
      ws.getRow(1).height=34;
      mergeText('A2:O2','FACTORY FABRIC BOOKING REPORT',{font:{size:10,bold:true,color:{argb:'FF'+navy}},fill:fill(blue),alignment:{horizontal:'left',indent:1}});
      ws.getRow(2).height=22;
      const meta=[
        ['REPORT DATE',dateText,'REPORT TIME',timeText,'REPORT ID',reportId],
        ['BUYER',val('bk-buyer'),'STYLE / ORDER NO.',val('bk-style'),'JOB / PO NO.',val('bk-po')],
        ['DESCRIPTION',val('bk-description'),'BODY FABRIC',val('bk-body-fabric'),'SHIPMENT DATE',val('bk-shipment')],
        ['ORDER QUANTITY',qty?qty+' pcs':'—','CUTTING QUANTITY',val('bk-cut-qty')==='—'?'—':Number(val('bk-cut-qty')).toLocaleString()+' pcs','WEBSITE','fabricconsumption.vercel.app']
      ];
      meta.forEach((r,i)=>{
        const row=4+i, cols=[1,2,6,7,11,12];
        [[1,2],[6,7],[11,12]].forEach((pair,k)=>{
          const labelCell=ws.getCell(row,pair[0]),valueCell=ws.getCell(row,pair[1]);
          put(labelCell,r[k*2],{font:{bold:true,size:7,color:{argb:'FF'+navy}},fill:fill(pale),alignment:{horizontal:'left',indent:1}});
          put(valueCell,r[k*2+1],{font:{bold:true,size:8},alignment:{horizontal:'left',indent:1}});
          const endCol=pair[1]+3;safeMerge(row,pair[1],row,endCol);
          for(let c=pair[1]+1;c<=endCol;c++)ws.getCell(row,c).border=border;
          if(r[k*2]==='WEBSITE')valueCell.value={text:'fabricconsumption.vercel.app',hyperlink:'https://fabricconsumption.vercel.app/'},valueCell.font={name:'Arial',size:8,bold:true,color:{argb:'FF'+ '0563C1'},underline:true};
        });
        ws.getRow(row).height=24;
      });
      mergeText('A9:O9','FABRIC & MARKER DETAILS',{font:{bold:true,size:10,color:{argb:'FF'+white}},fill:fill(navy),alignment:{horizontal:'left',indent:1}});
      const heads=['SL','PARTS','FABRIC TYPE','MARKER LENGTH','CUT ALLOW L','MARKER WIDTH','CUT ALLOW W','GSM','NET / MARKER (KG)','PCS / MARKER','NET / DOZEN (KG)','CUTTING %','FINAL / DOZEN (KG)','REQ. DIA','DIA TYPE'];
      heads.forEach((v,i)=>put(ws.getCell(10,i+1),v,{font:{bold:true,size:8,color:{argb:'FF'+white}},fill:fill(navy)}));
      ws.getRow(10).height=34;
      data.forEach((x,i)=>{
        const r=11+i, values=[i+1,x.parts,x.fabric,x.ml,x.cla,x.mw,x.cwa,x.gsm,
          {formula:`(D${r}+E${r})*(F${r}+G${r})*H${r}/1550000`,result:x.netMarker},x.pcs,
          {formula:`IF(J${r}>0,I${r}*12/J${r},0)`,result:x.netDozen},x.cut/100,
          {formula:`K${r}*(1+L${r})`,result:x.finalDozen},x.dia,x.diaType];
        values.forEach((v,j)=>put(ws.getCell(r,j+1),v,{fill:[9,11,13].includes(j+1)?fill(green):null,numFmt:[4,5,6,7,8,9,11,13,14].includes(j+1)?'0.0000':j===11?'0.0%':undefined}));
        ws.getRow(r).height=22;
      });
      const dataEnd=10+data.length, totalRow=dataEnd+1;
      mergeText(`A${totalRow}:J${totalRow}`,'TOTAL FINAL CONSUMPTION / DOZEN',{font:{bold:true,color:{argb:'FF'+navy}},fill:fill(blue),alignment:{horizontal:'right',indent:1}});
      put(ws.getCell(totalRow,11),'TOTAL',{font:{bold:true,color:{argb:'FF'+navy}},fill:fill(blue)});
      put(ws.getCell(totalRow,12),{formula:data.length?data.map((_,i)=>'M'+(11+i)).join('+'):'0',result:result.grand},{font:{bold:true,color:{argb:'FF'+navy}},fill:fill(blue),numFmt:'0.0000'});
      mergeText(`M${totalRow}:O${totalRow}`,'KG / DOZEN',{font:{bold:true,color:{argb:'FF'+navy}},fill:fill(blue)});
      ws.getRow(totalRow).height=24;
      let row=totalRow+2;
      mergeText(`A${row}:O${row}`,'SIZE RATIO',{font:{bold:true,size:10,color:{argb:'FF'+white}},fill:fill(navy),alignment:{horizontal:'left',indent:1}});row++;
      mergeText(`A${row}:C${row}`,result.sizing.label||'RATIO (BODY+RIB)',{font:{bold:true,color:{argb:'FF'+navy}},fill:fill(blue)});
      sizes.forEach((x,i)=>put(ws.getCell(row,4+i),x.ratio,{font:{bold:true},fill:fill(pale)}));
      put(ws.getCell(row,4+sizes.length),result.sizing.totalRatio,{font:{bold:true,color:{argb:'FF'+navy}},fill:fill(blue)});
      put(ws.getCell(row,5+sizes.length),'TOTAL PCS',{font:{bold:true,color:{argb:'FF'+navy}},fill:fill(blue)});
      const sizeHead=row-1;mergeText(`A${sizeHead}:C${sizeHead}`,'SIZE',{font:{bold:true,color:{argb:'FF'+white}},fill:fill(navy)});
      sizes.forEach((x,i)=>put(ws.getCell(sizeHead,4+i),x.size,{font:{bold:true,color:{argb:'FF'+white}},fill:fill(navy)}));
      put(ws.getCell(sizeHead,4+sizes.length),'TOTAL PCS',{font:{bold:true,color:{argb:'FF'+white}},fill:fill(navy)});
      row+=2;
      mergeText(`A${row}:O${row}`,'FABRIC-WISE SUMMARY',{font:{bold:true,size:10,color:{argb:'FF'+white}},fill:fill(navy),alignment:{horizontal:'left',indent:1}});row++;
      const sumHeads=['SL','FABRIC TYPE','PARTS','NET ORDER (KG)','WASTAGE (KG)','FINAL REQUIREMENT (KG)','FINAL / DOZEN (KG)'];
      sumHeads.forEach((v,i)=>{if(i===0)put(ws.getCell(row,1),v,{font:{bold:true,color:{argb:'FF'+white}},fill:fill(navy)});else{safeMerge(row,i*2,i===1?row:row,i*2+1);put(ws.getCell(row,i*2),v,{font:{bold:true,color:{argb:'FF'+white}},fill:fill(navy)});}});
      const groups={};
      data.forEach(x=>{const k=x.fabric||'Unspecified';if(!groups[k])groups[k]={parts:[],net:0,waste:0,final:0,dozen:0};const g=groups[k];g.parts.push(x.parts||'—');g.net+=qty?x.netDozen*qty/12:0;const final=qty?x.finalDozen*qty/12:0;g.final+=final;g.waste+=Math.max(0,final-(qty?x.netDozen*qty/12:0));g.dozen+=x.finalDozen;});
      Object.entries(groups).forEach(([fabric,g],i)=>{
        row++;const vals=[i+1,fabric,[...new Set(g.parts)].join(', '),g.net,g.waste,g.final,g.dozen];
        put(ws.getCell(row,1),vals[0]);put(ws.getCell(row,2),vals[1]);safeMerge(row,2,row,3);
        for(let k=2;k<7;k++){const col=2+(k-1)*2;put(ws.getCell(row,col),vals[k],{numFmt:k>=3?'0.000':'General'});safeMerge(row,col,row,col+1);}
        ws.getRow(row).height=21;
      });
      row+=2;
      mergeText(`A${row}:O${row}`,'BOOKING SUMMARY',{font:{bold:true,size:10,color:{argb:'FF'+white}},fill:fill(navy),alignment:{horizontal:'left',indent:1}});row++;
      const metrics=[['TOTAL FINAL CONSUMPTION / DOZEN',result.grand,'0.0000 "kg/dz"'],['ORDER QUANTITY',qty,'#,##0 "pcs"'],['TOTAL FABRIC REQUIREMENT',result.requirement,'0.000 "kg"'],['FABRIC REQUIREMENT / GARMENT',qty?result.requirement/qty:0,'0.0000 "kg/pc"']];
      metrics.forEach((m,i)=>{const c=i*4+1;safeMerge(row,c,row,c+2);put(ws.getCell(row,c),m[0],{font:{bold:true,size:7,color:{argb:'FF'+navy}},fill:fill(pale),alignment:{horizontal:'left',indent:1}});safeMerge(row+1,c,row+1,c+2);put(ws.getCell(row+1,c),m[1],{font:{bold:true,size:13,color:{argb:'FF'+(i===2?'087443':navy)}},fill:fill(i===2?green:blue),numFmt:m[2]});});
      ws.getRow(row).height=20;ws.getRow(row+1).height=28;row+=3;
      mergeText(`A${row}:O${row}`,'CALCULATION METHOD',{font:{bold:true,size:9,color:{argb:'FF'+white}},fill:fill(navy),alignment:{horizontal:'left',indent:1}});row++;
      const formulas=['Net KG / Marker = (Marker Length + Cut Allow L) × (Marker Width + Cut Allow W) × GSM ÷ 1,550,000','Net KG / Dozen = Net KG / Marker × 12 ÷ PCS / Marker','Final KG / Dozen = Net KG / Dozen × (1 + Cutting % ÷ 100)','Total Fabric Requirement = Total Final KG / Dozen × Order Quantity ÷ 12'];
      formulas.forEach(t=>{mergeText(`A${row}:O${row}`,'• '+t,{font:{size:8,color:{argb:'FF'+ink}},fill:fill('F8FAFC'),alignment:{horizontal:'left',indent:1}});ws.getRow(row).height=19;row++;});
      row+=1;
      mergeText(`A${row}:O${row}`,'COMMENTS / REMARKS',{font:{bold:true,size:8,color:{argb:'FF'+grey}},fill:fill(pale),alignment:{horizontal:'left',indent:1}});
      ws.getRow(row+1).height=30;safeMerge(row+1,1,row+1,15);put(ws.getCell(row+1,1),'',{fill:fill('FFFFFF'),alignment:{vertical:'top',horizontal:'left',wrapText:true}});
      row+=3;
      mergeText(`A${row}:O${row}`,'IMPORTANT: Consumption estimate only. Verify marker measurements, GSM, cutting allowance, size ratio and order quantity against the approved marker and actual cutting-room consumption.',{font:{italic:true,size:8,color:{argb:'FF'+grey}},fill:fill(amber),alignment:{horizontal:'left',vertical:'middle',indent:1}});
      ws.getRow(row).height=32;row+=2;
      ['PREPARED BY','CHECKED BY','APPROVED BY'].forEach((label,i)=>{const c=i*5+1;safeMerge(row,c,row,c+3);put(ws.getCell(row,c),label,{font:{bold:true,size:8,color:{argb:'FF'+navy}},alignment:{horizontal:'left'}});safeMerge(row+1,c,row+1,c+3);put(ws.getCell(row+1,c),'',{border:{bottom:{style:'thin',color:{argb:'FF'+grey}}}});safeMerge(row+2,c,row+2,c+3);put(ws.getCell(row+2,c),'Name / Signature / Date',{font:{size:7,color:{argb:'FF'+grey}},alignment:{horizontal:'left'}});});
      ws.getRow(row+1).height=24;row+=4;
      mergeText(`A${row}:O${row}`,'Fabric Consumption · Garment Calculator Suite  |  '+dateText+' · '+timeText+'  |  fabricconsumption.vercel.app',{font:{size:8,color:{argb:'FF'+grey},underline:true},alignment:{horizontal:'center'}});
      ws.getCell(row,1).value={text:'Fabric Consumption · Garment Calculator Suite  |  '+dateText+' · '+timeText+'  |  fabricconsumption.vercel.app',hyperlink:'https://fabricconsumption.vercel.app/'};
      ws.getCell(row,1).font={name:'Arial',size:8,color:{argb:'FF0563C1'},underline:true};
      ws.pageSetup={paperSize:ws.PAPER_A4,orientation:'landscape',fitToPage:true,fitToWidth:1,fitToHeight:0};ws.pageSetup.margins={left:0.2,right:0.2,top:0.35,bottom:0.35,header:0.15,footer:0.15};
      ws.printArea='A1:O'+row;ws.headerFooter={oddFooter:'&LFabric Consumption · Factory Booking Report&CPage &P of &N'};
      // A second sheet keeps the marker calculation inputs and formula reference easy to audit.
      const cs=wb.addWorksheet('CALCULATION REFERENCE');
      [5,24,18,18,18,18].forEach((w,i)=>cs.getColumn(i+1).width=w);
      const cp=(cell,value,opts={})=>{put(cell,value,opts);};
      cs.mergeCells('A1:F1');cp(cs.getCell('A1'),'MARKER CONSUMPTION CALCULATION REFERENCE',{font:{bold:true,size:15,color:{argb:'FF'+white}},fill:fill(navy),alignment:{horizontal:'left',indent:1}});cs.getRow(1).height=30;
      ['SL','PART / FABRIC','MARKER LENGTH + ALLOW','MARKER WIDTH + ALLOW','GSM','NET KG / MARKER'].forEach((v,i)=>cp(cs.getCell(3,i+1),v,{font:{bold:true,color:{argb:'FF'+white}},fill:fill(navy)}));
      data.forEach((x,i)=>{const r=4+i,vals=[i+1,(x.parts||'')+' / '+(x.fabric||''),x.ml+x.cla,x.mw+x.cwa,x.gsm,{formula:`C${r}*D${r}*E${r}/1550000`,result:x.netMarker}];vals.forEach((v,j)=>cp(cs.getCell(r,j+1),v,{fill:j===5?fill(green):null,numFmt:j>=2?'0.0000':undefined}));});
      const cr=5+data.length;cs.mergeCells(cr,1,cr,5);cp(cs.getCell(cr,1),'FORMULA: (ML + CUT L) × (MW + CUT W) × GSM ÷ 1,550,000',{font:{bold:true,color:{argb:'FF'+navy}},fill:fill(blue),alignment:{horizontal:'left',indent:1}});cs.pageSetup={paperSize:cs.PAPER_A4,orientation:'landscape',fitToPage:true,fitToWidth:1,fitToHeight:1};cs.printArea='A1:F'+cr;
      const buffer=await wb.xlsx.writeBuffer(),blob=new Blob([buffer],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),url=URL.createObjectURL(blob),a=document.createElement('a');
      a.href=url;a.download='Fabric-Booking-Report.xlsx';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
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