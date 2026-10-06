// ============================================
// SIZE RATIO.JS - Size Ratio Distribution
// ============================================

function updateSizeRatio() {
    calcSizeRatio();
}

function calcSizeRatio() {
    const totalQty = v('sr-total');
    
    // Get ratios for up to 5 sizes
    const ratios = [
        v('sr-r1'), v('sr-r2'), v('sr-r3'), v('sr-r4'), v('sr-r5')
    ];
    
    const sum = ratios.reduce((a, b) => a + b, 0);
    
    if (sum === 0) {
        for (let i = 1; i <= 5; i++) {
            set('sr-q' + i, '—');
        }
        set('sr-totrat', '0');
        return;
    }
    
    let distributed = 0;
    for (let i = 0; i < ratios.length; i++) {
        let qty = Math.floor(totalQty * ratios[i] / sum);
        distributed += qty;
        set('sr-q' + (i + 1), qty);
    }
    
    // Adjust last size to match total
    if (distributed !== totalQty && ratios.length > 0) {
        const lastQty = parseInt(document.getElementById('sr-q5')?.innerText) || 0;
        const adjustment = totalQty - distributed;
        set('sr-q5', lastQty + adjustment);
    }
    
    set('sr-totrat', sum);
}

function downloadSizeRatioReport() {
    const totalQty = v('sr-total');
    
    const sizes = [];
    const ratios = [];
    const qtys = [];
    
    for (let i = 1; i <= 5; i++) {
        const sizeVal = document.getElementById(`sr-s${i}`)?.value || '-';
        const ratioVal = v(`sr-r${i}`);
        const qtyVal = document.getElementById(`sr-q${i}`)?.innerText || '—';
        
        if (ratioVal > 0) {
            sizes.push(sizeVal);
            ratios.push(ratioVal);
            qtys.push(qtyVal);
        }
    }
    
    let tableRows = '';
    for (let i = 0; i < sizes.length; i++) {
        tableRows += `<tr><td>${sizes[i]}</td><td>${ratios[i]}</td><td>${qtys[i]}</td></tr>`;
    }
    
    const reportHtml = `
        <div class="header">
            <h1>📐 Size Ratio Report</h1>
            <div class="date">Generated: ${new Date().toLocaleString()}</div>
        </div>
        
        <div class="box">
            <div>Total Order Quantity</div>
            <div class="box-value">${totalQty} pcs</div>
        </div>
        
        <table style="width:100%">
            <thead><tr><th>Size</th><th>Ratio</th><th>Quantity (pcs)</th></tr></thead>
            <tbody>${tableRows}</tbody>
        </table>
        
        <div style="margin-top:20px; padding:12px; background:#f8fafc; border-radius:8px">
            <strong>📐 Formula:</strong><br>
            Quantity per Size = (Total Order × Size Ratio) ÷ Sum of All Ratios
        </div>
    `;
    
    generatePDF('Size Ratio Report', reportHtml);
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    const inputs = ['sr-total', 'sr-r1', 'sr-r2', 'sr-r3', 'sr-r4', 'sr-r5'];
    inputs.forEach(id => {
        const input = el(id);
        if (input) input.addEventListener('input', updateSizeRatio);
    });
    
    const calcBtn = el('btn-calc-sizeratio');
    if (calcBtn) calcBtn.addEventListener('click', calcSizeRatio);
    
    const pdfBtn = el('btn-pdf-sizeratio');
    if (pdfBtn) pdfBtn.addEventListener('click', downloadSizeRatioReport);
    
    calcSizeRatio();
});