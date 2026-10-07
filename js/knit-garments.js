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
    const waste = parseFloat(document.getElementById('kg-waste')?.value) || 0;
    
    function getVal(id) {
        const val = parseFloat(document.getElementById(id)?.value);
        return isNaN(val) ? 0 : val;
    }
    
    // BODY
let bodyPerPc = 0, bodyDz = 0;
if (document.getElementById('ck-body')?.checked) {
    const BL = getVal('kg-bl') + getVal('kg-bla');
    const SL = getVal('kg-sl') + getVal('kg-sla');
    const HC = getVal('kg-hc') + getVal('kg-hca');
    const bGSM = getVal('kg-bgsm') || 0;
    
    if (BL > 0 && SL > 0 && HC > 0 && bGSM > 0 && qty > 0) {
        bodyPerPc = ((BL + SL) * HC * 2 * bGSM) / div;
        bodyDz = bodyPerPc * 12;
    }
}
    
    // COLLAR
    let collarPerPc = 0, collarDz = 0;
    if (document.getElementById('ck-collar')?.checked) {
        const CL = getVal('kg-cl') + getVal('kg-cla');
        const CW = getVal('kg-cw') + getVal('kg-cwa');
        const cGSM = getVal('kg-cgsm') || 0;
        if (CL > 0 && CW > 0 && cGSM > 0 && qty > 0) {
            collarPerPc = (CL * CW * cGSM) / div;
            collarDz = collarPerPc * 12;
        }
    }
    
    // CUFF
    let cuffPerPc = 0, cuffDz = 0;
    if (document.getElementById('ck-cuff')?.checked) {
        const CL = getVal('kg-cul') + getVal('kg-cula');
        const CW = getVal('kg-cuw') + getVal('kg-cuwa');
        const cuGSM = getVal('kg-cugsm') || 0;
        if (CL > 0 && CW > 0 && cuGSM > 0 && qty > 0) {
            cuffPerPc = (CL * CW * 2 * cuGSM) / div;
            cuffDz = cuffPerPc * 12;
        }
    }
    
    // POCKET
    let pocketPerPc = 0, pocketDz = 0;
    if (document.getElementById('ck-pocket')?.checked) {
        const PL = getVal('kg-pl') + getVal('kg-pla');
        const PW = getVal('kg-pw') + getVal('kg-pwa');
        const pQty = getVal('kg-pqty') || 1;
        const pGSM = getVal('kg-pgsm') || 0;
        if (PL > 0 && PW > 0 && pGSM > 0 && qty > 0) {
            pocketPerPc = (PL * PW * pQty * pGSM) / div;
            pocketDz = pocketPerPc * 12;
        }
    }
    
    // HALF-MOON
    let hmPerPc = 0, hmDz = 0;
    if (document.getElementById('ck-halfmoon')?.checked) {
        const HL = getVal('kg-hml') + getVal('kg-hmla');
        const HW = getVal('kg-hmw') + getVal('kg-hmwa');
        const hmGSM = getVal('kg-hmgsm') || 0;
        if (HL > 0 && HW > 0 && hmGSM > 0 && qty > 0) {
            hmPerPc = (HL * HW * hmGSM) / div;
            hmDz = hmPerPc * 12;
        }
    }
    
    const totalPerPc = bodyPerPc + collarPerPc + cuffPerPc + pocketPerPc + hmPerPc;
    const totalDz = totalPerPc * 12;
    const totalWithWaste = totalDz * (1 + waste / 100);
    const totalKg = (totalWithWaste / 12) * qty;
    
    function fmt(n, d) {
        return (isNaN(n) || n === 0) ? '—' : n.toFixed(d);
    }
    
    const bodyRow = document.getElementById('kg-body-row');
    const bodyDisp = document.getElementById('kg-body-disp');

    if (document.getElementById('ck-body')?.checked) {
    if (bodyRow) bodyRow.style.display = 'flex';
    if (bodyDisp) bodyDisp.innerText = (bodyDz > 0 ? fmt(bodyDz, 3) + ' kg/dz | ' + fmt(bodyPerPc, 3) + ' kg/pcs' : '— kg/dz | — kg/pcs');
    } else if (bodyRow) bodyRow.style.display = 'none';
    
    const totalBefore = document.getElementById('kg-total-before');
    if (totalBefore) totalBefore.innerText = (totalDz > 0 ? fmt(totalDz, 3) + ' kg/dz' : '— kg/dz');
    
    const totalAfter = document.getElementById('kg-total-after');
    if (totalAfter) totalAfter.innerText = (totalWithWaste > 0 ? fmt(totalWithWaste, 3) + ' kg/dz' : '— kg/dz');
    
    const totalKgElem = document.getElementById('kg-total-kg');
    if (totalKgElem) totalKgElem.innerText = (totalKg > 0 ? fmt(totalKg, 3) + ' kg' : '— kg');
    
    const perDzLabel = document.getElementById('kg-per-dz-label');
    if (perDzLabel) perDzLabel.innerText = (totalWithWaste > 0 ? fmt(totalWithWaste, 3) + ' kg/dz' : '— kg/dz');
    
    const perPcLabel = document.getElementById('kg-per-pcs-label');
    if (perPcLabel) perPcLabel.innerText = (totalWithWaste > 0 ? fmt(totalWithWaste / 12, 3) + ' kg/pcs' : '— kg/pcs');
    
    // Optional rows
    const collarRow = document.getElementById('kg-collar-row');
    const cuffRow = document.getElementById('kg-cuff-row');
    const pocketRow = document.getElementById('kg-pocket-row');
    const hmRow = document.getElementById('kg-halfmoon-row');
    const collarDispSpan = document.getElementById('kg-collar-disp');
    const cuffDispSpan = document.getElementById('kg-cuff-disp');
    const pocketDispSpan = document.getElementById('kg-pocket-disp');
    const hmDispSpan = document.getElementById('kg-halfmoon-disp');
    
    if (document.getElementById('ck-collar')?.checked) {
        if (collarRow) collarRow.style.display = 'flex';
        if (collarDispSpan) collarDispSpan.innerText = (collarDz > 0 ? fmt(collarDz, 3) + ' kg/dz | ' + fmt(collarPerPc, 3) + ' kg/pcs' : '— kg/dz | — kg/pcs');
    } else if (collarRow) collarRow.style.display = 'none';
    
    if (document.getElementById('ck-cuff')?.checked) {
        if (cuffRow) cuffRow.style.display = 'flex';
        if (cuffDispSpan) cuffDispSpan.innerText = (cuffDz > 0 ? fmt(cuffDz, 3) + ' kg/dz | ' + fmt(cuffPerPc, 3) + ' kg/pcs' : '— kg/dz | — kg/pcs');
    } else if (cuffRow) cuffRow.style.display = 'none';
    
    if (document.getElementById('ck-pocket')?.checked) {
        if (pocketRow) pocketRow.style.display = 'flex';
        if (pocketDispSpan) pocketDispSpan.innerText = (pocketDz > 0 ? fmt(pocketDz, 3) + ' kg/dz | ' + fmt(pocketPerPc, 3) + ' kg/pcs' : '— kg/dz | — kg/pcs');
    } else if (pocketRow) pocketRow.style.display = 'none';
    
    if (document.getElementById('ck-halfmoon')?.checked) {
        if (hmRow) hmRow.style.display = 'flex';
        if (hmDispSpan) hmDispSpan.innerText = (hmDz > 0 ? fmt(hmDz, 3) + ' kg/dz | ' + fmt(hmPerPc, 3) + ' kg/pcs' : '— kg/dz | — kg/pcs');
    } else if (hmRow) hmRow.style.display = 'none';
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
    const waste = getVal('kg-waste');
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

    const showCollar = document.getElementById('ck-collar')?.checked || false;
    const showCuff = document.getElementById('ck-cuff')?.checked || false;
    const showPocket = document.getElementById('ck-pocket')?.checked || false;
    const showHalfmoon = document.getElementById('ck-halfmoon')?.checked || false;

    const now = new Date();
    const reportId = 'FC-KNIT-' + now.toISOString().slice(0,10).replace(/-/g,'') + '-001';
    const dateText = now.toLocaleDateString('en-GB', {day:'2-digit', month:'short', year:'numeric'});
    const timeText = now.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});

    let no = 1;
    let rows = \`
        <tr><td>\${no++}</td><td><strong>Body</strong><div class="muted">Front + Back</div></td><td>\${n(BL)} \${unit}</td><td>\${n(SL)} \${unit}</td><td>\${n(HC)} \${unit}</td><td>2</td><td>24</td><td>\${n(bGSM,0)}</td><td><strong>\${bodyDisp.split('|')[0] || '—'}</strong></td></tr>\`;

    if (showCollar) rows += \`
        <tr><td>\${no++}</td><td><strong>Collar</strong><div class="muted">Rib</div></td><td>\${n(CL)} \${unit}</td><td>—</td><td>\${n(CW)} \${unit}</td><td>1</td><td>12</td><td>\${n(cGSM,0)}</td><td><strong>\${collarDisp.split('|')[0] || '—'}</strong></td></tr>\`;

    if (showCuff) rows += \`
        <tr><td>\${no++}</td><td><strong>Cuff</strong><div class="muted">Rib × 2</div></td><td>\${n(CuL)} \${unit}</td><td>—</td><td>\${n(CuW)} \${unit}</td><td>2</td><td>24</td><td>\${n(cuGSM,0)}</td><td><strong>\${cuffDisp.split('|')[0] || '—'}</strong></td></tr>\`;

    if (showPocket) rows += \`
        <tr><td>\${no++}</td><td><strong>Pocket</strong><div class="muted">Qty \${n(pQty,0)}</div></td><td>\${n(PL)} \${unit}</td><td>—</td><td>\${n(PW)} \${unit}</td><td>1</td><td>12</td><td>\${n(pGSM,0)}</td><td><strong>\${pocketDisp.split('|')[0] || '—'}</strong></td></tr>\`;

    if (showHalfmoon) rows += \`
        <tr><td>\${no++}</td><td><strong>Half-moon</strong><div class="muted">Body fabric</div></td><td>\${n(HML)} \${unit}</td><td>—</td><td>\${n(HMW)} \${unit}</td><td>1</td><td>12</td><td>\${n(hmGSM,0)}</td><td><strong>\${hmDisp.split('|')[0] || '—'}</strong></td></tr>\`;

    const reportHtml = \`
        <div class="report">
            <div class="report-header">
                <div>
                    <div class="brand">FABRiCS <span>CONSUMPTiON</span></div>
                    <div class="subtitle">GARMENT CALCULATOR SUITE</div>
                </div>
                <div class="report-title">
                    <div class="eyebrow">CALCULATION REPORT</div>
                    <h1>Knit Fabrics Consumption</h1>
                    <div class="report-id">\${reportId}</div>
                </div>
            </div>

            <div class="meta-grid">
                <div><span>Date</span><strong>\${dateText}</strong></div>
                <div><span>Time</span><strong>\${timeText}</strong></div>
                <div><span>Unit</span><strong>\${unit.toUpperCase()}</strong></div>
                <div><span>Order Quantity</span><strong>\${qty} pcs</strong></div>
            </div>

            <section class="section">
                <div class="section-head">ORDER INFORMATION</div>
                <div class="info-grid">
                    <div><span>Buyer Name</span><strong>________________________</strong></div>
                    <div><span>Style No.</span><strong>________________________</strong></div>
                    <div><span>Garment Type</span><strong>T-Shirt / Knit</strong></div>
                    <div><span>Order Qty</span><strong>\${qty} pcs</strong></div>
                </div>
            </section>

            <section class="section">
                <div class="section-head">COMPONENT WISE CONSUMPTION</div>
                <table>
                    <thead><tr>
                        <th>SL</th><th>Component</th><th>Length</th><th>Sleeve</th><th>Width</th>
                        <th>Ply</th><th>Qty/Dz</th><th>GSM</th><th>Consumption / Dz</th>
                    </tr></thead>
                    <tbody>\${rows}</tbody>
                </table>
            </section>

            <section class="summary-grid">
                <div class="summary-card"><span>NET CONSUMPTION</span><strong>\${totalBefore}</strong><small>kg / dozen</small></div>
                <div class="summary-card"><span>WASTAGE</span><strong>\${waste}%</strong><small>applied to total</small></div>
                <div class="summary-card primary"><span>GRAND TOTAL</span><strong>\${totalKg}</strong><small>for \${qty} pcs</small></div>
                <div class="summary-card"><span>PER PIECE</span><strong>\${perPc}</strong><small>kg / piece</small></div>
            </section>

            <section class="section">
                <div class="section-head">COMPONENT STATUS</div>
                <div class="status-grid">
                    <div class="status included">Body <b>Included</b></div>
                    <div class="status \${showCollar ? 'included' : 'excluded'}">Collar <b>\${showCollar ? 'Included' : 'Not Included'}</b></div>
                    <div class="status \${showCuff ? 'included' : 'excluded'}">Cuff <b>\${showCuff ? 'Included' : 'Not Included'}</b></div>
                    <div class="status \${showPocket ? 'included' : 'excluded'}">Pocket <b>\${showPocket ? 'Included' : 'Not Included'}</b></div>
                    <div class="status \${showHalfmoon ? 'included' : 'excluded'}">Half-moon <b>\${showHalfmoon ? 'Included' : 'Not Included'}</b></div>
                </div>
            </section>

            <section class="formula">
                <div class="section-head">FORMULA REFERENCE</div>
                <div class="formula-text">
                    <strong>Body:</strong> (Body Length + Sleeve Length) × ½ Chest × 2 × GSM ÷ \${div}
                    <br>
                    <strong>Other components:</strong> Length × Width × Ply × GSM ÷ \${div}
                </div>
            </section>

            <div class="note"><strong>IMPORTANT:</strong> This report is computer generated. Verify measurements, GSM, quantity and wastage before bulk production.</div>

            <div class="report-footer">
                <span>Fabrics Consumption • Garment Calculator Suite</span>
                <span>fabricconsumption.vercel.app</span>
            </div>
        </div>\`;

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
        'kg-waste', 'kg-qty'
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
