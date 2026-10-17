// ============================================
// UNIVERSAL PANT FABRIC CONSUMPTION
// Methods: Quick Estimate, Component-wise, Marker-based
// Consumption only; no costing.
// ============================================
(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const num = id => {
    const el = $(id);
    if (!el || el.value.trim() === '') return null;
    const n = Number(el.value);
    return Number.isFinite(n) ? n : null;
  };
  const val = (id, fallback = 0) => {
    const n = num(id);
    return n === null ? fallback : n;
  };
  const fmt = (n, digits = 3) => Number.isFinite(n) ? n.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits }) : '—';
  const escapeHtml = s => String(s ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  let lastResult = null;
  let customCount = 0;
  let currentUnit = 'cm';

  const componentDefs = {
    front: { name: 'Front leg panels', qty: 2, length: 75, width: 32, gsm: 280, waste: 5 },
    back: { name: 'Back leg panels', qty: 2, length: 78, width: 36, gsm: 280, waste: 5 },
    waistband: { name: 'Waistband', qty: 1, length: 78, width: 8, gsm: 280, waste: 5 },
    cuff: { name: 'Bottom cuff / rib', qty: 2, length: 18, width: 12, gsm: 260, waste: 5 },
    pocketbag: { name: 'Pocket bag / lining', qty: 2, length: 22, width: 17, gsm: 140, waste: 5 },
    sidepocket: { name: 'Side pocket / facing', qty: 2, length: 18, width: 13, gsm: 280, waste: 5 },
    backpocket: { name: 'Back pocket', qty: 2, length: 16, width: 14, gsm: 280, waste: 5 },
    fly: { name: 'Fly / zipper guard', qty: 1, length: 18, width: 8, gsm: 280, waste: 5 },
    cargo: { name: 'Cargo pocket', qty: 2, length: 22, width: 20, gsm: 280, waste: 5 },
    knee: { name: 'Knee panel', qty: 2, length: 24, width: 30, gsm: 280, waste: 5 },
    gusset: { name: 'Gusset', qty: 1, length: 15, width: 12, gsm: 280, waste: 5 },
    other: { name: 'Other panel', qty: 1, length: 10, width: 10, gsm: 280, waste: 5 }
  };

  function method() {
    return document.querySelector('input[name="kp-method"]:checked')?.value || 'quick';
  }
  function unitFactorToCm() { return $('kp-unit')?.value === 'inch' ? 2.54 : 1; }
  function unitLabel() { return $('kp-unit')?.value === 'inch' ? 'IN' : 'CM'; }
  function showValidation(items) {
    const box = $('kp-validation');
    if (!box) return;
    box.innerHTML = items.map(item => '<div class="pant-validation-item ' + item.type + '">' + item.text + '</div>').join('');
  }
  function setResultText(id, value) { const node = $(id); if (node) node.textContent = value; }

  function renderComponentRows() {
    const body = $('kp-component-rows');
    if (!body) return;
    const selected = Array.from(document.querySelectorAll('#kp-component-checks input[type="checkbox"]:checked'));
    body.innerHTML = selected.map(check => {
      const d = componentDefs[check.value] || { name: check.dataset.name || 'Custom component', qty: 1, length: 0, width: 0, gsm: val('kp-default-gsm', 0), waste: 5 };
      const key = check.value;
      return '<tr data-component-row="' + escapeHtml(key) + '">' +
        '<td><input class="pant-row-name" data-field="name" aria-label="Component name" value="' + escapeHtml(d.name) + '"></td>' +
        '<td><input type="number" min="0" step="any" data-field="length" aria-label="Length" value="' + (d.length || '') + '"></td>' +
        '<td><input type="number" min="0" step="any" data-field="width" aria-label="Width" value="' + (d.width || '') + '"></td>' +
        '<td><input type="number" min="0" step="1" data-field="qty" aria-label="Quantity per garment" value="' + (d.qty ?? 1) + '"></td>' +
        '<td><input type="number" min="0" step="any" data-field="gsm" aria-label="GSM" value="' + (d.gsm || val('kp-default-gsm', 0) || '') + '"></td>' +
        '<td><input type="number" min="0" max="100" step="any" data-field="waste" aria-label="Wastage percent" value="' + (d.waste ?? 5) + '"></td>' +
        '<td class="pant-row-result" data-field="result">—</td><td><button type="button" class="pant-row-remove" data-remove-component="' + escapeHtml(key) + '" aria-label="Remove component">×</button></td></tr>';
    }).join('');
    if (!selected.length) body.innerHTML = '<tr><td colspan="8" class="pant-no-rows">Select at least one component above.</td></tr>';
    body.querySelectorAll('input').forEach(input => input.addEventListener('input', calculatePantConsumption));
    body.querySelectorAll('[data-remove-component]').forEach(button => button.addEventListener('click', () => {
      const cb = document.querySelector('#kp-component-checks input[value="' + CSS.escape(button.dataset.removeComponent) + '"]');
      if (cb) cb.checked = false;
      calculatePantConsumption();
    }));
  }

  function collectComponentRows() {
    return Array.from(document.querySelectorAll('#kp-component-rows tr[data-component-row]')).map(row => {
      const get = field => row.querySelector('[data-field="' + field + '"]');
      return {
        key: row.dataset.componentRow,
        name: get('name')?.value.trim() || 'Component',
        length: get('length')?.value.trim() === '' ? null : Number(get('length').value),
        width: get('width')?.value.trim() === '' ? null : Number(get('width').value),
        qty: get('qty')?.value.trim() === '' ? null : Number(get('qty').value),
        gsm: get('gsm')?.value.trim() === '' ? null : Number(get('gsm').value),
        waste: get('waste')?.value.trim() === '' ? null : Number(get('waste').value),
        resultNode: get('result')
      };
    });
  }

  function resetSummary() {
    ['kp-r-pc','kp-r-dz','kp-r-order','kp-r-before','kp-r-waste','kp-r-meter','kp-r-order-meter'].forEach(id => setResultText(id, '—'));
    setResultText('kp-summary-method', 'Awaiting valid inputs');
    setResultText('kp-r-method', '—');
    setResultText('kp-result-note', 'Enter the required data to calculate. Incomplete inputs will not produce a confirmed result.');
    const breakdown = $('kp-breakdown-list');
    if (breakdown) breakdown.innerHTML = '<p class="pant-empty">No calculated components yet.</p>';
    lastResult = null;
  }

  function publishResult({ beforeKg, afterKg, orderQty, methodName, note, meterPerPc = null, orderMeter = null, rows = [] }) {
    const wasteKg = afterKg - beforeKg;
    setResultText('kp-r-pc', fmt(afterKg, 4) + ' kg');
    setResultText('kp-r-dz', fmt(afterKg * 12, 3) + ' kg');
    setResultText('kp-r-order', fmt(afterKg * orderQty, 3) + ' kg');
    setResultText('kp-r-before', fmt(beforeKg, 4) + ' kg/pc');
    setResultText('kp-r-waste', fmt(wasteKg, 4) + ' kg/pc');
    setResultText('kp-summary-method', methodName);
    setResultText('kp-r-method', methodName);
    setResultText('kp-result-note', note);
    $('kp-marker-results').hidden = meterPerPc === null;
    if (meterPerPc !== null) {
      setResultText('kp-r-meter', fmt(meterPerPc, 4) + ' m');
      setResultText('kp-r-order-meter', fmt(orderMeter, 3) + ' m');
    }
    const list = $('kp-breakdown-list');
    if (list) {
      list.innerHTML = rows.length ? rows.map(r => '<div class="pant-breakdown-row"><span>' + escapeHtml(r.name) + '</span><strong>' + fmt(r.kg, 4) + ' kg/pc</strong></div>').join('') : '<p class="pant-empty">This method produces an overall estimate, not a panel breakdown.</p>';
    }
    lastResult = { beforeKg, afterKg, orderQty, methodName, note, meterPerPc, orderMeter, rows, unit: unitLabel(), type: $('kp-pant-type').value, buyer: $('kp-buyer').value, style: $('kp-style').value, po: $('kp-po').value };
  }

  function calculateQuick() {
    const required = ['kp-il','kp-cfr','kp-wbw','kp-htc','kp-gsm'];
    const missing = required.filter(id => num(id) === null || num(id) <= 0);
    if (missing.length) {
      resetSummary();
      showValidation([{type:'warning',text:'Missing required inputs: inseam, rise, waistband height and half-thigh must be greater than zero; enter GSM.'},{type:'info',text:'Quick Estimate is a preliminary formula. Use Component-wise or Marker-based when detailed pattern/marker data is available.'}]);
      return;
    }
    const f = unitFactorToCm();
    const IL = (val('kp-il') + val('kp-ila')) * f;
    const rise = (val('kp-cfr') + val('kp-cfra')) * f;
    const waistband = (val('kp-wbw') + val('kp-wbwa')) * f;
    const thigh = (val('kp-htc') + val('kp-htca')) * f;
    const gsm = val('kp-gsm');
    const waste = val('kp-waste');
    if (waste < 0 || waste > 100) { resetSummary(); showValidation([{type:'error',text:'Wastage must be between 0% and 100%.'}]); return; }
    // Convert all entered measurements to cm first, then use the cm² -> m² and g -> kg divisor.
    const beforeKgPerDz = (IL + rise + waistband) * thigh * 4 * gsm * 12 / 10000000;
    const beforeKg = beforeKgPerDz / 12;
    const afterKg = beforeKg * (1 + waste / 100);
    publishResult({beforeKg,afterKg,orderQty:val('kp-order-qty',0),methodName:'Quick Estimate · preliminary',note:'Approximation only. The simplified formula does not model the actual shape of every pant panel or marker layout.'});
    showValidation([{type:'warning',text:'Preliminary estimate only: verify against the approved pattern, actual panel area or CAD marker before production.'},{type:'success',text:'Unit converted to centimetres internally. Wastage applied once.'}]);
  }

  function calculateComponents() {
    const rows = collectComponentRows();
    if (!rows.length) { resetSummary(); showValidation([{type:'error',text:'Select at least one component.'}]); return; }
    const f = unitFactorToCm();
    const results = [];
    const errors = [];
    let beforeKg = 0;
    let afterKg = 0;
    rows.forEach(row => {
      const vals = [row.length,row.width,row.qty,row.gsm,row.waste];
      if (vals.some(x => x === null || !Number.isFinite(x)) || row.length <= 0 || row.width <= 0 || row.qty <= 0 || row.gsm <= 0 || row.waste < 0 || row.waste > 100) {
        errors.push(row.name + ': enter positive length, width, quantity and GSM; wastage must be 0–100%.');
        if (row.resultNode) row.resultNode.textContent = 'Check inputs';
        return;
      }
      const areaM2 = (row.length * f) * (row.width * f) * row.qty / 10000;
      const netKg = areaM2 * row.gsm / 1000;
      const finalKg = netKg * (1 + row.waste / 100);
      beforeKg += netKg;
      afterKg += finalKg;
      results.push({name:row.name,kg:finalKg,areaM2,netKg,finalKg,wasteKg:finalKg-netKg});
      if (row.resultNode) row.resultNode.textContent = fmt(finalKg,4);
    });
    if (errors.length) {
      resetSummary();
      showValidation(errors.map(text => ({type:'error',text})).concat([{type:'info',text:'No final total is shown until every selected component has valid inputs.'}]));
      return;
    }
    publishResult({beforeKg,afterKg,orderQty:val('kp-order-qty',0),methodName:'Component-wise · panel area',note:'Area × GSM estimate. Check panel dimensions, quantities and allowances against the pattern.',rows:results});
    showValidation([{type:'success',text:results.length + ' selected components calculated successfully.'},{type:'warning',text:'Area-based estimate only; fabric nesting, marker efficiency, shrinkage and cutting loss may change actual consumption.'}]);
  }

  function calculateMarker() {
    const length = num('kp-marker-length'), width = num('kp-marker-width'), pieces = num('kp-marker-pcs'), gsm = num('kp-marker-gsm'), waste = num('kp-marker-waste');
    const missing = [];
    if (length === null || length <= 0) missing.push('marker length');
    if (width === null || width <= 0) missing.push('usable fabric width');
    if (pieces === null || pieces <= 0) missing.push('garments in marker');
    if (gsm === null || gsm <= 0) missing.push('fabric GSM');
    if (waste === null || waste < 0 || waste > 100) missing.push('valid additional wastage (0–100%)');
    if (missing.length) { resetSummary(); showValidation([{type:'error',text:'Required marker inputs missing or invalid: ' + missing.join(', ') + '.'},{type:'info',text:'Use actual approved marker values; do not enter guessed marker data as confirmed consumption.'}]); return; }
    const toM = unitFactorToCm() / 100;
    const markerLengthM = length * toM;
    const widthM = width * toM;
    const meterPerPcBefore = markerLengthM / pieces;
    const areaM2PerPc = markerLengthM * widthM / pieces;
    const beforeKg = areaM2PerPc * gsm / 1000;
    const afterKg = beforeKg * (1 + waste / 100);
    const meterPerPc = meterPerPcBefore * (1 + waste / 100);
    publishResult({beforeKg,afterKg,orderQty:val('kp-order-qty',0),methodName:'Marker-based · verified inputs required',note:'Length per garment is derived from marker length ÷ garments per marker. Weight is an area × GSM estimate; confirm marker wastage treatment.',meterPerPc,orderMeter:meterPerPc*val('kp-order-qty',0),rows:[{name:'Marker fabric',kg:afterKg}]});
    showValidation([{type:'success',text:'Marker length per garment: ' + fmt(meterPerPc,4) + ' m, including the entered additional wastage.'},{type:'warning',text:'If marker length/consumption already includes cutting loss, set additional wastage to 0% to avoid double counting.'}]);
  }

  function calculatePantConsumption() {
    const qty = num('kp-order-qty');
    if (qty === null || qty <= 0 || !Number.isInteger(qty)) {
      resetSummary(); showValidation([{type:'error',text:'Order quantity must be a whole number greater than zero.'}]); return;
    }
    const selectedMethod = method();
    if (selectedMethod === 'quick') calculateQuick();
    else if (selectedMethod === 'components') calculateComponents();
    else calculateMarker();
  }

  function setMethodUI() {
    const selected = method();
    document.querySelectorAll('[data-method-card]').forEach(card => card.classList.toggle('is-selected', card.dataset.methodCard === selected));
    $('kp-quick-panel').hidden = selected !== 'quick';
    $('kp-components-panel').hidden = selected !== 'components';
    $('kp-marker-panel').hidden = selected !== 'marker';
    calculatePantConsumption();
  }

  function updateUnitLabels() {
    document.querySelectorAll('#page-knitpant .kp-unit-label').forEach(node => node.textContent = unitLabel());
  }

  function handleUnitChange() {
    const nextUnit = $('kp-unit').value;
    if (nextUnit !== currentUnit) {
      const factor = nextUnit === 'inch' ? (1 / 2.54) : 2.54;
      const ids = ['kp-il','kp-ila','kp-cfr','kp-cfra','kp-wbw','kp-wbwa','kp-htc','kp-htca','kp-marker-length','kp-marker-width'];
      ids.forEach(id => {
        const input = $(id);
        if (input && input.value.trim() !== '') {
          const n = Number(input.value);
          if (Number.isFinite(n)) input.value = (n * factor).toFixed(3).replace(/\.?0+$/, '');
        }
      });
      document.querySelectorAll('#kp-component-rows input[data-field="length"], #kp-component-rows input[data-field="width"]').forEach(input => {
        if (input.value.trim() !== '') {
          const n = Number(input.value);
          if (Number.isFinite(n)) input.value = (n * factor).toFixed(3).replace(/\.?0+$/, '');
        }
      });
      currentUnit = nextUnit;
    }
    updateUnitLabels();
    calculatePantConsumption();
  }

  function addCustomComponent() {
    customCount += 1;
    const key = 'custom-' + customCount;
    const label = document.createElement('label');
    label.innerHTML = '<input type="checkbox" checked value="' + key + '" data-name="Custom component ' + customCount + '"> Custom component ' + customCount + ' <small>Editable in the table</small>';
    $('kp-component-checks').appendChild(label);
    componentDefs[key] = {name:'Custom component ' + customCount,qty:1,length:0,width:0,gsm:val('kp-default-gsm',0),waste:5};
    renderComponentRows();
    calculatePantConsumption();
  }

  function loadDemo() {
    $('kp-buyer').value = 'Demo Buyer';
    $('kp-style').value = 'Basic Jogger Pant';
    $('kp-po').value = 'DEMO-001';
    $('kp-pant-type').value = 'Knit Jogger';
    $('kp-order-qty').value = 1000;
    $('kp-default-gsm').value = 280;
    $('kp-unit').value = 'cm';
    currentUnit = 'cm';
    $('kp-il').value = 75; $('kp-ila').value = 2;
    $('kp-cfr').value = 28; $('kp-cfra').value = 2;
    $('kp-wbw').value = 4; $('kp-wbwa').value = 1;
    $('kp-htc').value = 32; $('kp-htca').value = 2;
    $('kp-gsm').value = 280; $('kp-waste').value = 5;
    $('kp-marker-length').value = 650; $('kp-marker-width').value = 180; $('kp-marker-pcs').value = 10; $('kp-marker-gsm').value = 280; $('kp-marker-waste').value = 0;
    document.querySelectorAll('#kp-component-checks input[type="checkbox"]').forEach(cb => cb.checked = ['front','back','waistband','cuff','pocketbag'].includes(cb.value));
    renderComponentRows();
    updateUnitLabels();
    calculatePantConsumption();
  }

  function resetAll() {
    document.querySelectorAll('#page-knitpant input').forEach(input => {
      if (input.type === 'checkbox') input.checked = ['front','back','waistband'].includes(input.value);
      else if (input.type === 'radio') input.checked = input.value === 'quick';
      else if (input.id === 'kp-order-qty') input.value = '1000';
      else if (input.id === 'kp-waste' || input.id === 'kp-marker-waste') input.value = input.id === 'kp-waste' ? '5' : '0';
      else if (input.id === 'kp-marker-pcs') input.value = '1';
      else input.value = '';
    });
    ['kp-buyer','kp-style','kp-po'].forEach(id => $(id).value = '');
    $('kp-pant-type').value = 'Knit Pant';
    $('kp-unit').value = 'cm';
    currentUnit = 'cm';
    renderComponentRows();
    updateUnitLabels();
    setMethodUI();
  }

  function downloadKnitPantReport() {
    calculatePantConsumption();
    if (!lastResult) {
      alert('Please complete the required fields and calculate a valid result before exporting the report.');
      return;
    }
    const r = lastResult;
    const rowHtml = (r.rows || []).map(row => '<tr><td>' + escapeHtml(row.name) + '</td><td>' + fmt(row.kg,4) + ' kg/pc</td></tr>').join('');
    const report = '<div class="header"><h1>Pant Fabric Consumption Report</h1><div class="date">Generated: ' + new Date().toLocaleString() + '</div></div>' +
      '<div class="box"><div>Consumption per garment</div><div class="box-value">' + fmt(r.afterKg,4) + ' kg/pc</div><div>' + fmt(r.afterKg*12,3) + ' kg/dozen · ' + fmt(r.afterKg*r.orderQty,3) + ' kg/order</div></div>' +
      '<h2>Style information</h2><p>Buyer: ' + escapeHtml(r.buyer || '—') + ' | Style: ' + escapeHtml(r.style || '—') + ' | PO: ' + escapeHtml(r.po || '—') + '</p><p>Pant type: ' + escapeHtml(r.type) + ' | Order qty: ' + r.orderQty + ' pcs | Unit: ' + r.unit + '</p>' +
      '<h2>Calculation method</h2><p>' + escapeHtml(r.methodName) + '</p><p>' + escapeHtml(r.note) + '</p>' +
      '<h2>Result breakdown</h2><table><thead><tr><th>Component</th><th>Consumption</th></tr></thead><tbody>' + (rowHtml || '<tr><td>Overall estimate</td><td>' + fmt(r.afterKg,4) + ' kg/pc</td></tr>') + '</tbody></table>' +
      '<p>Before wastage: ' + fmt(r.beforeKg,4) + ' kg/pc | Wastage: ' + fmt(r.afterKg-r.beforeKg,4) + ' kg/pc</p>' +
      (r.meterPerPc !== null ? '<p>Length/garment: ' + fmt(r.meterPerPc,4) + ' m | Order length: ' + fmt(r.orderMeter,3) + ' m</p>' : '') +
      '<p><strong>Note:</strong> Consumption estimate only; costing excluded. Validate against approved pattern/marker and factory consumption.</p>';
    if (typeof generatePDF === 'function') generatePDF('Pant Fabric Consumption Report', report);
    else window.print();
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('input[name="kp-method"]').forEach(input => input.addEventListener('change', setMethodUI));
    $('kp-unit')?.addEventListener('change', handleUnitChange);
    $('kp-component-checks')?.addEventListener('change', event => {
      if (event.target.matches('input[type="checkbox"]')) { renderComponentRows(); calculatePantConsumption(); }
    });
    $('kp-add-component')?.addEventListener('click', addCustomComponent);
    $('kp-demo')?.addEventListener('click', loadDemo);
    $('kp-reset')?.addEventListener('click', resetAll);
    document.querySelectorAll('#page-knitpant input, #page-knitpant select').forEach(input => {
      if (!input.closest('#kp-component-rows') && input.id !== 'kp-unit' && input.id !== 'kp-pant-type' && input.id !== 'kp-buyer' && input.id !== 'kp-style' && input.id !== 'kp-po') input.addEventListener('input', calculatePantConsumption);
      if (['kp-pant-type','kp-buyer','kp-style','kp-po'].includes(input.id)) input.addEventListener('input', () => { if (lastResult) { lastResult.type = $('kp-pant-type').value; lastResult.buyer = $('kp-buyer').value; lastResult.style = $('kp-style').value; lastResult.po = $('kp-po').value; } });
    });
    renderComponentRows();
    updateUnitLabels();
    setMethodUI();
  });

  // Backward-compatible function names used by the existing app initializer.
  window.calcKnitPant = calculatePantConsumption;
  window.downloadKnitPantReport = downloadKnitPantReport;
})();
