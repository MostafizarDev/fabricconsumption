// ============================================
// UNIVERSAL PANT FABRIC CONSUMPTION
// Methods: Quick Estimate, Component-wise
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
      return '<tr data-component-row="' + escapeHtml(key) + '"><td colspan="2">' +
        '<div class="pant-component-card">' +
          '<div class="pant-component-card-head"><input class="pant-row-name" data-field="name" aria-label="Component name" value="' + escapeHtml(d.name) + '"><button type="button" class="pant-row-remove" data-remove-component="' + escapeHtml(key) + '" aria-label="Remove component">×</button></div>' +
          '<div class="pant-component-measure-grid">' +
            '<label class="pant-component-measure"><span>Length Measurements (<span class="kp-unit-label">CM</span>)</span><div class="pant-measure-pair"><input type="number" min="0" step="any" data-field="length" aria-label="Length" placeholder="e.g., 70" value="' + (d.length || '') + '"><span class="pant-measure-plus">+</span><input type="number" min="0" step="any" data-field="lengthAllowance" aria-label="Length allowance" placeholder="e.g., 6" value="' + (d.lengthAllowance ?? '') + '"><span class="pant-measure-equals">=</span><span class="pant-measure-total" data-field="lengthTotal">0.0 <span class="kp-unit-label">CM</span></span></div></label>' +
            '<label class="pant-component-measure"><span>Width Measurements (<span class="kp-unit-label">CM</span>)</span><div class="pant-measure-pair"><input type="number" min="0" step="any" data-field="width" aria-label="Width" placeholder="e.g., 32" value="' + (d.width || '') + '"><span class="pant-measure-plus">+</span><input type="number" min="0" step="any" data-field="widthAllowance" aria-label="Width allowance" placeholder="e.g., 2" value="' + (d.widthAllowance ?? '') + '"><span class="pant-measure-equals">=</span><span class="pant-measure-total" data-field="widthTotal">0.0 <span class="kp-unit-label">CM</span></span></div></label>' +
          '</div>' +
          '<div class="pant-component-meta-grid">' +
            '<label><span>Qty / pc</span><input type="number" min="0" step="1" data-field="qty" aria-label="Quantity per garment" value="' + (d.qty ?? 1) + '"></label>' +
            '<label><span>GSM</span><input type="number" min="0" step="any" data-field="gsm" aria-label="GSM" value="' + (d.gsm || val('kp-default-gsm', 0) || '') + '"></label>' +
            '<label><span>Waste %</span><input type="number" min="0" max="100" step="any" data-field="waste" aria-label="Wastage percent" value="' + (d.waste ?? 5) + '"></label>' +
            '<div class="pant-component-net"><span>Net kg/pc</span><strong class="pant-row-result" data-field="result">—</strong></div>' +
          '</div>' +
        '</div></td></tr>';
    }).join('');
    if (!selected.length) body.innerHTML = '<tr><td colspan="2" class="pant-no-rows">Select at least one component above.</td></tr>';
    body.querySelectorAll('input').forEach(input => input.addEventListener('input', () => {
      const row = input.closest('tr[data-component-row]');
      if (row && input.dataset.field === 'name') {
        const key = row.dataset.componentRow;
        if (componentDefs[key]) componentDefs[key].name = input.value.trim() || 'Component';
      }
      if (row) updateComponentMeasurementTotals(row);
      activateMethod('components');
      calculatePantConsumption();
    }));
    body.querySelectorAll('tr[data-component-row]').forEach(updateComponentMeasurementTotals);
    body.querySelectorAll('[data-remove-component]').forEach(button => button.addEventListener('click', () => {
      const key = button.dataset.removeComponent;
      const cb = document.querySelector('#kp-component-checks input[value="' + CSS.escape(key) + '"]');
      if (cb) cb.closest('label')?.remove();
      renderComponentRows();
      activateMethod('components');
      calculatePantConsumption();
    }));
  }

  function updateComponentMeasurementTotals(row) {
    const read = field => {
      const input = row.querySelector('[data-field="' + field + '"]');
      if (!input || input.value.trim() === '') return 0;
      const value = Number(input.value);
      return Number.isFinite(value) ? value : 0;
    };
    const unit = unitLabel().toUpperCase();
    const lengthTotal = row.querySelector('[data-field="lengthTotal"]');
    const widthTotal = row.querySelector('[data-field="widthTotal"]');
    if (lengthTotal) lengthTotal.innerHTML = fmt(read('length') + read('lengthAllowance'), 1) + ' <span class="kp-unit-label">' + unit + '</span>';
    if (widthTotal) widthTotal.innerHTML = fmt(read('width') + read('widthAllowance'), 1) + ' <span class="kp-unit-label">' + unit + '</span>';
  }

  function collectComponentRows() {
    return Array.from(document.querySelectorAll('#kp-component-rows tr[data-component-row]')).map(row => {
      const get = field => row.querySelector('[data-field="' + field + '"]');
      return {
        key: row.dataset.componentRow,
        name: get('name')?.value.trim() || 'Component',
        length: get('length')?.value.trim() === '' ? null : Number(get('length').value),
        lengthAllowance: get('lengthAllowance')?.value.trim() === '' ? 0 : Number(get('lengthAllowance').value),
        width: get('width')?.value.trim() === '' ? null : Number(get('width').value),
        widthAllowance: get('widthAllowance')?.value.trim() === '' ? 0 : Number(get('widthAllowance').value),
        qty: get('qty')?.value.trim() === '' ? null : Number(get('qty').value),
        gsm: get('gsm')?.value.trim() === '' ? null : Number(get('gsm').value),
        waste: get('waste')?.value.trim() === '' ? null : Number(get('waste').value),
        resultNode: get('result')
      };
    });
  }

  function resetSummary() {
    ['kp-r-pc','kp-r-pc-secondary','kp-r-dz','kp-r-order','kp-r-before','kp-r-waste','kp-r-meter','kp-r-order-meter'].forEach(id => setResultText(id, '—'));
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
    setResultText('kp-r-pc-secondary', fmt(afterKg, 4) + ' kg/pcs');
    setResultText('kp-r-dz', fmt(afterKg * 12, 3) + ' kg');
    setResultText('kp-r-order', fmt(afterKg * orderQty, 3) + ' kg');
    setResultText('kp-r-before', fmt(beforeKg, 4) + ' kg/pc');
    setResultText('kp-r-waste', fmt(wasteKg, 4) + ' kg/pc');
    setResultText('kp-summary-method', methodName);
    setResultText('kp-r-method', methodName);
    setResultText('kp-result-note', note);
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
      const vals = [row.length,row.lengthAllowance,row.width,row.widthAllowance,row.qty,row.gsm,row.waste];
      if (vals.some(x => x === null || !Number.isFinite(x)) || row.length <= 0 || row.width <= 0 || row.qty <= 0 || row.gsm <= 0 || row.waste < 0 || row.waste > 100) {
        errors.push(row.name + ': enter positive length, width, quantity and GSM; wastage must be 0–100%.');
        if (row.resultNode) row.resultNode.textContent = 'Check inputs';
        return;
      }
      const cutLength = (row.length + row.lengthAllowance) * f;
      const cutWidth = (row.width + row.widthAllowance) * f;
      const areaM2 = cutLength * cutWidth * row.qty / 10000;
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

  function calculatePantConsumption() {
    const qty = num('kp-order-qty');
    if (qty === null || qty <= 0 || !Number.isInteger(qty)) {
      resetSummary(); showValidation([{type:'error',text:'Order quantity must be a whole number greater than zero.'}]); return;
    }
    const selectedMethod = method();
    if (selectedMethod === 'quick') calculateQuick();
    else calculateComponents();
  }

  function setMethodUI() {
    // Both workflows stay visible on one page. The active calculation follows the section the user edits.
    calculatePantConsumption();
  }
  function activateMethod(value) {
    const radio = document.querySelector('input[name="kp-method"][value="' + value + '"]');
    if (radio) radio.checked = true;
  }

  function updateUnitLabels() {
    document.querySelectorAll('#page-knitpant .kp-unit-label').forEach(node => node.textContent = unitLabel());
  }

  function handleUnitChange() {
    const nextUnit = $('kp-unit').value;
    if (nextUnit !== currentUnit) {
      const factor = nextUnit === 'inch' ? (1 / 2.54) : 2.54;
      const ids = ['kp-il','kp-ila','kp-cfr','kp-cfra','kp-wbw','kp-wbwa','kp-htc','kp-htca'];
      ids.forEach(id => {
        const input = $(id);
        if (input && input.value.trim() !== '') {
          const n = Number(input.value);
          if (Number.isFinite(n)) input.value = (n * factor).toFixed(3).replace(/\.?0+$/, '');
        }
      });
      document.querySelectorAll('#kp-component-rows input[data-field="length"], #kp-component-rows input[data-field="lengthAllowance"], #kp-component-rows input[data-field="width"], #kp-component-rows input[data-field="widthAllowance"]').forEach(input => {
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

  function ensureComponentCheckbox(key, checked = true) {
    const checks = $('kp-component-checks');
    let checkbox = checks.querySelector('input[value="' + CSS.escape(key) + '"]');
    if (!checkbox) {
      const d = componentDefs[key];
      if (!d) return null;
      const label = document.createElement('label');
      label.innerHTML = '<input type="checkbox" value="' + escapeHtml(key) + '"> ' + escapeHtml(d.name);
      checks.appendChild(label);
      checkbox = label.querySelector('input');
    }
    checkbox.checked = checked;
    return checkbox;
  }

  function addComponentByKey(key) {
    const existing = $('kp-component-checks').querySelector('input[value="' + CSS.escape(key) + '"]');
    if (existing) {
      existing.checked = true;
    } else {
      ensureComponentCheckbox(key, true);
    }
    activateMethod('components');
    renderComponentRows();
    calculatePantConsumption();
  }

  function addCustomComponent() {
    customCount += 1;
    const key = 'custom-' + customCount;
    componentDefs[key] = {name:'Custom component ' + customCount,qty:1,length:0,width:0,gsm:val('kp-default-gsm',0),waste:5};
    ensureComponentCheckbox(key, true);
    activateMethod('components');
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
    document.querySelectorAll('#kp-component-checks input[type="checkbox"]').forEach(cb => {
      if (!['front','back','waistband'].includes(cb.value) && !cb.value.startsWith('custom-')) cb.closest('label')?.remove();
      else cb.checked = ['front','back','waistband'].includes(cb.value);
    });
    ['cuff','pocketbag'].forEach(key => ensureComponentCheckbox(key, true));
    renderComponentRows();
    updateUnitLabels();
    calculatePantConsumption();
  }

  function resetAll() {
    document.querySelectorAll('#page-knitpant input').forEach(input => {
      if (input.type === 'checkbox') input.checked = ['front','back','waistband'].includes(input.value);
      else if (input.type === 'radio') input.checked = input.value === 'quick';
      else if (input.id === 'kp-order-qty') input.value = '1000';
      else if (input.id === 'kp-waste') input.value = '5';
      else input.value = '';
    });
    ['kp-buyer','kp-style','kp-po'].forEach(id => $(id).value = '');
    $('kp-pant-type').value = 'Knit Pant';
    document.querySelectorAll('#kp-component-checks input[type="checkbox"]').forEach(cb => {
      if (!['front','back','waistband'].includes(cb.value)) cb.closest('label')?.remove();
    });
    activateMethod('quick');
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
    document.querySelectorAll('[data-pant-unit]').forEach(button => button.addEventListener('click', () => {
      if ($('kp-unit').value === button.dataset.pantUnit) return;
      $('kp-unit').value = button.dataset.pantUnit;
      document.querySelectorAll('[data-pant-unit]').forEach(item => item.classList.toggle('active', item === button));
      handleUnitChange();
    }));
    $('kp-pant-type')?.addEventListener('change', () => {
      const type = $('kp-pant-type').value;
      let preset = ['front','back','waistband'];
      if (type.includes('Jogger')) preset = preset.concat(['cuff']);
      if (type.includes('Woven')) preset = preset.concat(['sidepocket','fly']);
      document.querySelectorAll('#kp-component-checks input[type="checkbox"]').forEach(cb => {
        if (!['front','back','waistband'].includes(cb.value) && !cb.value.startsWith('custom-')) cb.closest('label')?.remove();
        else if (!cb.value.startsWith('custom-')) cb.checked = false;
      });
      preset.forEach(key => ensureComponentCheckbox(key, true));
      renderComponentRows();
      activateMethod('components');
      calculatePantConsumption();
    });
    $('kp-component-checks')?.addEventListener('change', event => {
      if (event.target.matches('input[type="checkbox"]')) {
        activateMethod('components');
        renderComponentRows();
        calculatePantConsumption();
      }
    });
    $('kp-add-component')?.addEventListener('click', () => {
      const key = $('kp-add-component-select').value;
      if (key === 'custom') addCustomComponent();
      else addComponentByKey(key);
    });
    $('kp-demo')?.addEventListener('click', loadDemo);
    $('kp-reset')?.addEventListener('click', resetAll);
    document.querySelectorAll('#page-knitpant input, #page-knitpant select').forEach(input => {
      if (!input.closest('#kp-component-rows') && input.id !== 'kp-unit' && input.id !== 'kp-pant-type' && input.id !== 'kp-buyer' && input.id !== 'kp-style' && input.id !== 'kp-po' && input.name !== 'kp-method' && input.id !== 'kp-add-component-select') input.addEventListener('input', () => {
        if (input.closest('#kp-quick-panel')) activateMethod('quick');
        calculatePantConsumption();
      });
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
