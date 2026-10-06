/* FabricConsumption — Phase 01 Foundation Core */
(function(){
  "use strict";
  const FC = window.FC = window.FC || {};
  FC.version = "phase-01";
  FC.config = { storageTheme:"fc-theme", searchPlaceholder:"Search tools, calculators..." };

  FC.num = function(value, fallback=0){
    if(value===null || value===undefined || value==="") return fallback;
    const n = Number(String(value).replace(/,/g,"").trim());
    return Number.isFinite(n) ? n : fallback;
  };
  FC.isNumber = function(value){ return value!=="" && Number.isFinite(Number(String(value).replace(/,/g,"").trim())); };
  FC.validate = function(value, opts={}){
    const errors=[];
    if(opts.required && (value===null || value===undefined || String(value).trim()==="")) errors.push("Required");
    if(value!=="" && value!==null && value!==undefined && !FC.isNumber(value)) errors.push("Enter a valid number");
    if(FC.isNumber(value)){
      const n=FC.num(value);
      if(opts.min!==undefined && n<opts.min) errors.push("Minimum "+opts.min);
      if(opts.max!==undefined && n>opts.max) errors.push("Maximum "+opts.max);
    }
    return {valid:errors.length===0,errors};
  };
  FC.format = function(value, decimals=3){
    return Number.isFinite(Number(value)) ? Number(value).toFixed(decimals) : "—";
  };
  FC.units = { inchToCm:2.54, cmToInch:1/2.54, meterToYard:1.0936132983, yardToMeter:.9144 };
  FC.registry = {};
  FC.register = function(id, meta, calculate){ FC.registry[id]={id,meta:meta||{},calculate}; };
  FC.calculate = function(id, inputs){ return FC.registry[id] ? FC.registry[id].calculate(inputs||{}) : null; };
  FC.readInputs = function(root){
    const data={};
    (root||document).querySelectorAll("input,select,textarea").forEach(i=>{ if(i.id) data[i.id]=i.value; });
    return data;
  };

  function addHeaderControls(){
    const header=document.querySelector("header"), nav=document.querySelector(".tab-bar");
    if(!header || !nav) return;
    if(!document.querySelector(".fc-mobile-overlay")){
      const overlay=document.createElement("div"); overlay.className="fc-mobile-overlay";
      overlay.addEventListener("click",()=>document.body.classList.remove("fc-nav-open"));
      document.body.appendChild(overlay);
    }
    if(!header.querySelector(".fc-menu-btn")){
      const b=document.createElement("button"); b.className="fc-icon-btn fc-menu-btn"; b.type="button"; b.innerHTML="☰"; b.setAttribute("aria-label","Open navigation");
      b.addEventListener("click",()=>document.body.classList.toggle("fc-nav-open")); header.prepend(b);
    }
    if(!header.querySelector(".fc-top-search")){
      const wrap=document.createElement("div"); wrap.className="fc-top-search";
      wrap.innerHTML='<span class="fc-search-icon">⌕</span><input id="fc-tool-search" type="search" autocomplete="off" placeholder="'+FC.config.searchPlaceholder+'"><span class="fc-search-count"></span>';
      header.appendChild(wrap);
      wrap.querySelector("input").addEventListener("input",runSearch);
    }
    if(!header.querySelector(".fc-header-actions")){
      const actions=document.createElement("div"); actions.className="fc-header-actions";
      const theme=document.createElement("button"); theme.className="fc-icon-btn"; theme.type="button"; theme.id="fc-theme-toggle"; theme.setAttribute("aria-label","Toggle theme");
      theme.addEventListener("click",toggleTheme); actions.appendChild(theme); header.appendChild(actions);
    }
  }
  const groups=[
    ["CONSUMPTION",["knit","knitpant","woven"]],
    ["PRODUCTION",["booking","sizeratio"]],
    ["FABRIC & COSTING",["knitprice","fob"]],
    ["TRIMS",["zipper","trims"]],
    ["UTILITIES",["converter","myformulas"]]
  ];
  function groupNavigation(){
    const nav=document.querySelector(".tab-bar"); if(!nav || nav.dataset.grouped) return;
    nav.dataset.grouped="1";
    const buttons=[...nav.querySelectorAll(".tab-btn")];
    buttons.forEach(b=>b.classList.add("fc-nav-item"));
    groups.forEach(([label,ids])=>{
      const title=document.createElement("div"); title.className="fc-nav-group"; title.textContent=label; nav.appendChild(title);
      ids.forEach(id=>{ const b=buttons.find(x=>x.dataset.page===id); if(b) nav.appendChild(b); });
    });
  }
  function setupTheme(){
    const saved=localStorage.getItem(FC.config.storageTheme);
    const theme=saved || (matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");
    document.documentElement.dataset.theme=theme;
    updateThemeButton();
  }
  function toggleTheme(){
    const next=document.documentElement.dataset.theme==="dark"?"light":"dark";
    document.documentElement.dataset.theme=next; localStorage.setItem(FC.config.storageTheme,next); updateThemeButton();
  }
  function updateThemeButton(){ const b=document.getElementById("fc-theme-toggle"); if(b) b.textContent=document.documentElement.dataset.theme==="dark"?"☀":"☾"; }

  function runSearch(e){
    const q=(e.target.value||"").trim().toLowerCase(), pages=[...document.querySelectorAll(".page")];
    document.body.classList.toggle("fc-searching",!!q);
    let hits=0;
    pages.forEach(page=>{
      const searchable=(page.innerText||"").toLowerCase();
      const match=!q || searchable.includes(q);
      page.classList.toggle("fc-search-hit",match);
      const btn=document.querySelector('.tab-btn[data-page="'+page.id.replace("page-","")+'"]');
      if(btn) btn.classList.toggle("fc-nav-hidden",!!q&&!match);
      if(match && q) hits++;
    });
    const counter=document.querySelector(".fc-search-count"); if(counter) counter.textContent=q?(hits+" tool"+(hits===1?"":"s")):"";
    if(q){
      const first=pages.find(p=>p.classList.contains("fc-search-hit"));
      if(first){ first.classList.add("active"); document.querySelectorAll(".page").forEach(p=>{if(p!==first)p.classList.remove("active")}); }
    }
  }

  function setupValidation(){
    document.addEventListener("input",e=>{
      const t=e.target;
      if(!t.matches("input,textarea,select")) return;
      if(t.type==="text" || t.type==="number"){
        const raw=t.value.trim();
        if(raw!=="" && !FC.isNumber(raw)) t.classList.add("fc-invalid"); else t.classList.remove("fc-invalid");
        if(FC.isNumber(raw) && Number(raw)<0 && !/negative|loss|shrink|waste|allowance|profit|margin/i.test(t.id+" "+t.name)) t.classList.add("fc-invalid");
      }
    },true);
  }

  function setupLiveCalculations(){
    const map={knit:"calcKnitGarments",knitpant:"calcKnitPant",woven:"calcWoven",booking:"calcBooking",knitprice:"calcKnitPrice",zipper:"calcZipper",trims:"calcThread",fob:"calcFOB",sizeratio:"calcSizeRatio"};
    let timer=null;
    document.addEventListener("input",e=>{
      if(!e.target.closest(".page")) return;
      const page=e.target.closest(".page")?.id?.replace("page-","");
      const fn=map[page];
      if(!fn || typeof window[fn]!=="function") return;
      clearTimeout(timer); timer=setTimeout(()=>{try{window[fn]()}catch(err){console.warn("FC live calculation:",err)}},80);
    },true);
  }

  function boot(){
    document.body.classList.add("fc-ready");
    addHeaderControls(); groupNavigation(); setupTheme(); setupValidation(); setupLiveCalculations();
    document.querySelectorAll(".tab-btn").forEach(b=>b.addEventListener("click",()=>document.body.classList.remove("fc-nav-open")));
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot); else boot();
})();