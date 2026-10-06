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
    function getVal(id) {
        const val = parseFloat(document.getElementById(id)?.value);
        return isNaN(val) ? 0 : val;
    }
    
    function getElemText(id) {
        return document.getElementById(id)?.innerText || '—';
    }
    
    // Get all values
    const qty = getVal('kg-qty') || 0;
    const waste = getVal('kg-waste') || 0;
    const bGSM = getVal('kg-bgsm') || 0;
    const knitUnit = window.knitUnit || 'cm';
    
    // Body measurements
    const BL = getVal('kg-bl') + getVal('kg-bla');
    const SL = getVal('kg-sl') + getVal('kg-sla');
    const HC = getVal('kg-hc') + getVal('kg-hca');
    
    // Collar measurements
    const CL = getVal('kg-cl') + getVal('kg-cla');
    const CW = getVal('kg-cw') + getVal('kg-cwa');
    const cGSM = getVal('kg-cgsm') || 0;
    
    // Cuff measurements
    const CuL = getVal('kg-cul') + getVal('kg-cula');
    const CuW = getVal('kg-cuw') + getVal('kg-cuwa');
    const cuGSM = getVal('kg-cugsm') || 0;
    
    // Get display values
    const bodyDisp = getElemText('kg-body-disp');
    const collarDisp = getElemText('kg-collar-disp');
    const cuffDisp = getElemText('kg-cuff-disp');
    const totalBefore = getElemText('kg-total-before');
    const totalAfter = getElemText('kg-total-after');
    const totalKg = getElemText('kg-total-kg');
    
    // Check which components are selected
    const showCollar = document.getElementById('ck-collar')?.checked || false;
    const showCuff = document.getElementById('ck-cuff')?.checked || false;
    const showPocket = document.getElementById('ck-pocket')?.checked || false;
    const showHalfmoon = document.getElementById('ck-halfmoon')?.checked || false;
    
    // Build component rows HTML
    let componentRows = '';
    
    // Body row
    componentRows += `<tr>
        <td style="padding: 8px; border: 1px solid #e2e8f0;">1</td>
        <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: 600;">👕 Body</td>
        <td style="padding: 8px; border: 1px solid #e2e8f0;">Front + Back</td>
        <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">${BL}</td>
        <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">${HC}</td>
        <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">2</td>
        <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">24</td>
        <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">${bGSM}</td>
        <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">${bodyDisp.split('|')[0] || '—'}</td>
    </tr>`;
    
    // Collar row (if selected)
    if (showCollar) {
        componentRows += `<tr>
            <td style="padding: 8px; border: 1px solid #e2e8f0;">2</td>
            <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: 600;">🧣 Collar</td>
            <td style="padding: 8px; border: 1px solid #e2e8f0;">Rib</td>
            <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">${CL}</td>
            <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">${CW}</td>
            <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">1</td>
            <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">12</td>
            <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">${cGSM}</td>
            <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">${collarDisp.split('|')[0] || '—'}</td>
        </tr>`;
    }
    
    // Cuff row (if selected)
    if (showCuff) {
        componentRows += `<tr>
            <td style="padding: 8px; border: 1px solid #e2e8f0;">3</td>
            <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: 600;">🧤 Cuff</td>
            <td style="padding: 8px; border: 1px solid #e2e8f0;">Rib</td>
            <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">${CuL}</td>
            <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">${CuW}</td>
            <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">2</td>
            <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">24</td>
            <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">${cuGSM}</td>
            <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">${cuffDisp.split('|')[0] || '—'}</td>
        </tr>`;
    }
    
    // Pocket row (if selected)
    if (showPocket) {
        componentRows += `<tr>
            <td style="padding: 8px; border: 1px solid #e2e8f0;">4</td>
            <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: 600;">🪡 Pocket</td>
            <td style="padding: 8px; border: 1px solid #e2e8f0;">Body Fabric</td>
            <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">—</td>
            <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">—</td>
            <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">1</td>
            <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">12</td>
            <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">—</td>
            <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">—</td>
        </tr>`;
    }
    
    // Half-moon row (if selected)
    if (showHalfmoon) {
        componentRows += `<tr>
            <td style="padding: 8px; border: 1px solid #e2e8f0;">5</td>
            <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: 600;">🌙 Half-moon</td>
            <td style="padding: 8px; border: 1px solid #e2e8f0;">Body Fabric</td>
            <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">—</td>
            <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">—</td>
            <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">1</td>
            <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">12</td>
            <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">—</td>
            <td style="padding: 8px; border: 1px solid #e2e8f0; text-align: center;">—</td>
        </tr>`;
    }
    
    // Build options text
    let selectedOptions = '';
    selectedOptions += showCollar ? '✅ Collar  ' : '❌ Collar  ';
    selectedOptions += showCuff ? '| ✅ Cuff  ' : '| ❌ Cuff  ';
    selectedOptions += showPocket ? '| ✅ Pocket  ' : '| ❌ Pocket  ';
    selectedOptions += showHalfmoon ? '| ✅ Half-moon' : '| ❌ Half-moon';
    
    const reportHtml = `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 1100px; margin: 0 auto; padding: 20px;">
            
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 25px;">
                <div style="font-size: 32px; margin-bottom: 5px;">🧵</div>
                <div style="font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: 1px;">FABRICS CONSUMPTION REPORT</div>
                <div style="font-size: 12px; color: #64748b;">Garment Calculator Suite</div>
            </div>
            
            <!-- Report Info -->
            <div style="background: #f8fafc; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; display: flex; justify-content: space-between; flex-wrap: wrap;">
                <div><span style="font-weight: 600;">Report ID:</span> FC-KNIT-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-001</div>
                <div><span style="font-weight: 600;">Date:</span> ${new Date().toLocaleDateString('en-GB', {day:'2-digit',month:'short',year:'numeric'})}</div>
                <div><span style="font-weight: 600;">Time:</span> ${new Date().toLocaleTimeString()}</div>
                <div><span style="font-weight: 600;">Unit:</span> ${knitUnit.toUpperCase()}</div>
            </div>
            
            <!-- Order Information -->
            <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 20px; overflow: hidden;">
                <div style="background: #0f172a; color: white; padding: 10px 16px; font-weight: 600;">📋 ORDER INFORMATION</div>
                <div style="padding: 12px 16px; display: flex; flex-wrap: wrap; gap: 20px;">
                    <div><span style="color: #64748b;">Buyer Name:</span> _______________</div>
                    <div><span style="color: #64748b;">Style No.:</span> _______________</div>
                    <div><span style="color: #64748b;">Garment Type:</span> T-Shirt / Knit</div>
                    <div><span style="color: #64748b;">Order Qty:</span> ${qty} pcs</div>
                </div>
            </div>
            
            <!-- Component Wise Table -->
            <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 20px; overflow-x: auto;">
                <div style="background: #0f172a; color: white; padding: 10px 16px; font-weight: 600;">📊 COMPONENT WISE CONSUMPTION</div>
                <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                    <thead>
                        <tr style="background: #f1f5f9;">
                            <th style="padding: 10px; border: 1px solid #e2e8f0;">SL</th>
                            <th style="padding: 10px; border: 1px solid #e2e8f0;">Component</th>
                            <th style="padding: 10px; border: 1px solid #e2e8f0;">Part Detail</th>
                            <th style="padding: 10px; border: 1px solid #e2e8f0;">Length (cm)</th>
                            <th style="padding: 10px; border: 1px solid #e2e8f0;">Width (cm)</th>
                            <th style="padding: 10px; border: 1px solid #e2e8f0;">Ply</th>
                            <th style="padding: 10px; border: 1px solid #e2e8f0;">Qty/Dz</th>
                            <th style="padding: 10px; border: 1px solid #e2e8f0;">GSM</th>
                            <th style="padding: 10px; border: 1px solid #e2e8f0;">Consumption (kg/dz)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${componentRows}
                    </tbody>
                </table>
            </div>
            
            <!-- Consumption Summary -->
            <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 20px;">
                <div style="background: #0f172a; color: white; padding: 10px 16px; font-weight: 600;">📈 CONSUMPTION SUMMARY</div>
                <div style="padding: 16px;">
                    <div style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: 15px;">
                        <div>
                            <div style="color: #64748b;">Total Net Consumption</div>
                            <div style="font-size: 20px; font-weight: 700;">${totalBefore}</div>
                        </div>
                        <div>
                            <div style="color: #64748b;">+ Wastage (${waste}%)</div>
                            <div style="font-size: 18px; font-weight: 500;">${totalAfter}</div>
                        </div>
                        <div style="border-left: 2px solid #e2e8f0; padding-left: 20px;">
                            <div style="color: #10b981;">🎯 GRAND TOTAL</div>
                            <div style="font-size: 24px; font-weight: 800; color: #10b981;">${totalAfter}</div>
                            <div style="font-size: 12px;">${totalKg} (for ${qty} pcs)</div>
                        </div>
                    </div>
                    <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e2e8f0;">
                        <div>Per Piece: <strong>${totalKg}/${qty} = ${(parseFloat(totalKg)/qty || 0).toFixed(4)} kg/pcs</strong></div>
                    </div>
                </div>
            </div>
            
            <!-- Selected Components -->
            <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 20px;">
                <div style="background: #0f172a; color: white; padding: 10px 16px; font-weight: 600;">✅ SELECTED COMPONENTS</div>
                <div style="padding: 12px 16px;">
                    <div style="display: flex; gap: 20px; flex-wrap: wrap;">
                        <div>👕 Body: Included</div>
                        <div>🧣 Collar: ${showCollar ? '✅ Included' : '❌ Not Included'}</div>
                        <div>🧤 Cuff: ${showCuff ? '✅ Included' : '❌ Not Included'}</div>
                        <div>🪡 Pocket: ${showPocket ? '✅ Included' : '❌ Not Included'}</div>
                        <div>🌙 Half-moon: ${showHalfmoon ? '✅ Included' : '❌ Not Included'}</div>
                    </div>
                </div>
            </div>
            
            <!-- Formula -->
            <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 20px;">
                <div style="background: #0f172a; color: white; padding: 10px 16px; font-weight: 600;">📐 FORMULA USED</div>
                <div style="padding: 12px 16px; font-family: monospace; font-size: 12px;">
                    Fabric Consumption (kg) = (Length × Width × Ply × Qty × GSM) ÷ 10,000,000<br>
                    Where: Length, Width = in cm | Qty = Total pieces in Dozen (12 pcs) | GSM = Gram per Square Meter
                </div>
            </div>
            
            <!-- Important Notes -->
            <div style="background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; margin-bottom: 20px;">
                <div style="background: #f59e0b; color: white; padding: 8px 16px; font-weight: 600;">⚠️ IMPORTANT NOTES</div>
                <div style="padding: 12px 16px; font-size: 11px; color: #64748b;">
                    • This report is computer generated, no signature required.<br>
                    • All measurements are in CM unless specified otherwise.<br>
                    • Wastage is calculated on total fabric consumption.<br>
                    • Please review and confirm before bulk production.
                </div>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; padding-top: 20px; margin-top: 20px; border-top: 1px solid #e2e8f0;">
                <div style="font-size: 11px; color: #64748b;">© 2026 All Rights Reserved • Fabrics Consumption</div>
                <div style="font-size: 10px; color: #94a3b8;">Generated By: Fabrics Consumption | Source: fabricconsumption.vercel.app</div>
            </div>
            
        </div>
    `;
    
    if (typeof generatePDF === 'function') {
        generatePDF('Knit Garments Report', reportHtml);
    } else {
        // Fallback print
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Knit Garments Report</title>
                <meta charset="UTF-8">
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Inter', Arial, sans-serif; padding: 20px; }
                    @media print {
                        body { padding: 0; }
                    }
                </style>
            </head>
            <body>${reportHtml}</body>
            </html>
        `);
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
