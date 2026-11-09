// WOVEN T-SHIRT FABRIC CONSUMPTION — pattern-area estimate (yards / meters)
'use strict';
let wovenUnit='cm';
const WS_RECENT_KEY='fabricConsumption.wovenTshirtRecent.v1';
const WS_REPORT_KEY='fabricConsumption.wovenTshirtReportInfo.v1';
const WS_COMPONENTS=[
 {key:'front',name:'Front Body',qty:1,enabled:'ws-on-front'},
 {key:'back',name:'Back Body',qty:1,enabled:'ws-on-back'},
 {key:'sleeve',name:'Sleeve',qty:2,enabled:'ws-on-sleeve'},
 {key:'neck',name:'Neck Binding / Collar',qty:1,enabled:'ws-on-neck'},
 {key:'pocket',name:'Pocket',qty:1,enabled:'ws-on-pocket'},
 {key:'placket',name:'Placket',qty:1,enabled:'ws-on-placket'}
];
const WS_INPUTS=['ws-qty','ws-fw','ws-eff','ws-waste',...WS_COMPONENTS.flatMap(c=>['ws-'+c.key+'-l','ws-'+c.key+'-la','ws-'+c.key+'-w','ws-'+c.key+'-wa'])];
let wsDemoSnapshot=null,wsLastResult=null;
function wsNum(id){const n=parseFloat(el(id)?.value);return Number.isFinite(n)?n:0}
function wsToCm(n){return wovenUnit==='inch'?n*2.54:n}
function wsUnitUI(){document.querySelectorAll('[data-ws-unit]').forEach(b=>{const active=b.dataset.wsUnit===wovenUnit;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))});if(el('ws-unit'))el('ws-unit').value=wovenUnit;document.querySelectorAll('#page-woven .ws-unit-label').forEach(x=>x.textContent=wovenUnit==='inch'?'inch':'cm')}
function wsCapture(){const values={},checks={};WS_INPUTS.forEach(id=>values[id]=el(id)?.value??'');WS_COMPONENTS.forEach(c=>checks[c.enabled]=!!el(c.enabled)?.checked);return{values,checks,unit:wovenUnit,savedAt:new Date().toISOString()}}
function wsApply(s){if(!s)return;Object.entries(s.values||{}).forEach(([id,v])=>{if(el(id))el(id).value=v});Object.entries(s.checks||{}).forEach(([id,v])=>{if(el(id))el(id).checked=!!v});wovenUnit=s.unit==='inch'?'inch':'cm';wsUnitUI();calcWoven()}
function wsRecent(){try{const x=JSON.parse(localStorage.getItem(WS_RECENT_KEY)||'[]');return Array.isArray(x)?x:[]}catch(_){return[]}}
function wsReadInfo(){try{return JSON.parse(localStorage.getItem(WS_REPORT_KEY)||'{}')}catch(_){return{}}}
function wsSaveRecent(){const state=wsCapture(),info=wsReadInfo(),item={id:'ws-'+Date.now(),title:info.style||'Woven T-shirt',buyer:info.buyer||'',po:info.po||'',qty:state.values['ws-qty'],state};try{localStorage.setItem(WS_RECENT_KEY,JSON.stringify([item,...wsRecent()].slice(0,5)));wsRenderRecent()}catch(_){alert('Could not save Recent calculation. Check browser storage.')}}
function wsRenderRecent(){const p=el('ws-recent-panel');if(!p)return;const esc=s=>String(s||'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));const items=wsRecent();p.innerHTML='<div class="knit-recent-head"><span>Recent Calculations · Last 5</span><button type="button" class="knit-recent-load" id="ws-save-current">Save Current</button></div>'+(items.length?items.map(x=>'<div class="knit-recent-item"><div class="knit-recent-info"><strong>'+esc(x.title)+(x.qty?' · '+esc(x.qty)+' pcs':'')+'</strong><small>'+esc(x.buyer?x.buyer+' · ':'')+esc(x.po?'PO: '+x.po+' · ':'')+esc(new Date(x.state.savedAt).toLocaleString())+'</small></div><div class="knit-recent-actions"><button type="button" class="knit-recent-load" data-ws-load="'+esc(x.id)+'">Load</button><button type="button" class="knit-recent-delete" data-ws-delete="'+esc(x.id)+'" title="Remove from Recent">×</button></div></div>').join(''):'<div class="knit-recent-empty">No saved calculations yet.</div>');el('ws-save-current').onclick=wsSaveRecent;p.querySelectorAll('[data-ws-load]').forEach(b=>b.onclick=()=>{const x=wsRecent().find(v=>v.id===b.dataset.wsLoad);if(x){wsApply(x.state);p.hidden=true}});p.querySelectorAll('[data-ws-delete]').forEach(b=>b.onclick=()=>{localStorage.setItem(WS_RECENT_KEY,JSON.stringify(wsRecent().filter(v=>v.id!==b.dataset.wsDelete)));wsRenderRecent()})}
function calcWoven(){
 const qty=wsNum('ws-qty'),width=wsToCm(wsNum('ws-fw')),eff=wsNum('ws-eff'),wastePct=Math.max(0,wsNum('ws-waste'));
 const baseValid=qty>0&&width>0&&eff>0&&eff<=100;
 const rows=[],missing=[];let area=0;
 WS_COMPONENTS.forEach(c=>{if(!el(c.enabled)?.checked)return;const prefix='ws-'+c.key+'-';const l=wsToCm(wsNum(prefix+'l')+wsNum(prefix+'la')),w=wsToCm(wsNum(prefix+'w')+wsNum(prefix+'wa'));if(l<=0||w<=0){missing.push(c.name);return}const a=l*w*c.qty;area+=a;rows.push({name:c.name,qty:c.qty,l,w,area:a})});
 // Pattern area (cm²) / cuttable width (cm) gives linear cm.
 // Divide by 100 for metres, then correct for marker utilization.
 const netMeters=baseValid&&area>0?(area/width/100)/(eff/100):0;
 const netYards=netMeters/0.9144,finalYards=netYards*(1+wastePct/100),finalOrder=finalYards*qty,wasteYards=finalYards-netYards;
 const valid=baseValid&&rows.length>0&&missing.length===0;
 wsLastResult={qty,width,eff,wastePct,area,netMeters,netYards,finalYards,finalOrder,wasteYards,rows,missing,valid};
 const put=(id,value)=>set(id,value);
 put('ws-r-order',valid?fmt(finalOrder,2):'—');put('ws-r-pc',valid?fmt(netYards,4)+' yds':'— yds');put('ws-r-final-pc',valid?fmt(finalYards,4)+' yds':'— yds');put('ws-r-dz',valid?fmt(finalYards*12,3)+' yds':'— yds');put('ws-r-net',valid?fmt(netYards*qty,2)+' yds':'— yds');put('ws-r-waste',valid?fmt(wasteYards*qty,2)+' yds':'— yds');
 const panel=el('ws-component-results');
 if(panel){panel.innerHTML=rows.length?rows.map(r=>'<div class="woven-result-row"><span>'+r.name+' ('+r.qty+' pcs)</span><strong>'+fmt((r.area/width/100)/(eff/100)/0.9144,4)+' yds/pc</strong></div>').join(''):'<div class="woven-empty">Enable components and enter pattern measurements.</div>';if(missing.length)panel.insertAdjacentHTML('beforeend','<div class="woven-empty" style="color:#b45309">Complete measurements for: '+missing.join(', ')+'</div>');if(!baseValid)panel.insertAdjacentHTML('beforeend','<div class="woven-empty">Enter order quantity, cuttable width and marker efficiency.</div>')}
 return wsLastResult;
}
function downloadWovenReport(){
 const r=calcWoven();if(!r.valid){alert('Please enter order quantity, cuttable width, marker efficiency and all enabled component measurements.');return}
 const info=wsReadInfo(),esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const rows=r.rows.map(x=>'<tr><td>'+esc(x.name)+'</td><td>'+x.qty+'</td><td>'+fmt(x.l,1)+' cm</td><td>'+fmt(x.w,1)+' cm</td><td>'+fmt(x.area,0)+' cm²</td></tr>').join('');
 const report='<div class="report"><div class="report-header"><div><div class="brand">FABRiCS <span>CONSUMPTiON</span></div><div class="subtitle">GARMENT CALCULATOR SUITE</div></div><div class="report-title"><div class="eyebrow">CALCULATION REPORT</div><h1>Woven T-shirt Fabric Consumption</h1><div class="report-id">PATTERN AREA ESTIMATE</div></div></div><section class="section"><div class="section-head">ORDER INFORMATION</div><div class="info-grid"><div><span>Buyer</span><strong>'+esc(info.buyer||'—')+'</strong></div><div><span>Style</span><strong>'+esc(info.style||'—')+'</strong></div><div><span>PO / Order</span><strong>'+esc(info.po||'—')+'</strong></div><div><span>Garment Type</span><strong>'+esc(info.type||'Woven T-shirt')+'</strong></div><div><span>Order Quantity</span><strong>'+r.qty+' pcs</strong></div><div><span>Cuttable Width</span><strong>'+fmt(r.width,1)+' cm</strong></div></div></section><section class="section"><div class="section-head">COMPONENT PATTERN AREA</div><table><thead><tr><th>Component</th><th>Pieces / pc</th><th>Length incl. SA</th><th>Width incl. SA</th><th>Area</th></tr></thead><tbody>'+rows+'</tbody></table></section><div class="summary-grid"><div class="summary-card"><span>Layout Utilization</span><strong>'+fmt(r.eff,1)+'%</strong></div><div class="summary-card"><span>Cutting Wastage</span><strong>'+fmt(r.wastePct,1)+'%</strong></div><div class="summary-card"><span>Final / Piece</span><strong>'+fmt(r.finalYards,4)+' yds</strong></div><div class="summary-card primary"><span>FINAL ORDER LENGTH</span><strong>'+fmt(r.finalOrder,2)+' yds</strong></div></div><div class="note">Estimation only. Pattern-area utilization is an estimate based on rectangular component dimensions and the entered layout utilization factor. It is not a substitute for an approved CAD marker. Confirm against actual marker length and cuttable width before bulk booking.</div></div>';
 if(typeof generatePDF==='function')generatePDF('Woven_Tshirt_Consumption_Report',report);else alert('PDF generator is not available.');
}
document.addEventListener('DOMContentLoaded',()=>{
 document.querySelectorAll('[data-ws-unit]').forEach(b=>b.addEventListener('click',()=>{wovenUnit=b.dataset.wsUnit==='inch'?'inch':'cm';wsUnitUI();calcWoven()}));wsUnitUI();
 WS_INPUTS.forEach(id=>el(id)?.addEventListener('input',calcWoven));WS_COMPONENTS.forEach(c=>el(c.enabled)?.addEventListener('change',calcWoven));
 el('btn-calc-woven')?.addEventListener('click',()=>{if(!calcWoven().valid)alert('Please complete the order, fabric and enabled component measurements.')});
 el('btn-pdf-woven')?.addEventListener('click',downloadWovenReport);
 el('ws-demo')?.addEventListener('click',function(){if(this.getAttribute('aria-pressed')==='true'){wsApply(wsDemoSnapshot);wsDemoSnapshot=null;this.setAttribute('aria-pressed','false');this.classList.remove('is-active')}else{wsDemoSnapshot=wsCapture();const demo={'ws-qty':1200,'ws-fw':140,'ws-eff':85,'ws-waste':5,'ws-front-l':70,'ws-front-la':1,'ws-front-w':54,'ws-front-wa':1,'ws-back-l':70,'ws-back-la':1,'ws-back-w':54,'ws-back-wa':1,'ws-sleeve-l':22,'ws-sleeve-la':1,'ws-sleeve-w':38,'ws-sleeve-wa':1,'ws-neck-l':60,'ws-neck-la':1,'ws-neck-w':5,'ws-neck-wa':1};Object.entries(demo).forEach(([id,v])=>el(id).value=v);['ws-on-front','ws-on-back','ws-on-sleeve','ws-on-neck'].forEach(id=>el(id).checked=true);wovenUnit='cm';wsUnitUI();calcWoven();this.setAttribute('aria-pressed','true');this.classList.add('is-active')}});
 el('ws-recent-open')?.addEventListener('click',()=>{const p=el('ws-recent-panel'),open=p.hidden;wsRenderRecent();p.hidden=!open;el('ws-recent-open').setAttribute('aria-expanded',String(open));el('ws-recent-open').classList.toggle('is-active',open)});
 el('ws-report-settings')?.addEventListener('click',()=>{const x=wsReadInfo();['buyer','style','po','type'].forEach(k=>el('ws-report-'+k).value=x[k]||(k==='type'?'Woven T-shirt':''));el('ws-report-modal').hidden=false});
 document.querySelectorAll('[data-close-ws-modal]').forEach(b=>b.addEventListener('click',()=>el('ws-report-modal').hidden=true));
 el('ws-report-save')?.addEventListener('click',()=>{const x={};['buyer','style','po','type'].forEach(k=>x[k]=el('ws-report-'+k).value.trim());localStorage.setItem(WS_REPORT_KEY,JSON.stringify(x));el('ws-report-modal').hidden=true});
 wsRenderRecent();calcWoven();
});
