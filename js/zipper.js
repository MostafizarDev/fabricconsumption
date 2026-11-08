// Zipper Consumption Planner — page-scoped calculator, history and PDF report.
(function(){
 'use strict';
 const $=id=>document.getElementById(id),root=()=>$('#page-zipper');
 const ids=['zp-buyer','zp-style','zp-po','zp-order-qty','zp-type','zp-material','zp-gauge','zp-color','zp-bl','zp-fnd','zp-hn','zp-shr','zp-direct-length','zp-direct-shr','zp-unit','zp-per-garment','zp-waste','zp-unit-price','zp-comments'];
let method='formula',lastResult=null;
 const num=id=>Math.max(0,Number($(id)?.value)||0),val=id=>$(id)?.value??'',fmt=(n,d=1)=>Number(n||0).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d}),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const cmToUnit=cm=>val('zp-unit')==='in'?cm/2.54:cm,unit=()=>val('zp-unit')||'cm',totalQty=()=>Math.floor(num('zp-order-qty')*Math.max(1,Math.floor(num('zp-per-garment'))));
 function status(message,type){const e=$('zp-status');if(e){e.textContent=message;e.className='zipper-inline-status'+(type?' is-'+type:'');}}
 function setText(id,value){const e=$(id);if(e)e.textContent=value;}
 function updateMethod(){
  const direct=method==='direct';$('zp-formula-fields').hidden=direct;$('zp-direct-fields').hidden=!direct;
  const inactive=direct?$('zp-formula-fields'):$('zp-direct-fields');
  inactive?.querySelectorAll('.is-missing').forEach(field=>{field.classList.remove('is-missing');field.setAttribute('aria-invalid','false');field.closest('label')?.classList.remove('has-error');});
  document.querySelectorAll('[data-zp-method]').forEach(b=>b.classList.toggle('is-active',b.dataset.zpMethod===method));
  setText('zp-formula-text',direct?'Use the finished zipper length measured from the approved sample. Shrinkage adjustment is applied to this measurement.':'Calculated length = (Body Length + High Neck − Front Neck Drop), adjusted by the entered shrinkage percentage.');
 }
 function updateUnits(){document.querySelectorAll('.zp-unit-label').forEach(e=>e.textContent=unit());}
 function clearResults(){
  ['zp-result','zp-result-cm','zp-with-waste','zp-total-qty','zp-total-length','zp-total-length-unit','zp-total-cost'].forEach(id=>setText(id,'—'));
  setText('zp-result-note','No calculation yet. Complete the order and measurement fields.');
  lastResult=null;
 }
 function collect(){
  const u=unit(),shrink=method==='direct'?num('zp-direct-shr'):num('zp-shr');
  const base=method==='direct'?num('zp-direct-length')*(u==='in'?2.54:1):(num('zp-bl')+num('zp-hn')-num('zp-fnd'))*(u==='in'?2.54:1);
  const finished=base*(1-shrink/100),waste=num('zp-waste');
  const baseQty=totalQty(),qty=Math.ceil(baseQty*(1+waste/100)),extraQty=qty-baseQty,price=num('zp-unit-price');
  return {baseCm:base,finishedCm:finished,baseQty,qty,extraQty,totalLengthCm:finished*qty,price,totalCost:price*qty,shrink,waste,perGarment:Math.max(1,Math.floor(num('zp-per-garment'))),inputUnit:u,method};
 }
 function validateRequiredFields(){
  const required=['zp-buyer','zp-style','zp-po','zp-order-qty','zp-type','zp-material','zp-gauge','zp-color',
   ...(method==='direct'?['zp-direct-length','zp-direct-shr']:['zp-bl','zp-fnd','zp-hn','zp-shr']),
   'zp-unit','zp-per-garment','zp-waste'];
  let firstMissing=null;
  required.forEach(id=>{
   const field=$(id);if(!field)return;
   const missing=String(field.value??'').trim()==='';
   field.classList.toggle('is-missing',missing);
   field.setAttribute('aria-invalid',missing?'true':'false');
   const label=field.closest('label');if(label)label.classList.toggle('has-error',missing);
   if(missing&&!firstMissing)firstMissing=field;
  });
  if(firstMissing){
   status('Please complete all required fields. Missing information is highlighted in red.','error');
   firstMissing.focus({preventScroll:true});
   firstMissing.scrollIntoView({behavior:'smooth',block:'center'});
   return false;
  }
  return true;
 }
 function clearFieldError(field){
  if(!field)return;
  if(String(field.value??'').trim()!==''){
   field.classList.remove('is-missing');field.setAttribute('aria-invalid','false');
   field.closest('label')?.classList.remove('has-error');
  }
 }
 function calculate(save=true){
  if(!root())return null;
  method=root().querySelector('[data-zp-method].is-active')?.dataset.zpMethod||method;
  if(!validateRequiredFields())return null;
  const qtyOrder=Math.floor(num('zp-order-qty'));
  const length=method==='direct'?num('zp-direct-length'):num('zp-bl')+num('zp-hn')-num('zp-fnd');
  const shrink=method==='direct'?num('zp-direct-shr'):num('zp-shr');
  if(!qtyOrder){status('Enter a valid total order quantity.','error');return null;}
  if(!length||length<=0){status(method==='direct'?'Enter a valid finished zipper length.':'Check the body length, high neck and front neck drop. Calculated zipper length must be greater than zero.','error');return null;}
  if(shrink>=100||num('zp-waste')>100){status('Shrinkage must be below 100% and wastage cannot exceed 100%.','error');return null;}
  if(!num('zp-per-garment')){status('Enter at least one zipper per garment.','error');return null;}
  const r=collect(),u=r.inputUnit;
  if(r.finishedCm<=0){status('Adjusted zipper length must be greater than zero.','error');return null;}
  setText('zp-result',fmt(cmToUnit(r.finishedCm),1)+' '+u);
  setText('zp-result-cm',fmt(r.finishedCm,2)+' cm reference');
  setText('zp-with-waste',r.extraQty.toLocaleString('en-US')+' pcs');
  setText('zp-total-qty',Math.round(r.qty).toLocaleString('en-US')+' pcs');
  setText('zp-total-length',fmt(cmToUnit(r.totalLengthCm),2));
  setText('zp-total-length-unit',u+' total incl. wastage');
  setText('zp-total-cost',r.price?fmt(r.totalCost,2):'Not entered');
  setText('zp-result-note','Order: '+qtyOrder.toLocaleString('en-US')+' pcs × '+r.perGarment+' zipper(s) per garment. Includes '+r.extraQty.toLocaleString('en-US')+' extra zipper(s) for wastage.');
  lastResult=r;status('Calculation complete. Review the result before exporting.','success');
  return r;
 }
 function demo(){
   const selectedMethod=root()?.querySelector('[data-zp-method].is-active')?.dataset.zpMethod||method;
   const sample={'zp-buyer':'DEMO BUYER','zp-style':'ZIP-DEMO-001','zp-po':'DEMO-PO-1200','zp-order-qty':'1200','zp-type':'Open-end / Separating','zp-material':'Nylon coil','zp-gauge':'#5','zp-color':'Black / 001','zp-bl':'68','zp-fnd':'8','zp-hn':'5','zp-shr':'0','zp-direct-length':'65','zp-direct-shr':'0','zp-unit':'cm','zp-per-garment':'1','zp-waste':'2','zp-unit-price':'18'};
   Object.entries(sample).forEach(([id,v])=>{const el=$(id);if(el){el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));}});
   method=selectedMethod;updateMethod();updateUnits();
   const result=calculate(true);
   if(!result){
    const r=collect();
    if(r.finishedCm>0&&r.baseQty>0){
     lastResult=r;
     setText('zp-result',fmt(cmToUnit(r.finishedCm),1)+' '+r.inputUnit);
     setText('zp-result-cm',fmt(r.finishedCm,2)+' cm reference');
     setText('zp-with-waste',r.extraQty.toLocaleString('en-US')+' pcs');
     setText('zp-total-qty',r.qty.toLocaleString('en-US')+' pcs');
     setText('zp-total-length',fmt(cmToUnit(r.totalLengthCm),2));
     setText('zp-total-length-unit',r.inputUnit+' total incl. wastage');
     setText('zp-total-cost',r.price?fmt(r.totalCost,2):'Not entered');
     setText('zp-result-note','Demo order: '+r.baseQty.toLocaleString('en-US')+' base zippers plus '+r.extraQty.toLocaleString('en-US')+' wastage pcs.');
     status('Demo calculation loaded successfully.','success');
    }else status('Demo inputs loaded, but calculation could not be completed. Check order quantity and zipper length.','error');
   }
  }
 function reset(){
  ids.forEach(id=>{const e=$(id);if(e)e.value='';});
  root()?.querySelectorAll('.is-missing').forEach(field=>{field.classList.remove('is-missing');field.setAttribute('aria-invalid','false');field.closest('label')?.classList.remove('has-error');});
  $('zp-type').value='Closed-end';$('zp-material').value='Nylon coil';$('zp-unit').value='cm';$('zp-per-garment').value='1';$('zp-waste').value='';method='formula';updateMethod();updateUnits();clearResults();
  status('All order details, specifications and calculation results have been cleared.');
 }
 function downloadReport(){
  const r=lastResult||calculate(false);if(!r)return;
  const date=new Date(),dateText=date.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
  const reportId='FC-ZIP-'+date.getFullYear()+String(date.getMonth()+1).padStart(2,'0')+String(date.getDate()).padStart(2,'0');
  const buyer=val('zp-buyer')||'—',style=val('zp-style')||'—',po=val('zp-po')||'—';
  const orderQty=Math.floor(num('zp-order-qty')),currency='BDT';
  const methodText=r.method==='direct'?'Direct Measurement':'Body / Neck Formula';
  const escPdf=esc;
  const info=[['Zipper Type',val('zp-type')||'—'],['Material / Teeth',val('zp-material')||'—'],['Gauge / Size',val('zp-gauge')||'—'],['Color / Code',val('zp-color')||'—'],['Measurement Method',methodText],['Measurement Unit',r.inputUnit],['Shrinkage Adjustment',r.shrink+'%'],['Wastage Allowance',r.waste+'%'],['Zippers per Garment',r.perGarment],['Base Zipper Quantity',r.baseQty.toLocaleString('en-US')+' pcs'],['Extra Zippers for Wastage',r.extraQty.toLocaleString('en-US')+' pcs'],['Total Zipper Quantity',r.qty.toLocaleString('en-US')+' pcs']];
  if(r.method==='formula'){
   info.splice(4,0,['Body Length',fmt(num('zp-bl'),2)+' '+r.inputUnit],['Front Neck Drop',fmt(num('zp-fnd'),2)+' '+r.inputUnit],['High Neck',fmt(num('zp-hn'),2)+' '+r.inputUnit]);
  }else info.splice(4,0,['Direct Finished Length',fmt(num('zp-direct-length'),2)+' '+r.inputUnit]);
  const infoCards=info.map(x=>'<div class="detail-item"><span>'+escPdf(x[0])+'</span><strong>'+escPdf(x[1])+'</strong></div>').join('');
  const formula=r.method==='direct'
   ?'Finished length = Direct measured length × (1 − Shrinkage % ÷ 100)'
   :'Finished length = (Body Length + High Neck − Front Neck Drop) × (1 − Shrinkage % ÷ 100)';
  const formulas=[formula,'Base zipper quantity = Order quantity × Zippers per garment','Wastage quantity = Base zipper quantity × Wastage %, rounded up to a whole zipper','Total zipper quantity = Base quantity + Wastage quantity','Total length required = Finished length per zipper × Total zipper quantity','Estimated cost = Total zipper quantity × Unit price (when entered)'];
  const reportCss='<style>'+
   '.zipper-pdf{font-family:Arial,Helvetica,sans-serif;color:#17243a;font-size:10px;line-height:1.45;padding:30px 34px;background:#fff}'+
   '.zipper-pdf .report-header{display:flex;justify-content:space-between;align-items:center;gap:20px;padding:4px 0 18px;border-bottom:3px solid #2563eb;margin-bottom:18px}'+
   '.zipper-pdf .brand{font-size:24px;font-weight:900;letter-spacing:-.8px;color:#101b30}.zipper-pdf .brand span{color:#168bd2}.zipper-pdf .subtitle{font-size:8px;letter-spacing:2.5px;font-weight:700;color:#8192aa;margin-top:3px}'+
   '.zipper-pdf .report-title{text-align:right}.zipper-pdf .eyebrow{font-size:8px;letter-spacing:1.8px;color:#2563eb;font-weight:800}.zipper-pdf h1{font-size:20px;line-height:1.2;margin:5px 0;color:#111d32}.zipper-pdf .report-id{font-size:8px;color:#8492a6}'+
   '.zipper-pdf .meta-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin:16px 0}.zipper-pdf .meta-grid>div{padding:10px 12px;border:1px solid #dce5ef;border-radius:7px;background:#f8fafc}.zipper-pdf .meta-grid span{display:block;font-size:7px;letter-spacing:.8px;color:#71819a;font-weight:700;text-transform:uppercase;margin-bottom:4px}.zipper-pdf .meta-grid strong{font-size:10px;color:#15233a;overflow-wrap:anywhere}'+
   '.zipper-pdf .qty-strip{display:grid;grid-template-columns:1.2fr 1fr 1fr;gap:12px;padding:12px 14px;margin:0 0 14px;border:1px solid #cfe1f6;border-radius:8px;background:#f7faff}.zipper-pdf .qty-strip span{display:block;font-size:7px;letter-spacing:.8px;color:#71819a;font-weight:800;margin-bottom:4px}.zipper-pdf .qty-strip strong{font-size:11px;color:#253650}.zipper-pdf .qty-strip .main strong{font-size:16px;color:#1769bd}'+
   '.zipper-pdf .section{border:1px solid #d9e3ef;border-radius:8px;overflow:hidden;margin:0 0 11px;page-break-inside:avoid}.zipper-pdf .section-head{padding:8px 12px;background:#f0f5ff;border-bottom:1px solid #d8e4f6;color:#172b4d;font-size:8px;font-weight:800;letter-spacing:1px}.zipper-pdf .details-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:0}.zipper-pdf .detail-item{padding:8px 10px;border-right:1px solid #e6edf5;border-bottom:1px solid #e6edf5;min-width:0}.zipper-pdf .detail-item:nth-child(4n){border-right:0}.zipper-pdf .detail-item span{display:block;font-size:7px;letter-spacing:.45px;color:#71819a;font-weight:700;text-transform:uppercase;margin-bottom:3px}.zipper-pdf .detail-item strong{display:block;font-size:9px;color:#26364d;overflow-wrap:anywhere}.zipper-pdf .summary-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin:14px 0}.zipper-pdf .summary-card{border:1px solid #dce5ef;border-radius:8px;padding:11px;background:#fff}.zipper-pdf .summary-card.primary{border-color:#91bdff;background:#eff6ff}.zipper-pdf .summary-card span{display:block;font-size:7px;letter-spacing:.8px;color:#64748b;font-weight:800}.zipper-pdf .summary-card strong{display:block;margin:7px 0 3px;font-size:17px;color:#15233a;overflow-wrap:anywhere}.zipper-pdf .summary-card.primary strong{color:#2563eb}.zipper-pdf .summary-card small{font-size:7px;color:#71819a}.zipper-pdf .formula{padding:8px 11px;font-size:8px;line-height:1.45}.zipper-pdf .formula p{padding:3px 8px;margin:2px 0;background:#f7f9fc;border-radius:4px;color:#475569}.zipper-pdf .zipper-comments .comments-body{min-height:48px;padding:10px 12px;font-size:9px;line-height:1.5;color:#34445b;white-space:pre-wrap;overflow-wrap:anywhere}.zipper-pdf .note{padding:10px 12px;border:1px solid #f4d37b;border-radius:7px;background:#fffbeb;color:#8a4b08;font-size:8px;margin:10px 0}.zipper-pdf .footer{display:flex;justify-content:space-between;border-top:1px solid #e2e8f0;margin-top:18px;padding-top:8px;color:#8492a6;font-size:7px}'+
   '@media print{.zipper-pdf{padding:0}}'+
   '</style>';
  const report='<div class="zipper-pdf">'+reportCss+
   '<div class="report-header"><div><div class="brand">FABRiCS <span>CONSUMPTiON</span></div><div class="subtitle">GARMENT CALCULATOR SUITE</div></div><div class="report-title"><div class="eyebrow">CALCULATION REPORT</div><h1>Zipper Consumption Report</h1><div class="report-id">'+reportId+'</div></div></div>'+
   '<div class="meta-grid"><div><span>BUYER NAME</span><strong>'+escPdf(buyer)+'</strong></div><div><span>STYLE NUMBER</span><strong>'+escPdf(style)+'</strong></div><div><span>PO / ORDER NUMBER</span><strong>'+escPdf(po)+'</strong></div></div>'+
   '<div class="qty-strip"><div class="main"><span>ORDER QUANTITY</span><strong>'+orderQty.toLocaleString('en-US')+' pcs</strong></div><div><span>REPORT DATE</span><strong>'+dateText+'</strong></div><div><span>REPORT CATEGORY</span><strong>ZIPPER CONSUMPTION</strong></div></div>'+
   '<section class="section"><div class="section-head">ZIPPER DETAILS & MEASUREMENT</div><div class="details-grid">'+infoCards+'</div></section>'+
   '<div class="summary-grid"><div class="summary-card"><span>FINISHED LENGTH / ZIPPER</span><strong>'+fmt(cmToUnit(r.finishedCm),1)+' '+r.inputUnit+'</strong><small>After shrinkage adjustment</small></div><div class="summary-card"><span>TOTAL ZIPPER QUANTITY</span><strong>'+r.qty.toLocaleString('en-US')+' pcs</strong><small>Including wastage allowance</small></div><div class="summary-card primary"><span>TOTAL LENGTH REQUIRED</span><strong>'+fmt(r.totalLengthCm/100,2)+' m'+'</strong><small>For complete order quantity</small></div></div>'+
   '<section class="section"><div class="section-head">CALCULATION METHOD & FORMULA</div><div class="formula"><strong>'+methodText+'</strong>'+formulas.map(x=>'<p>'+escPdf(x)+'</p>').join('')+'</div></section>'+
   '<section class="section zipper-comments"><div class="section-head">COMMENTS</div><div class="comments-body">'+(val('zp-comments').trim()?escPdf(val('zp-comments').trim()).replace(/\\n/g,'<br>'):'&nbsp;')+'</div></section>'+
   '<div class="note"><strong>PRODUCTION NOTE:</strong> This report is a consumption estimate. Confirm zipper length, construction, shrinkage and supplier specification against the approved sample before bulk production.</div>'+
   '<div class="footer"><span>FABRiCS CONSUMPTiON · ZIPPER REPORT</span><span>Generated '+dateText+' · '+reportId+'</span></div></div>';
  if(typeof generatePDF==='function')generatePDF('Zipper Consumption Report',report);else window.print();
 }
 function init(){
  if(!root()||root().dataset.zipperInitialized==='true')return;
  root().dataset.zipperInitialized='true';
  updateMethod();updateUnits();
  // All controls use the delegated handlers below to avoid duplicate click actions.
  if(window.lucide?.createIcons)window.lucide.createIcons();
 }
 // Delegated controls: resilient to page re-rendering and script initialization order.
 if(!window.__zipperPlannerEvents){
  window.__zipperPlannerEvents=true;
  document.addEventListener('click',e=>{
   const t=e.target.closest('#page-zipper button');if(!t)return;
   if(t.id==='zp-demo'){demo();return;}
   if(t.id==='zp-reset'){reset();return;}
   if(t.id==='btn-calc-zipper'){calculate(true);return;}
   if(t.id==='btn-pdf-zipper'){downloadReport();return;}
   if(t.dataset.zpMethod){method=t.dataset.zpMethod;updateMethod();clearResults();return;}
  });
  document.addEventListener('input',e=>{if(!e.target.closest('#page-zipper'))return;clearFieldError(e.target);if(lastResult)clearResults();});
  document.addEventListener('change',e=>{if(!e.target.closest('#page-zipper'))return;clearFieldError(e.target);if(e.target.id==='zp-unit'){updateUnits();clearResults();}});
 }
 window.calcZipper=()=>calculate(false);
 window.updateZipper=()=>calculate(false);
 window.downloadZipperReport=downloadReport;
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();