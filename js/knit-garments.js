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
        'kg-total-kg', 'kg-per-dz-label', 'kg-per-pcs-label',
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
    const getVal = id => {
        const value = parseFloat(document.getElementById(id)?.value);
        return Number.isFinite(value) ? value : 0;
    };
    const withWaste = (base, wastePct) => base * (1 + Math.max(0, wastePct) / 100);
    const isChecked = id => document.getElementById(id)?.checked === true;
    const fmt = (value, digits = 3) => Number.isFinite(value) && value > 0 ? value.toFixed(digits) : '—';

    // Per-piece formula is calculated first. Quantity is used only for the order total.
    // Net/dozen = per-piece × 12; wastage = net × (1 + wastage% / 100).
    let bodyPerPc = 0;
    let bodyDz = 0;
    let bodyAfterDz = 0;
    const bodyWaste = getVal('kg-body-waste');
    if (isChecked('ck-body')) {
        const bodyLength = getVal('kg-bl') + getVal('kg-bla');
        const sleeveLength = getVal('kg-sl') + getVal('kg-sla');
        const halfChest = getVal('kg-hc') + getVal('kg-hca');
        const gsm = getVal('kg-bgsm');
        if (bodyLength > 0 && sleeveLength > 0 && halfChest > 0 && gsm > 0 && qty > 0) {
            bodyPerPc = ((bodyLength + sleeveLength) * halfChest * 2 * gsm) / div;
            bodyDz = bodyPerPc * 12;
            bodyAfterDz = withWaste(bodyDz, bodyWaste);
        }
    }

    let collarPerPc = 0, collarDz = 0, collarAfterDz = 0;
    const collarWaste = getVal('kg-collar-waste');
    if (isChecked('ck-collar')) {
        const length = getVal('kg-cl') + getVal('kg-cla');
        const width = getVal('kg-cw') + getVal('kg-cwa');
        const gsm = getVal('kg-cgsm');
        if (length > 0 && width > 0 && gsm > 0 && qty > 0) {
            collarPerPc = (length * width * gsm) / div;
            collarDz = collarPerPc * 12;
            collarAfterDz = withWaste(collarDz, collarWaste);
        }
    }

    let cuffPerPc = 0, cuffDz = 0, cuffAfterDz = 0;
    const cuffWaste = getVal('kg-cuff-waste');
    if (isChecked('ck-cuff')) {
        const length = getVal('kg-cul') + getVal('kg-cula');
        const width = getVal('kg-cuw') + getVal('kg-cuwa');
        const gsm = getVal('kg-cugsm');
        if (length > 0 && width > 0 && gsm > 0 && qty > 0) {
            cuffPerPc = (length * width * 2 * gsm) / div;
            cuffDz = cuffPerPc * 12;
            cuffAfterDz = withWaste(cuffDz, cuffWaste);
        }
    }

    let pocketPerPc = 0, pocketDz = 0, pocketAfterDz = 0;
    const pocketWaste = getVal('kg-pocket-waste');
    if (isChecked('ck-pocket')) {
        const length = getVal('kg-pl') + getVal('kg-pla');
        const width = getVal('kg-pw') + getVal('kg-pwa');
        const pocketQty = Math.max(0, getVal('kg-pqty') || 1);
        const gsm = getVal('kg-pgsm');
        if (length > 0 && width > 0 && gsm > 0 && qty > 0) {
            pocketPerPc = (length * width * pocketQty * gsm) / div;
            pocketDz = pocketPerPc * 12;
            pocketAfterDz = withWaste(pocketDz, pocketWaste);
        }
    }

    let hmPerPc = 0, hmDz = 0, hmAfterDz = 0;
    const hmWaste = getVal('kg-halfmoon-waste');
    if (isChecked('ck-halfmoon')) {
        const length = getVal('kg-hml') + getVal('kg-hmla');
        const width = getVal('kg-hmw') + getVal('kg-hmwa');
        const gsm = getVal('kg-hmgsm');
        if (length > 0 && width > 0 && gsm > 0 && qty > 0) {
            hmPerPc = (length * width * gsm) / div;
            hmDz = hmPerPc * 12;
            hmAfterDz = withWaste(hmDz, hmWaste);
        }
    }

    const totalDz = bodyDz + collarDz + cuffDz + pocketDz + hmDz;
    const totalWithWaste = bodyAfterDz + collarAfterDz + cuffAfterDz + pocketAfterDz + hmAfterDz;
    const totalKg = qty > 0 ? (totalWithWaste / 12) * qty : 0;

    const updateRow = (checked, rowId, dispId, afterDz) => {
        const row = document.getElementById(rowId);
        const display = document.getElementById(dispId);
        if (row) row.style.display = checked ? 'flex' : 'none';
        if (checked && display) {
            const perPieceKg = afterDz / 12;
            const orderTotalKg = perPieceKg * qty;
            display.innerText = afterDz > 0
                ? `${fmt(orderTotalKg)} kg/qty | ${fmt(perPieceKg)} kg/pcs`
                : '— kg/qty | — kg/pcs';
        }
    };

    updateRow(isChecked('ck-body'), 'kg-body-row', 'kg-body-disp', bodyAfterDz);
    updateRow(isChecked('ck-collar'), 'kg-collar-row', 'kg-collar-disp', collarAfterDz);
    updateRow(isChecked('ck-cuff'), 'kg-cuff-row', 'kg-cuff-disp', cuffAfterDz);
    updateRow(isChecked('ck-pocket'), 'kg-pocket-row', 'kg-pocket-disp', pocketAfterDz);
    updateRow(isChecked('ck-halfmoon'), 'kg-halfmoon-row', 'kg-halfmoon-disp', hmAfterDz);

    const before = document.getElementById('kg-total-before');
    const after = document.getElementById('kg-total-after');
    const total = document.getElementById('kg-total-kg');
    const dozen = document.getElementById('kg-per-dz-label');
    const piece = document.getElementById('kg-per-pcs-label');
    const totalBeforeOrderKg = qty > 0 ? (totalDz / 12) * qty : 0;
    if (before) before.innerText = totalBeforeOrderKg > 0 ? `${fmt(totalBeforeOrderKg)} kg` : '— kg';
    if (after) after.innerText = totalKg > 0 ? `${fmt(totalKg)} kg` : '— kg';
    if (total) total.innerText = totalKg > 0 ? `${fmt(totalKg)} kg` : '— kg';
    // Keep dozen-based values in the calculation model for reports/conversion, but do not show kg/dz in the default result UI.
    if (dozen) dozen.innerText = totalWithWaste > 0 ? `${fmt(totalWithWaste)} kg/dz` : '— kg/dz';
    if (piece) piece.innerText = totalWithWaste > 0 ? `${fmt(totalWithWaste / 12)} kg/pcs` : '— kg/pcs';

    if (typeof window.updateKnitGroupTotals === 'function') {
        window.updateKnitGroupTotals({
            qty,
            components: {
                body: { beforeDz: bodyDz, afterDz: bodyAfterDz },
                collar: { beforeDz: collarDz, afterDz: collarAfterDz },
                cuff: { beforeDz: cuffDz, afterDz: cuffAfterDz },
                pocket: { beforeDz: pocketDz, afterDz: pocketAfterDz },
                halfmoon: { beforeDz: hmDz, afterDz: hmAfterDz }
            }
        });
    }
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
        return Number.isFinite(n) ? n : 0;
    };
    const val = id => document.getElementById(id)?.value?.trim() || '';
    const checked = id => document.getElementById(id)?.checked === true;
    const fmt = (value, digits = 3) => Number.isFinite(value) && value > 0 ? value.toFixed(digits) : '—';
    const safe = value => String(value || '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
    const qty = getVal('kg-qty'), unit = window.knitUnit || 'cm';
    const div = unit === 'inch' ? 1550000 : 10000000;
    const now = new Date();
    const reportId = 'FC-KNIT-' + now.toISOString().slice(0,10).replace(/-/g,'') + '-001';
    const dateText = now.toLocaleDateString('en-GB', {day:'2-digit', month:'short', year:'numeric'});
    const timeText = now.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
    const components = [
      {name:'Body',fabric:'Main body fabric',on:checked('ck-body'),l:getVal('kg-bl')+getVal('kg-bla'),s:getVal('kg-sl')+getVal('kg-sla'),w:getVal('kg-hc')+getVal('kg-hca'),ply:2,q:24,g:getVal('kg-bgsm'),x:getVal('kg-body-waste'),p:((getVal('kg-bl')+getVal('kg-bla')+getVal('kg-sl')+getVal('kg-sla'))*(getVal('kg-hc')+getVal('kg-hca'))*2*getVal('kg-bgsm'))/div},
      {name:'Collar',fabric:'Rib',on:checked('ck-collar'),l:getVal('kg-cl')+getVal('kg-cla'),s:0,w:getVal('kg-cw')+getVal('kg-cwa'),ply:1,q:12,g:getVal('kg-cgsm'),x:getVal('kg-collar-waste'),p:((getVal('kg-cl')+getVal('kg-cla'))*(getVal('kg-cw')+getVal('kg-cwa'))*getVal('kg-cgsm'))/div},
      {name:'Cuff',fabric:'Rib × 2',on:checked('ck-cuff'),l:getVal('kg-cul')+getVal('kg-cula'),s:0,w:getVal('kg-cuw')+getVal('kg-cuwa'),ply:2,q:24,g:getVal('kg-cugsm'),x:getVal('kg-cuff-waste'),p:((getVal('kg-cul')+getVal('kg-cula'))*(getVal('kg-cuw')+getVal('kg-cuwa'))*2*getVal('kg-cugsm'))/div},
      {name:'Pocket',fabric:'Pocket fabric',on:checked('ck-pocket'),l:getVal('kg-pl')+getVal('kg-pla'),s:0,w:getVal('kg-pw')+getVal('kg-pwa'),ply:1,q:12,g:getVal('kg-pgsm'),x:getVal('kg-pocket-waste'),p:((getVal('kg-pl')+getVal('kg-pla'))*(getVal('kg-pw')+getVal('kg-pwa'))*(getVal('kg-pqty')||1)*getVal('kg-pgsm'))/div},
      {name:'Half-moon',fabric:'Body fabric',on:checked('ck-halfmoon'),l:getVal('kg-hml')+getVal('kg-hmla'),s:0,w:getVal('kg-hmw')+getVal('kg-hmwa'),ply:1,q:12,g:getVal('kg-hmgsm'),x:getVal('kg-halfmoon-waste'),p:((getVal('kg-hml')+getVal('kg-hmla'))*(getVal('kg-hmw')+getVal('kg-hmwa'))*getVal('kg-hmgsm'))/div}
    ];
    const active = components.filter(c => c.on);
    const complete = qty > 0 && active.length > 0 && active.every(c => c.l > 0 && c.w > 0 && c.g > 0);
    const net = active.reduce((s,c) => s + c.p * qty, 0);
    const waste = active.reduce((s,c) => s + c.p * qty * Math.max(0,c.x) / 100, 0);
    const total = net + waste, perPiece = qty > 0 ? total / qty : 0, perDozen = perPiece * 12;
    const rows = active.map((c,i) => {
      const wasteKg = c.p * qty * Math.max(0,c.x) / 100;
      const baseDz = c.p * 12, finalDz = baseDz * (1 + Math.max(0,c.x)/100);
      return '<tr><td>'+(i+1)+'</td><td><strong>'+safe(c.name)+'</strong><div class="muted">'+safe(c.fabric)+'</div></td><td>'+(c.l>0?fmt(c.l,1)+' '+unit:'—')+'</td><td>'+(c.s>0?fmt(c.s,1)+' '+unit:'—')+'</td><td>'+(c.w>0?fmt(c.w,1)+' '+unit:'—')+'</td><td>'+c.ply+'</td><td>'+c.q+'</td><td>'+(c.g||'—')+'</td><td>'+fmt(c.x,1)+'%</td><td>'+fmt(baseDz)+' kg</td><td>'+fmt(wasteKg)+' kg</td><td>'+fmt(finalDz)+' kg</td><td><strong>'+fmt(c.p*qty*(1+Math.max(0,c.x)/100))+' kg</strong></td></tr>';
    }).join('');
    const status = c => '<div class="status '+(c.on?'included':'excluded')+'">'+safe(c.name)+'<b>'+(c.on?'Included':'Not included')+'</b></div>';
    const reportHtml = '<div class="report">'+
      '<div class="report-header"><div><div class="brand">FABRiCS <span>CONSUMPTiON</span></div><div class="subtitle">GARMENT CALCULATOR SUITE</div></div><div class="report-title"><div class="eyebrow">CALCULATION REPORT</div><h1>Knit Fabrics Consumption</h1><div class="report-id">'+reportId+' · REV 00</div></div></div>'+
      '<div class="meta-grid"><div><span>Report Date</span><strong>'+dateText+'</strong></div><div><span>Time</span><strong>'+timeText+'</strong></div><div><span>Unit</span><strong>'+unit.toUpperCase()+'</strong></div><div><span>Order Quantity</span><strong>'+qty+' pcs</strong></div></div>'+
      '<section class="section"><div class="section-head">'+reportIcon('info')+'<span>ORDER INFORMATION</span></div><div class="info-grid">'+
      '<div><span>Buyer Name</span><strong>'+(safe(val('kg-buyer'))||'________________')+'</strong></div><div><span>Style No.</span><strong>'+(safe(val('kg-style'))||'________________')+'</strong></div><div><span>PO / Order No.</span><strong>'+(safe(val('kg-po'))||'________________')+'</strong></div><div><span>Garment Type</span><strong>'+(safe(val('kg-garment-type'))||'T-Shirt / Knit')+'</strong></div></div></section>'+
      '<section class="section"><div class="section-head">'+reportIcon('components')+'<span>COMPONENT-WISE CONSUMPTION</span></div><table class="consumption-table"><thead><tr><th>SL</th><th>Component / Fabric</th><th>Length</th><th>Sleeve</th><th>Width</th><th>Ply</th><th>Qty/Dz</th><th>GSM</th><th>Waste %</th><th>Base kg/dz</th><th>Waste kg/order</th><th>Final kg/dz</th><th>Order total kg</th></tr></thead><tbody>'+ (rows || '<tr><td colspan="13">No components selected.</td></tr>') +'</tbody></table></section>'+
      '<div class="summary-grid"><div class="summary-card"><div class="metric-head">'+reportIcon('components')+'<span>NET CONSUMPTION</span></div><strong>'+fmt(net)+' kg</strong><small>Before wastage · whole order</small></div><div class="summary-card"><div class="metric-head">'+reportIcon('warning')+'<span>WASTAGE ADDED</span></div><strong>'+fmt(waste)+' kg</strong><small>Component wastage total</small></div><div class="summary-card primary"><div class="metric-head">'+reportIcon('summary')+'<span>FINAL ORDER TOTAL</span></div><strong>'+fmt(total)+' kg</strong><small>With wastage</small></div><div class="summary-card"><div class="metric-head">'+reportIcon('file')+'<span>PER PIECE</span></div><strong>'+fmt(perPiece)+' kg/pcs</strong><small>Final total ÷ order quantity</small></div></div>'+
      '<div class="extra-summary"><div><span>CONSUMPTION PER DOZEN</span><strong>'+fmt(perDozen)+' kg/dozen</strong></div><div><span>BOOKING ALLOWANCE</span><strong>Optional — not included</strong></div><div><span>SUGGESTED BOOKING QTY</span><strong>Requires approved allowance</strong></div></div>'+
      '<section class="section"><div class="section-head">'+reportIcon('status')+'<span>COMPONENT STATUS</span></div><div class="status-grid">'+components.map(status).join('')+'</div></section>'+

      '<div class="note">'+reportIcon('warning')+'<div><strong>IMPORTANT:</strong> '+(complete?'Verify measurements, GSM, quantity, and wastage before bulk production.':'DRAFT — INCOMPLETE DATA. Fill in required measurements, GSM, and a valid order quantity before using this report for bulk production.')+' Booking allowance is separate from component wastage.</div></div>'+
      '<div class="approval-grid"><div><span>PREPARED BY</span><strong>______________________</strong></div><div><span>CHECKED BY</span><strong>______________________</strong></div><div><span>APPROVED BY</span><strong>______________________</strong></div></div>'+
      '<div class="report-footer"><span>Fabrics Consumption • Garment Calculator Suite</span><span>'+dateText+' · '+timeText+' · fabricconsumption.vercel.app</span></div></div>';
    if (typeof generatePDF === 'function') generatePDF('Knit Fabrics Consumption Report', reportHtml);
    else {
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;
      printWindow.document.write('<!DOCTYPE html><html><head><title>Knit Fabrics Consumption Report</title></head><body>'+reportHtml+'</body></html>');
      printWindow.document.close(); printWindow.print();
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
    
    // Formula copy buttons
    document.querySelectorAll('.formula-copy-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const formula = this.getAttribute('data-copy-formula') || '';
            try {
                await navigator.clipboard.writeText(formula);
            } catch (e) {
                const ta = document.createElement('textarea');
                ta.value = formula;
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                ta.remove();
            }
            const original = this.textContent;
            this.textContent = '✓ Copied';
            this.classList.add('copied');
            clearTimeout(this._copyTimer);
            this._copyTimer = setTimeout(() => {
                this.textContent = original;
                this.classList.remove('copied');
            }, 1400);
        });
    });

    // PDF button
    const pdfBtn = document.getElementById('btn-pdf-knit');
    if (pdfBtn) pdfBtn.addEventListener('click', downloadKnitReport);
    
    // Set default unit button active
    const defaultBtn = document.querySelector('#page-knit .unit-bar .u-btn[data-unit="cm"]');
    if (defaultBtn) defaultBtn.classList.add('active');
    
    // Force reset all inputs
    forceResetAllInputs();
});
