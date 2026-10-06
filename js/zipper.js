// ============================================
// ZIPPER.JS - Zipper Length Calculator
// Formula: (Body Length + High Neck - Front Neck Drop) × (1 - Shrinkage/100)
// ============================================

function updateZipper() {
    calcZipper();
}

function calcZipper() {
    const BL = v('zp-bl');           // Body Length (cm)
    const FND = v('zp-fnd');         // Front Neck Drop (cm)
    const HN = v('zp-hn');           // High Neck (cm)
    const SHR = v('zp-shr');         // Shrinkage %
    
    // Zipper Length Formula
    let zipperLength = (BL + HN - FND);
    
    // Apply shrinkage if any
    if (SHR > 0) {
        zipperLength = zipperLength * (1 - SHR / 100);
    }
    
    // Round to 1 decimal
    zipperLength = Math.round(zipperLength * 10) / 10;
    
    set('zp-result', zipperLength.toFixed(1) + ' cm');
}

function downloadZipperReport() {
    const BL = v('zp-bl');
    const FND = v('zp-fnd');
    const HN = v('zp-hn');
    const SHR = v('zp-shr');
    
    let zipperLength = (BL + HN - FND);
    if (SHR > 0) {
        zipperLength = zipperLength * (1 - SHR / 100);
    }
    zipperLength = Math.round(zipperLength * 10) / 10;
    
    const reportHtml = `
        <div class="header">
            <h1>🔱 Zipper Length Report</h1>
            <div class="date">Generated: ${new Date().toLocaleString()}</div>
        </div>
        
        <div class="box">
            <div>Calculated Zipper Length</div>
            <div class="box-value">${zipperLength.toFixed(1)} cm</div>
            <div>Recommended zipper size</div>
        </div>
        
        <table>
            <thead>
                <tr><th>Parameter</th><th>Value</th><th>Description</th></tr>
            </thead>
            <tbody>
                <tr><td>Body Length</td><td>${BL} cm</td><td>Garment body length from HSP</td></tr>
                <tr><td>Front Neck Drop</td><td>${FND} cm</td><td>Neck drop from front</td></tr>
                <tr><td>High Neck</td><td>${HN} cm</td><td>High neck point (if any)</td></tr>
                <tr><td>Shrinkage</td><td>${SHR}%</td><td>Fabric shrinkage allowance</td></tr>
            </tbody>
        </table>
        
        <div style="margin-top: 20px; padding: 12px; background: #f8fafc; border-radius: 8px;">
            <strong>📐 Formula:</strong><br>
            Zipper Length = (Body Length + High Neck - Front Neck Drop) × (1 - Shrinkage/100)<br>
            = (${BL} + ${HN} - ${FND}) × (1 - ${SHR}/100)<br>
            = ${(BL + HN - FND).toFixed(1)} × ${(1 - SHR/100).toFixed(2)}<br>
            = <strong>${zipperLength.toFixed(1)} cm</strong>
        </div>
        
        <div style="margin-top: 16px; padding: 10px; background: #dbeafe; border-radius: 8px;">
            <strong>💡 Recommendation:</strong><br>
            Use zipper size: <strong>${Math.ceil(zipperLength)} cm</strong> or <strong>${(Math.ceil(zipperLength) / 2.54).toFixed(1)} inch</strong>
        </div>
    `;
    
    generatePDF('Zipper Length Report', reportHtml);
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Input listeners
    const inputs = ['zp-bl', 'zp-fnd', 'zp-hn', 'zp-shr'];
    inputs.forEach(id => {
        const input = el(id);
        if (input) input.addEventListener('input', updateZipper);
    });
    
    // Calculate button
    const calcBtn = el('btn-calc-zipper');
    if (calcBtn) calcBtn.addEventListener('click', calcZipper);
    
    // PDF button
    const pdfBtn = el('btn-pdf-zipper');
    if (pdfBtn) pdfBtn.addEventListener('click', downloadZipperReport);
    
    // Initial calculation
    calcZipper();
});