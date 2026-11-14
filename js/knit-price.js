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
        pricePerKg: Number(v('kfp-pkg'))
    };
}
function calculateKnitPriceValues() {
    const data = getKnitPriceInputs();
    if (!Number.isFinite(data.weight) || data.weight <= 0) return { error: 'Fabric Weight must be greater than 0 kg.' };
    if (!Number.isFinite(data.gsm) || data.gsm <= 0) return { error: 'Fabric GSM must be greater than 0.' };
    if (!Number.isFinite(data.width) || data.width <= 0) return { error: 'Fabric Width must be greater than 0 meter.' };
    if (!Number.isFinite(data.pricePerKg) || data.pricePerKg < 0) return { error: 'Price Per Kg cannot be negative.' };

    // Existing approved formula — intentionally unchanged.
    const fabricLength = (data.weight * 1000) / (data.gsm * data.width);
    const pricePerMeter = (data.pricePerKg * data.weight) / fabricLength;
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
    setKnitPriceStatus('Calculation completed successfully.', 'success');
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
    const reportHtml = `
        <div class="header"><h1>💰 Knit Fabric Price Report</h1><div class="date">Generated: ${new Date().toLocaleString()}</div></div>
        ${pricingOrderInfoReportHtml()}
        <div class="box"><div>Price per Meter</div><div class="box-value">${currency.symbol}${pricePerMeter.toFixed(2)}</div><div>per meter</div></div>
        <table style="width:100%">
            <thead><tr><th>Parameter</th><th>Value</th><th>Unit</th></tr></thead>
            <tbody>
                <tr><td>Fabric Weight</td><td>${weight}</td><td>kg</td></tr>
                <tr><td>Fabric GSM</td><td>${gsm}</td><td>g/m²</td></tr>
                <tr><td>Fabric Width</td><td>${width}</td><td>meter</td></tr>
                <tr><td>Price Per Kg</td><td>${currency.symbol}${pricePerKg}</td><td>${currency.code}/kg</td></tr>
                <tr style="background:#dbeafe"><td>Fabric Length</td><td>${fabricLength.toFixed(2)}</td><td>meter</td></tr>
                <tr style="background:#dbeafe"><td>Price Per Meter</td><td>${currency.symbol}${pricePerMeter.toFixed(2)}</td><td>${currency.code}/meter</td></tr>
            </tbody>
        </table>
        <div style="margin-top:20px;padding:12px;background:#f8fafc;border-radius:8px">
            <strong>📐 Formula:</strong><br>
            Fabric Length = (Weight × 1000) ÷ (GSM × Width)<br>
            = (${weight} × 1000) ÷ (${gsm} × ${width})<br>
            = <strong>${fabricLength.toFixed(2)} meters</strong><br><br>
            Price per Meter = (PricePerKg × Weight) ÷ Fabric Length<br>
            = (${pricePerKg} × ${weight}) ÷ ${fabricLength.toFixed(2)}<br>
            = <strong>${currency.symbol}${pricePerMeter.toFixed(2)} per meter</strong>
        </div>`;
    generatePDF('Knit Fabric Price Report', reportHtml);
    setKnitPriceStatus('PDF report is ready.', 'success');
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
