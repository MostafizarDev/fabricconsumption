/* Size Ratio & Assortment Planner — scoped to the Size Ratio page */
(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s)), root=()=>$('#page-sizeratio');
const st={mode:'ratio',colorMode:'shared',cartonMode:'mixed',sizes:[['S',1],['M',2],['L',3],['XL',2],['XXL',1]].map((x,i)=>({id:'s'+i,name:x[0],ratio:x[1],percent:x[1]*100/9,marker:1,carton:2})),colors:[{id:'c0',name:'Black',qty:0,ratios:{}}]};
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
function report(data,sections){
 const include=Object.assign({sizes:true,colors:true,cutting:true,packing:true,results:true},sections||{});
 const list=data.list,d=data.d,qty=data.qty,now=new Date();
 const dateCode=now.getFullYear()+String(now.getMonth()+1).padStart(2,'0')+String(now.getDate()).padStart(2,'0');
 const dateText=now.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
 const timeText=now.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
 const sequenceKey='sizeRatio.reportSequence.'+dateCode;
 let sequence=0;
 try{sequence=parseInt(localStorage.getItem(sequenceKey)||'0',10)||0}catch(_){}
 sequence+=1;
 try{localStorage.setItem(sequenceKey,String(sequence))}catch(_){}
 const reportId='FC-SR-'+dateCode+'-'+String(sequence).padStart(3,'0');
 const iconPaths={
  info:'<circle cx="12" cy="12" r="9"></circle><path d="M12 10v6M12 7h.01"></path>',
  sizes:'<path d="M4 5h16M4 12h16M4 19h16"></path><path d="M8 3v4M15 10v4M11 17v4"></path>',
  colors:'<path d="M12 3a9 9 0 1 0 0 18h1.2a2 2 0 0 0 1.5-3.3 1.5 1.5 0 0 1 1.1-2.5H18a3 3 0 0 0 3-3c0-5.1-4-9.2-9-9.2Z"></path><path d="M7.5 10h.01M10 7.5h.01M15 8h.01"></path>',
  marker:'<path d="M4 19V5M4 19h17"></path><path d="m7 15 4-4 3 2 6-7"></path>',
  cartons:'<path d="m3 7 9-4 9 4-9 4-9-4Z"></path><path d="M3 7v10l9 4 9-4V7M12 11v10"></path>',
  summary:'<path d="M5 19V9M12 19V5M19 19v-7"></path>',
  warning:'<path d="M12 3 2.5 20h19z"></path><path d="M12 9v5M12 17h.01"></path>',
  formula:'<path d="M7 4h10M7 20h10M9 7l6 10M15 7l-6 10"></path>'
 };
 const icon=name=>'<svg class="report-icon" viewBox="0 0 24 24" aria-hidden="true">'+(iconPaths[name]||iconPaths.info)+'</svg>';
 const ratioTotal=list.reduce((sum,s)=>sum+n(st.mode==='ratio'?s.ratio:s.percent),0);
 const sizeRows=list.map((s,i)=>'<tr><td><strong>'+esc(s.name)+'</strong></td><td>'+(st.mode==='ratio'?fmt(s.ratio):n(s.percent).toFixed(2)+'%')+'</td><td>'+fmt(d[i])+' pcs</td><td>'+(d[i]/qty*100).toFixed(2)+'%</td></tr>').join('');
 const sizeFooterValue=st.mode==='ratio'?fmt(ratioTotal):ratioTotal.toFixed(2)+'%';
 const sizeFooter='<tr class="total-row"><td>Total</td><td>'+sizeFooterValue+'</td><td>'+fmt(qty)+' pcs</td><td>100%</td></tr>';
 const colorData=st.colors.map(c=>{
  const ws=st.colorMode==='independent'?list.map(s=>n(c.ratios[s.id]??s.ratio)):weights();
  const quantities=allocate(q(c.qty),ws);
  return {name:c.name,quantities,total:quantities.reduce((sum,value)=>sum+value,0)};
 });
 const colorTotals=list.map((_,i)=>colorData.reduce((sum,c)=>sum+c.quantities[i],0));
 const colorGrand=colorData.reduce((sum,c)=>sum+c.total,0);
 const colorRows=colorData.map(c=>'<tr><td><strong>'+esc(c.name||'Unspecified')+'</strong></td>'+c.quantities.map(value=>'<td>'+fmt(value)+'</td>').join('')+'<td><strong>'+fmt(c.total)+'</strong></td></tr>').join('');
 const colorTotalRow='<tr class="total-row"><td>All colors</td>'+colorTotals.map(value=>'<td>'+fmt(value)+'</td>').join('')+'<td>'+fmt(colorGrand)+'</td></tr>';
 const colorColumnWidth=(82/(list.length+1)).toFixed(2)+'%';
 const colorHeader='<tr><th style="width:13%">Color</th>'+list.map(s=>'<th style="width:'+colorColumnWidth+'">'+esc(s.name)+'</th>').join('')+'<th style="width:'+colorColumnWidth+'">Total</th></tr>';
 const colorOrderState=colorGrand===qty?'Balanced':'Check quantities';
 const markerData=list.map((s,i)=>{
  const perLay=q(s.marker),required=perLay>0?Math.ceil(d[i]/perLay):(d[i]?Infinity:0);
  return {perLay,required};
 });
 const markerLays=Math.max(0,...markerData.map(x=>Number.isFinite(x.required)?x.required:0));
 const markerRows=markerData.map((x,i)=>{
  const planned=markerLays*x.perLay,over=Math.max(0,planned-d[i]);
  return '<tr><td><strong>'+esc(list[i].name)+'</strong></td><td>'+fmt(x.perLay)+'</td><td>'+fmt(d[i])+'</td><td>'+(Number.isFinite(x.required)?fmt(x.required):'Set per lay')+'</td><td>'+fmt(planned)+'</td><td>'+fmt(over)+'</td></tr>';
 }).join('');
 const markerPlanned=markerData.reduce((sum,x)=>sum+markerLays*x.perLay,0);
 const markerOver=markerData.reduce((sum,x,i)=>sum+Math.max(0,markerLays*x.perLay-d[i]),0);
 const markerFooter='<tr class="total-row"><td>Total</td><td>—</td><td>'+fmt(qty)+'</td><td>'+fmt(markerLays)+' lays</td><td>'+fmt(markerPlanned)+' pcs</td><td>'+fmt(markerOver)+' pcs</td></tr>';
 const capacity=q($('#sr-carton-capacity').value),mixed=st.cartonMode==='mixed';
 const sharedCartons=capacity?Math.floor(qty/capacity):0;
 const cartonData=list.map((s,i)=>{
  const full=capacity?(mixed?sharedCartons:Math.floor(d[i]/capacity)):0;
  const perCarton=mixed?q(s.carton):capacity;
  const packed=capacity?(mixed?Math.min(d[i],perCarton*sharedCartons):full*capacity):0;
  return {perCarton,full,packed,loose:capacity?d[i]-packed:0};
 });
 const cartonFull=capacity?(mixed?sharedCartons:cartonData.reduce((sum,x)=>sum+x.full,0)):null;
 const cartonPacked=capacity?cartonData.reduce((sum,x)=>sum+x.packed,0):null;
 const cartonLoose=capacity?cartonData.reduce((sum,x)=>sum+x.loose,0):null;
 const cartonMode=mixed?'Assorted-size packing':'One size per carton';
 const cartonHeader=mixed
  ?'<tr><th>Size</th><th>Pcs / carton</th><th>Order qty</th><th>Packed qty</th><th>Loose pcs</th></tr>'
  :'<tr><th>Size</th><th>Capacity / carton</th><th>Order qty</th><th>Full cartons</th><th>Packed qty</th><th>Loose pcs</th></tr>';
 const cartonRows=cartonData.map((x,i)=>'<tr><td><strong>'+esc(list[i].name)+'</strong></td><td>'+fmt(x.perCarton)+'</td><td>'+fmt(d[i])+'</td>'+(mixed?'':'<td>'+(capacity?fmt(x.full):'—')+'</td>')+'<td>'+(capacity?fmt(x.packed):'—')+'</td><td>'+(capacity?fmt(x.loose):'—')+'</td></tr>').join('');
 const cartonFoot=mixed
  ?'<tr class="total-row"><td>Total / carton</td><td>'+fmt(list.reduce((sum,s)=>sum+q(s.carton),0))+'</td><td>'+fmt(qty)+'</td><td>'+(capacity?fmt(cartonPacked):'—')+'</td><td>'+(capacity?fmt(cartonLoose):'—')+'</td></tr>'
  :'<tr class="total-row"><td>Total</td><td>—</td><td>'+fmt(qty)+'</td><td>'+(capacity?fmt(cartonFull):'—')+'</td><td>'+(capacity?fmt(cartonPacked):'—')+'</td><td>'+(capacity?fmt(cartonLoose):'—')+'</td></tr>';
 const modeLabel=st.mode==='ratio'?'Ratio-based':'Percentage-based';
 const mixLabel=st.colorMode==='independent'?'Independent mix per color':'Shared size mix';
 const buyer=$('#sr-buyer').value.trim(),style=$('#sr-style').value.trim(),po=$('#sr-po').value.trim(),orderDate=$('#sr-date').value,remarks=$('#sr-remarks').value.trim();
 const orderSection='<section class="section"><div class="section-head">'+icon('info')+'<span>01 / ORDER SETUP</span></div><div class="info-grid"><div><span>Buyer Name</span><strong>'+(esc(buyer)||'________________')+'</strong></div><div><span>Style No.</span><strong>'+(esc(style)||'________________')+'</strong></div><div><span>PO / Order No.</span><strong>'+(esc(po)||'________________')+'</strong></div><div><span>Order Date</span><strong>'+(esc(orderDate)||'________________')+'</strong></div></div><div class="comments-section" style="margin:10px;padding:7px 10px"><div class="comments-title">ORDER REMARKS:</div><div style="min-height:20px;font-size:9px;line-height:1.5;color:#334155">'+(esc(remarks)||'—')+'</div></div></section>';
 const sizeSection='<section class="section"><div class="section-head">'+icon('sizes')+'<span>02 / SIZE BREAKDOWN</span></div><table class="fabric-type-table"><thead><tr><th>Size</th><th>Ratio / Percentage</th><th>Quantity</th><th>Share</th></tr></thead><tbody>'+sizeRows+sizeFooter+'</tbody></table></section>';
 const colorSection='<section class="section"><div class="section-head">'+icon('colors')+'<span>03 / COLOR ASSORTMENT</span></div><div style="padding:8px 10px;font-size:8px;line-height:1.5;color:#475569">Mix: '+mixLabel+' · Color quantity total: '+fmt(colorGrand)+' / '+fmt(qty)+' pcs · '+colorOrderState+'.</div><table class="fabric-type-table" style="font-size:7px;table-layout:fixed"><thead>'+colorHeader+'</thead><tbody>'+colorRows+colorTotalRow+'</tbody></table></section>';
 const cuttingSection='<section class="section"><div class="section-head">'+icon('marker')+'<span>04 / CUTTING PLAN</span></div><table class="fabric-type-table"><thead><tr><th>Size</th><th>Pcs / lay</th><th>Required qty</th><th>Lays needed</th><th>Planned cut</th><th>Overcut</th></tr></thead><tbody>'+markerRows+markerFooter+'</tbody></table></section>';
 const packingSection='<section class="section"><div class="section-head">'+icon('cartons')+'<span>05 / PACKING PLAN</span></div><div class="meta-grid"><div><span>Packing Mode</span><strong>'+cartonMode+'</strong></div><div><span>Carton Capacity</span><strong>'+(capacity?fmt(capacity)+' pcs':'Not set')+'</strong></div><div><span>Full Cartons</span><strong>'+(capacity?fmt(cartonFull):'—')+'</strong></div><div><span>Loose Balance</span><strong>'+(capacity?fmt(cartonLoose)+' pcs':'—')+'</strong></div></div><table class="fabric-type-table"><thead>'+cartonHeader+'</thead><tbody>'+cartonRows+cartonFoot+'</tbody></table>'+(capacity?'':'<div style="padding:8px 10px;font-size:8px;color:#475569">Set carton capacity in the planner to calculate packing quantities.</div>')+'</section>';
 const resultsSection='<section class="section"><div class="section-head">'+icon('summary')+'<span>06 / CALCULATION RESULTS</span></div><div class="summary-grid"><div class="summary-card primary"><div class="metric-head">'+icon('summary')+'<span>TOTAL ORDER QTY</span></div><strong>'+fmt(qty)+' pcs</strong><small>Planned garment quantity</small></div><div class="summary-card"><div class="metric-head">'+icon('sizes')+'<span>TOTAL SIZES</span></div><strong>'+fmt(list.length)+'</strong><small>Active size labels</small></div><div class="summary-card"><div class="metric-head">'+icon('formula')+'<span>TOTAL '+(st.mode==='ratio'?'RATIO':'PERCENTAGE')+'</span></div><strong>'+(st.mode==='ratio'?fmt(ratioTotal):ratioTotal.toFixed(2)+'%')+'</strong><small>'+modeLabel+'</small></div><div class="summary-card"><div class="metric-head">'+icon('colors')+'<span>COLORWAYS</span></div><strong>'+fmt(st.colors.length)+'</strong><small>Color entries</small></div></div><div style="padding:10px 12px;font-size:9px;line-height:1.6;color:#475569">Order quantities use the selected size ratio or percentage. Rounding assigns remaining pieces by largest fractional share so allocated quantities equal the order total.</div></section>';
 const optionalSections=[include.sizes?sizeSection:'',include.colors?colorSection:'',include.cutting?cuttingSection:'',include.packing?packingSection:'',include.results?resultsSection:''].join('');
 const html='<div class="report">'+
  '<div class="report-header"><div><div class="brand">FABRiCS <span>CONSUMPTiON</span></div><div class="subtitle">GARMENT CALCULATOR SUITE</div></div><div class="report-title"><div class="eyebrow">CALCULATION REPORT</div><h1>Size Ratio &amp; Assortment Planner</h1><div class="report-id">'+reportId+'</div></div></div>'+
  '<div class="meta-grid"><div><span>Report Date</span><strong>'+dateText+'</strong></div><div><span>Time</span><strong>'+timeText+'</strong></div><div><span>Order Quantity</span><strong>'+fmt(qty)+' pcs</strong></div><div><span>Distribution Mode</span><strong>'+modeLabel+'</strong></div></div>'+
  orderSection+optionalSections+
  '<div class="note">'+icon('warning')+'<div><strong>IMPORTANT:</strong> Planning report only. Confirm the buyer-approved information before production.</div></div>'+
  '<div class="approval-grid"><div><span>PREPARED BY</span><strong></strong></div><div><span>CHECKED BY</span><strong></strong></div><div><span>APPROVED BY</span><strong></strong></div></div>'+
  '<div class="report-footer"><span>Fabrics Consumption - Garment Calculator Suite</span><span>'+dateText+' · '+timeText+' · <a href="https://fabricconsumption.vercel.app/" target="_blank" rel="noopener noreferrer">fabricconsumption.vercel.app</a></span></div></div>';
 const filePart=value=>String(value||'').trim().replace(/[^a-z0-9-_]+/gi,'_').replace(/^_+|_+$/g,'').slice(0,40);
 const poPart=filePart(po);
 const fileName=['FC',filePart(buyer),filePart(style),poPart?'PO'+poPart.replace(/^PO[_-]?/i,''):'',reportId].filter(Boolean).join('_');
 if(typeof generatePDF==='function')generatePDF(fileName,html);else window.print();
}

function pdfDialog(){return $('#sr-pdf-dialog',root());}
function pdfSectionChoices(){const dialog=pdfDialog();return Object.fromEntries($$('[data-pdf-section]',dialog||document).map(input=>[input.dataset.pdfSection,input.checked]));}
function updatePdfSelectionCount(){const dialog=pdfDialog();if(!dialog)return;const selected=1+$$('[data-pdf-section]',dialog).filter(input=>input.checked).length;const status=$('#sr-pdf-selection-count',dialog);if(status)status.textContent=selected+' of 6 sections included';}
function openPdfSectionDialog(data){const dialog=pdfDialog();if(dialog&&typeof dialog.showModal==='function'){updatePdfSelectionCount();dialog.showModal();return;}report(data);}
function initPdfSectionDialog(){
 const dialog=pdfDialog();if(!dialog||dialog.dataset.srReady)return;dialog.dataset.srReady='1';
 const inputs=$$('[data-pdf-section]',dialog);
 try{const saved=JSON.parse(localStorage.getItem('sizeRatio.pdfSectionSelection.v1')||'null');if(saved&&typeof saved==='object')inputs.forEach(input=>{if(typeof saved[input.dataset.pdfSection]==='boolean')input.checked=saved[input.dataset.pdfSection];});}catch(_){}
 const saveChoices=()=>{try{localStorage.setItem('sizeRatio.pdfSectionSelection.v1',JSON.stringify(pdfSectionChoices()));}catch(_){}};
 dialog.addEventListener('change',e=>{if(e.target.matches('[data-pdf-section]'))updatePdfSelectionCount();});
 $('#sr-pdf-select-all',dialog)?.addEventListener('click',()=>{inputs.forEach(input=>input.checked=true);updatePdfSelectionCount();});
 $('#sr-pdf-clear-optional',dialog)?.addEventListener('click',()=>{inputs.forEach(input=>input.checked=false);updatePdfSelectionCount();});
 $('#sr-pdf-dialog-close',dialog)?.addEventListener('click',()=>dialog.close());
 $('#sr-pdf-cancel',dialog)?.addEventListener('click',()=>dialog.close());
 $('#sr-pdf-generate',dialog)?.addEventListener('click',()=>{
  const data=calculate();if(!data)return;
  const choices=pdfSectionChoices();saveChoices();dialog.close();report(data,choices);
 });
 updatePdfSelectionCount();
}

const RECENT_KEY='fabricConsumption.sizeRatio.recent.v1';
function recentItems(){try{const x=JSON.parse(localStorage.getItem(RECENT_KEY)||'[]');return Array.isArray(x)?x.slice(0,5):[];}catch(_){return [];}}
function saveRecent(label){
 const result=calculate();if(!result)return;
 const fields={};$('#page-sizeratio input[id],#page-sizeratio select[id],#page-sizeratio textarea[id]').forEach(el=>{fields[el.id]={value:el.value,type:el.type,checked:el.type==='checkbox'?el.checked:undefined};});
 const snapshot={fields,st:JSON.parse(JSON.stringify(st))};
 const item={id:Date.now(),savedAt:new Date().toISOString(),label:label||'Size ratio calculation',buyer:$('#sr-buyer').value,style:$('#sr-style').value,po:$('#sr-po').value,qty:order(),snapshot};
 const items=recentItems();items.unshift(item);
 try{localStorage.setItem(RECENT_KEY,JSON.stringify(items.slice(0,5)));}catch(_){msg('Could not save Recent. Browser storage may be unavailable.','error');return;}
 renderRecent();msg('Calculation saved to Recent.','success');
}
function renderRecent(){
 const panel=$('#sr-recent-panel');if(!panel)return;const items=recentItems();
 if(!items.length){panel.innerHTML='<p class="sr-recent-empty">No saved calculations yet. Load Demo or complete a calculation to save it here.</p>';return;}
 panel.innerHTML='<div class="sr-recent-heading"><strong>Recent Calculations</strong><button type="button" data-sr-recent-clear>Clear all</button></div>'+items.map(x=>'<div class="sr-recent-item"><div><strong>'+esc([x.buyer,x.style].filter(Boolean).join(' · ')||x.label)+'</strong><small>'+esc(x.po||'No PO')+' · '+fmt(x.qty)+' pcs · '+esc(new Date(x.savedAt).toLocaleString())+'</small></div><div class="sr-recent-actions"><button type="button" data-sr-recent-load="'+x.id+'">Load</button><button type="button" data-sr-recent-delete="'+x.id+'" aria-label="Delete recent calculation">×</button></div></div>').join('');
}
function loadRecent(id){
 const item=recentItems().find(x=>String(x.id)===String(id));if(!item)return;
 st.mode=item.snapshot.st.mode||'ratio';st.colorMode=item.snapshot.st.colorMode||'shared';st.cartonMode=item.snapshot.st.cartonMode||'mixed';
 st.sizes=item.snapshot.st.sizes||[];st.colors=item.snapshot.st.colors||[];
 Object.entries(item.snapshot.fields||{}).forEach(([id,v])=>{const el=$('#'+id);if(!el)return;if(el.type==='checkbox'||el.type==='radio')el.checked=!!v.checked;else el.value=v.value??'';});
 $('[name="sr-color-mode"]').forEach(el=>el.checked=el.value===st.colorMode);
 $('#sr-recent-panel').hidden=true;$('#sr-recent-toggle')?.setAttribute('aria-expanded','false');
 renderAll();setMode();msg('Recent calculation loaded. You can edit and recalculate it.','success');
}
function demo(){
 const today=new Date().toISOString().slice(0,10);
 $('#sr-buyer').value='DEMO BUYER';$('#sr-style').value='SR-DEMO-001';$('#sr-po').value='DEMO-PO-1200';$('#sr-date').value=today;$('#sr-total').value='1200';$('#sr-remarks').value='Demo order — color-wise size assortment, marker and carton plan';
 $('#sr-preset').value='custom';$('#sr-new-size').value='';
 st.mode='ratio';st.colorMode='independent';st.cartonMode='mixed';
 const names=['XS','S','M','L','XL','XXL'],ratios=[1,2,3,3,2,1],percent=[8.33,16.67,25,25,16.67,8.33],marker=[1,2,2,2,2,1],carton=[1,2,3,3,2,1];
 st.sizes=names.map((name,i)=>({id:'sd'+i,name,ratio:ratios[i],percent:percent[i],marker:marker[i],carton:carton[i]}));
 const makeRatios=(arr)=>Object.fromEntries(st.sizes.map((size,i)=>[size.id,arr[i]]));
 st.colors=[
  {id:'cd0',name:'Black',qty:500,ratios:makeRatios([1,2,3,3,2,1])},
  {id:'cd1',name:'Navy',qty:400,ratios:makeRatios([1,2,2,3,2,1])},
  {id:'cd2',name:'White',qty:300,ratios:makeRatios([1,2,3,2,2,1])}
 ];
 $('#sr-carton-capacity').value='12';$('#sr-carton-name').value='12 pcs mixed assortment';
 $('input[name="sr-color-mode"][value="independent"]').checked=true;
 renderAll();setMode();saveRecent('Demo — full color-wise assortment');
 msg('Demo loaded: 1,200 pcs across 3 colors and 6 sizes, with size ratios, color-wise ratios, marker plan and carton assortment.','success');
}
function reset(){st.mode='ratio';st.cartonMode='mixed';st.colorMode='shared';st.sizes=[['S',1],['M',2],['L',3],['XL',2],['XXL',1]].map((x,i)=>({id:'s'+i,name:x[0],ratio:x[1],percent:x[1]*100/9,marker:1,carton:2}));st.colors=[{id:'c0',name:'Black',qty:0,ratios:{}}];$('#sr-total').value='';$('#sr-buyer').value='';$('#sr-style').value='';$('#sr-po').value='';$('#sr-remarks').value='';$('#sr-date').value=new Date().toISOString().slice(0,10);$('#sr-carton-capacity').value=10;$('#sr-carton-name').value='Standard assortment';$('#sr-preset').value='custom';$('input[name="sr-color-mode"][value="shared"]').checked=true;renderAll();msg('Ready for a new order. Enter the order quantity and calculate.','neutral');}
function init(){
 if(!root()||root().dataset.srReady)return;root().dataset.srReady='1';$('#sr-date').value=new Date().toISOString().slice(0,10);renderAll();renderRecent();initPdfSectionDialog();
 $('#sr-demo')?.addEventListener('click',demo);
 $('#sr-recent-toggle')?.addEventListener('click',()=>{const p=$('#sr-recent-panel');if(!p)return;p.hidden=!p.hidden;$('#sr-recent-toggle').setAttribute('aria-expanded',String(!p.hidden));if(!p.hidden)renderRecent();});
 $('#sr-recent-panel')?.addEventListener('click',e=>{const load=e.target.closest('[data-sr-recent-load]'),del=e.target.closest('[data-sr-recent-delete]');if(load){loadRecent(load.dataset.srRecentLoad);return;}if(del){localStorage.setItem(RECENT_KEY,JSON.stringify(recentItems().filter(x=>String(x.id)!==del.dataset.srRecentDelete)));renderRecent();return;}if(e.target.closest('[data-sr-recent-clear]')){localStorage.removeItem(RECENT_KEY);renderRecent();}});
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
  if(e.target.closest('#btn-calc-sizeratio')){const r=calculate();if(r){saveRecent('Size ratio calculation');msg('Calculation complete. Quantities reconcile to the order total.','success');}return;}
  if(e.target.closest('#btn-pdf-sizeratio')){const r=calculate();if(r)openPdfSectionDialog(r);return;}
  if(e.target.closest('#sr-reset'))reset();
 });
 renderAll();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
window.calcSizeRatio=calculate;window.updateSizeRatio=calculate;window.downloadSizeRatioReport=()=>{const d=calculate();if(d)openPdfSectionDialog(d);};
})();