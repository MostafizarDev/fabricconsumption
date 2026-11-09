// ============================================
// WOVEN SHIRT.JS — Woven Shirt Consumption Workspace
// Formula intentionally preserved from the original Woven Shirt calculator.
// Body / dozen = (BL × HC × 2 × 12) / (Fabric Width × 36 × 2.54)
// Sleeve / dozen = (SL × AH × 2 × 2 × 12) / (Fabric Width × 36 × 2.54)
// ============================================
(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const INPUT_IDS = ['ws-bl','ws-bla','ws-hc','ws-hca','ws-sl','ws-sla','ws-ah','ws-aha','ws-fw'];
  const REPORT_IDS = ['ws-report-buyer','ws-report-style','ws-report-po','ws-report-type'];
  const RECENT_KEY = 'fabricConsumption.wovenShirtRecent.v1';
  const REPORT_KEY = 'fabricConsumption.wovenShirtReportInfo.v1';
  const DEMO = {
    'ws-bl':'79','ws-bla':'6','ws-hc':'52','ws-hca':'6',
    'ws-sl':'59','ws-sla':'6','ws-ah':'20','ws-aha':'5','ws-fw':'55'
  };
  let lastResult = null;
  let demoSnapshot = null;

  const number = id => {
    const node = $(id);
    if (!node || String(node.value).trim() === '') return null;
    const value = Number(node.value);
    return Number.isFinite(value) ? value : null;
  };
  const fmt = (value, digits = 3) => Number.isFinite(value)
    ? value.toLocaleString('en-US',{minimumFractionDigits:digits,maximumFractionDigits:digits})
    : '—';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[ch]));
  const setText = (id, value) => { const node=$(id); if(node) node.textContent=value; };

  function getReportInfo() {
    try {
      const data=JSON.parse(localStorage.getItem(REPORT_KEY)||'{}');
      return {
        buyer:String(data.buyer||''),style:String(data.style||''),
        po:String(data.po||''),type:String(data.type||'Woven Shirt')
      };
    } catch (_) { return {buyer:'',style:'',po:'',type:'Woven Shirt'}; }
  }
  function saveReportInfo(info) {
    try { localStorage.setItem(REPORT_KEY,JSON.stringify(info)); return true; }
    catch (_) { alert('Could not save Report Information. Please check browser storage settings.'); return false; }
  }
  function readInputs() {
    const values={};
    INPUT_IDS.forEach(id=>{values[id]=$(id)?.value ?? '';});
    REPORT_IDS.forEach(id=>{values[id]=$(id)?.value ?? '';});
    return values;
  }
  function applyInputs(values) {
    Object.keys(values||{}).forEach(id=>{const node=$(id);if(node)node.value=values[id]??'';});
    updateWovenTotals();
  }
  function updateWovenTotals() {
    [
      ['ws-bl','ws-bla','ws-blt'],['ws-hc','ws-hca','ws-hct'],
      ['ws-sl','ws-sla','ws-slt'],['ws-ah','ws-aha','ws-aht']
    ].forEach(([a,b,target])=>{
      const total=(number(a)||0)+(number(b)||0);
      setText(target,fmt(total,1)+' cm');
    });
    calcWoven();
  }

  function showValidation(type,message) {
    const box=$('ws-validation');
    const note=$('ws-result-note');
    if(box) box.innerHTML='<div class="pant-validation-item '+type+'">'+esc(message)+'</div>';
    if(note) note.textContent=message;
  }
  function clearResults() {
    ['ws-r-total','ws-r-pc','ws-r-body','ws-r-sleeve','ws-r-width'].forEach((id,i)=>{
      const suffix=[' yds/dz',' yds',' yds',' yds',' inch'][i];
      setText(id,'—'+suffix);
    });
    lastResult=null;
  }

  function calcWoven() {
    const required=['ws-bl','ws-hc','ws-sl','ws-ah','ws-fw'];
    const missing=required.filter(id=>number(id)===null||number(id)<=0);
    const allowanceIds=['ws-bla','ws-hca','ws-sla','ws-aha'];
    const invalidAllowances=allowanceIds.filter(id=>number(id)!==null&&number(id)<0);
    if(missing.length||invalidAllowances.length){
      clearResults();
      if(invalidAllowances.length) showValidation('error','Seam allowance cannot be negative. Enter zero or a positive value.');
      else showValidation('info','Enter positive Body Length, ½ Chest, Sleeve Length, Armhole Straight and Fabric Width to calculate.');
      return null;
    }

    const FW=number('ws-fw');
    const BL=number('ws-bl')+(number('ws-bla')||0);
    const HC=number('ws-hc')+(number('ws-hca')||0);
    const SL=number('ws-sl')+(number('ws-sla')||0);
    const AH=number('ws-ah')+(number('ws-aha')||0);

    // Original Woven Shirt formula: do not change its constants or calculation basis.
    const div=FW*36*2.54;
    const bodyDz=(BL*HC*2*12)/div;
    const sleeveDz=(SL*AH*2*2*12)/div;
    const totalDz=bodyDz+sleeveDz;
    const perPiece=totalDz/12;

    if(![bodyDz,sleeveDz,totalDz,perPiece].every(Number.isFinite)){
      clearResults();
      showValidation('error','Unable to calculate. Please check the entered measurements and fabric width.');
      return null;
    }

    setText('ws-r-body',fmt(bodyDz)+' yds');
    setText('ws-r-sleeve',fmt(sleeveDz)+' yds');
    setText('ws-r-total',fmt(totalDz)+' yds/dz');
    setText('ws-r-pc',fmt(perPiece)+' yds');
    setText('ws-r-width',fmt(FW,1)+' inch');
    showValidation('success','Calculation updated. Results are shown in yards per dozen and yards per piece. No wastage or GSM factor is applied.');
    lastResult={BL,HC,SL,AH,FW,bodyDz,sleeveDz,totalDz,perPiece,raw:{
      bodyLength:number('ws-bl'),bodyAllowance:number('ws-bla')||0,
      chest:number('ws-hc'),chestAllowance:number('ws-hca')||0,
      sleeveLength:number('ws-sl'),sleeveAllowance:number('ws-sla')||0,
      armhole:number('ws-ah'),armholeAllowance:number('ws-aha')||0
    },reportInfo:getReportInfo()};
    return lastResult;
  }

  function resetWoven() {
    INPUT_IDS.forEach(id=>{if($(id))$(id).value='';});
    REPORT_IDS.forEach(id=>{if($(id))$(id).value='';});
    saveReportInfo({buyer:'',style:'',po:'',type:'Woven Shirt'});
    demoSnapshot=null;
    const demo=$('ws-demo');
    if(demo){demo.classList.remove('is-active');demo.setAttribute('aria-pressed','false');}
    updateWovenTotals();
    showValidation('info','Measurements reset. Enter new values to calculate.');
  }

  function captureState() {
    return {values:readInputs(),savedAt:new Date().toISOString()};
  }
  function applyState(state) {
    if(!state||!state.values)return;
    applyInputs(state.values);
    const info={
      buyer:state.values['ws-report-buyer']||'',
      style:state.values['ws-report-style']||'',
      po:state.values['ws-report-po']||'',
      type:state.values['ws-report-type']||'Woven Shirt'
    };
    saveReportInfo(info);
  }
  function readRecent() {
    try { const list=JSON.parse(localStorage.getItem(RECENT_KEY)||'[]');return Array.isArray(list)?list:[]; }
    catch (_) { return []; }
  }
  function saveRecent(openPanel=false) {
    const state=captureState(),info=getReportInfo();
    const item={
      id:'woven-'+Date.now(),
      title:(info.style||'Untitled Style').trim(),
      buyer:info.buyer,po:info.po,type:info.type,
      width:number('ws-fw')||'',state
    };
    try { localStorage.setItem(RECENT_KEY,JSON.stringify([item,...readRecent()].slice(0,5))); }
    catch (_) { alert('Could not save Recent calculations. Browser storage may be full or disabled.');return; }
    renderRecent();
    if(openPanel&&$('ws-recent-panel'))$('ws-recent-panel').hidden=false;
  }
  function renderRecent() {
    const panel=$('ws-recent-panel');
    if(!panel)return;
    const items=readRecent();
    panel.innerHTML='<div class="knit-recent-head"><span>Recent Calculations · Last 5</span><button type="button" class="knit-recent-load" id="ws-save-current">Save Current</button></div>'+
      (items.length?items.map(item=>'<div class="knit-recent-item"><div class="knit-recent-info"><strong>'+esc(item.title||'Untitled Style')+' · '+esc(item.type||'Woven Shirt')+'</strong><small>'+(item.buyer?esc(item.buyer)+' · ':'')+esc(item.po?'PO: '+item.po:'No PO')+' · '+esc(item.width?item.width+' in width':'Width not set')+' · '+esc(item.state?.savedAt?new Date(item.state.savedAt).toLocaleString():'Saved')+'</small></div><div class="knit-recent-actions"><button type="button" class="knit-recent-load" data-load-ws-recent="'+esc(item.id)+'">Load</button><button type="button" class="knit-recent-delete" data-delete-ws-recent="'+esc(item.id)+'" title="Remove from Recent">×</button></div></div>').join(''):'<div class="knit-recent-empty">No saved calculations yet. Click “Save Current” to keep this calculation.</div>');
    $('ws-save-current')?.addEventListener('click',()=>saveRecent(true));
    panel.querySelectorAll('[data-load-ws-recent]').forEach(button=>button.addEventListener('click',()=>{
      const item=readRecent().find(x=>x.id===button.dataset.loadWsRecent);
      if(item){applyState(item.state);panel.hidden=true;$('ws-recent-open')?.classList.remove('is-active');$('ws-recent-open')?.setAttribute('aria-expanded','false');}
    }));
    panel.querySelectorAll('[data-delete-ws-recent]').forEach(button=>button.addEventListener('click',()=>{
      try{localStorage.setItem(RECENT_KEY,JSON.stringify(readRecent().filter(x=>x.id!==button.dataset.deleteWsRecent)));renderRecent();}
      catch(_){alert('Could not update Recent calculations.');}
    }));
  }

  function openReportModal() {
    const modal=$('ws-report-modal');
    if(!modal)return;
    const info=getReportInfo();
    $('ws-report-buyer').value=info.buyer;
    $('ws-report-style').value=info.style;
    $('ws-report-po').value=info.po;
    $('ws-report-type').value=info.type||'Woven Shirt';
    modal.hidden=false;
    modal.setAttribute('aria-hidden','false');
  }
  function closeReportModal() {
    const modal=$('ws-report-modal');
    if(!modal)return;
    modal.hidden=true;
    modal.setAttribute('aria-hidden','true');
  }
  function saveModalInfo() {
    const info={
      buyer:$('ws-report-buyer')?.value.trim()||'',
      style:$('ws-report-style')?.value.trim()||'',
      po:$('ws-report-po')?.value.trim()||'',
      type:$('ws-report-type')?.value.trim()||'Woven Shirt'
    };
    if(!saveReportInfo(info))return;
    showValidation('success','Report information saved. These details will appear in your PDF report.');
    closeReportModal();
  }

  function downloadWovenReport() {
    const result=calcWoven();
    if(!result){
      alert('Please complete all required measurements and calculate a valid result before exporting the report.');
      return;
    }
    const info=getReportInfo();
    const now=new Date();
    const dateText=now.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
    const timeText=now.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
    const reportId='FC-WOVEN-'+now.getFullYear()+String(now.getMonth()+1).padStart(2,'0')+String(now.getDate()).padStart(2,'0')+'-'+String(now.getHours()).padStart(2,'0')+String(now.getMinutes()).padStart(2,'0');
    const filePart=value=>String(value||'').trim().replace(/[^a-z0-9-_]+/gi,'_').replace(/^_+|_+$/g,'').slice(0,40);
    const fileName=['FC',filePart(info.buyer),filePart(info.style),filePart(info.po)?'PO'+filePart(info.po).replace(/^PO[_-]?/i,''):'',reportId].filter(Boolean).join('_');
    const report=
      '<div class="report">'+
      '<div class="report-header"><div><div class="brand">FABRiCS <span>CONSUMPTiON</span></div><div class="subtitle">GARMENT CALCULATOR SUITE</div></div><div class="report-title"><div class="eyebrow">CALCULATION REPORT</div><h1>Woven Shirt Fabric Consumption</h1><div class="report-id">'+reportId+'</div></div></div>'+
      '<div class="meta-grid"><div><span>Report Date</span><strong>'+dateText+'</strong></div><div><span>Time</span><strong>'+timeText+'</strong></div><div><span>Fabric Width</span><strong>'+fmt(result.FW,1)+' inch</strong></div><div><span>Calculation Unit</span><strong>Yards / Dozen</strong></div></div>'+
      '<section class="section"><div class="section-head"><span>ORDER INFORMATION</span></div><div class="info-grid"><div><span>Buyer Name</span><strong>'+(esc(info.buyer)||'________________')+'</strong></div><div><span>Style No.</span><strong>'+(esc(info.style)||'________________')+'</strong></div><div><span>PO / Order No.</span><strong>'+(esc(info.po)||'________________')+'</strong></div><div><span>Shirt Type</span><strong>'+esc(info.type||'Woven Shirt')+'</strong></div></div></section>'+
      '<section class="section"><div class="section-head"><span>MEASUREMENT DETAILS</span></div><table class="consumption-table"><thead><tr><th>SL</th><th>Component</th><th>Base Measurement</th><th>Allowance</th><th>Final Measurement</th><th>Consumption / Dozen</th></tr></thead><tbody>'+
      '<tr><td>01</td><td><strong>Body</strong></td><td>Length '+fmt(result.raw.bodyLength,1)+' cm × ½ Chest '+fmt(result.raw.chest,1)+' cm</td><td>Length '+fmt(result.raw.bodyAllowance,1)+' cm · Chest '+fmt(result.raw.chestAllowance,1)+' cm</td><td>'+fmt(result.BL,1)+' × '+fmt(result.HC,1)+' cm</td><td><strong>'+fmt(result.bodyDz)+' yds</strong></td></tr>'+
      '<tr><td>02</td><td><strong>Sleeve</strong></td><td>Length '+fmt(result.raw.sleeveLength,1)+' cm × Armhole '+fmt(result.raw.armhole,1)+' cm</td><td>Length '+fmt(result.raw.sleeveAllowance,1)+' cm · Armhole '+fmt(result.raw.armholeAllowance,1)+' cm</td><td>'+fmt(result.SL,1)+' × '+fmt(result.AH,1)+' cm</td><td><strong>'+fmt(result.sleeveDz)+' yds</strong></td></tr>'+
      '</tbody></table></section>'+
      '<section class="section"><div class="section-head"><span>CALCULATION FORMULA</span></div><div class="formula-text"><strong>Body / Dozen</strong><br>('+fmt(result.BL,1)+' × '+fmt(result.HC,1)+' × 2 × 12) ÷ ('+fmt(result.FW,1)+' × 36 × 2.54) = '+fmt(result.bodyDz)+' yds<br><br><strong>Sleeve / Dozen</strong><br>('+fmt(result.SL,1)+' × '+fmt(result.AH,1)+' × 2 × 2 × 12) ÷ ('+fmt(result.FW,1)+' × 36 × 2.54) = '+fmt(result.sleeveDz)+' yds<br><br><strong>Total</strong><br>'+fmt(result.bodyDz)+' + '+fmt(result.sleeveDz)+' = '+fmt(result.totalDz)+' yds/dozen<br><strong>Per Piece</strong><br>'+fmt(result.totalDz)+' ÷ 12 = '+fmt(result.perPiece)+' yds/pc</div></section>'+
      '<div class="summary-grid"><div class="summary-card"><div class="metric-head"><span>BODY / DOZEN</span></div><strong>'+fmt(result.bodyDz)+' yds</strong><small>Body consumption</small></div><div class="summary-card"><div class="metric-head"><span>SLEEVE / DOZEN</span></div><strong>'+fmt(result.sleeveDz)+' yds</strong><small>Sleeve consumption</small></div><div class="summary-card primary"><div class="metric-head"><span>TOTAL / DOZEN</span></div><strong>'+fmt(result.totalDz)+' yds</strong><small>Body + Sleeve</small></div><div class="summary-card"><div class="metric-head"><span>PER PIECE</span></div><strong>'+fmt(result.perPiece)+' yds</strong><small>Total ÷ 12</small></div></div>'+
      '<section class="comments-section"><div class="comments-title">COMMENTS:</div><div class="comments-writing-area"></div></section>'+
      '<div class="note"><div><strong>CALCULATION NOTE:</strong> Original Woven Shirt formula retained. Output is yards per dozen and yards per piece. GSM, order quantity and wastage are not included in this formula.</div></div>'+
      '<div class="approval-grid"><div><span>PREPARED BY</span><strong></strong></div><div><span>CHECKED BY</span><strong></strong></div><div><span>APPROVED BY</span><strong></strong></div></div>'+
      '<div class="report-footer"><span>Fabrics Consumption • Garment Calculator Suite</span><span>'+dateText+' · '+timeText+' · <a href="https://fabricconsumption.vercel.app/" target="_blank" rel="noopener noreferrer">fabricconsumption.vercel.app</a></span></div></div>';
    if(typeof generatePDF==='function')generatePDF(fileName,report);else window.print();
  }

  document.addEventListener('DOMContentLoaded',function(){
    const demo=$('ws-demo');
    demo?.addEventListener('click',()=>{
      if(!demoSnapshot){
        demoSnapshot=captureState();
        Object.keys(DEMO).forEach(id=>{if($(id))$(id).value=DEMO[id];});
        demo.classList.add('is-active');demo.setAttribute('aria-pressed','true');
        updateWovenTotals();
      }else{
        const snapshot=demoSnapshot;demoSnapshot=null;
        applyState(snapshot);demo.classList.remove('is-active');demo.setAttribute('aria-pressed','false');
      }
    });
    $('ws-reset')?.addEventListener('click',resetWoven);
    $('ws-recent-open')?.addEventListener('click',()=>{
      const panel=$('ws-recent-panel');if(!panel)return;
      const open=panel.hidden;renderRecent();panel.hidden=!open;
      $('ws-recent-open').classList.toggle('is-active',open);
      $('ws-recent-open').setAttribute('aria-expanded',String(open));
    });
    $('ws-report-settings')?.addEventListener('click',openReportModal);
    document.querySelectorAll('[data-close-ws-modal]').forEach(node=>node.addEventListener('click',closeReportModal));
    $('ws-report-save')?.addEventListener('click',saveModalInfo);
    renderRecent();
    updateWovenTotals();
  });

  window.updateWovenTotals=updateWovenTotals;
  window.calcWoven=calcWoven;
  window.downloadWovenReport=downloadWovenReport;
})();
