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

  function renderSelectedComponentChips() {
    const container = $('kp-selected-components');
    if (!container) return;
    const selected = Array.from(document.querySelectorAll('#kp-component-checks input[type="checkbox"]:checked'));
    container.innerHTML = selected.map(check => {
      const d = componentDefs[check.value] || { name: check.dataset.name || 'Custom component' };
      return '<div class="kp-selected-component" data-selected-component="' + escapeHtml(check.value) + '"><span class="kp-selected-check" aria-hidden="true">✓</span><span class="kp-selected-name">' + escapeHtml(d.name) + '</span><button type="button" class="kp-selected-remove" data-remove-selected-component="' + escapeHtml(check.value) + '" aria-label="Remove ' + escapeHtml(d.name) + '" title="Remove component">×</button></div>';
    }).join('');
    container.querySelectorAll('[data-remove-selected-component]').forEach(button => button.addEventListener('click', () => {
      const key = button.dataset.removeSelectedComponent;
      const cb = document.querySelector('#kp-component-checks input[value="' + CSS.escape(key) + '"]');
      if (cb) cb.checked = false;
      renderComponentRows();
      activateMethod('components');
      calculatePantConsumption();
    }));
    const select = $('kp-add-component-select');
    if (select) {
      Array.from(select.options).forEach(option => {
        if (option.value) option.disabled = selected.some(cb => cb.value === option.value);
      });
      if (select.value && selected.some(cb => cb.value === select.value)) select.value = '';
    }
  }

  function renderComponentRows() {
    renderSelectedComponentChips();
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

          '</div>' +
        '</div></td></tr>';
    }).join('');
    if (!selected.length) body.innerHTML = '<tr><td colspan="2" class="pant-no-rows">Select components above to add measurements.</td></tr>';
    body.querySelectorAll('input').forEach(input => input.addEventListener('input', () => {
      const row = input.closest('tr[data-component-row]');
      if (row && input.dataset.field === 'name') {
        const key = row.dataset.componentRow;
        if (componentDefs[key]) componentDefs[key].name = input.value.trim() || 'Component';
        renderSelectedComponentChips();
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

  function updateKnitGarmentStyleSummary(rows, orderQty, beforeKg, methodName) {
    const container = $('kp-summary-components');
    if (!container) return;
    if (methodName && methodName.startsWith('Quick')) { container.innerHTML = ''; return; }
    const esc = value => escapeHtml(String(value || 'Component'));
    const list = rows || [];
    container.innerHTML = list.map(row => {
      const hasResult = Number.isFinite(Number(row.kg)) && row.kg !== null && row.kg !== '';
      const perPc = hasResult ? Number(row.kg) : (Number(row.finalKg) || 0);
      const totalOrderKg = perPc * (Number(orderQty) || 0);
      const valueText = hasResult || row.finalKg != null
        ? fmt(totalOrderKg,3) + ' kg/qty | ' + fmt(perPc,3) + ' kg/pcs'
        : '— kg/qty | — kg/pcs';
      return '<div class="pant-kg-component-row"><span class="pant-kg-component-name">' + esc(row.name) + '</span><strong>' + valueText + '</strong></div>';
    }).join('');
  }
  function resetSummary() {
    ['kp-r-pc','kp-r-pc-secondary','kp-r-dz','kp-r-order','kp-r-before','kp-r-waste','kp-r-meter','kp-r-order-meter'].forEach(id => setResultText(id, '—'));
    setResultText('kp-summary-method', 'Awaiting valid inputs');
    setResultText('kp-r-method', '—');
    setResultText('kp-result-note', 'Enter the required data to calculate. Incomplete inputs will not produce a confirmed result.');
    const breakdown = $('kp-breakdown-list');
    if (breakdown) breakdown.innerHTML = '<p class="pant-empty">No calculated components yet.</p>';
    lastResult = null;
    const selectedRows = collectComponentRows().map(row => ({name: row.name}));
    updateKnitGarmentStyleSummary(selectedRows, val('kp-order-qty', 0), 0, method() === 'quick' ? 'Quick Estimate' : 'Component-wise');
  }

  function publishResult({ beforeKg, afterKg, orderQty, methodName, note, meterPerPc = null, orderMeter = null, rows = [] }) {
    const wasteKg = afterKg - beforeKg;
    setResultText('kp-r-pc', fmt(afterKg, 4) + ' kg');
    setResultText('kp-r-pc-secondary', fmt(afterKg, 4) + ' kg/pcs');
    setResultText('kp-r-dz', fmt(afterKg * 12, 3) + ' kg');
    setResultText('kp-r-order', fmt(afterKg * orderQty, 3) + ' kg');
    setResultText('kp-r-before', fmt(beforeKg * orderQty, 3) + ' kg');
    setResultText('kp-r-waste', fmt(afterKg * orderQty, 3) + ' kg');
    updateKnitGarmentStyleSummary(rows, orderQty, beforeKg, methodName);
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
      if (!cb.value.startsWith('custom-')) cb.checked = false;
      else cb.checked = false;
    });
    ['front','back','waistband','cuff','pocketbag'].forEach(key => ensureComponentCheckbox(key, true));
    renderComponentRows();
    updateUnitLabels();
    calculatePantConsumption();
  }

  function resetAll() {
    document.querySelectorAll('#page-knitpant input').forEach(input => {
      if (input.type === 'checkbox') input.checked = false;
      else if (input.type === 'radio') input.checked = input.value === 'quick';
      else if (input.id === 'kp-order-qty') input.value = '1000';
      else if (input.id === 'kp-waste') input.value = '5';
      else input.value = '';
    });
    ['kp-buyer','kp-style','kp-po'].forEach(id => $(id).value = '');
    $('kp-pant-type').value = 'Knit Pant';
    document.querySelectorAll('#kp-component-checks input[type="checkbox"]').forEach(cb => {
      if (!cb.value.startsWith('custom-')) cb.checked = false;
    });
    activateMethod('quick');
    $('kp-unit').value = 'cm';
    currentUnit = 'cm';
    renderComponentRows();
    updateUnitLabels();
    setMethodUI();
  }


  const KP_RECENT_KEY = 'fabricConsumption.knitPantRecent.v1';
  let kpDemoSnapshot = null;
  function kpCaptureState() {
    const values = {};
    document.querySelectorAll('#page-knitpant input, #page-knitpant select').forEach(el => {
      if (el.type === 'checkbox') values[el.id || ('check:' + el.value)] = el.checked;
      else if (el.type !== 'radio' && !el.closest('#kp-component-rows')) values[el.id] = el.value;
    });
    const selected = Array.from(document.querySelectorAll('#kp-component-checks input[type="checkbox"]:checked')).map(cb => cb.value);
    const rows = {};
    document.querySelectorAll('#kp-component-rows tr[data-component-row]').forEach(row => {
      const item = {};
      row.querySelectorAll('[data-field]').forEach(el => { if (el.dataset.field !== 'result' && !el.dataset.field.endsWith('Total')) item[el.dataset.field] = el.value; });
      rows[row.dataset.componentRow] = item;
    });
    const defs = {};
    selected.forEach(key => { if (componentDefs[key]) defs[key] = {...componentDefs[key]}; });
    return { values, selected, rows, defs, method: method(), unit: $('kp-unit').value, savedAt: new Date().toISOString() };
  }
  function kpApplyState(state) {
    if (!state) return;
    Object.keys(state.values || {}).forEach(id => {
      if (id.startsWith('check:')) return;
      const el = $(id);
      if (el && !el.closest('#kp-component-rows') && el.type !== 'checkbox') el.value = state.values[id];
    });
    if (state.defs) Object.keys(state.defs).forEach(key => { componentDefs[key] = {...state.defs[key]}; });
    document.querySelectorAll('#kp-component-checks input[type="checkbox"]').forEach(cb => {
      if (cb.value.startsWith('custom-') && !(state.selected || []).includes(cb.value)) cb.closest('label')?.remove();
    });
    (state.selected || []).forEach(key => {
      if (!document.querySelector('#kp-component-checks input[value="' + CSS.escape(key) + '"]')) ensureComponentCheckbox(key, true);
    });
    document.querySelectorAll('#kp-component-checks input[type="checkbox"]').forEach(cb => { cb.checked = (state.selected || []).includes(cb.value); });
    $('kp-unit').value = state.unit || 'cm';
    currentUnit = $('kp-unit').value;
    document.querySelectorAll('[data-pant-unit]').forEach(btn => btn.classList.toggle('active', btn.dataset.pantUnit === currentUnit));
    const methodRadio = document.querySelector('input[name="kp-method"][value="' + (state.method || 'quick') + '"]');
    if (methodRadio) methodRadio.checked = true;
    renderComponentRows();
    Object.keys(state.rows || {}).forEach(key => {
      const row = document.querySelector('#kp-component-rows tr[data-component-row="' + CSS.escape(key) + '"]');
      if (!row) return;
      Object.keys(state.rows[key]).forEach(field => { const el = row.querySelector('[data-field="' + field + '"]'); if (el) el.value = state.rows[key][field]; });
    });
    updateUnitLabels(); setMethodUI(); calculatePantConsumption();
  }
  function kpReadRecent() { try { const x = JSON.parse(localStorage.getItem(KP_RECENT_KEY) || '[]'); return Array.isArray(x) ? x : []; } catch (_) { return []; } }
  function kpSaveRecent(showPanel = false) {
    const state = kpCaptureState(), v = state.values || {};
    const item = { id:'pant-' + Date.now(), title:(v['kp-style'] || 'Untitled Style').trim(), buyer:(v['kp-buyer'] || '').trim(), po:(v['kp-po'] || '').trim(), type:v['kp-pant-type'] || '', qty:v['kp-order-qty'] || '', state };
    const list = [item, ...kpReadRecent()].slice(0,5);
    try { localStorage.setItem(KP_RECENT_KEY, JSON.stringify(list)); } catch (_) { alert('Could not save Recent calculations. Browser storage may be full or disabled.'); return; }
    kpRenderRecent(); if (showPanel) $('kp-recent-panel').hidden = false;
  }
  function kpRenderRecent() {
    const panel = $('kp-recent-panel'); if (!panel) return;
    const esc = s => String(s || '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
    const list = kpReadRecent();
    panel.innerHTML = '<div class="knit-recent-head"><span>Recent Calculations · Last 5</span><button type="button" class="knit-recent-load" id="kp-save-current">Save Current</button></div>' +
      (list.length ? list.map(x => '<div class="knit-recent-item"><div class="knit-recent-info"><strong>'+esc(x.title || 'Untitled Style')+(x.type?' · '+esc(x.type):'')+'</strong><small>'+(x.buyer?esc(x.buyer)+' · ':'')+esc(x.po?'PO: '+x.po:'No PO')+' · '+esc(x.qty?x.qty+' pcs':'Quantity not set')+' · '+esc(x.state?.savedAt?new Date(x.state.savedAt).toLocaleString():'Saved')+'</small></div><div class="knit-recent-actions"><button type="button" class="knit-recent-load" data-load-kp-recent="'+esc(x.id)+'">Load</button><button type="button" class="knit-recent-delete" data-delete-kp-recent="'+esc(x.id)+'" title="Remove from Recent">×</button></div></div>').join(''):'<div class="knit-recent-empty">No saved calculations yet. Click “Save Current” to keep this calculation.</div>');
    $('kp-save-current')?.addEventListener('click',()=>kpSaveRecent(true));
    panel.querySelectorAll('[data-load-kp-recent]').forEach(btn=>btn.addEventListener('click',()=>{const x=kpReadRecent().find(y=>y.id===btn.dataset.loadKpRecent);if(x){kpApplyState(x.state);panel.hidden=true;$('kp-recent-open')?.classList.remove('is-active')}}));
    panel.querySelectorAll('[data-delete-kp-recent]').forEach(btn=>btn.addEventListener('click',()=>{try{localStorage.setItem(KP_RECENT_KEY,JSON.stringify(kpReadRecent().filter(x=>x.id!==btn.dataset.deleteKpRecent)));kpRenderRecent()}catch(_){alert('Could not update Recent calculations.')}}));
  }
  function kpOpenReportModal() {
    $('kp-report-buyer').value=$('kp-buyer').value; $('kp-report-style').value=$('kp-style').value; $('kp-report-po').value=$('kp-po').value; $('kp-report-type').value=$('kp-pant-type').value; $('kp-report-modal').hidden=false;
  }
  function kpCloseReportModal() { $('kp-report-modal').hidden=true; }
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
      // Changing pant type does not auto-add components; the user chooses what applies.
      document.querySelectorAll('#kp-component-checks input[type="checkbox"]').forEach(cb => {
        if (!cb.value.startsWith('custom-')) cb.checked = false;
      });
      renderComponentRows();
      calculatePantConsumption();
    });
    $('kp-component-checks')?.addEventListener('change', event => {
      if (event.target.matches('input[type="checkbox"]')) {
        activateMethod('components');
        renderComponentRows();
        calculatePantConsumption();
      }
    });
    $('kp-confirm-add-component')?.addEventListener('click', () => {
      const select = $('kp-add-component-select');
      const key = select?.value;
      if (!key) return;
      addComponentByKey(key);
      select.value = '';
    });
    $('kp-add-component')?.addEventListener('click', () => addCustomComponent());
    $('kp-demo')?.addEventListener('click', () => {
      const btn=$('kp-demo'), active=btn.getAttribute('aria-pressed')==='true';
      if(active){if(kpDemoSnapshot)kpApplyState(kpDemoSnapshot);kpDemoSnapshot=null;btn.setAttribute('aria-pressed','false');btn.classList.remove('is-active')}
      else{kpDemoSnapshot=kpCaptureState();loadDemo();btn.setAttribute('aria-pressed','true');btn.classList.add('is-active')}
    });
    $('kp-reset')?.addEventListener('click',()=>{resetAll();kpDemoSnapshot=null;$('kp-demo')?.setAttribute('aria-pressed','false');$('kp-demo')?.classList.remove('is-active')});
    $('kp-recent-open')?.addEventListener('click',()=>{const panel=$('kp-recent-panel'),opening=panel.hidden;kpRenderRecent();panel.hidden=!opening;$('kp-recent-open').classList.toggle('is-active',opening);$('kp-recent-open').setAttribute('aria-expanded',String(opening))});
    $('kp-report-settings')?.addEventListener('click',kpOpenReportModal);
    document.querySelectorAll('[data-close-kp-modal]').forEach(el=>el.addEventListener('click',kpCloseReportModal));
    $('kp-report-save')?.addEventListener('click',()=>{
      $('kp-buyer').value=$('kp-report-buyer').value;$('kp-style').value=$('kp-report-style').value;$('kp-po').value=$('kp-report-po').value;
      const type=$('kp-report-type').value.trim();
      if(type&&!Array.from($('kp-pant-type').options).some(o=>o.value===type)){const option=document.createElement('option');option.value=type;option.textContent=type;$('kp-pant-type').appendChild(option)}
      if(type)$('kp-pant-type').value=type;
      if(lastResult){lastResult.buyer=$('kp-buyer').value;lastResult.style=$('kp-style').value;lastResult.po=$('kp-po').value;lastResult.type=$('kp-pant-type').value}
      kpCloseReportModal();
    });
    $('btn-pdf-knitpant')?.addEventListener('click',()=>{kpSaveRecent(false);downloadKnitPantReport()});
    kpRenderRecent();
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
