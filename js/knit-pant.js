// ============================================
// KNIT PANT.JS - Knit Pant Fabric Consumption
// ============================================

let pantUnit = 'cm';

function setPantUnit(unit) {
    pantUnit = unit;
    updatePantUnitLabels();
    convertPantInputs();
    calcKnitPant();
}

function updatePantUnitLabels() {
    document.querySelectorAll('#page-knitpant .unit-label').forEach(label => {
        label.textContent = '(' + pantUnit + ')';
    });
    
    // Update all total spans
    const totalSpans = ['kp-ilt', 'kp-cfrt', 'kp-wbwt', 'kp-htct'];
    totalSpans.forEach(id => {
        const span = el(id);
        if (span && span.innerHTML) {
            const value = parseFloat(span.innerHTML);
            if (!isNaN(value)) {
                span.innerHTML = value.toFixed(1) + ' ' + pantUnit;
            }
        }
    });
}

function convertPantInputs() {
    const isInch = (pantUnit === 'inch');
    
    const pantPairs = [
        { actual: 'kp-il', allow: 'kp-ila', tot: 'kp-ilt' },
        { actual: 'kp-cfr', allow: 'kp-cfra', tot: 'kp-cfrt' },
        { actual: 'kp-wbw', allow: 'kp-wbwa', tot: 'kp-wbwt' },
        { actual: 'kp-htc', allow: 'kp-htca', tot: 'kp-htct' }
    ];
    
    pantPairs.forEach(pair => {
        const actualEl = el(pair.actual);
        const allowEl = el(pair.allow);
        if (actualEl && allowEl) {
            let actualVal = parseFloat(actualEl.value) || 0;
            let allowVal = parseFloat(allowEl.value) || 0;
            
            if (isInch) {
                actualEl.value = (actualVal / 2.54).toFixed(2);
                allowEl.value = (allowVal / 2.54).toFixed(2);
            } else {
                actualEl.value = (actualVal * 2.54).toFixed(2);
                allowEl.value = (allowVal * 2.54).toFixed(2);
            }
            
            const newActual = parseFloat(actualEl.value) || 0;
            const newAllow = parseFloat(allowEl.value) || 0;
            const totSpan = el(pair.tot);
            if (totSpan) totSpan.innerHTML = (newActual + newAllow).toFixed(1) + ' ' + pantUnit;
        }
    });
}

function updatePantTotals() {
    const pairs = [
        { a: 'kp-il', b: 'kp-ila', t: 'kp-ilt' },
        { a: 'kp-cfr', b: 'kp-cfra', t: 'kp-cfrt' },
        { a: 'kp-wbw', b: 'kp-wbwa', t: 'kp-wbwt' },
        { a: 'kp-htc', b: 'kp-htca', t: 'kp-htct' }
    ];
    
    pairs.forEach(pair => {
        const total = v(pair.a) + v(pair.b);
        const span = el(pair.t);
        if (span) span.innerHTML = total.toFixed(1) + ' ' + pantUnit;
    });
    
    calcKnitPant();
}

function calcKnitPant() {
    const div = pantUnit === 'inch' ? 1550000 : 10000000;
    
    const IL = v('kp-il') + v('kp-ila');
    const CFR = v('kp-cfr') + v('kp-cfra');
    const WBW = v('kp-wbw') + v('kp-wbwa');
    const HTC = v('kp-htc') + v('kp-htca');
    const GSM = v('kp-gsm');
    const waste = v('kp-waste');
    
    // Base calculation: (IL + CFR + WBW) × HTC × 4 × GSM × 12 / DIVIDER
    const basePerDz = (IL + CFR + WBW) * HTC * 4 * GSM * 12 / div;
    const totalPerDz = basePerDz * (1 + waste / 100);
    const perPiece = totalPerDz / 12;
    
    set('kp-r-dz', fmt(totalPerDz, 3) + ' kg/dz');
    set('kp-r-pc', fmt(perPiece, 4) + ' kg/pc');
}

function downloadKnitPantReport() {
    const waste = v('kp-waste') || 0;
    const GSM = v('kp-gsm') || 0;
    const totalPerDz = document.getElementById('kp-r-dz')?.innerText || '—';
    const perPiece = document.getElementById('kp-r-pc')?.innerText || '—';
    
    const IL = (v('kp-il') + v('kp-ila')).toFixed(1);
    const CFR = (v('kp-cfr') + v('kp-cfra')).toFixed(1);
    const WBW = (v('kp-wbw') + v('kp-wbwa')).toFixed(1);
    const HTC = (v('kp-htc') + v('kp-htca')).toFixed(1);
    
    const reportHtml = `
        <div class="header">
            <h1>👖 Knit Pant Consumption Report</h1>
            <div class="date">Generated: ${new Date().toLocaleString()}</div>
        </div>
        
        <div class="box">
            <div>Total Fabric Consumption</div>
            <div class="box-value">${totalPerDz}</div>
            <div>with ${waste}% wastage</div>
            <div style="font-size: 12px; margin-top: 8px;">${perPiece} (per piece)</div>
        </div>
        
        <table>
            <thead>
                <tr><th>Measurement</th><th>Value (${pantUnit})</th><th>With Allowance</th></tr>
            </thead>
            <tbody>
                <tr><td>A — Inseam Length (IL)</td><td>${v('kp-il')} ${pantUnit}</td><td>${IL} ${pantUnit}</td></tr>
                <tr><td>B — Center Front Rise (CFR)</td><td>${v('kp-cfr')} ${pantUnit}</td><td>${CFR} ${pantUnit}</td></tr>
                <tr><td>C — Waist Belt Width (WBW)</td><td>${v('kp-wbw')} ${pantUnit}</td><td>${WBW} ${pantUnit}</td></tr>
                <tr><td>D — Half Thigh Circum (HTC)</td><td>${v('kp-htc')} ${pantUnit}</td><td>${HTC} ${pantUnit}</td></tr>
            </tbody>
        </table>
        
        <div style="margin-top: 20px; padding: 12px; background: #f8fafc; border-radius: 8px;">
            <strong>📐 Input Summary:</strong><br>
            Unit: ${pantUnit.toUpperCase()} | GSM: ${GSM} | Wastage: ${waste}%<br>
            <strong>Formula:</strong> (IL + CFR + WBW) × HTC × 4 × GSM × 12 / ${pantUnit === 'inch' ? '15,50,000' : '1,00,00,000'} + ${waste}% wastage
        </div>
    `;
    
    generatePDF('Knit Pant Report', reportHtml);
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Unit buttons
    document.querySelectorAll('#page-knitpant .unit-bar .u-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const unit = this.getAttribute('data-unit');
            setPantUnit(unit);
            document.querySelectorAll('#page-knitpant .unit-bar .u-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Input listeners
    const inputs = ['kp-il', 'kp-ila', 'kp-cfr', 'kp-cfra', 'kp-wbw', 'kp-wbwa', 'kp-htc', 'kp-htca', 'kp-gsm', 'kp-waste'];
    inputs.forEach(id => {
        const input = el(id);
        if (input) input.addEventListener('input', updatePantTotals);
    });
    
    // Calculate button
    const calcBtn = el('btn-calc-knitpant');
    if (calcBtn) calcBtn.addEventListener('click', calcKnitPant);
    
    // PDF button
    const pdfBtn = el('btn-pdf-knitpant');
    if (pdfBtn) pdfBtn.addEventListener('click', downloadKnitPantReport);
    
    // Initial calculation
    calcKnitPant();
});