// ============================================
// WOVEN SHIRT.JS - Woven Shirt Fabric Consumption (Yards)
// ============================================

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
        if (span) span.innerHTML = total.toFixed(1) + ' cm';
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
    const BL = v('ws-bl') + v('ws-bla');
    const HC = v('ws-hc') + v('ws-hca');
    const bodyDz = (BL * HC * 2 * 12) / div;
    
    // SLEEVE: (SL) × (AH) × 2 × 2 × 12 / DIVIDER
    const SL = v('ws-sl') + v('ws-sla');
    const AH = v('ws-ah') + v('ws-aha');
    const sleeveDz = (SL * AH * 2 * 2 * 12) / div;
    
    const totalDz = bodyDz + sleeveDz;
    const perPiece = totalDz / 12;
    
    set('ws-r-body', fmt(bodyDz, 3) + ' yds');
    set('ws-r-sleeve', fmt(sleeveDz, 3) + ' yds');
    set('ws-r-total', fmt(totalDz, 3) + ' yds/dz');
    set('ws-r-pc', fmt(perPiece, 3) + ' yds');
}

function downloadWovenReport() {
    const FW = v('ws-fw') || 0;
    const totalDz = document.getElementById('ws-r-total')?.innerText || '—';
    const bodyDz = document.getElementById('ws-r-body')?.innerText || '—';
    const sleeveDz = document.getElementById('ws-r-sleeve')?.innerText || '—';
    const perPiece = document.getElementById('ws-r-pc')?.innerText || '—';
    
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
                <tr><th>Component</th><th>Measurement (cm)</th><th>With Allowance</th><th>Consumption (yds/dz)</th></tr>
            </thead>
            <tbody>
                <tr><td>👕 Body</td>
                    <td>Length: ${v('ws-bl')}, Chest: ${v('ws-hc')}</td>
                    <td>${BL} cm × ${HC} cm</td>
                    <td>${bodyDz}</td>
                </tr>
                <tr><td>🧤 Sleeve</td>
                    <td>Length: ${v('ws-sl')}, Armhole: ${v('ws-ah')}</td>
                    <td>${SL} cm × ${AH} cm</td>
                    <td>${sleeveDz}</td>
                </tr>
            </tbody>
        </table>
        
        <div style="margin-top: 20px; padding: 12px; background: #f8fafc; border-radius: 8px;">
            <strong>📐 Input Summary:</strong><br>
            Fabric Width: ${FW} inches | Unit: CM<br>
            <strong>Formula (Body):</strong> (BL) × (HC) × 2 × 12 / (FW × 36 × 2.54)<br>
            <strong>Formula (Sleeve):</strong> (SL) × (AH) × 2 × 2 × 12 / (FW × 36 × 2.54)
        </div>
    `;
    
    generatePDF('Woven Shirt Report', reportHtml);
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
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