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
    
    const currency = pricingCurrencyInfo();
    
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
    
    set('fob-cost', currency.symbol + totalCost.toFixed(2));
    set('fob-fob', currency.symbol + fobPrice.toFixed(2));
    set('fob-cnf', currency.symbol + cfPrice.toFixed(2));
    set('fob-cif', currency.symbol + cifPrice.toFixed(2));
}

function downloadFOBReport() {
    const currency = pricingCurrencyInfo();
    const fabric = v('fob-fab');
    const trims = v('fob-tr');
    const cm = v('fob-cm');
    const accessories = v('fob-acc');
    const overhead = v('fob-oh');
    const profit = v('fob-pr');
    const freight = v('fob-fr');
    const insurance = v('fob-ins');

    const totalCost = fabric + trims + cm + accessories;
    const overheadAmount = totalCost * overhead / 100;
    const costWithOH = totalCost + overheadAmount;
    const profitAmount = costWithOH * profit / 100;
    const fobPrice = costWithOH + profitAmount;
    const cfPrice = fobPrice + freight;
    const insuranceAmount = cfPrice * insurance / 100;
    const cifPrice = cfPrice + insuranceAmount;

    const now = new Date();
    const dateText = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const reportId = 'FC-FOB-' + now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0') + '-' + String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
    const safe = function(value) {
        return String(value == null ? '' : value).replace(/[&<>"']/g, function(char) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
        });
    };
    const icon = function(name) {
        const paths = {
            info: '<circle cx="12" cy="12" r="9"></circle><path d="M12 10v6M12 7h.01"></path>',
            summary: '<path d="M4 19V5M4 19h17"></path><path d="m7 15 4-4 3 2 6-7"></path>',
            formula: '<rect x="4" y="3" width="16" height="18" rx="2"></rect><path d="M8 8h8M8 12h2m4 0h2m-8 4h2m4 0h2"></path>'
        };
        return '<svg class="report-icon" viewBox="0 0 24 24" aria-hidden="true">' + (paths[name] || paths.info) + '</svg>';
    };

    const infoFields = [
        ['Buyer Name', 'pc-buyer'],
        ['Style No.', 'pc-style'],
        ['PO / Order No.', 'pc-po'],
        ['Garment Type', 'pc-garment']
    ];
    const orderCards = infoFields.map(function(field) {
        const input = document.getElementById(field[1]);
        const value = input ? String(input.value || '').trim() : '';
        return value ? '<div><span>' + field[0] + '</span><strong>' + safe(value) + '</strong></div>' : '';
    }).filter(Boolean).join('');
    const extraOrderFields = [
        ['Order Quantity', 'pc-qty', ' pcs'],
        ['Season', 'pc-season', ''],
        ['Shipment Date', 'pc-shipment', '']
    ];
    const extraOrderCards = extraOrderFields.map(function(field) {
        const input = document.getElementById(field[1]);
        const value = input ? String(input.value || '').trim() : '';
        return value ? '<div><span>' + field[0] + '</span><strong>' + safe(value) + safe(field[2]) + '</strong></div>' : '';
    }).filter(Boolean).join('');

    const share = function(value) {
        return totalCost > 0 ? (value / totalCost * 100).toFixed(1) + '%' : '0.0%';
    };
    const report = '<div class="report fob-cost-report">' +
        '<div class="report-header"><div><div class="brand">FABRIC <span>CONSUMPTION</span></div><div class="subtitle">GARMENT CALCULATOR SUITE</div></div><div class="report-title"><div class="eyebrow">CALCULATION REPORT</div><h1>FOB Costing Calculator</h1><div class="report-id">' + reportId + '</div></div></div>' +
        '<div class="meta-grid"><div><span>Report Date</span><strong>' + dateText + '</strong></div><div><span>Time</span><strong>' + timeText + '</strong></div><div><span>Currency</span><strong>' + safe(currency.code) + '</strong></div><div><span>Calculation</span><strong>Per Piece</strong></div></div>' +
        (orderCards || extraOrderCards ? '<section class="section"><div class="section-head">' + icon('info') + '<span>ORDER INFORMATION</span></div><div class="info-grid">' + orderCards + extraOrderCards + '</div></section>' : '') +
        '<section class="section"><div class="section-head">' + icon('info') + '<span>COST INPUT DETAILS</span></div><div class="info-grid">' +
        '<div><span>Fabric Cost</span><strong>' + safe(currency.symbol) + fabric.toFixed(2) + '</strong></div>' +
        '<div><span>Trims Cost</span><strong>' + safe(currency.symbol) + trims.toFixed(2) + '</strong></div>' +
        '<div><span>CM (Cut &amp; Make)</span><strong>' + safe(currency.symbol) + cm.toFixed(2) + '</strong></div>' +
        '<div><span>Accessories</span><strong>' + safe(currency.symbol) + accessories.toFixed(2) + '</strong></div>' +
        '<div><span>Overhead</span><strong>' + overhead.toFixed(2) + '%</strong></div>' +
        '<div><span>Profit</span><strong>' + profit.toFixed(2) + '%</strong></div>' +
        '<div><span>Freight / Piece</span><strong>' + safe(currency.symbol) + freight.toFixed(2) + '</strong></div>' +
        '<div><span>Insurance</span><strong>' + insurance.toFixed(2) + '%</strong></div>' +
        '</div></section>' +
        '<div class="summary-grid" style="grid-template-columns:repeat(2,minmax(0,1fr))">' +
        '<div class="summary-card"><div class="metric-head">' + icon('summary') + '<span>TOTAL COST</span></div><strong>' + safe(currency.symbol) + totalCost.toFixed(2) + '</strong><small>Manufacturing cost per piece</small></div>' +
        '<div class="summary-card primary"><div class="metric-head">' + icon('summary') + '<span>FOB PRICE</span></div><strong>' + safe(currency.symbol) + fobPrice.toFixed(2) + '</strong><small>FOB price per piece</small></div>' +
        '<div class="summary-card"><div class="metric-head">' + icon('summary') + '<span>C&amp;F PRICE</span></div><strong>' + safe(currency.symbol) + cfPrice.toFixed(2) + '</strong><small>Including freight per piece</small></div>' +
        '<div class="summary-card primary"><div class="metric-head">' + icon('summary') + '<span>CIF PRICE</span></div><strong>' + safe(currency.symbol) + cifPrice.toFixed(2) + '</strong><small>Including freight and insurance</small></div>' +
        '</div>' +
        '<section class="section compact-fob-breakdown"><div class="section-head">' + icon('info') + '<span>COST BREAKDOWN</span></div><table><thead><tr><th>Cost Component</th><th>Amount (' + safe(currency.code) + ')</th><th>Share</th></tr></thead><tbody>' +
        '<tr><td>Fabric Cost</td><td>' + safe(currency.symbol) + fabric.toFixed(2) + '</td><td>' + share(fabric) + '</td></tr>' +
        '<tr><td>Trims Cost</td><td>' + safe(currency.symbol) + trims.toFixed(2) + '</td><td>' + share(trims) + '</td></tr>' +
        '<tr><td>CM (Cut &amp; Make)</td><td>' + safe(currency.symbol) + cm.toFixed(2) + '</td><td>' + share(cm) + '</td></tr>' +
        '<tr><td>Accessories</td><td>' + safe(currency.symbol) + accessories.toFixed(2) + '</td><td>' + share(accessories) + '</td></tr>' +
        '<tr class="total-row"><td><strong>Total Manufacturing Cost</strong></td><td><strong>' + safe(currency.symbol) + totalCost.toFixed(2) + '</strong></td><td><strong>100%</strong></td></tr>' +
        '<tr><td>Overhead (' + overhead.toFixed(2) + '%)</td><td>' + safe(currency.symbol) + overheadAmount.toFixed(2) + '</td><td>—</td></tr>' +
        '<tr><td>Profit (' + profit.toFixed(2) + '%)</td><td>' + safe(currency.symbol) + profitAmount.toFixed(2) + '</td><td>—</td></tr>' +
        '<tr><td>Freight</td><td>' + safe(currency.symbol) + freight.toFixed(2) + '</td><td>—</td></tr>' +
        '<tr><td>Insurance (' + insurance.toFixed(2) + '%)</td><td>' + safe(currency.symbol) + insuranceAmount.toFixed(2) + '</td><td>—</td></tr>' +
        '</tbody></table></section>' +
        '<section class="section formula compact-fob-formula"><div class="section-head">' + icon('formula') + '<span>CALCULATION FORMULA</span></div><div class="formula-text">' +
        '<div><strong>1. Manufacturing Cost:</strong> ' + [fabric,trims,cm,accessories].map(v=>safe(currency.symbol)+v.toFixed(2)).join(' + ') + ' = <strong>' + safe(currency.symbol) + totalCost.toFixed(2) + '</strong></div>' +
        '<div><strong>2. Cost with Overhead:</strong> ' + safe(currency.symbol) + totalCost.toFixed(2) + ' × (1 + ' + overhead.toFixed(2) + '%) = <strong>' + safe(currency.symbol) + costWithOH.toFixed(2) + '</strong></div>' +
        '<div><strong>3. FOB Price:</strong> ' + safe(currency.symbol) + costWithOH.toFixed(2) + ' × (1 + ' + profit.toFixed(2) + '%) = <strong>' + safe(currency.symbol) + fobPrice.toFixed(2) + '</strong></div>' +
        '<div><strong>4. C&amp;F Price:</strong> ' + safe(currency.symbol) + fobPrice.toFixed(2) + ' + ' + safe(currency.symbol) + freight.toFixed(2) + ' = <strong>' + safe(currency.symbol) + cfPrice.toFixed(2) + '</strong></div>' +
        '<div><strong>5. CIF Price:</strong> ' + safe(currency.symbol) + cfPrice.toFixed(2) + ' × (1 + ' + insurance.toFixed(2) + '%) = <strong>' + safe(currency.symbol) + cifPrice.toFixed(2) + '</strong></div>' +
        '</div></section>' +
        '<div class="report-footer"><span>Fabric Consumption • Garment Calculator Suite</span><span>' + dateText + ' · ' + timeText + ' · <a href="https://fabricconsumption.vercel.app/" target="_blank" rel="noopener noreferrer">fabricconsumption.vercel.app</a></span></div>' +
        '</div>';

    const pdfOpened = generatePDF('FOB Costing Report', report);
    if (!pdfOpened && typeof showToast === 'function') {
        showToast('FOB PDF window could not be opened. Please try again.', 'error');
    }
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