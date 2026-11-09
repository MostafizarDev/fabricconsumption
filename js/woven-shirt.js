// ============================================
// WOVEN SHIRT.JS - Woven Shirt Fabric Consumption (Yards)
// ============================================

let wovenUnit = 'cm';
const WS_RECENT_KEY = 'fabricConsumption.wovenShirtRecent.v1';
const WS_REPORT_KEY = 'fabricConsumption.wovenShirtReportInfo.v1';
let wsDemoSnapshot = null;

function wovenValueInCm(id) {
    const value = v(id);
    return wovenUnit === 'inch' ? value * 2.54 : value;
}

function updateWovenUnitUI() {
    document.querySelectorAll('[data-ws-unit]').forEach(button => {
        const active = button.dataset.wsUnit === wovenUnit;
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
}

function updateWovenTotals() {
    const pairs = [
        { a: 'ws-bl', b: 'ws-bla', t: 'ws-blt' },
        { a: 'ws-hc', b: 'ws-hca', t: 'ws-hct' },
        { a: 'ws-sl', b: 'ws-sla', t: 'ws-slt' },
        { a: 'ws-ah', b: 'ws-aha', t: 'ws-aht' }
    ];
    
    pairs.forEach(pair => {
        const total = v(pair.a) + v(pair.b);
        const span = el(pair.t);
        if (span) span.innerHTML = total.toFixed(1) + ' ' + (wovenUnit === 'inch' ? 'inch' : 'cm');
    });
    
    calcWoven();
}

function calcWoven() {
    const FW = v('ws-fw'); // Fabric width in inches
    if (FW === 0) {
        set('ws-r-total', '—');
        set('ws-r-body', '—');
        set('ws-r-sleeve', '—');
        return;
    }
    
    const div = FW * 36 * 2.54; // Convert to yards
    
    // BODY: (BL) × (HC) × 2 × 12 / DIVIDER
    const BL = wovenValueInCm('ws-bl') + wovenValueInCm('ws-bla');
    const HC = wovenValueInCm('ws-hc') + wovenValueInCm('ws-hca');
    const bodyDz = (BL * HC * 2 * 12) / div;
    
    // SLEEVE: (SL) × (AH) × 2 × 2 × 12 / DIVIDER
    const SL = wovenValueInCm('ws-sl') + wovenValueInCm('ws-sla');
    const AH = wovenValueInCm('ws-ah') + wovenValueInCm('ws-aha');
    const sleeveDz = (SL * AH * 2 * 2 * 12) / div;
    
    const totalDz = bodyDz + sleeveDz;
    const perPiece = totalDz / 12;
    
    set('ws-r-body', fmt(bodyDz, 3) + ' yds');
    set('ws-r-sleeve', fmt(sleeveDz, 3) + ' yds');
    set('ws-r-total', fmt(totalDz, 3) + ' yds/dz');
    set('ws-r-pc', fmt(perPiece, 3) + ' yds');
}


function wsCapture(){const values={};['ws-bl','ws-bla','ws-hc','ws-hca','ws-sl','ws-sla','ws-ah','ws-aha','ws-fw'].forEach(id=>values[id]=el(id)?.value||'');return {values,unit:wovenUnit,savedAt:new Date().toISOString()};}
function wsApply(state){if(!state)return;Object.entries(state.values||{}).forEach(([id,value])=>{if(el(id))el(id).value=value;});wovenUnit=state.unit==='inch'?'inch':'cm';el('ws-unit').value=wovenUnit;updateWovenUnitUI();updateWovenTotals();}
function wsRecent(){try{return JSON.parse(localStorage.getItem(WS_RECENT_KEY)||'[]');}catch(_){return[];}}
function wsRenderRecent(){const p=el('ws-recent-panel');if(!p)return;const list=wsRecent();p.innerHTML='<div class="knit-recent-head"><span>Recent Calculations · Last 5</span><button type="button" class="knit-recent-load" id="ws-save-current">Save Current</button></div>'+(list.length?list.map(x=>'<div class="knit-recent-item"><div class="knit-recent-info"><strong>'+String(x.title||'Woven Shirt').replace(/[<>]/g,'')+'</strong><small>'+new Date(x.state.savedAt).toLocaleString()+'</small></div><div class="knit-recent-actions"><button class="knit-recent-load" data-ws-load="'+x.id+'">Load</button><button class="knit-recent-delete" data-ws-delete="'+x.id+'">×</button></div></div>').join(''):'<div class="knit-recent-empty">No saved calculations yet.</div>');el('ws-save-current').onclick=()=>wsSaveRecent();p.querySelectorAll('[data-ws-load]').forEach(b=>b.onclick=()=>{const x=wsRecent().find(v=>v.id===b.dataset.wsLoad);wsApply(x.state);p.hidden=true;});p.querySelectorAll('[data-ws-delete]').forEach(b=>b.onclick=()=>{localStorage.setItem(WS_RECENT_KEY,JSON.stringify(wsRecent().filter(v=>v.id!==b.dataset.wsDelete)));wsRenderRecent();});}
function wsSaveRecent(){const info=JSON.parse(localStorage.getItem(WS_REPORT_KEY)||'{}');const item={id:'ws-'+Date.now(),title:info.style||'Woven Shirt',state:wsCapture()};localStorage.setItem(WS_RECENT_KEY,JSON.stringify([item,...wsRecent()].slice(0,5)));wsRenderRecent();}
function downloadWovenReport() {
    const FW = v('ws-fw') || 0;
    const totalDz = document.getElementById('ws-r-total')?.innerText || '—';
    const bodyDz = document.getElementById('ws-r-body')?.innerText || '—';
    const sleeveDz = document.getElementById('ws-r-sleeve')?.innerText || '—';
    const perPiece = document.getElementById('ws-r-pc')?.innerText || '—';
    
    const unitLabel = wovenUnit === 'inch' ? 'inch' : 'cm';
    const BL = (v('ws-bl') + v('ws-bla')).toFixed(1);
    const HC = (v('ws-hc') + v('ws-hca')).toFixed(1);
    const SL = (v('ws-sl') + v('ws-sla')).toFixed(1);
    const AH = (v('ws-ah') + v('ws-aha')).toFixed(1);
    
    const reportHtml = `
        <div class="header">
            <h1>👔 Woven Shirt Consumption Report</h1>
            <div class="date">Generated: ${new Date().toLocaleString()}</div>
        </div>
        
        <div class="box">
            <div>Total Fabric Consumption</div>
            <div class="box-value">${totalDz}</div>
            <div>per dozen (yards)</div>
            <div style="font-size: 12px; margin-top: 8px;">${perPiece} (per piece)</div>
        </div>
        
        <table>
            <thead>
                <tr><th>Component</th><th>Measurement (${unitLabel})</th><th>With Allowance (${unitLabel})</th><th>Consumption (yds/dz)</th></tr>
            </thead>
            <tbody>
                <tr><td>👕 Body</td>
                    <td>Length: ${v('ws-bl')}, Chest: ${v('ws-hc')}</td>
                    <td>${BL} ${unitLabel} × ${HC} ${unitLabel}</td>
                    <td>${bodyDz}</td>
                </tr>
                <tr><td>🧤 Sleeve</td>
                    <td>Length: ${v('ws-sl')}, Armhole: ${v('ws-ah')}</td>
                    <td>${SL} ${unitLabel} × ${AH} ${unitLabel}</td>
                    <td>${sleeveDz}</td>
                </tr>
            </tbody>
        </table>
        
        <div style="margin-top: 20px; padding: 12px; background: #f8fafc; border-radius: 8px;">
            <strong>📐 Input Summary:</strong><br>
            Fabric Width: ${FW} inches | Measurement Unit: ${unitLabel}<br>
            <strong>Formula (Body):</strong> (BL) × (HC) × 2 × 12 / (FW × 36 × 2.54)<br>
            <strong>Formula (Sleeve):</strong> (SL) × (AH) × 2 × 2 × 12 / (FW × 36 × 2.54)
        </div>
    `;
    
    generatePDF('Woven Shirt Report', reportHtml);
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('[data-ws-unit]').forEach(button => {
        button.addEventListener('click', function() {
            wovenUnit = this.dataset.wsUnit === 'inch' ? 'inch' : 'cm';
            const unitInput = el('ws-unit');
            if (unitInput) unitInput.value = wovenUnit;
            updateWovenUnitUI();
            updateWovenTotals();
        });
    });
    updateWovenUnitUI();

    el('ws-demo')?.addEventListener('click',function(){if(this.getAttribute('aria-pressed')==='true'){wsApply(wsDemoSnapshot);wsDemoSnapshot=null;this.setAttribute('aria-pressed','false');}else{wsDemoSnapshot=wsCapture();[['ws-bl',79],['ws-bla',6],['ws-hc',52],['ws-hca',6],['ws-sl',59],['ws-sla',6],['ws-ah',20],['ws-aha',5],['ws-fw',55]].forEach(([id,value])=>el(id).value=value);wovenUnit='cm';el('ws-unit').value='cm';updateWovenUnitUI();updateWovenTotals();this.setAttribute('aria-pressed','true');}});
    el('ws-recent-open')?.addEventListener('click',()=>{const p=el('ws-recent-panel'),open=p.hidden;wsRenderRecent();p.hidden=!open;el('ws-recent-open').setAttribute('aria-expanded',String(open));});
    el('ws-report-settings')?.addEventListener('click',()=>{const x=JSON.parse(localStorage.getItem(WS_REPORT_KEY)||'{}');['buyer','style','po','type'].forEach(k=>el('ws-report-'+k).value=x[k]||(k==='type'?'Woven Shirt':''));el('ws-report-modal').hidden=false;});
    document.querySelectorAll('[data-close-ws-modal]').forEach(b=>b.addEventListener('click',()=>el('ws-report-modal').hidden=true));
    el('ws-report-save')?.addEventListener('click',()=>{const x={};['buyer','style','po','type'].forEach(k=>x[k]=el('ws-report-'+k).value.trim());localStorage.setItem(WS_REPORT_KEY,JSON.stringify(x));el('ws-report-modal').hidden=true;});
    wsRenderRecent();

    // Input listeners
    const inputs = ['ws-bl', 'ws-bla', 'ws-hc', 'ws-hca', 'ws-sl', 'ws-sla', 'ws-ah', 'ws-aha', 'ws-fw'];
    inputs.forEach(id => {
        const input = el(id);
        if (input) input.addEventListener('input', updateWovenTotals);
    });
    
    // Calculate button
    const calcBtn = el('btn-calc-woven');
    if (calcBtn) calcBtn.addEventListener('click', calcWoven);
    
    // PDF button
    const pdfBtn = el('btn-pdf-woven');
    if (pdfBtn) pdfBtn.addEventListener('click', downloadWovenReport);
    
    // Initial calculation
    calcWoven();
});