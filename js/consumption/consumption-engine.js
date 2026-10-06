/* FabricConsumption — Phase 02 Consumption Engine
   Existing Excel/body-block formulas remain the Basic method.
   Marker/Panel methods are additional, explicit estimation methods.
*/
(function(){
"use strict";
const FC=window.FC=window.FC||{};
const C={cm:10000000,inch:1550000};
const S=window.FC2=window.FC2||{knitUnit:"cm",pantUnit:"cm",wovenUnit:"cm"};
const n=(id)=>typeof v==="function"?v(id):(Number(document.getElementById(id)?.value)||0);
const setv=(id,val)=>{const e=document.getElementById(id);if(e)e.innerText=val};
const f=(x,d=3)=>Number.isFinite(x)&&x!==0?Number(x).toFixed(d):"—";
const pct=(x)=>Math.max(0,Number(x)||0)/100;
function val(id){const e=document.getElementById(id);return e?Number(String(e.value||"").replace(/,/g,""))||0:0}
function total(a,b){return val(a)+val(b)}
function factor(shrink,waste){return (1+pct(shrink))*(1+pct(waste))}
function html(tag,attrs,children=""){const e=document.createElement(tag);Object.entries(attrs||{}).forEach(([k,v])=>e.setAttribute(k,v));e.innerHTML=children;return e}
function addMethodBar(pageId, methods, note){
 const page=document.getElementById(pageId); if(!page||page.querySelector(".fc-method-bar"))return;
 const bar=html("div",{class:"fc-method-bar"});
 bar.innerHTML='<span class="fc-method-label">Method</span>'+methods.map((m,i)=>'<button type="button" class="fc-method-btn '+(i===0?"active":"")+'" data-fc-method="'+m.id+'">'+m.label+'</button>').join("")+'<span class="fc-method-note">'+note+"</span>";
 const anchor=page.querySelector(".unit-bar"); if(anchor)anchor.insertAdjacentElement("afterend",bar); else page.insertBefore(bar,page.firstChild);
 bar.addEventListener("click",e=>{const b=e.target.closest(".fc-method-btn");if(!b)return;selectMethod(pageId,b.dataset.fcMethod)});
}
function selectMethod(pageId,method){
 const page=document.getElementById(pageId); if(!page)return;
 page.querySelectorAll(".fc-method-btn").forEach(b=>b.classList.toggle("active",b.dataset.fcMethod===method));
 page.dataset.fcMethod=method;
 const note=page.querySelector(".input-note"); if(note) note.style.display=method==="basic"?"":"none";
 const basic=page.querySelector(".fc-basic-content");
 const adv=page.querySelectorAll(".fc-advanced");
 if(basic)basic.style.display=method==="basic"?"":"none";
 adv.forEach(x=>x.classList.toggle("active",x.dataset.method===method));
 if(pageId==="page-knit")calcKnitGarments();
 if(pageId==="page-knitpant")calcKnitPant();
 if(pageId==="page-woven")calcWoven();
}
function addAdvanced(pageId,method,title,description,fieldsHtml,resultId){
 const page=document.getElementById(pageId); if(!page)return;
 const wrap=html("div",{class:"fc-advanced", "data-method":method});
 wrap.innerHTML='<div class="fc-advanced-grid"><div><div class="fc-method-card"><h3>'+title+'</h3><p>'+description+'</p>'+fieldsHtml+'</div></div><div class="fc-result-stack"><div class="fc-result-main"><div class="fc-result-label">Consumption</div><div class="fc-result-value" id="'+resultId+'">—</div><div class="fc-result-unit">Live result</div></div><div class="fc-method-card" id="'+resultId+'-detail"><div class="fc-result-row"><span>Net</span><strong>—</strong></div></div></div></div>';
 page.querySelector(".calc-grid")?.insertAdjacentElement("afterend",wrap);
}
function input(id,label,placeholder="",type="number"){
 return '<div class="f-group"><label>'+label+'</label><input id="'+id+'" type="'+type+'" inputmode="decimal" step="any" placeholder="'+placeholder+'"></div>'
}
function select(id,label,opts){
 return '<div class="f-group"><label>'+label+'</label><select id="'+id+'">'+opts.map(o=>'<option value="'+o[0]+'">'+o[1]+"</option>").join("")+"</select></div>"
}
function addShrinkToBasic(pageId,afterId,ids){
 const page=document.getElementById(pageId); if(!page||page.querySelector(".fc-basic-extra"))return;
 const row=html("div",{class:"field-row fc-basic-extra"});
 row.innerHTML=input(ids.shrink,"Shrinkage %","e.g., 0")+input(ids.width,"Usable Width (optional)","e.g., 72");
 const target=page.querySelector(afterId); if(target)target.insertAdjacentElement("afterend",row);
}
function toggleSleeve(){
 const cb=document.getElementById("ck-sleeve"); if(!cb)return;
 const group=document.getElementById("kg-sl")?.closest(".sa-group");
 if(group)group.classList.toggle("fc-hidden-component",!cb.checked);
}
function enhanceKnit(){
 const page=document.getElementById("page-knit"); if(!page)return;
 addMethodBar("page-knit",[{id:"basic",label:'<svg class="fc-icon" aria-hidden="true"><use href="#i-calculator"></use></svg> Basic / Body Block'},{id:"marker",label:'<svg class="fc-icon" aria-hidden="true"><use href="#i-marker"></use></svg> Marker'},{id:"panel",label:'<svg class="fc-icon" aria-hidden="true"><use href="#i-panels"></use></svg> Panel'}],"");
 const checks=page.querySelector(".check-row");
 if(checks&&!document.getElementById("ck-sleeve")){
   const label=document.createElement("label");label.className="fc-component-toggle";label.innerHTML='<input type="checkbox" id="ck-sleeve" checked> 🧤 Sleeve';checks.insertBefore(label,checks.children[1]||null);
   document.getElementById("ck-sleeve").addEventListener("change",()=>{toggleSleeve();calcKnitGarments()});
 }
 addShrinkToBasic("page-knit",".calc-grid",{shrink:"kg-shrink",width:"kg-width"});
 const body=page.querySelector(".calc-grid");
 if(body)body.classList.add("fc-basic-content");
 const markerFields='<div class="fc-method-fields">'+input("kn-m-length","Marker Length (inch)","e.g., 72")+input("kn-m-width","Usable Marker Width (inch)","e.g., 72")+input("kn-m-pcs","Garments in Marker","e.g., 10")+input("kn-m-gsm","GSM","e.g., 180")+input("kn-m-waste","Cutting / Marker Wastage %","e.g., 5")+input("kn-m-shrink","Shrinkage %","e.g., 0")+'</div><div class="fc-info">Marker method uses marker length ÷ garments in marker, then converts the marker area to kg using width × GSM. Use cuttable/usable width, not the full roll width.</div>';
 addAdvanced("page-knit","marker","Marker-based Knit Consumption","Use an actual marker when available. This is the production-oriented method; Basic remains the quick body-block estimate.",markerFields,"kn-marker-result");
 let rows='<table class="fc-panel-table"><thead><tr><th>Panel</th><th>Length</th><th>Width</th><th>Qty</th><th>GSM</th><th></th></tr></thead><tbody id="kn-panel-body"></tbody></table><button type="button" class="fc-add-row" id="kn-add-panel">＋ Add panel</button><div class="fc-method-fields" style="margin-top:12px">'+input("kn-panel-waste","Wastage %","e.g., 5")+input("kn-panel-shrink","Shrinkage %","e.g., 0")+'</div><div class="fc-info">Panel method treats each cut panel as a bounding rectangle including seam/hem allowance. Each panel may have its own GSM, which is useful for body fabric vs rib/contrast components.</div>';
 addAdvanced("page-knit","panel","Panel-based Knit Consumption","Add the actual cut panels. The engine sums panel area and converts it to fabric weight.",rows,"kn-panel-result");
 addPanelRow("kn-panel-body","Front",74,54,1,180);
 addPanelRow("kn-panel-body","Back",74,54,1,180);
 const add=document.getElementById("kn-add-panel");if(add)add.addEventListener("click",()=>addPanelRow("kn-panel-body","New panel","","","",180));
}
function addPanelRow(tbodyId,name,l,w,q,gsm){
 const body=document.getElementById(tbodyId);if(!body)return;
 const tr=document.createElement("tr");const uid="knp-"+Date.now()+"-"+Math.random().toString(36).slice(2,6);
 tr.innerHTML='<td><input data-kp="name" value="'+name+'"></td><td><input data-kp="l" type="number" step="any" value="'+l+'"></td><td><input data-kp="w" type="number" step="any" value="'+w+'"></td><td><input data-kp="q" type="number" step="any" value="'+q+'"></td><td><input data-kp="gsm" type="number" step="any" value="'+gsm+'"></td><td><button type="button" class="fc-delete-row" aria-label="Remove panel">×</button></td>';
 body.appendChild(tr);
 tr.addEventListener("input",calcKnitPanel);
 tr.querySelector(".fc-delete-row").addEventListener("click",()=>{tr.remove();calcKnitPanel()});
 calcKnitPanel();
}
function basicKnitData(){
 const unit=S.knitUnit||"cm",div=C[unit],qty=val("kg-qty"),waste=val("kg-waste"),shrink=val("kg-shrink");
 const body=document.getElementById("ck-body")?.checked!==false, sleeve=document.getElementById("ck-sleeve")?.checked!==false;
 const bl=total("kg-bl","kg-bla"),sl=sleeve?total("kg-sl","kg-sla"):0,hc=total("kg-hc","kg-hca"),gsm=val("kg-bgsm");
 let bodyPc=0;
 if(body&&bl>0&&hc>0&&gsm>0&&qty>0)bodyPc=((bl+sl)*hc*2*gsm)/div*(1+pct(shrink));
 const components=[];
 const add=(key,label,pc)=>{if(pc>0)components.push({key,label,pc})};
 add("body","👕 Body",bodyPc);
 if(document.getElementById("ck-collar")?.checked)add("collar","🧣 Collar",total("kg-cl","kg-cla")*total("kg-cw","kg-cwa")*val("kg-cgsm")/div*(1+pct(shrink)));
 if(document.getElementById("ck-cuff")?.checked)add("cuff","🧤 Cuff",total("kg-cul","kg-cula")*total("kg-cuw","kg-cuwa")*2*val("kg-cugsm")/div*(1+pct(shrink)));
 if(document.getElementById("ck-pocket")?.checked)add("pocket","🪡 Pocket",total("kg-pl","kg-pla")*total("kg-pw","kg-pwa")*Math.max(1,val("kg-pqty"))*val("kg-pgsm")/div*(1+pct(shrink)));
 if(document.getElementById("ck-halfmoon")?.checked)add("halfmoon","🌙 Half-moon",total("kg-hml","kg-hmla")*total("kg-hmw","kg-hmwa")*val("kg-hmgsm")/div*(1+pct(shrink)));
 const netPc=components.reduce((s,x)=>s+x.pc,0),netDz=netPc*12,afterDz=netDz*(1+pct(waste)),totalKg=afterDz/12*qty;
 return {unit,qty,netPc,netDz,afterDz,totalKg,components};
}
window.calcKnitGarments=function(){
 const method=document.getElementById("page-knit")?.dataset.fcMethod||"basic";
 if(method==="marker")return calcKnitMarker();
 if(method==="panel")return calcKnitPanel();
 const d=basicKnitData();
 setv("kg-total-kg",d.totalKg>0?f(d.totalKg,3)+" kg":"—");
 setv("kg-per-dz-label",d.afterDz>0?f(d.afterDz,3)+" kg/dz":"— kg/dz");
 setv("kg-per-pcs-label",d.afterDz>0?f(d.afterDz/12,3)+" kg/pcs":"— kg/pcs");
 setv("kg-total-before",d.netDz>0?f(d.netDz,3)+" kg/dz":"— kg/dz");
 setv("kg-total-after",d.afterDz>0?f(d.afterDz,3)+" kg/dz":"— kg/dz");
 const ids={body:["kg-body-row","kg-body-disp"],collar:["kg-collar-row","kg-collar-disp"],cuff:["kg-cuff-row","kg-cuff-disp"],pocket:["kg-pocket-row","kg-pocket-disp"],halfmoon:["kg-halfmoon-row","kg-halfmoon-disp"]};
 Object.keys(ids).forEach(k=>{const row=document.getElementById(ids[k][0]),sp=document.getElementById(ids[k][1]),x=d.components.find(c=>c.key===k);if(row)row.style.display=x?"flex":"none";if(sp)sp.innerText=x?f(x.pc*12,3)+" kg/dz | "+f(x.pc,3)+" kg/pcs":"—";});
 toggleSleeve();
 return d;
};
function calcKnitMarker(){
 const L=val("kn-m-length"),W=val("kn-m-width"),pcs=val("kn-m-pcs"),gsm=val("kn-m-gsm"),w=val("kn-m-waste"),s=val("kn-m-shrink");
 if(!(L>0&&W>0&&pcs>0&&gsm>0)){setv("kn-marker-result","—");return}
 const netPc=(L*(1+pct(s))*W*(1+pct(s))*gsm)/(1550000*pcs);
 const afterPc=netPc*(1+pct(w)),dz=afterPc*12,total=afterPc*val("kg-qty");
 setv("kn-marker-result",f(dz,3)+" kg/dz");
 const d=document.getElementById("kn-marker-result-detail");if(d)d.innerHTML='<div class="fc-summary-badge">MARKER METHOD</div><div class="fc-result-row"><span>Net / pc</span><strong>'+f(netPc,4)+' kg</strong></div><div class="fc-result-row"><span>After allowance / pc</span><strong>'+f(afterPc,4)+' kg</strong></div><div class="fc-result-row"><span>Total order</span><strong>'+f(total,3)+' kg</strong></div><div class="fc-result-row"><span>Marker area</span><strong>'+f(L*W/1550,3)+' m²</strong></div>';
 return {netPc,afterPc,dz,total};
}
function calcKnitPanel(){
 const rows=[...(document.querySelectorAll("#kn-panel-body tr"))],w=val("kn-panel-waste"),s=val("kn-panel-shrink");
 let area=0;rows.forEach(tr=>{area+=valEl(tr,"l")*valEl(tr,"w")*valEl(tr,"q")});
 const gsmWeighted=rows.reduce((sum,tr)=>sum+(valEl(tr,"l")*valEl(tr,"w")*valEl(tr,"q")*(1+pct(s))**2*valEl(tr,"gsm")),0);
 if(!(area>0&&gsmWeighted>0)){setv("kn-panel-result","—");return}
 const netKgPc=gsmWeighted/10000/1000,afterPc=netKgPc*(1+pct(s))*(1+pct(w)),dz=afterPc*12,total=afterPc*val("kg-qty");
 setv("kn-panel-result",f(dz,3)+" kg/dz");
 const d=document.getElementById("kn-panel-result-detail");if(d)d.innerHTML='<div class="fc-summary-badge">PANEL METHOD</div><div class="fc-result-row"><span>Net area / pc</span><strong>'+f(area/10000,4)+' m²</strong></div><div class="fc-result-row"><span>Net / pc</span><strong>'+f(netKgPc,4)+' kg</strong></div><div class="fc-result-row"><span>After wastage / pc</span><strong>'+f(afterPc,4)+' kg</strong></div><div class="fc-result-row"><span>Total order</span><strong>'+f(total,3)+' kg</strong></div>';
 return {area,netKgPc,afterPc,dz,total};
}
function valEl(tr,key){const e=tr.querySelector('[data-kp="'+key+'"]');return Number(e?.value)||0}

function enhancePant(){
 addMethodBar("page-knitpant",[{id:"basic",label:'<svg class="fc-icon" aria-hidden="true"><use href="#i-calculator"></use></svg> Basic'},{id:"marker",label:'<svg class="fc-icon" aria-hidden="true"><use href="#i-marker"></use></svg> Marker'},{id:"panel",label:'<svg class="fc-icon" aria-hidden="true"><use href="#i-panels"></use></svg> Panel'}],"");
 const page=document.getElementById("page-knitpant"),basic=page?.querySelector(".calc-grid");if(basic)basic.classList.add("fc-basic-content");
 addShrinkToBasic("page-knitpant",".calc-grid",{shrink:"kp-shrink",width:"kp-width"});
 const mf='<div class="fc-method-fields">'+input("kp-m-length","Marker Length (inch)","e.g., 60")+input("kp-m-width","Usable Width (inch)","e.g., 72")+input("kp-m-pcs","Garments in Marker","e.g., 10")+input("kp-m-gsm","GSM","e.g., 240")+input("kp-m-waste","Wastage %","e.g., 5")+input("kp-m-shrink","Shrinkage %","e.g., 0")+'</div>';
 addAdvanced("page-knitpant","marker","Marker-based Pant Consumption","Use the actual pant marker when available. Shrinkage is treated as a separate allowance factor.",mf,"kp-marker-result");
 const pf='<div class="fc-method-fields">'+input("kp-parea","Total Panel Area / garment (cm²)","e.g., 8000")+input("kp-pgsm","GSM","e.g., 240")+input("kp-pwaste","Wastage %","e.g., 5")+input("kp-pshrink","Shrinkage %","e.g., 0")+input("kp-pqty","Order Quantity (pcs)","e.g., 1200")+input("kp-pwidth","Usable Width (cm, reference)","e.g., 180")+'</div><div class="fc-info">Panel mode accepts the total cut-panel area per garment. Include seam/hem allowances in that area. This keeps the method auditable without pretending a CAD shape is a rectangle.</div>';
 addAdvanced("page-knitpant","panel","Panel-area Pant Consumption","Useful when you have total pattern/panel area but no marker yet. Shrinkage is treated as an allowance factor; confirm directional shrinkage from test data.",pf,"kp-panel-result");
}
window.calcKnitPant=function(){
 const method=document.getElementById("page-knitpant")?.dataset.fcMethod||"basic";
 if(method==="marker")return calcPantMarker();
 if(method==="panel")return calcPantPanel();
 const div=(S.pantUnit||"cm")==="inch"?1550000:10000000;
 const IL=total("kp-il","kp-ila"),CFR=total("kp-cfr","kp-cfra"),WBW=total("kp-wbw","kp-wbwa"),HTC=total("kp-htc","kp-htca"),gsm=val("kp-gsm"),w=val("kp-waste"),s=val("kp-shrink");
 const net=(IL+CFR+WBW)*HTC*4*gsm*12/div*(1+pct(s)),after=net*(1+pct(w));
 setv("kp-r-dz",gsm>0?f(after,3)+" kg/dz":"—");setv("kp-r-pcs",gsm>0?f(after/12,4)+" kg":"—");
 updatePantTotalsOnly();
 return {net,after};
};
function calcPantMarker(){
 const L=val("kp-m-length"),W=val("kp-m-width"),pcs=val("kp-m-pcs"),gsm=val("kp-m-gsm"),w=val("kp-m-waste"),s=val("kp-m-shrink");
 if(!(L>0&&W>0&&pcs>0&&gsm>0)){setv("kp-marker-result","—");return}
 const netPc=L*W*gsm/(1550000*pcs)*(1+pct(s)),after=netPc*(1+pct(w)),dz=after*12,total=after*val("kp-qty");
 setv("kp-marker-result",f(dz,3)+" kg/dz");const d=document.getElementById("kp-marker-result-detail");if(d)d.innerHTML='<div class="fc-summary-badge">MARKER METHOD</div><div class="fc-result-row"><span>Net / pc</span><strong>'+f(netPc,4)+' kg</strong></div><div class="fc-result-row"><span>After allowance / pc</span><strong>'+f(after,4)+' kg</strong></div><div class="fc-result-row"><span>Total order</span><strong>'+f(total,3)+' kg</strong></div>';
 return {netPc,after,dz,total};
}
function calcPantPanel(){
 const area=val("kp-parea"),gsm=val("kp-pgsm"),w=val("kp-pwaste"),s=val("kp-pshrink"),qty=val("kp-pqty");
 if(!(area>0&&gsm>0)){setv("kp-panel-result","—");return}
 const netPc=area*gsm/10000000*(1+pct(s))*(1+pct(w)),dz=after*12,total=after*qty;
 setv("kp-panel-result",f(dz,3)+" kg/dz");const d=document.getElementById("kp-panel-result-detail");if(d)d.innerHTML='<div class="fc-summary-badge">PANEL METHOD</div><div class="fc-result-row"><span>Net / pc</span><strong>'+f(netPc,4)+' kg</strong></div><div class="fc-result-row"><span>After wastage / pc</span><strong>'+f(after,4)+' kg</strong></div><div class="fc-result-row"><span>Total order</span><strong>'+f(total,3)+' kg</strong></div>';
 return {netPc,after,dz,total};
}
function enhanceWoven(){
 addMethodBar("page-woven",[{id:"basic",label:'<svg class="fc-icon" aria-hidden="true"><use href="#i-calculator"></use></svg> Basic Estimate'},{id:"marker",label:'<svg class="fc-icon" aria-hidden="true"><use href="#i-marker"></use></svg> Marker'},{id:"panel",label:'<svg class="fc-icon" aria-hidden="true"><use href="#i-panels"></use></svg> Pattern Area'}],"");
 const page=document.getElementById("page-woven"),basic=page?.querySelector(".calc-grid");if(basic)basic.classList.add("fc-basic-content");
 const mf='<div class="fc-method-fields">'+input("wv-m-length","Marker Length (m)","e.g., 6.2")+input("wv-m-pcs","Garments in Marker","e.g., 4")+input("wv-m-allow","End Loss / Allowance %","e.g., 3")+input("wv-m-shrink","Shrinkage %","e.g., 0")+input("wv-m-qty","Order Quantity (pcs)","e.g., 1200")+'</div><div class="fc-info">Marker method: marker length ÷ garments in marker, then allowances. The usable/cuttable width remains a critical production input; the actual marker should be confirmed at the received width.</div>';
 addAdvanced("page-woven","marker","Marker-based Woven Consumption","Use this when a CAD marker exists.",mf,"wv-marker-result");
 const pf='<div class="fc-method-fields">'+input("wv-p-area","Pattern Area / garment (cm²)","e.g., 12000")+input("wv-p-width","Usable Width (cm)","e.g., 150")+input("wv-p-eff","Marker Efficiency %","e.g., 85")+input("wv-p-allow","Allowance %","e.g., 3")+input("wv-p-shrink","Shrinkage %","e.g., 0")+input("wv-p-qty","Order Quantity (pcs)","e.g., 1200")+'</div><div class="fc-info">Pattern-area mode is an estimate before a final marker. It divides pattern area by cuttable width and expected marker efficiency, then applies allowance.</div>';
 addAdvanced("page-woven","panel","Pattern-area Woven Consumption","Useful before the final CAD marker is available.",pf,"wv-panel-result");
}
window.calcWoven=function(){
 const method=document.getElementById("page-woven")?.dataset.fcMethod||"basic";
 if(method==="marker")return calcWovenMarker();
 if(method==="panel")return calcWovenPanel();
 const FW=val("ws-fw");if(!FW){setv("ws-r-total","—");setv("ws-r-body","—");setv("ws-r-sleeve","—");return}
 const s=val("ws-shrink"),BL=val("ws-bl")+val("ws-bla"),HC=val("ws-hc")+val("ws-hca"),SL=val("ws-sl")+val("ws-sla"),AH=val("ws-ah")+val("ws-aha");
 const div=FW*36*2.54,body=BL*HC*2*12/div,sleeve=SL*AH*2*2*12/div,total=body+sleeve,w=val("ws-waste"),after=total*(1+pct(s))*(1+pct(w));
 setv("ws-r-body",f(body,3)+" yds");setv("ws-r-sleeve",f(sleeve,3)+" yds");setv("ws-r-total",f(after,3)+" yds/dz");setv("ws-r-pc",f(after/12,3)+" yds");
 return {body,sleeve,total,after};
};
function calcWovenMarker(){
 const L=val("wv-m-length"),pcs=val("wv-m-pcs"),allow=val("wv-m-allow"),shrink=val("wv-m-shrink"),qty=val("wv-m-qty");
 if(!(L>0&&pcs>0)){setv("wv-marker-result","—");return}
 const perM=L/pcs*(1+pct(shrink))*(1+pct(allow)),yd=perM*1.0936132983,dz=yd*12,total=yd*qty;
 setv("wv-marker-result",f(dz,3)+" yd/dz");const d=document.getElementById("wv-marker-result-detail");if(d)d.innerHTML='<div class="fc-summary-badge">MARKER METHOD</div><div class="fc-result-row"><span>Consumption / pc</span><strong>'+f(perM,3)+' m | '+f(yd,3)+' yd</strong></div><div class="fc-result-row"><span>Total order</span><strong>'+f(total,2)+' yd</strong></div><div class="fc-result-row"><span>Per dozen</span><strong>'+f(dz,3)+' yd</strong></div>';
 return {perM,yd,dz,total};
}
function calcWovenPanel(){
 const area=val("wv-p-area"),width=val("wv-p-width"),eff=val("wv-p-eff"),allow=val("wv-p-allow"),shrink=val("wv-p-shrink"),qty=val("wv-p-qty");
 if(!(area>0&&width>0&&eff>0)){setv("wv-panel-result","—");return}
 const baseM=(area/(width*(eff/100)))/100,perM=baseM*(1+pct(shrink))*(1+pct(allow)),yd=perM*1.0936132983,dz=yd*12,total=yd*qty;
 setv("wv-panel-result",f(dz,3)+" yd/dz");const d=document.getElementById("wv-panel-result-detail");if(d)d.innerHTML='<div class="fc-summary-badge">PATTERN AREA</div><div class="fc-result-row"><span>Estimated / pc</span><strong>'+f(yd,3)+' yd</strong></div><div class="fc-result-row"><span>Per dozen</span><strong>'+f(dz,3)+' yd</strong></div><div class="fc-result-row"><span>Total order</span><strong>'+f(total,2)+' yd</strong></div>';
 return {baseM,perM,yd,dz,total};
}
function updatePantTotalsOnly(){ const pairs=[["kp-il","kp-ila","kp-ilt"],["kp-cfr","kp-cfra","kp-cfrt"],["kp-wbw","kp-wbwa","kp-wbwt"],["kp-htc","kp-htca","kp-htct"]]; pairs.forEach(p=>{const e=document.getElementById(p[2]);if(e)e.innerText=(val(p[0])+val(p[1])).toFixed(1)+" "+(S.pantUnit||"cm")}); }
function addExtraInputs(){
 const knit= document.getElementById("page-knit");if(knit&&!document.getElementById("kg-shrink")){}
 const pant=document.getElementById("page-knitpant");if(pant&&!document.getElementById("kp-shrink")){}
 const woven=document.getElementById("page-woven");if(woven&&!document.getElementById("ws-waste")){
   const row=html("div",{class:"field-row fc-basic-extra"});row.innerHTML=input("ws-waste","Wastage %","e.g., 3")+input("ws-shrink","Shrinkage %","e.g., 0");const target=woven.querySelector(".calc-grid");if(target)target.insertAdjacentElement("afterend",row);
 }
}
function convertFields(ids,from,to){
  if(from===to)return;
  const factor=from==="cm"&&to==="inch"?1/2.54:2.54;
  ids.forEach(id=>{const e=document.getElementById(id);if(!e||e.value==="")return;const x=Number(e.value);if(Number.isFinite(x))e.value=(x*factor).toFixed(2)});
}
function setupUnits(){
  const knitIds=["kg-bl","kg-bla","kg-sl","kg-sla","kg-hc","kg-hca","kg-cl","kg-cla","kg-cw","kg-cwa","kg-cul","kg-cula","kg-cuw","kg-cuwa","kg-pl","kg-pla","kg-pw","kg-pwa","kg-hml","kg-hmla","kg-hmw","kg-hmwa","kg-width"];
  const pantIds=["kp-il","kp-ila","kp-cfr","kp-cfra","kp-wbw","kp-wbwa","kp-htc","kp-htca","kp-width"];
  window.setKnitUnit=function(unit){
    if(unit!=="cm"&&unit!=="inch")return;
    const from=S.knitUnit||"cm"; convertFields(knitIds,from,unit); S.knitUnit=unit;
    document.querySelectorAll("#page-knit .unit-label").forEach(e=>e.textContent="("+unit+")");
    document.querySelectorAll("#page-knit .unit-bar .u-btn").forEach(b=>b.classList.toggle("active",b.dataset.unit===unit));
    updateKnitTotalsSafe(); calcKnitGarments();
  };
  window.setPantUnit=function(unit){
    if(unit!=="cm"&&unit!=="inch")return;
    const from=S.pantUnit||"cm"; convertFields(pantIds,from,unit); S.pantUnit=unit;
    document.querySelectorAll("#page-knitpant .unit-label").forEach(e=>e.textContent="("+unit+")");
    document.querySelectorAll("#page-knitpant .unit-bar .u-btn").forEach(b=>b.classList.toggle("active",b.dataset.unit===unit));
    updatePantTotalsOnly(); calcKnitPant();
  };
}
function updateKnitTotalsSafe(){
 const pairs=[["kg-bl","kg-bla","kg-blt"],["kg-sl","kg-sla","kg-slt"],["kg-hc","kg-hca","kg-hct"],["kg-cl","kg-cla","kg-clt"],["kg-cw","kg-cwa","kg-cwt"],["kg-cul","kg-cula","kg-cul-t"],["kg-cuw","kg-cuwa","kg-cuw-t"],["kg-pl","kg-pla","kg-pl-t"],["kg-pw","kg-pwa","kg-pw-t"],["kg-hml","kg-hmla","kg-hml-t"],["kg-hmw","kg-hmwa","kg-hmw-t"]];
 pairs.forEach(p=>{const e=document.getElementById(p[2]);if(e)e.innerText=(val(p[0])+val(p[1])).toFixed(1)+" "+(S.knitUnit||"cm")});
}
function setup(){
 setupUnits(); enhanceKnit();enhancePant();enhanceWoven();addExtraInputs();toggleSleeve();
 ["page-knit","page-knitpant","page-woven"].forEach(id=>{
   const p=document.getElementById(id);if(p)p.addEventListener("input",()=>{if(id==="page-knit")calcKnitGarments();else if(id==="page-knitpant")calcKnitPant();else calcWoven()});
 });
 document.addEventListener("click",e=>{
   if(e.target.closest(".fc-method-btn"))return;
 });
 calcKnitGarments();calcKnitPant();calcWoven();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",setup);else setup();
})();