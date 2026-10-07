// ============================================
// KNIT GARMENTS.JS - T-Shirt + Collar + Cuff + Pocket + Half-moon
// Formula: (Length × Width × Factor × GSM × Quantity) / DIVIDER
// ============================================

// Initialize variables
let knitUnit = 'cm';

function setKnitUnit(unit) {
    knitUnit = unit;
    updateUnitLabels();
    convertKnitInputs();
    updateTotalSpans();
    calcKnitGarments();
}

function updateUnitLabels() {
    // Update all unit labels in the page
    document.querySelectorAll('#page-knit .unit-label').forEach(label => {
        label.textContent = '(' + knitUnit + ')';
    });
    
    // Update all total span unit labels
    const allTotals = document.querySelectorAll('#page-knit .sa-tot');
    allTotals.forEach(span => {
        let currentText = span.innerHTML;
        currentText = currentText.replace(/\bcm\b|\binch\b/i, knitUnit);
        span.innerHTML = currentText;
    });
}

function convertKnitInputs() {
    // DISABLED - No automatic conversion and total update
    return;
}

// ========== UPDATE ONLY TOTAL SPANS (Actual + Allowance) ==========
function updateTotalSpans() {
    const pairs = [
        { a: 'kg-bl', b: 'kg-bla', t: 'kg-blt' },
        { a: 'kg-sl', b: 'kg-sla', t: 'kg-slt' },
        { a: 'kg-hc', b: 'kg-hca', t: 'kg-hct' },
        { a: 'kg-cl', b: 'kg-cla', t: 'kg-clt' },
        { a: 'kg-cw', b: 'kg-cwa', t: 'kg-cwt' },
        { a: 'kg-cul', b: 'kg-cula', t: 'kg-cul-t' },
        { a: 'kg-cuw', b: 'kg-cuwa', t: 'kg-cuw-t' },
        { a: 'kg-pl', b: 'kg-pla', t: 'kg-pl-t' },
        { a: 'kg-pw', b: 'kg-pwa', t: 'kg-pw-t' },
        { a: 'kg-hml', b: 'kg-hmla', t: 'kg-hml-t' },
        { a: 'kg-hmw', b: 'kg-hmwa', t: 'kg-hmw-t' }
    ];
    
    pairs.forEach(pair => {
        const aVal = parseFloat(document.getElementById(pair.a)?.value) || 0;
        const bVal = parseFloat(document.getElementById(pair.b)?.value) || 0;
        const total = aVal + bVal;
        const span = document.getElementById(pair.t);
        if (span) span.innerHTML = total.toFixed(1) + ' ' + knitUnit;
    });
}

function toggleOptPanels() {
    const showBody = document.getElementById('ck-body')?.checked || false;
    const showCollar = document.getElementById('ck-collar')?.checked || false;
    const showCuff = document.getElementById('ck-cuff')?.checked || false;
    const showPocket = document.getElementById('ck-pocket')?.checked || false;
    const showHalfmoon = document.getElementById('ck-halfmoon')?.checked || false;
    
    const bodyPanel = document.getElementById('panel-body');
    const collarPanel = document.getElementById('panel-collar');
    const cuffPanel = document.getElementById('panel-cuff');
    const pocketPanel = document.getElementById('panel-pocket');
    const halfmoonPanel = document.getElementById('panel-halfmoon');
    
    if (bodyPanel) bodyPanel.style.display = showBody ? 'block' : 'none';
    if (collarPanel) collarPanel.style.display = showCollar ? 'block' : 'none';
    if (cuffPanel) cuffPanel.style.display = showCuff ? 'block' : 'none';
    if (pocketPanel) pocketPanel.style.display = showPocket ? 'block' : 'none';
    if (halfmoonPanel) halfmoonPanel.style.display = showHalfmoon ? 'block' : 'none';
    
    calcKnitGarments();
}

// ========== RESET ALL INPUTS ON PAGE LOAD ==========
function resetAllInputs() {
    // Reset all text inputs to EMPTY
    const allInputs = document.querySelectorAll('#page-knit input');
    allInputs.forEach(input => {
        input.value = '';
    });
    
    // Reset all total spans to 0.0
    const allTotals = document.querySelectorAll('#page-knit .sa-tot');
    allTotals.forEach(span => {
        span.innerHTML = '0.0 ' + knitUnit;
    });
    
    // Reset result displays
    const resultSpans = [
        'kg-body-disp', 'kg-total-before', 'kg-total-after', 
        'kg-total-kg', 'kg-per-dz-label', 'kg-per-pc-label',
        'kg-collar-disp', 'kg-cuff-disp', 'kg-pocket-disp', 'kg-halfmoon-disp'
    ];
    resultSpans.forEach(id => {
        const span = document.getElementById(id);
        if (span) span.innerText = '—';
    });
    
    // Hide optional rows (but keep body visible initially)
    const optionalRows = ['kg-collar-row', 'kg-cuff-row', 'kg-pocket-row', 'kg-halfmoon-row'];
    optionalRows.forEach(id => {
        const row = document.getElementById(id);
        if (row) row.style.display = 'none';
    });
    
    // Make sure body panel is visible (checkbox is checked by default)
    const bodyPanel = document.getElementById('panel-body');
    if (bodyPanel) bodyPanel.style.display = 'block';
}



function calcKnitGarments() {
    const div = knitUnit === 'inch' ? 1550000 : 10000000;
    const qty = parseFloat(document.getElementById('kg-qty')?.value) || 0;
    const getVal = id => { const v = parseFloat(document.getElementById(id)?.value); return isNaN(v) ? 0 : v; };
    const withWaste = (baseDz, wastePct) => baseDz * (1 + wastePct / 100);

    let bodyPerPc=0, bodyDz=0, bodyAfterDz=0; const bodyWaste=getVal('kg-body-waste');
    if(document.getElementById('ck-body')?.checked){
        const BL=getVal('kg-bl')+getVal('kg-bla'), SL=getVal('kg-sl')+getVal('kg-sla'), HC=getVal('kg-hc')+getVal('kg-hca'), gsm=getVal('kg-bgsm');
        if(BL>0&&SL>0&&HC>0&&gsm>0&&qty>0){ bodyPerPc=((BL+SL)*HC*2*gsm)/div; bodyDz=bodyPerPc*12; bodyAfterDz=withWaste(bodyDz,bodyWaste); }
    }

    let collarPerPc=0, collarDz=0, collarAfterDz=0; const collarWaste=getVal('kg-collar-waste');
    if(document.getElementById('ck-collar')?.checked){
        const L=getVal('kg-cl')+getVal('kg-cla'), W=getVal('kg-cw')+getVal('kg-cwa'), gsm=getVal('kg-cgsm');
        if(L>0&&W>0&&gsm>0&&qty>0){ collarPerPc=(L*W*gsm)/div; collarDz=collarPerPc*12; collarAfterDz=withWaste(collarDz,collarWaste); }
    }

    let cuffPerPc=0, cuffDz=0, cuffAfterDz=0; const cuffWaste=getVal('kg-cuff-waste');
    if(document.getElementById('ck-cuff')?.checked){
        const L=getVal('kg-cul')+getVal('kg-cula'), W=getVal('kg-cuw')+getVal('kg-cuwa'), gsm=getVal('kg-cugsm');
        if(L>0&&W>0&&gsm>0&&qty>0){ cuffPerPc=(L*W*2*gsm)/div; cuffDz=cuffPerPc*12; cuffAfterDz=withWaste(cuffDz,cuffWaste); }
    }

    let pocketPerPc=0, pocketDz=0, pocketAfterDz=0; const pocketWaste=getVal('kg-pocket-waste');
    if(document.getElementById('ck-pocket')?.checked){
        const L=getVal('kg-pl')+getVal('kg-pla'), W=getVal('kg-pw')+getVal('kg-pwa'), pQty=getVal('kg-pqty')||1, gsm=getVal('kg-pgsm');
        if(L>0&&W>0&&gsm>0&&qty>0){ pocketPerPc=(L*W*pQty*gsm)/div; pocketDz=pocketPerPc*12; pocketAfterDz=withWaste(pocketDz,pocketWaste); }
    }

    let hmPerPc=0, hmDz=0, hmAfterDz=0; const hmWaste=getVal('kg-halfmoon-waste');
    if(document.getElementById('ck-halfmoon')?.checked){
        const L=getVal('kg-hml')+getVal('kg-hmla'), W=getVal('kg-hmw')+getVal('kg-hmwa'), gsm=getVal('kg-hmgsm');
        if(L>0&&W>0&&gsm>0&&qty>0){ hmPerPc=(L*W*gsm)/div; hmDz=hmPerPc*12; hmAfterDz=withWaste(hmDz,hmWaste); }
    }

    const totalDz=bodyDz+collarDz+cuffDz+pocketDz+hmDz;
    const totalWithWaste=bodyAfterDz+collarAfterDz+cuffAfterDz+pocketAfterDz+hmAfterDz;
    const totalKg=qty>0?(totalWithWaste/12)*qty:0;
    const fmt=(n,d)=>(isNaN(n)||n===0)?'—':n.toFixed(d);
    const updateRow=(checked,rowId,dispId,afterDz)=>{ const row=document.getElementById(rowId), disp=document.getElementById(dispId); if(checked){ if(row)row.style.display='flex'; if(disp)disp.innerText=afterDz>0?fmt(afterDz,3)+' kg/dz | '+fmt(afterDz/12,3)+' kg/pcs':'— kg/dz | — kg/pcs'; } else if(row)row.style.display='none'; };
    updateRow(document.getElementById('ck-body')?.checked,'kg-body-row','kg-body-disp',bodyAfterDz);
    updateRow(document.getElementById('ck-collar')?.checked,'kg-collar-row','kg-collar-disp',collarAfterDz);
    updateRow(document.getElementById('ck-cuff')?.checked,'kg-cuff-row','kg-cuff-disp',cuffAfterDz);
    updateRow(document.getElementById('ck-pocket')?.checked,'kg-pocket-row','kg-pocket-disp',pocketAfterDz);
    updateRow(document.getElementById('ck-halfmoon')?.checked,'kg-halfmoon-row','kg-halfmoon-disp',hmAfterDz);
    const before=document.getElementById('kg-total-before'); if(before)before.innerText=totalDz>0?fmt(totalDz,3)+' kg/dz':'— kg/dz';
    const after=document.getElementById('kg-total-after'); if(after)after.innerText=totalWithWaste>0?fmt(totalWithWaste,3)+' kg/dz':'— kg/dz';
    const total=document.getElementById('kg-total-kg'); if(total)total.innerText=totalKg>0?fmt(totalKg,3)+' kg':'— kg';
    const dz=document.getElementById('kg-per-dz-label'); if(dz)dz.innerText=totalWithWaste>0?fmt(totalWithWaste,3)+' kg/dz':'— kg/dz';
    const pc=document.getElementById('kg-per-pcs-label'); if(pc)pc.innerText=totalWithWaste>0?fmt(totalWithWaste/12,3)+' kg/pcs':'— kg/pcs';
}
// ========== PDF REPORT SVG ICONS ==========
function reportIcon(name) {
    const icons = {
        file: '<svg class="report-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h9l4 4v14H6z"></path><path d="M15 3v5h5M9 13h6M9 17h6"></path></svg>',
        info: '<svg class="report-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="M12 10v6M12 7h.01"></path></svg>',
        components: '<svg class="report-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"></path><circle cx="7" cy="7" r="1.5"></circle><circle cx="7" cy="12" r="1.5"></circle><circle cx="7" cy="17" r="1.5"></circle></svg>',
        summary: '<svg class="report-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19V9M12 19V5M19 19v-7"></path></svg>',
        status: '<svg class="report-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="m8 12 2.5 2.5L16 9"></path></svg>',
        formula: '<svg class="report-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h10M7 20h10M9 7l6 10M15 7l-6 10"></path></svg>',
        warning: '<svg class="report-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 2.5 20h19z"></path><path d="M12 9v5M12 17h.01"></path></svg>'
    };
    return icons[name] || icons.file;
}

// ========== Download Report ==========

function downloadKnitReport() {
    const getVal = id => {
        const n = parseFloat(document.getElementById(id)?.value);
        return isNaN(n) ? 0 : n;
    };
    const txt = id => document.getElementById(id)?.innerText || '—';
    const n = (v, d = 1) => Number(v || 0).toFixed(d);

    const qty = getVal('kg-qty');
    const unit = window.knitUnit || 'cm';
    const div = unit === 'inch' ? '1,550,000' : '10,000,000';

    const BL = getVal('kg-bl') + getVal('kg-bla');
    const SL = getVal('kg-sl') + getVal('kg-sla');
    const HC = getVal('kg-hc') + getVal('kg-hca');
    const CL = getVal('kg-cl') + getVal('kg-cla');
    const CW = getVal('kg-cw') + getVal('kg-cwa');
    const CuL = getVal('kg-cul') + getVal('kg-cula');
    const CuW = getVal('kg-cuw') + getVal('kg-cuwa');
    const PL = getVal('kg-pl') + getVal('kg-pla');
    const PW = getVal('kg-pw') + getVal('kg-pwa');
    const HML = getVal('kg-hml') + getVal('kg-hmla');
    const HMW = getVal('kg-hmw') + getVal('kg-hmwa');

    const bGSM = getVal('kg-bgsm');
    const cGSM = getVal('kg-cgsm');
    const cuGSM = getVal('kg-cugsm');
    const pGSM = getVal('kg-pgsm');
    const hmGSM = getVal('kg-hmgsm');
    const pQty = getVal('kg-pqty') || 1;

    const bodyDisp = txt('kg-body-disp');
    const collarDisp = txt('kg-collar-disp');
    const cuffDisp = txt('kg-cuff-disp');
    const pocketDisp = txt('kg-pocket-disp');
    const hmDisp = txt('kg-halfmoon-disp');

    const totalBefore = txt('kg-total-before');
    const totalAfter = txt('kg-total-after');
    const totalKg = txt('kg-total-kg');
    const perPc = txt('kg-per-pcs-label');
    const bodyWaste = getVal('kg-body-waste');
    const collarWaste = getVal('kg-collar-waste');
    const cuffWaste = getVal('kg-cuff-waste');
    const pocketWaste = getVal('kg-pocket-waste');
    const halfmoonWaste = getVal('kg-halfmoon-waste');

    const showCollar = document.getElementById('ck-collar')?.checked || false;
    const showCuff = document.getElementById('ck-cuff')?.checked || false;
    const showPocket = document.getElementById('ck-pocket')?.checked || false;
    const showHalfmoon = document.getElementById('ck-halfmoon')?.checked || false;

    const now = new Date();
    const reportId = 'FC-KNIT-' + now.toISOString().slice(0,10).replace(/-/g,'') + '-001';
    const dateText = now.toLocaleDateString('en-GB', {day:'2-digit', month:'short', year:'numeric'});
    const timeText = now.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});

    let no = 1;
    let rows = `
        <tr><td>${no++}</td><td><strong>Body</strong><div class="muted">Front + Back</div></td><td>${n(BL)} ${unit}</td><td>${n(SL)} ${unit}</td><td>${n(HC)} ${unit}</td><td>2</td><td>24</td><td>${n(bGSM,0)}</td><td>${n(bodyWaste,1)}%</td><td><strong>${bodyDisp.split('|')[0] || '—'}</strong></td></tr>`;

    if (showCollar) rows += `
        <tr><td>${no++}</td><td><strong>Collar</strong><div class="muted">Rib</div></td><td>${n(CL)} ${unit}</td><td>—</td><td>${n(CW)} ${unit}</td><td>1</td><td>12</td><td>${n(cGSM,0)}</td><td>${n(collarWaste,1)}%</td><td><strong>${collarDisp.split('|')[0] || '—'}</strong></td></tr>`;

    if (showCuff) rows += `
        <tr><td>${no++}</td><td><strong>Cuff</strong><div class="muted">Rib × 2</div></td><td>${n(CuL)} ${unit}</td><td>—</td><td>${n(CuW)} ${unit}</td><td>2</td><td>24</td><td>${n(cuGSM,0)}</td><td>${n(cuffWaste,1)}%</td><td><strong>${cuffDisp.split('|')[0] || '—'}</strong></td></tr>`;

    if (showPocket) rows += `
        <tr><td>${no++}</td><td><strong>Pocket</strong><div class="muted">Qty ${n(pQty,0)}</div></td><td>${n(PL)} ${unit}</td><td>—</td><td>${n(PW)} ${unit}</td><td>1</td><td>12</td><td>${n(pGSM,0)}</td><td>${n(pocketWaste,1)}%</td><td><strong>${pocketDisp.split('|')[0] || '—'}</strong></td></tr>`;

    if (showHalfmoon) rows += `
        <tr><td>${no++}</td><td><strong>Half-moon</strong><div class="muted">Body fabric</div></td><td>${n(HML)} ${unit}</td><td>—</td><td>${n(HMW)} ${unit}</td><td>1</td><td>12</td><td>${n(hmGSM,0)}</td><td>${n(halfmoonWaste,1)}%</td><td><strong>${hmDisp.split('|')[0] || '—'}</strong></td></tr>`;

    const reportHtml = `
        <div class="report">
            <div class="report-header">
                <div>
                    <div class="brand">FABRiCS <span>CONSUMPTiON</span></div>
                    <div class="subtitle">GARMENT CALCULATOR SUITE</div>
                </div>
                <div class="report-title">
                    <div class="eyebrow">CALCULATION REPORT</div>
                    <h1>Knit Fabrics Consumption</h1>
                    <div class="report-id">${reportId}</div>
                </div>
            </div>

            <div class="meta-grid">
                <div><span>Date</span><strong>${dateText}</strong></div>
                <div><span>Time</span><strong>${timeText}</strong></div>
                <div><span>Unit</span><strong>${unit.toUpperCase()}</strong></div>
                <div><span>Order Quantity</span><strong>${qty} pcs</strong></div>
            </div>

            <section class="section">
                <div class="section-head">${reportIcon('info')}<span>ORDER INFORMATION</span></div>
                <div class="info-grid">
                    <div><span>Buyer Name</span><strong>________________________</strong></div>
                    <div><span>Style No.</span><strong>________________________</strong></div>
                    <div><span>Garment Type</span><strong>T-Shirt / Knit</strong></div>
                    <div><span>Order Qty</span><strong>${qty} pcs</strong></div>
                </div>
            </section>

            <section class="section">
                <div class="section-head">${reportIcon('components')}<span>COMPONENT WISE CONSUMPTION</span></div>
                <table>
                    <thead><tr>
                        <th>SL</th><th>Component</th><th>Length</th><th>Sleeve</th><th>Width</th>
                        <th>Ply</th><th>Qty/Dz</th><th>GSM</th><th>Wastage</th><th>Final / Dz</th>
                    </tr></thead>
                    <tbody>${rows}</tbody>
                </table>
            </section>

            <section class="summary-grid">
                <div class="summary-card"><div class="metric-head">${reportIcon('components')}<span>NET CONSUMPTION</span></div><strong>${totalBefore}</strong><small>kg / dozen</small></div>
                <div class="summary-card"><div class="metric-head">${reportIcon('warning')}<span>WASTAGE</span></div><strong>Individual</strong><small>entered per component</small></div>
                <div class="summary-card primary"><div class="metric-head">${reportIcon('summary')}<span>GRAND TOTAL</span></div><strong>${totalKg}</strong><small>for ${qty} pcs</small></div>
                <div class="summary-card"><div class="metric-head">${reportIcon('file')}<span>PER PIECE</span></div><strong>${perPc}</strong><small>kg / piece</small></div>
            </section>

            <section class="section">
                <div class="section-head">${reportIcon('status')}<span>COMPONENT STATUS</span></div>
                <div class="status-grid">
                    <div class="status included">Body <b>Included</b></div>
                    <div class="status ${showCollar ? 'included' : 'excluded'}">Collar <b>${showCollar ? 'Included' : 'Not Included'}</b></div>
                    <div class="status ${showCuff ? 'included' : 'excluded'}">Cuff <b>${showCuff ? 'Included' : 'Not Included'}</b></div>
                    <div class="status ${showPocket ? 'included' : 'excluded'}">Pocket <b>${showPocket ? 'Included' : 'Not Included'}</b></div>
                    <div class="status ${showHalfmoon ? 'included' : 'excluded'}">Half-moon <b>${showHalfmoon ? 'Included' : 'Not Included'}</b></div>
                </div>
            </section>

            <section class="formula">
                <div class="section-head">${reportIcon('formula')}<span>FORMULA REFERENCE</span></div>
                <div class="formula-text">
                    <strong>Base consumption:</strong> Component dimensions × Ply × GSM ÷ ${div}
                    <br>
                    <strong>Final component:</strong> Base consumption × (1 + component wastage % ÷ 100)
                </div>
            </section>

            <div class="note">${reportIcon('warning')}<div><strong>IMPORTANT:</strong> This report is computer generated. Wastage is entered separately for Main Body, Collar, Cuff, Pocket and Half-moon. Verify all measurements, GSM, quantity and wastage before bulk production.</div></div>

            <div class="report-footer">
                <span>Fabrics Consumption • Garment Calculator Suite</span>
                <span>fabricconsumption.vercel.app</span>
            </div>
        </div>`;

    if (typeof generatePDF === 'function') {
        generatePDF('Knit Fabrics Consumption Report', reportHtml);
    } else {
        const printWindow = window.open('', '_blank');
        printWindow.document.write('<!DOCTYPE html><html><head><title>Knit Fabrics Consumption Report</title></head><body>' + reportHtml + '</body></html>');
        printWindow.document.close();
        printWindow.print();
    }
}

// ========== FORCE RESET ALL INPUTS ON PAGE LOAD ==========
function forceResetAllInputs() {
    const allInputs = document.querySelectorAll('#page-knit input');
    allInputs.forEach(input => {
        input.value = '';
    });
    
    const allTotals = document.querySelectorAll('#page-knit .sa-tot');
    allTotals.forEach(span => {
        span.innerHTML = '0.0 ' + knitUnit;
    });
    
    const resultIds = [
        'kg-body-disp', 'kg-total-before', 'kg-total-after',
        'kg-total-kg', 'kg-per-dz-label', 'kg-per-pc-label',
        'kg-collar-disp', 'kg-cuff-disp', 'kg-pocket-disp', 'kg-halfmoon-disp'
    ];
    resultIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerText = '—';
    });
    
    const optionalRows = ['kg-collar-row', 'kg-cuff-row', 'kg-pocket-row', 'kg-halfmoon-row'];
    optionalRows.forEach(id => {
        const row = document.getElementById(id);
        if (row) row.style.display = 'none';
    });
}

// ========== EVENT LISTENERS ==========
document.addEventListener('DOMContentLoaded', function() {
    // Unit buttons
    document.querySelectorAll('#page-knit .unit-bar .u-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const unit = this.getAttribute('data-unit');
            setKnitUnit(unit);
            document.querySelectorAll('#page-knit .unit-bar .u-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Checkbox listeners
const checkboxes = ['ck-body', 'ck-collar', 'ck-cuff', 'ck-pocket', 'ck-halfmoon'];
checkboxes.forEach(id => {
    const cb = document.getElementById(id);
    if (cb) cb.addEventListener('change', toggleOptPanels);
});
    
    // Input listeners - Update total spans in real-time
    const inputs = [
        'kg-bl', 'kg-bla', 'kg-sl', 'kg-sla', 'kg-hc', 'kg-hca', 'kg-bgsm',
        'kg-cl', 'kg-cla', 'kg-cw', 'kg-cwa', 'kg-cgsm',
        'kg-cul', 'kg-cula', 'kg-cuw', 'kg-cuwa', 'kg-cugsm',
        'kg-pl', 'kg-pla', 'kg-pw', 'kg-pwa', 'kg-pgsm', 'kg-pqty',
        'kg-hml', 'kg-hmla', 'kg-hmw', 'kg-hmwa', 'kg-hmgsm',
        'kg-body-waste', 'kg-collar-waste', 'kg-cuff-waste', 'kg-pocket-waste', 'kg-halfmoon-waste', 'kg-qty'
    ];
    inputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) input.addEventListener('input', function() {
            updateTotalSpans();
            calcKnitGarments();  // Resualt Live update
        });
    });
    
    // Calculate button
    const calcBtn = document.getElementById('btn-calc-knit');
    if (calcBtn) calcBtn.addEventListener('click', calcKnitGarments);
    
    // PDF button
    const pdfBtn = document.getElementById('btn-pdf-knit');
    if (pdfBtn) pdfBtn.addEventListener('click', downloadKnitReport);
    
    // Set default unit button active
    const defaultBtn = document.querySelector('#page-knit .unit-bar .u-btn[data-unit="cm"]');
    if (defaultBtn) defaultBtn.classList.add('active');
    
    // Force reset all inputs
    forceResetAllInputs();
});
