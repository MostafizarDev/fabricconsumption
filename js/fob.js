// ============================================
// FOB.JS - FOB, C&F, CIF Costing Calculation
// ============================================

function updateFOB() {
    calcFOB();
}

function calcFOB() {
    const fabric = v('fob-fab');      // Fabric Cost ($)
    const trims = v('fob-tr');        // Trims Cost ($)
    const cm = v('fob-cm');           // Cut & Make ($)
    const accessories = v('fob-acc'); // Accessories ($)
    const overhead = v('fob-oh');     // Overhead %
    const profit = v('fob-pr');       // Profit %
    const freight = v('fob-fr');      // Freight per pc ($)
    const insurance = v('fob-ins');   // Insurance %
    
    // Total Manufacturing Cost
    const totalCost = fabric + trims + cm + accessories;
    
    // Cost with Overhead
    const costWithOH = totalCost * (1 + overhead / 100);
    
    // FOB Price with Profit
    const fobPrice = costWithOH * (1 + profit / 100);
    
    // C&F Price (FOB + Freight)
    const cfPrice = fobPrice + freight;
    
    // CIF Price (C&F + Insurance)
    const cifPrice = cfPrice * (1 + insurance / 100);
    
    set('fob-cost', '$' + totalCost.toFixed(2));
    set('fob-fob', '$' + fobPrice.toFixed(2));
    set('fob-cnf', '$' + cfPrice.toFixed(2));
    set('fob-cif', '$' + cifPrice.toFixed(2));
}

function downloadFOBReport() {
    const fabric = v('fob-fab');
    const trims = v('fob-tr');
    const cm = v('fob-cm');
    const accessories = v('fob-acc');
    const overhead = v('fob-oh');
    const profit = v('fob-pr');
    const freight = v('fob-fr');
    const insurance = v('fob-ins');
    
    const totalCost = fabric + trims + cm + accessories;
    const costWithOH = totalCost * (1 + overhead / 100);
    const fobPrice = costWithOH * (1 + profit / 100);
    const cfPrice = fobPrice + freight;
    const cifPrice = cfPrice * (1 + insurance / 100);
    
    const reportHtml = `
        <div class="header">
            <h1>💵 FOB Costing Report</h1>
            <div class="date">Generated: ${new Date().toLocaleString()}</div>
        </div>
        
        <div class="box">
            <div>Final Prices</div>
            <div class="box-value">$${fobPrice.toFixed(2)}</div>
            <div>FOB Price per piece</div>
            <div style="font-size:12px; margin-top:5px">C&F: $${cfPrice.toFixed(2)} | CIF: $${cifPrice.toFixed(2)}</div>
        </div>
        
        <table style="width:100%">
            <thead><tr><th>Cost Component</th><th>Amount ($)</th><th>Percentage</th></tr></thead>
            <tbody>
                <tr><td>Fabric Cost</td><td>$${fabric.toFixed(2)}</td><td>${((fabric/totalCost)*100).toFixed(1)}%</td></tr>
                <tr><td>Trims Cost</td><td>$${trims.toFixed(2)}</td><td>${((trims/totalCost)*100).toFixed(1)}%</td></tr>
                <tr><td>CM (Cut & Make)</td><td>$${cm.toFixed(2)}</td><td>${((cm/totalCost)*100).toFixed(1)}%</td></tr>
                <tr><td>Accessories</td><td>$${accessories.toFixed(2)}</td><td>${((accessories/totalCost)*100).toFixed(1)}%</td></tr>
                <tr style="background:#f8fafc"><td><strong>Total Cost</strong></td><td><strong>$${totalCost.toFixed(2)}</strong></td><td><strong>100%</strong></td></tr>
                <tr><td>Overhead (${overhead}%)</td><td>$${(totalCost * overhead/100).toFixed(2)}</td><td>-</td></tr>
                <tr><td>Profit (${profit}%)</td><td>$${(costWithOH * profit/100).toFixed(2)}</td><td>-</td></tr>
                <tr style="background:#dbeafe"><td><strong>FOB Price</strong></td><td><strong>$${fobPrice.toFixed(2)}</strong></td><td>-</td></tr>
                <tr><td>Freight</td><td>$${freight.toFixed(2)}</td><td>-</td></tr>
                <tr style="background:#dbeafe"><td><strong>C&F Price</strong></td><td><strong>$${cfPrice.toFixed(2)}</strong></td><td>-</td></tr>
                <tr><td>Insurance (${insurance}%)</td><td>$${(cfPrice * insurance/100).toFixed(2)}</td><td>-</td></tr>
                <tr style="background:#dbeafe"><td><strong>CIF Price</strong></td><td><strong>$${cifPrice.toFixed(2)}</strong></td><td>-</td></tr>
            </tbody>
        </table>
    `;
    
    generatePDF('FOB Costing Report', reportHtml);
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    const inputs = ['fob-fab', 'fob-tr', 'fob-cm', 'fob-acc', 'fob-oh', 'fob-pr', 'fob-fr', 'fob-ins'];
    inputs.forEach(id => {
        const input = el(id);
        if (input) input.addEventListener('input', updateFOB);
    });
    
    const calcBtn = el('btn-calc-fob');
    if (calcBtn) calcBtn.addEventListener('click', calcFOB);
    
    const pdfBtn = el('btn-pdf-fob');
    if (pdfBtn) pdfBtn.addEventListener('click', downloadFOBReport);
    
    calcFOB();
});