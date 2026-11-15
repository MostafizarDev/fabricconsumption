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
    const totalPriceIcon = document.getElementById('kfp-total-price-icon');
    if (totalPriceIcon) totalPriceIcon.textContent = currency.symbol;
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
        orderQty: Number(v('kfp-order-qty')),
        consumption: Number(v('kfp-consumption')),
        manualTotalQty: Number(v('kfp-total-qty'))
    };
}
function calculateKnitPriceValues() {
    const data = getKnitPriceInputs();
    if (!Number.isFinite(data.weight) || data.weight <= 0) return { error: 'Fabric Weight must be greater than 0 kg.' };
    if (!Number.isFinite(data.gsm) || data.gsm <= 0) return { error: 'Fabric GSM must be greater than 0.' };
    if (!Number.isFinite(data.width) || data.width <= 0) return { error: 'Fabric Width must be greater than 0 meter.' };
    const priceInput = document.getElementById('kfp-pkg');
    if (!priceInput || priceInput.value.trim() === '' || !Number.isFinite(data.pricePerKg) || data.pricePerKg < 0) return { error: 'Please enter a valid Price Per Kg (zero is allowed).' };

    const hasOrderQty = document.getElementById('kfp-order-qty').value.trim() !== '';
    const hasConsumption = document.getElementById('kfp-consumption').value.trim() !== '';
    const hasManualQty = document.getElementById('kfp-total-qty').value.trim() !== '';
    if (hasOrderQty !== hasConsumption) return { error: 'Enter both Order Quantity and Fabric Consumption, or leave both blank.' };
    if (hasOrderQty && (data.orderQty <= 0 || !Number.isInteger(data.orderQty))) return { error: 'Order Quantity must be a positive whole number.' };
    if (hasConsumption && (!Number.isFinite(data.consumption) || data.consumption <= 0)) return { error: 'Fabric Consumption must be greater than 0 meter per piece.' };
    if (hasManualQty && (!Number.isFinite(data.manualTotalQty) || data.manualTotalQty <= 0)) return { error: 'Total Required Fabric must be greater than 0 meter.' };

    // Fabric length from weight, GSM and width.
    const fabricLength = (data.weight * 1000) / (data.gsm * data.width);
    // Equivalent direct formula: price/kg × GSM × width ÷ 1000.
    const pricePerMeter = (data.pricePerKg * data.gsm * data.width) / 1000;
    const totalFabricQty = hasOrderQty ? data.orderQty * data.consumption : (hasManualQty ? data.manualTotalQty : null);
    const totalFabricCost = totalFabricQty === null ? null : totalFabricQty * pricePerMeter;
    if (!Number.isFinite(fabricLength) || !Number.isFinite(pricePerMeter) || (totalFabricQty !== null && (!Number.isFinite(totalFabricQty) || !Number.isFinite(totalFabricCost)))) {
        return { error: 'Please check the entered fabric values.' };
    }
    return { data: data, fabricLength: fabricLength, pricePerMeter: pricePerMeter, totalFabricQty: totalFabricQty, totalFabricCost: totalFabricCost, quantitySource: hasOrderQty ? 'order' : (hasManualQty ? 'manual' : 'none') };
}
function calcKnitPrice() {
    const result = calculateKnitPriceValues();
    if (result.error) {
        set('kfp-len', '—');
        set('kfp-pm', '—');
        set('kfp-total-meters', '—');
        set('kfp-total-cost', '—');
        setKnitPriceStatus(result.error, 'error');
        return false;
    }
    const currency = pricingCurrencyInfo();
    set('kfp-len', result.fabricLength.toFixed(2) + ' m');
    set('kfp-pm', currency.symbol + result.pricePerMeter.toFixed(2));
    set('kfp-total-meters', result.totalFabricQty === null ? '—' : result.totalFabricQty.toFixed(2) + ' m');
    set('kfp-total-cost', result.totalFabricCost === null ? '—' : currency.symbol + result.totalFabricCost.toFixed(2));
    setKnitPriceStatus(result.totalFabricQty === null ? 'Per-meter calculation completed. Enter order quantity and consumption, or total required fabric, to calculate total cost.' : 'Per-meter and total fabric cost calculated successfully.', 'success');
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
    const totalFabricQty = result.totalFabricQty;
    const totalFabricCost = result.totalFabricCost;
    const currency = pricingCurrencyInfo();
    const reportHtml = `
        <div class="header"><h1>💰 Knit Fabric Cost Report</h1><div class="date">Generated: ${new Date().toLocaleString()}</div></div>
        ${pricingOrderInfoReportHtml()}
        <div class="box"><div>Price per Meter</div><div class="box-value">${currency.symbol}${pricePerMeter.toFixed(2)}</div><div>per meter</div></div>
        ${totalFabricQty === null ? '' : `<div class="box"><div>Total Fabric Quantity</div><div class="box-value">${totalFabricQty.toFixed(2)} m</div><div>Total Fabric Cost: ${currency.symbol}${totalFabricCost.toFixed(2)}</div></div>`}
        <table style="width:100%">
            <thead><tr><th>Parameter</th><th>Value</th><th>Unit</th></tr></thead>
            <tbody>
                <tr><td>Fabric Weight</td><td>${weight}</td><td>kg</td></tr>
                <tr><td>Fabric GSM</td><td>${gsm}</td><td>g/m²</td></tr>
                <tr><td>Fabric Width</td><td>${width}</td><td>meter</td></tr>
                <tr><td>Price Per Kg</td><td>${currency.symbol}${pricePerKg}</td><td>${currency.code}/kg</td></tr>
                <tr style="background:#dbeafe"><td>Fabric Length</td><td>${fabricLength.toFixed(2)}</td><td>meter</td></tr>
                <tr style="background:#dbeafe"><td>Price Per Meter</td><td>${currency.symbol}${pricePerMeter.toFixed(2)}</td><td>${currency.code}/meter</td></tr>
                ${totalFabricQty === null ? '' : `<tr><td>Total Fabric Quantity</td><td>${totalFabricQty.toFixed(2)}</td><td>meter</td></tr><tr style="background:#dbeafe"><td>Total Fabric Cost</td><td>${currency.symbol}${totalFabricCost.toFixed(2)}</td><td>${currency.code}</td></tr>`}
            </tbody>
        </table>
        <div style="margin-top:20px;padding:12px;background:#f8fafc;border-radius:8px">
            <strong>📐 Formula:</strong><br>
            Fabric Length = (Weight × 1000) ÷ (GSM × Width)<br>
            = (${weight} × 1000) ÷ (${gsm} × ${width})<br>
            = <strong>${fabricLength.toFixed(2)} meters</strong><br><br>
            Price per Meter = (Price per Kg × GSM × Width) ÷ 1000<br>
            = (${pricePerKg} × ${gsm} × ${width}) ÷ 1000<br>
            = <strong>${currency.symbol}${pricePerMeter.toFixed(2)} per meter</strong><br>
            ${totalFabricQty === null ? '' : `Total Fabric Quantity = ${totalFabricQty.toFixed(2)} meters<br>Total Fabric Cost = ${totalFabricQty.toFixed(2)} × ${currency.symbol}${pricePerMeter.toFixed(2)} = <strong>${currency.symbol}${totalFabricCost.toFixed(2)}</strong>`}
        </div>`;
    generatePDF('Knit Fabric Cost Report', reportHtml);
    setKnitPriceStatus('PDF report is ready.', 'success');
}
document.addEventListener('DOMContentLoaded', function() {
    const inputs = ['kfp-w', 'kfp-gsm', 'kfp-wid', 'kfp-pkg', 'kfp-order-qty', 'kfp-consumption', 'kfp-total-qty'];
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
