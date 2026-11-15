// ============================================
// KNIT PRICE.JS - Knit Fabric Price per Meter
// ============================================
function pricingCurrencyInfo() {
    const select = document.getElementById('pc-currency');
    const code = select ? select.value : 'USD';
    const symbols = { USD: '$', EUR: '€', BDT: '৳' };
    return { code: code, symbol: symbols[code] || '$' };
}
function updatePricingCurrencyUI() {
    const currency = pricingCurrencyInfo();
    const knitSymbol = document.getElementById('kfp-currency-symbol');
    if (knitSymbol) knitSymbol.textContent = currency.symbol;
    const knitPriceIcon = document.getElementById('kfp-price-icon');
    if (knitPriceIcon) knitPriceIcon.textContent = currency.symbol;
    document.querySelectorAll('.fob-currency-symbol').forEach(function(node) { node.textContent = currency.symbol; });
    if (typeof calcKnitPrice === 'function') calcKnitPrice();
    if (typeof calcFOB === 'function') calcFOB();
}
function pricingOrderInfoReportHtml() {
    const fields = [
        ['Buyer', 'pc-buyer'], ['Style', 'pc-style'], ['PO No.', 'pc-po'],
        ['Garment Type', 'pc-garment'], ['Order Qty (pcs)', 'pc-qty'],
        ['Currency', 'pc-currency'], ['Season', 'pc-season'], ['Shipment Date', 'pc-shipment']
    ];
    const rows = fields.map(function(item) {
        const input = document.getElementById(item[1]);
        const value = input ? String(input.value || '').trim() : '';
        if (!value) return '';
        const safe = value.replace(/[&<>"']/g, function(char) {
            return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char];
        });
        return '<tr><td>' + item[0] + '</td><td>' + safe + '</td></tr>';
    }).filter(Boolean).join('');
    return rows ? '<h2 style="margin:18px 0 8px">Order Information</h2><table style="width:100%"><tbody>' + rows + '</tbody></table>' : '';
}
function updateKnitPrice() { calcKnitPrice(); }
function setKnitPriceStatus(message, type) {
    const status = document.getElementById('kfp-status');
    if (!status) return;
    status.textContent = message;
    status.classList.toggle('error', type === 'error');
    status.classList.toggle('success', type === 'success');
}
function getKnitPriceInputs() {
    return {
        weight: Number(v('kfp-w')),
        gsm: Number(v('kfp-gsm')),
        width: Number(v('kfp-wid')),
        pricePerKg: Number(v('kfp-pkg')),
    };
}
function calculateKnitPriceValues() {
    const data = getKnitPriceInputs();
    if (!Number.isFinite(data.weight) || data.weight <= 0) return { error: 'Fabric Weight must be greater than 0 kg.' };
    if (!Number.isFinite(data.gsm) || data.gsm <= 0) return { error: 'Fabric GSM must be greater than 0.' };
    if (!Number.isFinite(data.width) || data.width <= 0) return { error: 'Fabric Width must be greater than 0 meter.' };
    const priceInput = document.getElementById('kfp-pkg');
    if (!priceInput || priceInput.value.trim() === '' || !Number.isFinite(data.pricePerKg) || data.pricePerKg < 0) return { error: 'Please enter a valid Price Per Kg (zero is allowed).' };

    // Fabric length from weight, GSM and width.
    const fabricLength = (data.weight * 1000) / (data.gsm * data.width);
    // Equivalent direct formula: price/kg × GSM × width ÷ 1000.
    const pricePerMeter = (data.pricePerKg * data.gsm * data.width) / 1000;
    if (!Number.isFinite(fabricLength) || !Number.isFinite(pricePerMeter)) {
        return { error: 'Please check the entered fabric values.' };
    }
    return { data: data, fabricLength: fabricLength, pricePerMeter: pricePerMeter };
}
function calcKnitPrice() {
    const result = calculateKnitPriceValues();
    if (result.error) {
        set('kfp-len', '—');
        set('kfp-pm', '—');
        setKnitPriceStatus(result.error, 'error');
        return false;
    }
    const currency = pricingCurrencyInfo();
    set('kfp-len', result.fabricLength.toFixed(2) + ' m');
    set('kfp-pm', currency.symbol + result.pricePerMeter.toFixed(2));
    setKnitPriceStatus('Per-meter calculation completed successfully.', 'success');
    return true;
}
function downloadKnitPriceReport() {
    const result = calculateKnitPriceValues();
    if (result.error) {
        calcKnitPrice();
        setKnitPriceStatus('PDF not generated. ' + result.error, 'error');
        return;
    }

    const weight = result.data.weight;
    const gsm = result.data.gsm;
    const width = result.data.width;
    const pricePerKg = result.data.pricePerKg;
    const fabricLength = result.fabricLength;
    const pricePerMeter = result.pricePerMeter;
    const currency = pricingCurrencyInfo();
    const now = new Date();
    const dateText = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const reportId = 'FC-KNIT-' + now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0') + '-' + String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');

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

    const orderRows = pricingOrderInfoReportHtml();
    const report = '<div class="report">' +
        '<div class="report-header"><div><div class="brand">FABRIC <span>CONSUMPTION</span></div><div class="subtitle">GARMENT CALCULATOR SUITE</div></div><div class="report-title"><div class="eyebrow">CALCULATION REPORT</div><h1>Knit Fabric Cost Calculator</h1><div class="report-id">' + reportId + '</div></div></div>' +
        '<div class="meta-grid"><div><span>Report Date</span><strong>' + dateText + '</strong></div><div><span>Time</span><strong>' + timeText + '</strong></div><div><span>Currency</span><strong>' + safe(currency.code) + '</strong></div><div><span>Calculation</span><strong>Per Meter</strong></div></div>' +
        (orderRows ? '<section class="section"><div class="section-head">' + icon('info') + '<span>ORDER INFORMATION</span></div>' + orderRows.replace(/<h2[^>]*>Order Information<\/h2>/, '') + '</section>' : '') +
        '<section class="section"><div class="section-head">' + icon('info') + '<span>FABRIC INPUT DETAILS</span></div><table><thead><tr><th>Parameter</th><th>Value</th><th>Unit</th></tr></thead><tbody>' +
        '<tr><td>Fabric Weight</td><td>' + weight.toFixed(2) + '</td><td>kg</td></tr>' +
        '<tr><td>Fabric GSM</td><td>' + gsm.toFixed(2) + '</td><td>g/m²</td></tr>' +
        '<tr><td>Fabric Width</td><td>' + width.toFixed(2) + '</td><td>meter</td></tr>' +
        '<tr><td>Price Per Kg</td><td>' + safe(currency.symbol) + pricePerKg.toFixed(2) + '</td><td>' + safe(currency.code) + '/kg</td></tr>' +
        '</tbody></table></section>' +
        '<div class="summary-grid">' +
        '<div class="summary-card"><div class="metric-head">' + icon('summary') + '<span>FABRIC LENGTH</span></div><strong>' + fabricLength.toFixed(2) + ' m</strong><small>Calculated from weight, GSM and width</small></div>' +
        '<div class="summary-card primary"><div class="metric-head">' + icon('summary') + '<span>PRICE PER METER</span></div><strong>' + safe(currency.symbol) + pricePerMeter.toFixed(2) + '</strong><small>' + safe(currency.code) + ' per meter</small></div>' +
        '</div>' +
        '<section class="section"><div class="section-head">' + icon('formula') + '<span>CALCULATION FORMULA</span></div><div class="formula-text">' +
        '<strong>1. Fabric Length</strong><br>Fabric Length = (Weight × 1000) ÷ (GSM × Width)<br>= (' + weight.toFixed(2) + ' × 1000) ÷ (' + gsm.toFixed(2) + ' × ' + width.toFixed(2) + ')<br>= <strong>' + fabricLength.toFixed(2) + ' meters</strong><br><br>' +
        '<strong>2. Price per Meter</strong><br>Price per Meter = (Price per Kg × GSM × Width) ÷ 1000<br>= (' + pricePerKg.toFixed(2) + ' × ' + gsm.toFixed(2) + ' × ' + width.toFixed(2) + ') ÷ 1000<br>= <strong>' + safe(currency.symbol) + pricePerMeter.toFixed(2) + ' per meter</strong>' +
        '</div></section>' +
        '<div class="report-footer"><span>Fabric Consumption • Garment Calculator Suite</span><span>' + dateText + ' · ' + timeText + ' · <a href="https://fabricconsumption.vercel.app/" target="_blank" rel="noopener noreferrer">fabricconsumption.vercel.app</a></span></div>' +
        '</div>';

    try {
        const pdfOpened = generatePDF('Knit Fabric Cost Report', report);
        if (!pdfOpened) {
            setKnitPriceStatus('PDF window was blocked. Please allow pop-ups for this website and try again.', 'error');
            return;
        }
        setKnitPriceStatus('PDF report is ready. In the print window, choose Save as PDF.', 'success');
    } catch (error) {
        console.error('Knit PDF generation error:', error);
        setKnitPriceStatus('PDF could not be opened. Please allow pop-ups and try again.', 'error');
    }
}
document.addEventListener('DOMContentLoaded', function() {
    const inputs = ['kfp-w', 'kfp-gsm', 'kfp-wid', 'kfp-pkg'];
    inputs.forEach(function(id) {
        const input = el(id);
        if (input) input.addEventListener('input', updateKnitPrice);
    });
    const calcBtn = el('btn-calc-knitprice');
    if (calcBtn) calcBtn.addEventListener('click', calcKnitPrice);
    const currencySelect = el('pc-currency');
    if (currencySelect) currencySelect.addEventListener('change', updatePricingCurrencyUI);
    updatePricingCurrencyUI();
    const pdfBtn = el('btn-pdf-knitprice');
    if (pdfBtn) pdfBtn.addEventListener('click', downloadKnitPriceReport);
    calcKnitPrice();
});
