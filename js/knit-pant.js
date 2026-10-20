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
  let showDemoValues = false;
  const KP_REPORT_INFO_KEY = 'fc-knit-pant-report-info-v1';
  function kpReadReportInfo() {
    try {
      const data = JSON.parse(localStorage.getItem(KP_REPORT_INFO_KEY) || '{}');
      return data && typeof data === 'object' ? { buyer: String(data.buyer || ''), style: String(data.style || ''), po: String(data.po || ''), type: String(data.type || '') } : { buyer:'', style:'', po:'', type:'' };
    } catch (_) { return { buyer:'', style:'', po:'', type:'' }; }
  }
  function kpWriteReportInfo(info) {
    try { localStorage.setItem(KP_REPORT_INFO_KEY, JSON.stringify(info)); return true; }
    catch (_) { alert('Could not save Report Information. Please check browser storage settings.'); return false; }
  }

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
  function unitLabel() { return $('kp-unit')?.value === 'inch' ? 'inch' : 'cm'; }
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
            '<label class="pant-component-measure"><span>Length Measurements (<span class="kp-unit-label">CM</span>)</span><div class="pant-measure-pair"><input type="number" min="0" step="any" data-field="length" aria-label="Length" placeholder="e.g., 70" value="' + (showDemoValues ? (d.length ?? '') : '') + '"><span class="pant-measure-plus">+</span><input type="number" min="0" step="any" data-field="lengthAllowance" aria-label="Length allowance" placeholder="e.g., 6" value="' + (showDemoValues ? (d.lengthAllowance ?? 0) : '') + '"><span class="pant-measure-equals">=</span><span class="pant-measure-total" data-field="lengthTotal">0.0 <span class="kp-unit-label">CM</span></span></div></label>' +
            '<label class="pant-component-measure"><span>Width Measurements (<span class="kp-unit-label">CM</span>)</span><div class="pant-measure-pair"><input type="number" min="0" step="any" data-field="width" aria-label="Width" placeholder="e.g., 32" value="' + (showDemoValues ? (d.width ?? '') : '') + '"><span class="pant-measure-plus">+</span><input type="number" min="0" step="any" data-field="widthAllowance" aria-label="Width allowance" placeholder="e.g., 2" value="' + (showDemoValues ? (d.widthAllowance ?? 0) : '') + '"><span class="pant-measure-equals">=</span><span class="pant-measure-total" data-field="widthTotal">0.0 <span class="kp-unit-label">CM</span></span></div></label>' +
          '</div>' +
          '<div class="pant-component-meta-grid">' +
            '<label><span>Qty / pc</span><input type="number" min="0" step="1" data-field="qty" aria-label="Quantity per garment" placeholder="e.g., 2" value="' + (showDemoValues ? (d.qty ?? 1) : '') + '"></label>' +
            '<label><span>GSM</span><input type="number" min="0" step="any" data-field="gsm" aria-label="GSM" placeholder="e.g., 280" value="' + (showDemoValues ? (d.gsm || val('kp-default-gsm', 0) || '') : '') + '"></label>' +
            '<label><span>Waste %</span><input type="number" min="0" max="100" step="any" data-field="waste" aria-label="Wastage percent" placeholder="e.g., 5" value="' + (showDemoValues ? (d.waste ?? 5) : '') + '"></label>' +

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
    const esc = value => escapeHtml(String(value || 'Component'));
    const list = rows || [];

    // Show the always-visible Pant Measurements calculation first, like the Body row in Knit Garments.
    // This is a reference estimate; it is not added to component-wise totals.
    const required = ['kp-il','kp-cfr','kp-wbw','kp-htc','kp-gsm'];
    const valuesValid = required.every(id => num(id) !== null && num(id) > 0);
    const waste = num('kp-waste');
    const qty = Number(orderQty) || 0;
    let pantMeasurementText = '— kg/qty | — kg/pcs';
    if (valuesValid && waste !== null && waste >= 0 && waste <= 100 && qty > 0) {
      const f = unitFactorToCm();
      const inseam = (val('kp-il') + val('kp-ila')) * f;
      const rise = (val('kp-cfr') + val('kp-cfra')) * f;
      const waistband = (val('kp-wbw') + val('kp-wbwa')) * f;
      const thigh = (val('kp-htc') + val('kp-htca')) * f;
      const perPc = ((inseam + rise + waistband) * thigh * 4 * val('kp-gsm') / 10000000) * (1 + waste / 100);
      pantMeasurementText = fmt(perPc * qty,3) + ' kg/qty | ' + fmt(perPc,3) + ' kg/pcs';
    }
    const pantRow = '<div class="pant-kg-component-row pant-kg-pant-measurement-row"><span class="pant-kg-component-name">Main Body </span><strong>' + pantMeasurementText + '</strong></div>';
    const componentRows = list.map(row => {
      const hasResult = Number.isFinite(Number(row.kg)) && row.kg !== null && row.kg !== '';
      const perPc = hasResult ? Number(row.kg) : (Number(row.finalKg) || 0);
      const totalOrderKg = perPc * qty;
      const valueText = hasResult || row.finalKg != null
        ? fmt(totalOrderKg,3) + ' kg/qty | ' + fmt(perPc,3) + ' kg/pcs'
        : '— kg/qty | — kg/pcs';
      return '<div class="pant-kg-component-row"><span class="pant-kg-component-name">' + esc(row.name) + '</span><strong>' + valueText + '</strong></div>';
    }).join('');
    container.innerHTML = pantRow + componentRows;
  }
  function resetSummary() {
    ['kp-r-pc','kp-r-pc-secondary','kp-r-dz','kp-r-order','kp-r-before','kp-r-waste','kp-r-meter','kp-r-order-meter'].forEach(id => setResultText(id, '—'));
    setResultText('kp-summary-method', 'Awaiting valid inputs');
    setResultText('kp-r-method', '—');
    setResultText('kp-result-note', 'Enter the required data to calculate. Incomplete inputs will not produce a confirmed result.');
    const breakdown = $('kp-breakdown-list');
    if (breakdown) breakdown.innerHTML = '<div class="kg-group-totals-empty">No calculated components yet.</div>';
    setResultText('kp-breakdown-count', '0 components');
    lastResult = null;
    const selectedRows = collectComponentRows().map(row => ({name: row.name}));
    updateKnitGarmentStyleSummary(selectedRows, val('kp-order-qty', 0), 0, method() === 'quick' ? 'Quick Estimate' : 'Component-wise');
  }

  function getMainBodyKgPerPiece() {
    const required = ['kp-il','kp-cfr','kp-wbw','kp-htc','kp-gsm'];
    if (!required.every(id => num(id) !== null && num(id) > 0)) return 0;
    const waste = num('kp-waste');
    if (waste === null || waste < 0 || waste > 100) return 0;
    const f = unitFactorToCm();
    const inseam = (val('kp-il') + val('kp-ila')) * f;
    const rise = (val('kp-cfr') + val('kp-cfra')) * f;
    const waistband = (val('kp-wbw') + val('kp-wbwa')) * f;
    const thigh = (val('kp-htc') + val('kp-htca')) * f;
    return ((inseam + rise + waistband) * thigh * 4 * val('kp-gsm') / 10000000) * (1 + waste / 100);
  }

  function publishResult({ beforeKg, afterKg, orderQty, methodName, note, meterPerPc = null, orderMeter = null, rows = [] }) {
    const isComponentWise = methodName.startsWith('Component-wise');
    const mainBodyKg = isComponentWise ? getMainBodyKgPerPiece() : 0;
    const totalPerPiece = afterKg + mainBodyKg;
    const totalOrderKg = totalPerPiece * orderQty;
    setResultText('kp-r-pc', fmt(totalOrderKg, 4) + ' kg');
    setResultText('kp-r-pc-secondary', fmt(totalPerPiece, 4) + ' kg/pcs');
    setResultText('kp-r-dz', fmt(totalPerPiece * 12, 3) + ' kg');
    setResultText('kp-r-order', fmt(totalOrderKg, 3) + ' kg');
    setResultText('kp-r-before', fmt((beforeKg + mainBodyKg / (1 + (val('kp-waste') / 100))) * orderQty, 3) + ' kg');
    setResultText('kp-r-waste', fmt(totalOrderKg, 3) + ' kg');
    updateKnitGarmentStyleSummary(rows, orderQty, beforeKg, methodName);
    setResultText('kp-summary-method', methodName);
    setResultText('kp-r-method', methodName);
    setResultText('kp-result-note', note);
    if (typeof window.updatePantGroupTotals === 'function') {
      window.updatePantGroupTotals({ qty: orderQty, rows: rows || [] });
    }
    lastResult = { beforeKg, afterKg, orderQty, methodName, note, meterPerPc, orderMeter, rows, unit: unitLabel(), type: kpReadReportInfo().type || $('kp-pant-type')?.value || $('kp-report-type')?.value || 'Knit Pant', buyer: kpReadReportInfo().buyer || $('kp-buyer')?.value || $('kp-report-buyer')?.value || '', style: kpReadReportInfo().style || $('kp-style')?.value || $('kp-report-style')?.value || '', po: kpReadReportInfo().po || $('kp-po')?.value || $('kp-report-po')?.value || '' };
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
      results.push({key:row.key,name:row.name,kg:finalKg,areaM2,netKg,finalKg,wasteKg:finalKg-netKg});
      if (row.resultNode) row.resultNode.textContent = fmt(finalKg,4);
    });
    if (errors.length) {
      resetSummary();
      showValidation(errors.map(text => ({type:'error',text})).concat([{type:'info',text:'No final total is shown until every selected component has valid inputs.'}]));
      return;
    }
    publishResult({beforeKg,afterKg,orderQty:val('kp-order-qty',0),methodName:'Component-wise · panel area',note:'',rows:results});
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
    updateInseamTotal();
    updatePantMeasurementTotals();
  }

  function updateInseamTotal() {
    const length = Number($('kp-il')?.value || 0);
    const allowance = Number($('kp-ila')?.value || 0);
    const total = $('kp-inseam-total');
    if (total) total.innerHTML = fmt(length + allowance, 1) + ' <span class="kp-unit-label">' + unitLabel() + '</span>';
  }

  function updatePantMeasurementTotals() {
    [
      ['kp-cfr', 'kp-cfra', 'kp-rise-total'],
      ['kp-wbw', 'kp-wbwa', 'kp-waistband-total'],
      ['kp-htc', 'kp-htca', 'kp-thigh-total']
    ].forEach(([baseId, allowanceId, totalId]) => {
      const base = Number($(baseId)?.value || 0);
      const allowance = Number($(allowanceId)?.value || 0);
      const total = $(totalId);
      if (total) total.innerHTML = fmt(base + allowance, 1) + ' <span class="kp-unit-label">' + unitLabel() + '</span>';
    });
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
    // "Custom panel" is an add-new action, not a single reusable component.
    // Each click creates another independently editable custom panel.
    if (key === 'other') {
      addCustomComponent();
      return;
    }
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
    componentDefs[key] = {name:'Custom panel ' + customCount,qty:1,length:0,width:0,gsm:val('kp-default-gsm',0),waste:5};
    ensureComponentCheckbox(key, true);
    activateMethod('components');
    renderComponentRows();
    calculatePantConsumption();
  }

  function loadDemo() {
    showDemoValues = true;
    // Use only IDs that exist in the current Knit Pant UI.
    const setValue = (id, value) => {
      const el = $(id);
      if (el) el.value = value;
    };
    setValue('kp-report-buyer', 'Demo Buyer');
    setValue('kp-report-style', 'Basic Jogger Pant');
    setValue('kp-report-po', 'DEMO-001');
    setValue('kp-report-type', 'Knit Jogger');
    setValue('kp-gsm', 280);
    setValue('kp-unit', 'cm');
    currentUnit = 'cm';
    setValue('kp-il', 75); setValue('kp-ila', 2);
    setValue('kp-cfr', 28); setValue('kp-cfra', 2);
    setValue('kp-wbw', 4); setValue('kp-wbwa', 1);
    setValue('kp-htc', 32); setValue('kp-htca', 2);
    setValue('kp-waste', 5);
    document.querySelectorAll('#kp-component-checks input[type="checkbox"]').forEach(cb => {
      cb.checked = false;
    });
    ['front','back','waistband','cuff','pocketbag'].forEach(key => ensureComponentCheckbox(key, true));
    // Demo should expose the prefilled component measurement cards, like Knit Garments.
    activateMethod('components');
    renderComponentRows();
    updateUnitLabels();
    calculatePantConsumption();
  }

  function resetAll() {
    showDemoValues = false;
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
    const reportInfo = kpReadReportInfo();
    const item = { id:'pant-' + Date.now(), title:(reportInfo.style || v['kp-style'] || 'Untitled Style').trim(), buyer:(reportInfo.buyer || v['kp-buyer'] || '').trim(), po:(reportInfo.po || v['kp-po'] || '').trim(), type:reportInfo.type || v['kp-pant-type'] || '', qty:v['kp-order-qty'] || '', state };
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
    const modal = $('kp-report-modal');
    if (!modal) return;
    const copyValue = (fromId, toId) => {
      const from = $(fromId), to = $(toId);
      if (from && to) to.value = from.value || '';
    };
    const saved = kpReadReportInfo();
    const hasSaved = Boolean(saved.buyer || saved.style || saved.po || saved.type);
    if (hasSaved) {
      $('kp-report-buyer').value = saved.buyer;
      $('kp-report-style').value = saved.style;
      $('kp-report-po').value = saved.po;
      $('kp-report-type').value = saved.type;
    } else {
      copyValue('kp-buyer', 'kp-report-buyer');
      copyValue('kp-style', 'kp-report-style');
      copyValue('kp-po', 'kp-report-po');
      copyValue('kp-pant-type', 'kp-report-type');
    }
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
  }
  function kpCloseReportModal() {
    const modal = $('kp-report-modal');
    if (!modal) return;
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
  }
  function downloadKnitPantReport() {
    calculatePantConsumption();
    if (!lastResult) {
      alert('Please complete the required fields and calculate a valid result before exporting the report.');
      return;
    }
    const r = lastResult;
    const now = new Date();
    const dateText = now.toLocaleDateString('en-GB', {day:'2-digit',month:'short',year:'numeric'});
    const timeText = now.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
    const reportId = 'FC-PANT-' + now.getFullYear() + String(now.getMonth()+1).padStart(2,'0') + String(now.getDate()).padStart(2,'0') + '-' + String(now.getHours()).padStart(2,'0') + String(now.getMinutes()).padStart(2,'0');
    const reportIcon = name => {
      const icons = {
        info:'<svg class="report-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"></circle><path d="M12 10v6M12 7h.01"></path></svg>',
        components:'<svg class="report-icon" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect><rect x="14" y="14" width="7" height="7" rx="1"></rect></svg>',
        summary:'<svg class="report-icon" viewBox="0 0 24 24"><path d="M4 19V5M4 19h17"></path><path d="m7 15 4-4 3 2 6-7"></path></svg>',
        warning:'<svg class="report-icon" viewBox="0 0 24 24"><path d="M12 3 2.5 20h19z"></path><path d="M12 9v5M12 17h.01"></path></svg>',
        file:'<svg class="report-icon" viewBox="0 0 24 24"><path d="M6 3h9l4 4v14H6z"></path><path d="M15 3v5h5M9 13h6M9 17h6"></path></svg>'
      };
      return icons[name] || icons.file;
    };
    const rows = (r.rows || []).map((row,i) => {
      const name = escapeHtml(row.name || ('Component ' + (i+1)));
      const kg = Number(row.kg) || 0;
      return '<tr><td>'+(i+1)+'</td><td><strong>'+name+'</strong></td><td>'+fmt(kg,4)+' kg/pc</td><td>'+fmt(kg*12,3)+' kg/dz</td><td>'+fmt(kg*r.orderQty,3)+' kg</td><td>—</td></tr>';
    }).join('');
    const beforeOrder = r.beforeKg * r.orderQty;
    const wastageOrder = Math.max(0, r.afterKg-r.beforeKg) * r.orderQty;
    const finalOrder = r.afterKg * r.orderQty;
    // Build the same Fabrics Type summary used by the Knit Garments report.
    let savedPantGroups = [];
    try {
      const stored = JSON.parse(localStorage.getItem('fc-knit-pant-fabric-groups-v1') || '[]');
      if (Array.isArray(stored)) savedPantGroups = stored.filter(g => g && typeof g.id === 'string' && typeof g.name === 'string' && Array.isArray(g.components));
    } catch (_) {}
    const validRows = r.rows || [];
    const rowByKey = new Map(validRows.map(row => [row.key, row]));
    const assignedKeys = new Set(savedPantGroups.flatMap(group => group.components).filter(key => rowByKey.has(key)));
    const fabricTypeGroups = savedPantGroups.map(group => ({
      name: group.name,
      members: group.components.map(key => rowByKey.get(key)).filter(Boolean)
    })).filter(group => group.members.length);
    const ungroupedRows = validRows.filter(row => !assignedKeys.has(row.key));
    if (ungroupedRows.length) fabricTypeGroups.push({name:'Others',members:ungroupedRows});
    const fabricTypeRows = fabricTypeGroups.map((group,index) => {
      const memberNames = group.members.map(row => row.name).join(', ');
      const groupBefore = group.members.reduce((sum,row) => sum + (Number(row.netKg) || 0),0);
      const groupFinal = group.members.reduce((sum,row) => sum + (Number(row.finalKg ?? row.kg) || 0),0);
      const groupWastage = groupFinal - groupBefore;
      return '<tr><td>'+(index+1)+'</td><td><strong>'+escapeHtml(group.name)+'</strong></td><td>'+escapeHtml(memberNames)+'</td><td>'+fmt(groupBefore*12,3)+' kg</td><td>'+fmt(groupFinal*12,3)+' kg</td><td>'+fmt(groupWastage*r.orderQty,3)+' kg</td><td><strong>'+fmt(groupFinal*r.orderQty,3)+' kg</strong></td><td>—</td></tr>';
    }).join('');
    const fabricTypeSection = '<section class="section"><div class="section-head">'+reportIcon('summary')+'<span>FABRICS TYPE WISE SUMMARY</span></div><table class="fabric-type-table"><thead><tr><th>SL</th><th>FABRIC TYPE</th><th>COMPONENTS</th><th>BEFORE WASTAGE / DZ</th><th>FINAL / DZ</th><th>WASTAGE / ORDER</th><th>ORDER TOTAL</th><th>REMARKS</th></tr></thead><tbody>'+(fabricTypeRows || '<tr><td colspan="8">'+(validRows.length ? 'No grouped components.' : 'Quick Estimate — overall pant fabric consumption')+'</td></tr>')+'</tbody></table></section>';
    const filePart = value => String(value || '').trim().replace(/[^a-z0-9-_]+/gi,'_').replace(/^_+|_+$/g,'').slice(0,40);
    const fileName = ['FC',filePart(r.buyer),filePart(r.style),filePart(r.po) ? 'PO'+filePart(r.po).replace(/^PO[_-]?/i,'') : '',reportId].filter(Boolean).join('_');
    const report = '<div class="report">'+
      '<div class="report-header"><div><div class="brand">FABRiCS <span>CONSUMPTiON</span></div><div class="subtitle">GARMENT CALCULATOR SUITE</div></div><div class="report-title"><div class="eyebrow">CALCULATION REPORT</div><h1>Knit Pant Fabric Consumption</h1><div class="report-id">'+reportId+'</div></div></div>'+
      '<div class="meta-grid"><div><span>Report Date</span><strong>'+dateText+'</strong></div><div><span>Time</span><strong>'+timeText+'</strong></div><div><span>Unit</span><strong>'+escapeHtml(r.unit)+'</strong></div><div><span>Order Quantity</span><strong>'+r.orderQty+' pcs</strong></div></div>'+
      '<section class="section"><div class="section-head">'+reportIcon('info')+'<span>ORDER INFORMATION</span></div><div class="info-grid"><div><span>Buyer Name</span><strong>'+(escapeHtml(r.buyer)||'________________')+'</strong></div><div><span>Style No.</span><strong>'+(escapeHtml(r.style)||'________________')+'</strong></div><div><span>PO / Order No.</span><strong>'+(escapeHtml(r.po)||'________________')+'</strong></div><div><span>Pant Type</span><strong>'+escapeHtml(r.type)+'</strong></div></div></section>'+
      '<section class="section"><div class="section-head">'+reportIcon('components')+'<span>COMPONENT-WISE CONSUMPTION</span></div><table class="consumption-table"><thead><tr><th>SL</th><th>Component</th><th>Consumption / Piece</th><th>Consumption / Dozen</th><th>Order Total</th><th>Remarks</th></tr></thead><tbody>'+(rows||'<tr><td colspan="6">Quick estimate summary</td></tr>')+'</tbody></table></section>'+
      fabricTypeSection+
      '<section class="section"><div class="section-head">'+reportIcon('summary')+'<span>CALCULATION METHOD</span></div><div style="padding:12px 13px;font-size:10px;line-height:1.6"><strong>'+escapeHtml(r.methodName)+'</strong><div style="margin-top:4px;color:#475569">'+escapeHtml(r.note)+'</div></div></section>'+
      '<div class="summary-grid"><div class="summary-card"><div class="metric-head">'+reportIcon('components')+'<span>BEFORE WASTAGE</span></div><strong>'+fmt(r.beforeKg,4)+' kg/pc</strong><small>'+fmt(beforeOrder,3)+' kg per order</small></div><div class="summary-card"><div class="metric-head">'+reportIcon('warning')+'<span>WASTAGE ADDED</span></div><strong>'+fmt(r.afterKg-r.beforeKg,4)+' kg/pc</strong><small>'+fmt(wastageOrder,3)+' kg per order</small></div><div class="summary-card primary"><div class="metric-head">'+reportIcon('summary')+'<span>FINAL ORDER TOTAL</span></div><strong>'+fmt(finalOrder,3)+' kg</strong><small>Including wastage</small></div><div class="summary-card"><div class="metric-head">'+reportIcon('file')+'<span>PER DOZEN</span></div><strong>'+fmt(r.afterKg*12,3)+' kg/dz</strong><small>Final consumption</small></div></div>'+
      '<section class="comments-section"><div class="comments-title">COMMENTS:</div><div class="comments-writing-area"></div></section>'+
      '<div class="note">'+reportIcon('warning')+'<div><strong>IMPORTANT:</strong> Consumption estimate only; costing excluded. Verify dimensions, allowances, GSM, wastage and order quantity against the approved pattern/CAD marker and actual factory consumption.</div></div>'+
      '<div class="approval-grid"><div><span>PREPARED BY</span><strong></strong></div><div><span>CHECKED BY</span><strong></strong></div><div><span>APPROVED BY</span><strong></strong></div></div>'+
      '<div class="report-footer"><span>Fabrics Consumption • Garment Calculator Suite</span><span>'+dateText+' · '+timeText+' · <a href="https://fabricconsumption.vercel.app/" target="_blank" rel="noopener noreferrer">fabricconsumption.vercel.app</a></span></div></div>';
    if (typeof generatePDF === 'function') generatePDF(fileName, report);
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
        showDemoValues = false;
        activateMethod('components');
        renderComponentRows();
        calculatePantConsumption();
      }
    });
    $('kp-confirm-add-component')?.addEventListener('click', () => {
      showDemoValues = false;
      const select = $('kp-add-component-select');
      const key = select?.value;
      if (!key) return;
      addComponentByKey(key);
      select.value = '';
    });
    $('kp-add-component')?.addEventListener('click', () => { showDemoValues = false; addCustomComponent(); });
    // Match Knit Garments Demo toggle: load a complete sample state, then restore the exact prior state.
    $('kp-demo')?.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      const btn = $('kp-demo');
      const active = btn?.getAttribute('aria-pressed') === 'true';
      if (active) {
        if (kpDemoSnapshot) kpApplyState(kpDemoSnapshot);
        kpDemoSnapshot = null;
        btn?.classList.remove('is-active');
        btn?.setAttribute('aria-pressed', 'false');
      } else {
        kpDemoSnapshot = kpCaptureState();
        loadDemo();
        btn?.classList.add('is-active');
        btn?.setAttribute('aria-pressed', 'true');
      }
    });
    $('kp-reset')?.addEventListener('click',()=>{resetAll();kpDemoSnapshot=null;$('kp-demo')?.setAttribute('aria-pressed','false');$('kp-demo')?.classList.remove('is-active')});
    $('kp-recent-open')?.addEventListener('click',()=>{const panel=$('kp-recent-panel'),opening=panel.hidden;kpRenderRecent();panel.hidden=!opening;$('kp-recent-open').classList.toggle('is-active',opening);$('kp-recent-open').setAttribute('aria-expanded',String(opening))});
    $('kp-report-settings')?.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      kpOpenReportModal();
    });
    document.querySelectorAll('[data-close-kp-modal]').forEach(el=>el.addEventListener('click',kpCloseReportModal));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !$('kp-report-modal')?.hidden) kpCloseReportModal();
    });
    $('kp-report-save')?.addEventListener('click',()=>{
      const buyer = $('kp-report-buyer')?.value.trim() || '';
      const style = $('kp-report-style')?.value.trim() || '';
      const po = $('kp-report-po')?.value.trim() || '';
      const type = $('kp-report-type')?.value.trim() || 'Knit Pant';
      const reportInfo = { buyer, style, po, type };
      if (!kpWriteReportInfo(reportInfo)) return;
      // Keep legacy controls in sync when present; the saved report info also survives page reloads.
      const typeSelect = $('kp-pant-type');
      if (typeSelect) {
        if (type && !Array.from(typeSelect.options).some(o => o.value === type)) {
          const option = document.createElement('option');
          option.value = type;
          option.textContent = type;
          typeSelect.appendChild(option);
        }
        if (type) typeSelect.value = type;
      }
      if (lastResult) {
        lastResult.buyer = buyer;
        lastResult.style = style;
        lastResult.po = po;
        lastResult.type = type;
      }
      kpCloseReportModal();
    });
    $('btn-pdf-knitpant')?.addEventListener('click',()=>{kpSaveRecent(false);downloadKnitPantReport()});
    kpRenderRecent();
    document.querySelectorAll('#page-knitpant input, #page-knitpant select').forEach(input => {
      if (!input.closest('#kp-component-rows') && input.id !== 'kp-unit' && input.id !== 'kp-pant-type' && input.id !== 'kp-buyer' && input.id !== 'kp-style' && input.id !== 'kp-po' && input.name !== 'kp-method' && input.id !== 'kp-add-component-select') input.addEventListener('input', () => {
        if (input.closest('#kp-quick-panel')) activateMethod('quick');
        updateInseamTotal();
        updatePantMeasurementTotals();
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
