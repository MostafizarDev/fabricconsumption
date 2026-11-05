/* Size Ratio & Assortment Planner — scoped to the Size Ratio page */
(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s)), root=()=>$('#page-sizeratio');
const st={mode:'ratio',colorMode:'shared',cartonMode:'mixed',sizes:[['S',1],['M',2],['L',3],['XL',2],['XXL',1]].map((x,i)=>({id:'s'+i,name:x[0],ratio:x[1],percent:x[1]*100/9,marker:1,carton:2})),colors:[{id:'c0',name:'Black',qty:1200,ratios:{}}]};
const presets={adult:['XS','S','M','L','XL','XXL','3XL','4XL','5XL'],kids:['2T','3T','4T','5T','6T','7T'],age:['2/3','3/4','4/5','5/6','6/7','7/8'],numeric:['28','30','32','34','36','38','40'],custom:[]};let uid=10;
const n=x=>Math.max(0,Number(x)||0),q=x=>Math.floor(n(x)),fmt=x=>Math.round(n(x)).toLocaleString('en-US'),order=()=>q($('#sr-total')?.value),sizes=()=>st.sizes.filter(x=>x.name.trim()),weights=()=>sizes().map(x=>n(st.mode==='ratio'?x.ratio:x.percent));
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function allocate(total,ws){const sum=ws.reduce((a,b)=>a+n(b),0);if(!sum)return ws.map(()=>0);const raw=ws.map(w=>total*n(w)/sum),out=raw.map(Math.floor);let left=total-out.reduce((a,b)=>a+b,0);raw.map((v,i)=>({i,f:v-Math.floor(v)})).sort((a,b)=>b.f-a.f||a.i-b.i).slice(0,left).forEach(x=>out[x.i]++);return out;}
function msg(t,type){const e=$('#sr-size-status');if(e){e.textContent=t;e.className='sr-inline-status is-'+(type||'neutral');}}
function text(sel,v){const e=$(sel,root());if(e)e.textContent=v;}
function icons(){if(window.lucide?.createIcons)window.lucide.createIcons({attrs:{'stroke-width':2,stroke:'currentColor'}});}
function renderSizes(){
 $('#sr-size-rows').innerHTML=st.sizes.map((s,i)=>'<tr data-size-id="'+s.id+'"><td><input class="sr-cell-input sr-name-input" maxlength="24" value="'+esc(s.name)+'" data-size-field="name" aria-label="Size name"></td><td class="sr-ratio-col"><input class="sr-cell-input" type="number" min="0" step="any" value="'+s.ratio+'" data-size-field="ratio"></td><td class="sr-percent-col"><input class="sr-cell-input" type="number" min="0" max="100" step="any" value="'+s.percent.toFixed(2)+'" data-size-field="percent"></td><td class="sr-qty-cell" data-size-qty="'+s.id+'">—</td><td class="sr-share-cell" data-size-share="'+s.id+'">—</td><td class="sr-row-actions"><button type="button" class="sr-icon-btn" data-size-action="up" '+(i===0?'disabled':'')+' title="Move up"><i data-lucide="arrow-up"></i></button><button type="button" class="sr-icon-btn" data-size-action="down" '+(i===st.sizes.length-1?'disabled':'')+' title="Move down"><i data-lucide="arrow-down"></i></button><button type="button" class="sr-icon-btn" data-size-action="duplicate" title="Duplicate"><i data-lucide="copy"></i></button><button type="button" class="sr-icon-btn danger" data-size-action="delete" title="Delete"><i data-lucide="trash-2"></i></button></td></tr>').join('');
 const ratio=st.mode==='ratio';$$('.sr-ratio-col',root()).forEach(e=>e.hidden=!ratio);$$('.sr-percent-col',root()).forEach(e=>e.hidden=ratio);$$('[data-sr-mode]',root()).forEach(b=>b.classList.toggle('active',b.dataset.srMode===st.mode));icons();
}
function renderColors(){
 $('#sr-color-list').innerHTML=st.colors.map(c=>'<div class="sr-color-card" data-color-id="'+c.id+'"><label>Color name<input maxlength="40" value="'+esc(c.name)+'" data-color-field="name"></label><label>Color order qty (pcs)<input type="number" min="0" step="1" value="'+c.qty+'" data-color-field="qty"></label><button type="button" class="sr-icon-btn danger" data-color-remove title="Remove color"><i data-lucide="trash-2"></i></button></div>').join('');icons();
}
function renderMarker(){
 const d=allocate(order(),weights());$('#sr-marker-rows').innerHTML=sizes().map((s,i)=>'<tr><td><strong>'+esc(s.name)+'</strong></td><td><input class="sr-cell-input" type="number" min="0" step="1" value="'+s.marker+'" data-marker-value="'+s.id+'"></td><td>'+fmt(d[i])+'</td><td data-marker-lays="'+s.id+'">—</td><td data-marker-plan="'+s.id+'">—</td><td data-marker-balance="'+s.id+'">—</td></tr>').join('');
}
function renderCartons(){
 const list=sizes();
 if(st.cartonMode==='mixed'){
 $('#sr-carton-head').innerHTML='<tr><th>Size</th><th>Per Carton</th><th>Order Qty</th><th>Full Carton Qty</th><th>Remaining Pcs</th></tr>';
 $('#sr-carton-rows').innerHTML=list.map((s,i)=>'<tr><td><strong>'+esc(s.name)+'</strong></td><td><input class="sr-cell-input" type="number" min="0" step="1" value="'+(s.carton??2)+'" data-carton-size="'+s.id+'"></td><td data-carton-order="'+s.id+'">—</td><td data-carton-full="'+s.id+'">—</td><td data-carton-remain="'+s.id+'">—</td></tr>').join('');
 $('#sr-carton-foot').innerHTML='<tr><th>Total</th><th id="sr-carton-assort-total">—</th><th id="sr-carton-order-total">—</th><th id="sr-carton-packed-total">—</th><th id="sr-carton-remain-total">—</th></tr>';
 }else{
 $('#sr-carton-head').innerHTML='<tr><th>Size</th><th>Order Qty</th><th>Full Cartons</th><th>Packed Qty</th><th>Remaining Pcs</th></tr>';
 $('#sr-carton-rows').innerHTML=list.map(s=>'<tr><td><strong>'+esc(s.name)+'</strong></td><td data-carton-order="'+s.id+'">—</td><td data-carton-full="'+s.id+'">—</td><td data-carton-fullqty="'+s.id+'">—</td><td data-carton-remain="'+s.id+'">—</td></tr>').join('');
 $('#sr-carton-foot').innerHTML='<tr><th>Total</th><th id="sr-carton-order-total">—</th><th id="sr-cartons-full-foot">—</th><th id="sr-carton-packed-total">—</th><th id="sr-carton-remain-total">—</th></tr>';
 }
 $$('[data-sr-carton]',root()).forEach(b=>b.classList.toggle('active',b.dataset.srCarton===st.cartonMode));
}
function setMode(){const ratio=st.mode==='ratio';$$('.sr-ratio-col',root()).forEach(e=>e.hidden=!ratio);$$('.sr-percent-col',root()).forEach(e=>e.hidden=ratio);$$('[data-sr-mode]',root()).forEach(b=>b.classList.toggle('active',b.dataset.srMode===st.mode));}
function colorsCalc(list,qty){
 const sum=st.colors.reduce((a,c)=>a+q(c.qty),0),ok=sum===qty; text('#sr-color-total',fmt(sum)+' / '+fmt(qty)+' pcs');
 const pill=$('#sr-color-status');pill.textContent=ok?'Balanced':'Mismatch';pill.className='sr-status-pill '+(ok?'is-success':'is-warning');
 $('#sr-color-matrix-head').innerHTML='<tr><th>Color</th>'+list.map(s=>'<th>'+esc(s.name)+'</th>').join('')+'<th>Total</th></tr>';
 $('#sr-color-matrix-body').innerHTML=st.colors.map(c=>{const ws=st.colorMode==='independent'?list.map(s=>n(c.ratios[s.id]??s.ratio)):weights(),d=allocate(q(c.qty),ws);return '<tr><td>'+esc(c.name)+'</td>'+d.map(x=>'<td>'+fmt(x)+'</td>').join('')+'<td><strong>'+fmt(d.reduce((a,b)=>a+b,0))+'</strong></td></tr>';}).join('');
 if(st.colorMode!=='independent'){$$('.sr-color-ratios',root()).forEach(e=>e.remove());}
 else {
  const blocks=$$('.sr-color-ratios',root());
  const rebuild=blocks.length!==st.colors.length||blocks.some(b=>$$('[data-color-ratio]',b).length!==list.length||!list.every(s=>$('[data-color-ratio="'+s.id+'"]',b)));
  if(rebuild){blocks.forEach(e=>e.remove());st.colors.forEach(c=>{const box=document.createElement('div');box.className='sr-color-ratios';box.dataset.colorRatios=c.id;box.innerHTML='<strong>'+esc(c.name)+' size ratios</strong><div>'+list.map(s=>'<label>'+esc(s.name)+'<input type="number" min="0" step="any" data-color-ratio="'+s.id+'" value="'+n(c.ratios[s.id]??s.ratio)+'"></label>').join('')+'</div>';$('#sr-color-list').appendChild(box);});}
 }
}
function markerCalc(list,d){
 const req=list.map((s,i)=>n(s.marker)>0?Math.ceil(d[i]/n(s.marker)):(d[i]?Infinity:0)),lays=Math.max(0,...req.filter(Number.isFinite));let planned=0,over=0;
 list.forEach((s,i)=>{const p=q(s.marker),plan=lays*p,extra=Math.max(0,plan-d[i]);planned+=plan;over+=extra;text('[data-marker-lays="'+s.id+'"]',Number.isFinite(req[i])?fmt(lays):'Set qty');text('[data-marker-plan="'+s.id+'"]',fmt(plan));text('[data-marker-balance="'+s.id+'"]','+'+fmt(extra));});
 text('#sr-marker-lays',fmt(lays));text('#sr-marker-planned',fmt(planned));text('#sr-marker-balance','+'+fmt(over));text('#sr-marker-count',fmt(lays));text('#sr-marker-total',fmt(planned)+' pcs');text('#sr-marker-overcut','+'+fmt(over)+' pcs');
}
function cartonCalc(list,d){
 const cap=q($('#sr-carton-capacity').value);if(!cap){text('#sr-cartons-full','—');text('#sr-cartons-loose','—');text('#sr-cartons-packed','—');return;}
 let full=0,packed=0,loose=0;
 if(st.cartonMode==='mixed'){
 const per=list.map(s=>q(s.carton)),sum=per.reduce((a,b)=>a+b,0),count=Math.floor(order()/cap);
 list.forEach((s,i)=>{const pack=Math.min(d[i],per[i]*count),rem=d[i]-pack;text('[data-carton-order="'+s.id+'"]',fmt(d[i]));text('[data-carton-full="'+s.id+'"]',fmt(per[i])+' × '+fmt(count));text('[data-carton-remain="'+s.id+'"]',fmt(rem));packed+=pack;loose+=rem;});
 full=count;text('#sr-carton-assort-total',fmt(sum));text('#sr-carton-order-total',fmt(order()));text('#sr-carton-packed-total',fmt(packed));text('#sr-carton-remain-total',fmt(loose));text('#sr-carton-hint',sum===cap?'Assortment matches carton capacity. Remaining pieces are shown by size.':'Assortment totals '+fmt(sum)+' pcs; carton capacity is '+fmt(cap)+' pcs. Adjust quantities to match.');
 }else{
 list.forEach((s,i)=>{const count=Math.floor(d[i]/cap),pack=count*cap,rem=d[i]-pack;full+=count;packed+=pack;loose+=rem;text('[data-carton-order="'+s.id+'"]',fmt(d[i]));text('[data-carton-full="'+s.id+'"]',fmt(count));text('[data-carton-fullqty="'+s.id+'"]',fmt(pack));text('[data-carton-remain="'+s.id+'"]',fmt(rem));});
 text('#sr-carton-order-total',fmt(order()));text('#sr-cartons-full-foot',fmt(full));text('#sr-carton-packed-total',fmt(packed));text('#sr-carton-remain-total',fmt(loose));text('#sr-carton-hint','Solid-size packing keeps each carton to one size. Balance is shown by size.');
 }
 text('#sr-cartons-full',fmt(full));text('#sr-cartons-loose',fmt(loose)+' pcs');text('#sr-cartons-packed',fmt(packed)+' pcs');
}
function calculate(){
 const qty=order(),list=sizes(),ws=weights(),sum=ws.reduce((a,b)=>a+b,0);
 if(!qty||!list.length){msg('Enter a valid order quantity and at least one size.','error');return null;}
 if(new Set(list.map(s=>s.name.trim().toLowerCase())).size!==list.length){msg('Duplicate size names found. Use unique labels.','error');return null;}
 if(!sum){msg('Enter a positive ratio or percentage.','error');return null;}
 if(st.mode==='percent'&&Math.abs(sum-100)>.01){msg('Percentage total must equal 100%. Current total: '+sum.toFixed(2)+'%.','error');return null;}
 const d=allocate(qty,ws);list.forEach((s,i)=>{text('[data-size-qty="'+s.id+'"]',fmt(d[i]));text('[data-size-share="'+s.id+'"]',(d[i]/qty*100).toFixed(2)+'%');});
 text('#sr-total-ratio',fmt(list.reduce((a,s)=>a+n(s.ratio),0)));text('#sr-total-percent',list.reduce((a,s)=>a+n(s.percent),0).toFixed(2)+'%');text('#sr-total-size-qty',fmt(d.reduce((a,b)=>a+b,0)));text('#sr-total-share','100%');
 text('#sr-result-total',fmt(qty));text('#sr-result-sizes',list.length);text('#sr-result-ratio',st.mode==='ratio'?fmt(sum):sum.toFixed(2)+'%');text('#sr-result-colors',st.colors.length);
 $('#sr-result-breakdown').innerHTML='<div class="sr-breakdown-bars">'+list.map((s,i)=>{const p=d[i]/qty*100;return '<div class="sr-breakdown-item"><div><strong>'+esc(s.name)+'</strong><span>'+fmt(d[i])+' pcs · '+p.toFixed(1)+'%</span></div><div class="sr-bar"><span style="width:'+p+'%"></span></div></div>';}).join('')+'</div>';
 const v=$('#sr-validation');v.className='sr-validation is-success';v.innerHTML='<i data-lucide="check-circle-2"></i><span>Size distribution is balanced: '+fmt(qty)+' / '+fmt(qty)+' pcs.</span>';
 colorsCalc(list,qty);markerCalc(list,d);cartonCalc(list,d);icons();msg('Calculated successfully. Size quantities total '+fmt(qty)+' pcs.','success');return {qty,list,d};
}
function addSize(name){name=String(name||'').trim();if(!name)return msg('Enter a size name first.','error');if(st.sizes.some(s=>s.name.toLowerCase()===name.toLowerCase()))return msg('This size already exists.','error');if(st.sizes.length>=20)return msg('Maximum 20 sizes are supported.','error');st.sizes.push({id:'s'+uid++,name,ratio:1,percent:100/(st.sizes.length+1),marker:1,carton:0});renderAll();msg('Size '+name+' added.','success');}
function loadPreset(key){const a=presets[key]||[];st.sizes=a.map((name,i)=>({id:'s'+uid++,name,ratio:key==='adult'?([1,2,3,3,2,1,1,1,1][i]||1):key==='kids'?([1,2,3,3,2,1][i]||1):1,percent:100/(a.length||1),marker:1,carton:0}));st.colors.forEach(c=>c.ratios={});renderAll();msg('Preset loaded. You can edit every size label.','success');}
function renderAll(){renderSizes();renderColors();renderMarker();renderCartons();calculate();}
function report(data){
 const list=data.list,d=data.d,qty=data.qty,rows=list.map((s,i)=>'<tr><td>'+esc(s.name)+'</td><td>'+ (st.mode==='ratio'?n(s.ratio):n(s.percent).toFixed(2)+'%')+'</td><td>'+fmt(d[i])+'</td><td>'+(d[i]/qty*100).toFixed(2)+'%</td></tr>').join('');
 const colorRows=st.colors.map(c=>{const x=allocate(q(c.qty),st.colorMode==='independent'?list.map(s=>n(c.ratios[s.id]??s.ratio)):weights());return '<tr><td>'+esc(c.name)+'</td>'+x.map(v=>'<td>'+fmt(v)+'</td>').join('')+'<td>'+fmt(x.reduce((a,b)=>a+b,0))+'</td></tr>';}).join('');
 const meta=[['Buyer',$('#sr-buyer').value],['Style',$('#sr-style').value],['PO Number',$('#sr-po').value],['Order Date',$('#sr-date').value]];
 const html='<div class="report"><h1>Size Ratio &amp; Assortment Report</h1><p>Generated: '+new Date().toLocaleString()+'</p><div class="meta-grid">'+meta.map(x=>'<div><span>'+esc(x[0])+'</span><strong>'+esc(x[1]||'—')+'</strong></div>').join('')+'<div><span>Total Order</span><strong>'+fmt(qty)+' pcs</strong></div><div><span>Mode</span><strong>'+st.mode+'</strong></div></div><h2>Size-wise Breakdown</h2><table><thead><tr><th>Size</th><th>Ratio / Percentage</th><th>Quantity</th><th>Share</th></tr></thead><tbody>'+rows+'</tbody><tfoot><tr class="total-row"><td>Total</td><td>'+ (st.mode==='ratio'?fmt(list.reduce((a,s)=>a+n(s.ratio),0)):'100%')+'</td><td>'+fmt(qty)+'</td><td>100%</td></tr></tfoot></table><h2>Color-wise Size Matrix</h2><table><thead><tr><th>Color</th>'+list.map(s=>'<th>'+esc(s.name)+'</th>').join('')+'<th>Total</th></tr></thead><tbody>'+colorRows+'</tbody></table><h2>Marker Plan</h2><p>Lays: '+esc($('#sr-marker-count').textContent)+' · Planned cutting: '+esc($('#sr-marker-total').textContent)+' · Overcut: '+esc($('#sr-marker-overcut').textContent)+'</p><h2>Carton Plan</h2><p>Mode: '+st.cartonMode+' · Full cartons: '+esc($('#sr-cartons-full').textContent)+' · Loose balance: '+esc($('#sr-cartons-loose').textContent)+'</p><p>Remarks: '+esc($('#sr-remarks').value||'—')+'</p></div>';
 if(typeof generatePDF==='function')generatePDF('Size Ratio & Assortment Report',html);else window.print();
}
function reset(){st.mode='ratio';st.cartonMode='mixed';st.colorMode='shared';st.sizes=[['S',1],['M',2],['L',3],['XL',2],['XXL',1]].map((x,i)=>({id:'s'+i,name:x[0],ratio:x[1],percent:x[1]*100/9,marker:1,carton:2}));st.colors=[{id:'c0',name:'Black',qty:1200,ratios:{}}];$('#sr-total').value=1200;$('#sr-carton-capacity').value=10;$('#sr-preset').value='custom';$('input[name="sr-color-mode"][value="shared"]').checked=true;renderAll();msg('Default size ratio restored.','success');}
function init(){
 if(!root()||root().dataset.srReady)return;root().dataset.srReady='1';$('#sr-date').value=new Date().toISOString().slice(0,10);renderAll();
 root().addEventListener('input',e=>{
  const tr=e.target.closest('[data-size-id]');if(tr&&e.target.dataset.sizeField){const s=st.sizes.find(x=>x.id===tr.dataset.sizeId),f=e.target.dataset.sizeField;if(s){s[f]=f==='name'?e.target.value:n(e.target.value);if(f!=='name')calculate();}return;}
  const cr=e.target.closest('[data-color-id]');if(cr&&e.target.dataset.colorField){const c=st.colors.find(x=>x.id===cr.dataset.colorId);if(c){c[e.target.dataset.colorField]=e.target.dataset.colorField==='name'?e.target.value:q(e.target.value);calculate();}return;}
  if(e.target.dataset.markerValue){const s=st.sizes.find(x=>x.id===e.target.dataset.markerValue);if(s){s.marker=q(e.target.value);calculate();}return;}
  if(e.target.dataset.cartonSize){const s=st.sizes.find(x=>x.id===e.target.dataset.cartonSize);if(s){s.carton=q(e.target.value);calculate();}return;}
  if(e.target.dataset.colorRatio){const box=e.target.closest('[data-color-ratios]'),c=st.colors.find(x=>x.id===box?.dataset.colorRatios);if(c){c.ratios[e.target.dataset.colorRatio]=n(e.target.value);calculate();}return;}
  if(e.target.id==='sr-total'){if(st.colors.length===1&&st.colors[0].name==='Black')st.colors[0].qty=q(e.target.value);calculate();}
  if(e.target.id==='sr-carton-capacity')calculate();
 });
 root().addEventListener('change',e=>{if(e.target.id==='sr-preset')loadPreset(e.target.value);if(e.target.name==='sr-color-mode'){st.colorMode=e.target.value;calculate();}});
 root().addEventListener('click',e=>{
  const mode=e.target.closest('[data-sr-mode]');if(mode){st.mode=mode.dataset.srMode;setMode();calculate();return;}
  const cm=e.target.closest('[data-sr-carton]');if(cm){st.cartonMode=cm.dataset.srCarton;$$('[data-sr-carton]',root()).forEach(b=>b.classList.toggle('active',b===cm));renderCartons();calculate();return;}
  const a=e.target.closest('[data-size-action]');if(a){const tr=a.closest('[data-size-id]'),id=tr.dataset.sizeId,i=st.sizes.findIndex(s=>s.id===id),act=a.dataset.sizeAction;if(act==='up'&&i>0)[st.sizes[i-1],st.sizes[i]]=[st.sizes[i],st.sizes[i-1]];if(act==='down'&&i<st.sizes.length-1)[st.sizes[i+1],st.sizes[i]]=[st.sizes[i],st.sizes[i+1]];if(act==='delete'){if(st.sizes.length===1)return msg('At least one size is required.','error');st.sizes=st.sizes.filter(s=>s.id!==id);}if(act==='duplicate'){const s=st.sizes[i];addSize(s.name+' Copy');return;}renderAll();return;}
  if(e.target.closest('#sr-add-size')){addSize($('#sr-new-size').value);$('#sr-new-size').value='';return;}
  if(e.target.closest('#sr-add-color')){if(st.colors.length>=20)return msg('Maximum 20 colors are supported.','error');st.colors.push({id:'c'+uid++,name:'New Color',qty:0,ratios:{}});renderColors();calculate();return;}
  if(e.target.closest('[data-color-remove]')){if(st.colors.length===1)return msg('At least one color is required.','error');const card=e.target.closest('[data-color-id]');st.colors=st.colors.filter(c=>c.id!==card.dataset.colorId);renderColors();calculate();return;}
  if(e.target.closest('#btn-calc-sizeratio')){const r=calculate();if(r)msg('Calculation complete. Quantities reconcile to the order total.','success');return;}
  if(e.target.closest('#btn-pdf-sizeratio')){const r=calculate();if(r)report(r);return;}
  if(e.target.closest('#sr-reset'))reset();
 });
 renderAll();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
window.calcSizeRatio=calculate;window.updateSizeRatio=calculate;window.downloadSizeRatioReport=()=>{const d=calculate();if(d)report(d);};
})();