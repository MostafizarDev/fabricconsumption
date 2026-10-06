// ============================================
// TRIMS.JS - Thread, Button, Interlining Consumption
// ============================================

// ========== THREAD CALCULATION ==========
function updateThread() {
    calcThread();
}

function calcThread() {
    const seamLength = v('th-seam');      // Seam length per piece (meters)
    const layers = v('th-layer');          // Number of layers
    const spi = v('th-spi');               // Stitches per inch
    const tps = v('th-tps');               // Thread per stitch
    
    // Thread consumption per piece (meters)
    // Formula: seamLength × layers × spi × tps / 39.37 (convert inch to meter)
    const perPc = (seamLength * layers * spi * tps) / 39.37;
    const perDz = perPc * 12;
    
    set('th-pc', perPc.toFixed(1) + ' m');
    set('th-dz', perDz.toFixed(1) + ' m');
}

function downloadThreadReport() {
    const seamLength = v('th-seam');
    const layers = v('th-layer');
    const spi = v('th-spi');
    const tps = v('th-tps');
    
    const perPc = (seamLength * layers * spi * tps) / 39.37;
    const perDz = perPc * 12;
    
    const reportHtml = `
        <div class="header">
            <h1>🪡 Thread Consumption Report</h1>
            <div class="date">Generated: ${new Date().toLocaleString()}</div>
        </div>
        
        <div class="box">
            <div>Thread Consumption</div>
            <div class="box-value">${perDz.toFixed(1)} m</div>
            <div>per dozen</div>
            <div style="font-size: 12px; margin-top: 8px;">${perPc.toFixed(1)} m per piece</div>
        </div>
        
        <table>
            <thead><tr><th>Parameter</th><th>Value</th><th>Unit</th></tr></thead>
            <tbody>
                <tr><td>Seam Length</td><td>${seamLength}</td><td>m/pc</td></tr>
                <tr><td>Number of Layers</td><td>${layers}</td><td>-</td></tr>
                <tr><td>Stitch Density (SPI)</td><td>${spi}</td><td>stitches/inch</td></tr>
                <tr><td>Thread Per Stitch</td><td>${tps}</td><td>threads</td></tr>
            </tbody>
        </table>
        
        <div style="margin-top: 20px; padding: 12px; background: #f8fafc; border-radius: 8px;">
            <strong>📐 Formula:</strong><br>
            Thread (m) = Seam Length × Layers × SPI × Thread Per Stitch ÷ 39.37<br>
            = ${seamLength} × ${layers} × ${spi} × ${tps} ÷ 39.37<br>
            = <strong>${perPc.toFixed(1)} m/pc</strong> | <strong>${perDz.toFixed(1)} m/dz</strong>
        </div>
    `;
    
    generatePDF('Thread Consumption Report', reportHtml);
}

// ========== BUTTON CALCULATION ==========
function updateButton() {
    calcButton();
}

function calcButton() {
    const buttonsPerPc = v('bt-pp');      // Buttons per piece
    const extraPercent = v('bt-ex');       // Extra / Spare percentage
    
    // Buttons per dozen with extra percentage
    const perDz = buttonsPerPc * 12 * (1 + extraPercent / 100);
    
    set('bt-dz', Math.ceil(perDz) + ' pcs');
}

function downloadButtonReport() {
    const buttonsPerPc = v('bt-pp');
    const extraPercent = v('bt-ex');
    
    const perDz = buttonsPerPc * 12 * (1 + extraPercent / 100);
    
    const reportHtml = `
        <div class="header">
            <h1>🔘 Button Consumption Report</h1>
            <div class="date">Generated: ${new Date().toLocaleString()}</div>
        </div>
        
        <div class="box">
            <div>Buttons Required</div>
            <div class="box-value">${Math.ceil(perDz)} pcs</div>
            <div>per dozen (including ${extraPercent}% spare)</div>
        </div>
        
        <table>
            <thead><tr><th>Parameter</th><th>Value</th><th>Unit</th></tr></thead>
            <tbody>
                <tr><td>Buttons per Piece</td><td>${buttonsPerPc}</td><td>pcs</td></tr>
                <tr><td>Extra / Spare %</td><td>${extraPercent}</td><td>%</td></tr>
            </tbody>
        </table>
        
        <div style="margin-top: 20px; padding: 12px; background: #f8fafc; border-radius: 8px;">
            <strong>📐 Formula:</strong><br>
            Buttons/Dz = Buttons/Pc × 12 × (1 + Extra%/100)<br>
            = ${buttonsPerPc} × 12 × ${(1 + extraPercent/100).toFixed(2)}<br>
            = <strong>${Math.ceil(perDz)} pcs/dz</strong>
        </div>
    `;
    
    generatePDF('Button Consumption Report', reportHtml);
}

// ========== INTERLINING CALCULATION ==========
function updateInterlining() {
    calcInterlining();
}

function calcInterlining() {
    const length = v('il-len');      // Length in cm
    const width = v('il-wid');       // Width in cm
    const qtyPerPc = v('il-qty');    // Quantity per piece
    
    // Area per piece (m²)
    const areaPerPc = (length * width * qtyPerPc) / 10000;
    const areaPerDz = areaPerPc * 12;
    
    set('il-dz', areaPerDz.toFixed(3) + ' m²');
}

function downloadInterliningReport() {
    const length = v('il-len');
    const width = v('il-wid');
    const qtyPerPc = v('il-qty');
    
    const areaPerPc = (length * width * qtyPerPc) / 10000;
    const areaPerDz = areaPerPc * 12;
    
    const reportHtml = `
        <div class="header">
            <h1>🧵 Interlining Consumption Report</h1>
            <div class="date">Generated: ${new Date().toLocaleString()}</div>
        </div>
        
        <div class="box">
            <div>Interlining Required</div>
            <div class="box-value">${areaPerDz.toFixed(3)} m²</div>
            <div>per dozen</div>
            <div style="font-size: 12px; margin-top: 8px;">${areaPerPc.toFixed(4)} m² per piece</div>
        </div>
        
        <table>
            <thead><tr><th>Parameter</th><th>Value</th><th>Unit</th></tr></thead>
            <tbody>
                <tr><td>Length</td><td>${length}</td><td>cm</td></tr>
                <tr><td>Width</td><td>${width}</td><td>cm</td></tr>
                <tr><td>Quantity per Piece</td><td>${qtyPerPc}</td><td>pcs</td></tr>
            </tbody>
        </table>
        
        <div style="margin-top: 20px; padding: 12px; background: #f8fafc; border-radius: 8px;">
            <strong>📐 Formula:</strong><br>
            Area (m²) = (Length × Width × Qty) ÷ 10,000<br>
            = (${length} × ${width} × ${qtyPerPc}) ÷ 10,000<br>
            = <strong>${areaPerPc.toFixed(4)} m²/pc</strong> | <strong>${areaPerDz.toFixed(3)} m²/dz</strong>
        </div>
    `;
    
    generatePDF('Interlining Consumption Report', reportHtml);
}

// ========== EVENT LISTENERS ==========
document.addEventListener('DOMContentLoaded', function() {
    // Thread inputs
    const threadInputs = ['th-seam', 'th-layer', 'th-spi', 'th-tps'];
    threadInputs.forEach(id => {
        const input = el(id);
        if (input) input.addEventListener('input', updateThread);
    });
    
    // Button inputs
    const buttonInputs = ['bt-pp', 'bt-ex'];
    buttonInputs.forEach(id => {
        const input = el(id);
        if (input) input.addEventListener('input', updateButton);
    });
    
    // Interlining inputs
    const interliningInputs = ['il-len', 'il-wid', 'il-qty'];
    interliningInputs.forEach(id => {
        const input = el(id);
        if (input) input.addEventListener('input', updateInterlining);
    });
    
    // Calculate buttons
    const threadCalcBtn = el('btn-calc-thread');
    if (threadCalcBtn) threadCalcBtn.addEventListener('click', calcThread);
    
    const buttonCalcBtn = el('btn-calc-button');
    if (buttonCalcBtn) buttonCalcBtn.addEventListener('click', calcButton);
    
    const interliningCalcBtn = el('btn-calc-interlining');
    if (interliningCalcBtn) interliningCalcBtn.addEventListener('click', calcInterlining);
    
    // PDF buttons (optional - add IDs in HTML if needed)
    const threadPdfBtn = el('btn-pdf-thread');
    if (threadPdfBtn) threadPdfBtn.addEventListener('click', downloadThreadReport);
    
    const buttonPdfBtn = el('btn-pdf-button');
    if (buttonPdfBtn) buttonPdfBtn.addEventListener('click', downloadButtonReport);
    
    const interliningPdfBtn = el('btn-pdf-interlining');
    if (interliningPdfBtn) interliningPdfBtn.addEventListener('click', downloadInterliningReport);
    
    // Initial calculations
    calcThread();
    calcButton();
    calcInterlining();
});