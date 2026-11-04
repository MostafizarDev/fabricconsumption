// ============================================
// Garment industry unit and consumption converters
// ============================================

let converterPageInitialized = false;

function initConverters() {
    if (converterPageInitialized) return;
    converterPageInitialized = true;

    initQuickLengthConverter();
    initLengthConverters();
    initWeightConverters();
    initFabricConverters();
    initGSMConverters();
    initAreaConverter();
    initButtonConverters();
    initYarnCountConverter();
    initTemperatureConverters();
    initFabricConsumptionConverters();
    initOrderConsumptionPlanner();
    initThreadConverters();
    initProductionConverters();
    initConverterSearch();
}

function initQuickLengthConverter() {
    const valueInput = el('cv-quick-value');
    const fromSelect = el('cv-quick-from');
    const toSelect = el('cv-quick-to');
    const result = el('cv-quick-result');
    const equation = el('cv-quick-equation');
    const swapButton = el('cv-quick-swap');
    if (!valueInput || !fromSelect || !toSelect || !result || !equation) return;

    const metersPerUnit = { mm:0.001, cm:0.01, m:1, km:1000, in:0.0254, ft:0.3048, yd:0.9144 };
    const unitNames = { mm:'mm', cm:'cm', m:'m', km:'km', in:'in', ft:'ft', yd:'yd' };
    const formatter = new Intl.NumberFormat('en-US', { maximumFractionDigits:6 });

    function update() {
        const raw = valueInput.value.trim();
        if (!raw) {
            equation.textContent = 'Enter a value to convert';
            result.textContent = 'Result appears here';
            return;
        }
        const value = Number(raw);
        const from = fromSelect.value;
        const to = toSelect.value;
        if (!Number.isFinite(value) || !metersPerUnit[from] || !metersPerUnit[to]) {
            equation.textContent = 'Enter a valid measurement';
            result.textContent = '—';
            return;
        }
        const converted = value * metersPerUnit[from] / metersPerUnit[to];
        equation.textContent = formatter.format(value) + ' ' + unitNames[from] + ' =';
        result.textContent = formatter.format(converted) + ' ' + unitNames[to];
    }

    [valueInput, fromSelect, toSelect].forEach(input => {
        input.addEventListener('input', update);
        input.addEventListener('change', update);
    });
    if (swapButton) swapButton.addEventListener('click', () => {
        const previousFrom = fromSelect.value;
        fromSelect.value = toSelect.value;
        toSelect.value = previousFrom;
        update();
    });
    update();
}

function initLengthConverters() {
    bindPair('cv-cm', 'cv-inch', value => value / 2.54, value => value * 2.54, 3);
    bindPair('cv-m', 'cv-yd', value => value / 0.9144, value => value * 0.9144, 3);
    bindPair('cv-m-ft', 'cv-ft', value => value / 0.3048, value => value * 0.3048, 3);
}

function initWeightConverters() {
    bindPair('cv-kg-g', 'cv-g', value => value * 1000, value => value / 1000, 0, 3);
    bindPair('cv-kg-lb', 'cv-lb', value => value / 0.45359237, value => value * 0.45359237, 3);
    bindPair('cv-lb-oz', 'cv-oz-lb', value => value * 16, value => value / 16, 2, 3);
}

function initFabricConverters() {
    const inputs = ['cv-kg','cv-gsm2','cv-wid'];
    inputs.forEach(id => el(id)?.addEventListener('input', calcKgToMeter));

    ['cv-m-kg','cv-gsm-m','cv-width-m'].forEach(id => el(id)?.addEventListener('input', calcMeterToKg));
    ['cv-yd-kg','cv-gsm-yd','cv-width-yd'].forEach(id => el(id)?.addEventListener('input', calcYardToKg));

    calcKgToMeter();
    calcMeterToKg();
    calcYardToKg();
}

function calcKgToMeter() {
    const kg = v('cv-kg');
    const gsm = v('cv-gsm2');
    const width = v('cv-wid');
    if (kg > 0 && gsm > 0 && width > 0) {
        const meter = kg * 1000 / (gsm * width);
        set('cv-kg-res', meter.toFixed(2) + ' m');
        set('cv-kg-res-yd', (meter / 0.9144).toFixed(2) + ' yd');
    } else {
        set('cv-kg-res', '—');
        set('cv-kg-res-yd', '—');
    }
}

function calcMeterToKg() {
    const meter = v('cv-m-kg');
    const gsm = v('cv-gsm-m');
    const width = v('cv-width-m');
    set('cv-m-kg-res', meter > 0 && gsm > 0 && width > 0
        ? ((meter * gsm * width) / 1000).toFixed(3) + ' kg'
        : '—');
}

function calcYardToKg() {
    const yard = v('cv-yd-kg');
    const gsm = v('cv-gsm-yd');
    const width = v('cv-width-yd');
    set('cv-yd-kg-res', yard > 0 && gsm > 0 && width > 0
        ? ((yard * 0.9144 * gsm * width) / 1000).toFixed(3) + ' kg'
        : '—');
}

function initGSMConverters() {
    bindPair('cv-gsm', 'cv-oz', value => value / 33.905747, value => value * 33.905747, 3, 2);
    bindGsmFabricWeight('cv-gsm-kgm', 'cv-width-kgm', 'cv-kgm', 1);
    bindGsmFabricWeight('cv-gsm-kgyd', 'cv-width-kgyd', 'cv-kgyd', 0.9144);
}

function bindGsmFabricWeight(gsmId, widthId, weightId, lengthInMeters) {
    const gsmInput = el(gsmId);
    const widthInput = el(widthId);
    const weightInput = el(weightId);
    if (!gsmInput || !widthInput || !weightInput) return;
    let lastEdited = 'gsm';

    function update() {
        const width = Number(widthInput.value);
        if (!widthInput.value.trim() || !Number.isFinite(width) || width <= 0) {
            if (lastEdited === 'gsm') weightInput.value = '';
            else gsmInput.value = '';
            return;
        }
        if (lastEdited === 'gsm') {
            if (!gsmInput.value.trim()) { weightInput.value = ''; return; }
            const gsm = Number(gsmInput.value);
            weightInput.value = Number.isFinite(gsm) && gsm >= 0
                ? (gsm * width * lengthInMeters / 1000).toFixed(4)
                : '';
        } else {
            if (!weightInput.value.trim()) { gsmInput.value = ''; return; }
            const weight = Number(weightInput.value);
            gsmInput.value = Number.isFinite(weight) && weight >= 0
                ? (weight * 1000 / (width * lengthInMeters)).toFixed(2)
                : '';
        }
    }

    gsmInput.addEventListener('input', () => { lastEdited = 'gsm'; update(); });
    weightInput.addEventListener('input', () => { lastEdited = 'weight'; update(); });
    widthInput.addEventListener('input', update);
}

function initAreaConverter() {
    const squareYardInSquareMeters = 0.83612736;
    bindPair('cv-area-m2', 'cv-area-yd2',
        value => value / squareYardInSquareMeters,
        value => value * squareYardInSquareMeters,
        4);
}

function initButtonConverters() {
    const mmInput = el('cv-btmm');
    const ligneResult = el('cv-btln');
    if (mmInput && ligneResult) {
        mmInput.addEventListener('input', () => {
            const value = readNumber(mmInput);
            ligneResult.textContent = value === null ? '—' : (value / 0.635).toFixed(1) + ' L';
        });
    }

    const ligneInput = el('cv-btln-in');
    const mmResult = el('cv-btmm-out');
    if (ligneInput && mmResult) {
        ligneInput.addEventListener('input', () => {
            const value = readNumber(ligneInput);
            mmResult.textContent = value === null ? '—' : (value * 0.635).toFixed(2) + ' mm';
        });
    }
    updateButtonSizeChart();
}

function updateButtonSizeChart() {
    const commonSizes = [
        { ligne:14, mm:8.9, name:'Shirt button' },
        { ligne:16, mm:10.2, name:'Shirt button' },
        { ligne:18, mm:11.4, name:'Shirt / pant button' },
        { ligne:20, mm:12.7, name:'Pant button' },
        { ligne:22, mm:14.0, name:'Jacket button' },
        { ligne:24, mm:15.2, name:'Jacket / coat button' },
        { ligne:28, mm:17.8, name:'Winter coat button' },
        { ligne:32, mm:20.3, name:'Heavy coat button' },
        { ligne:36, mm:22.9, name:'Blazer button' },
        { ligne:40, mm:25.4, name:'Overcoat button' }
    ];
    const chart = el('button-chart');
    if (!chart) return;
    let html = '<table class="converter-reference-table"><thead><tr><th scope="col">Ligne (L)</th><th scope="col">Diameter</th><th scope="col">Common use</th></tr></thead><tbody>';
    commonSizes.forEach(size => {
        html += '<tr><td>' + size.ligne + ' L</td><td>' + size.mm.toFixed(1) + ' mm</td><td>' + size.name + '</td></tr>';
    });
    chart.innerHTML = html + '</tbody></table>';
}

function initYarnCountConverter() {
    const valueInput = el('cv-yarn-value');
    const fromSelect = el('cv-yarn-from');
    const toSelect = el('cv-yarn-to');
    const result = el('cv-yarn-result');
    if (!valueInput || !fromSelect || !toSelect || !result) return;

    function toTex(value, unit) {
        if (unit === 'tex') return value;
        if (unit === 'denier') return value / 9;
        if (unit === 'ne') return 590.5 / value;
        if (unit === 'nm') return 1000 / value;
        return NaN;
    }
    function fromTex(tex, unit) {
        if (unit === 'tex') return tex;
        if (unit === 'denier') return tex * 9;
        if (unit === 'ne') return 590.5 / tex;
        if (unit === 'nm') return 1000 / tex;
        return NaN;
    }
    function update() {
        const value = readNumber(valueInput);
        if (value === null) { result.textContent = 'Enter a count to see the result.'; return; }
        if (value <= 0) { result.textContent = 'Count must be greater than zero.'; return; }
        const tex = toTex(value, fromSelect.value);
        const converted = fromTex(tex, toSelect.value);
        result.textContent = Number.isFinite(converted)
            ? formatConverterNumber(converted, 3) + ' ' + toSelect.options[toSelect.selectedIndex].text
            : 'Check the selected count units.';
    }
    valueInput.addEventListener('input', update);
    fromSelect.addEventListener('change', update);
    toSelect.addEventListener('change', update);
    update();
}

function initTemperatureConverters() {
    bindPair('cv-celsius', 'cv-fahrenheit',
        value => value * 9 / 5 + 32,
        value => (value - 32) * 5 / 9,
        1);
}

function initFabricConsumptionConverters() {
    bindPair('cv-kgdz', 'cv-kgpc', value => value / 12, value => value * 12, 4, 3);
    bindPair('cv-ydsdz', 'cv-ydspc', value => value / 12, value => value * 12, 4, 3);
    bindPair('cv-msdz', 'cv-mspc', value => value / 12, value => value * 12, 4, 3);
    bindPair('cv-pcs', 'cv-dozen', value => value / 12, value => value * 12, 2, 0);
}

function initOrderConsumptionPlanner() {
    const pcInput = el('cv-order-pc');
    const qtyInput = el('cv-order-qty');
    const wasteInput = el('cv-order-waste');
    const unitSelect = el('cv-order-unit');
    if (!pcInput || !qtyInput || !wasteInput || !unitSelect) return;

    const outputIds = ['cv-order-base','cv-order-waste-out','cv-order-total','cv-order-dozen'];
    function clearOutputs() {
        outputIds.forEach(id => set(id, '—'));
    }
    function update() {
        const pc = readNumber(pcInput);
        const qty = readNumber(qtyInput);
        const waste = readNumber(wasteInput);
        const status = el('cv-order-status');
        if (status) status.className = 'converter-order-status';

        if (pc === null || qty === null) {
            clearOutputs();
            if (status) status.textContent = 'Enter per-piece consumption and order quantity.';
            return;
        }
        if (pc < 0 || qty < 1 || !Number.isInteger(qty) || waste === null || waste < 0 || waste > 100) {
            clearOutputs();
            if (status) {
                status.classList.add('is-error');
                status.textContent = 'Use a whole-number order quantity and wastage from 0% to 100%.';
            }
            return;
        }
        const unit = unitSelect.value;
        const base = pc * qty;
        const addedWaste = base * waste / 100;
        const total = base + addedWaste;
        set('cv-order-base', formatConverterNumber(base, 3) + ' ' + unit);
        set('cv-order-waste-out', formatConverterNumber(addedWaste, 3) + ' ' + unit);
        set('cv-order-total', formatConverterNumber(total, 3) + ' ' + unit);
        set('cv-order-dozen', formatConverterNumber(pc * 12 * (1 + waste / 100), 3) + ' ' + unit + '/dozen');
        if (status) {
            status.classList.add('is-success');
            status.textContent = 'Wastage is applied to the full-order base consumption.';
        }
    }
    [pcInput,qtyInput,wasteInput].forEach(input => input.addEventListener('input', update));
    unitSelect.addEventListener('change', update);
    update();
}

function initThreadConverters() {
    const metersInput = el('cv-thread-m');
    const kgInput = el('cv-thread-kg');
    const countInput = el('cv-thread-count');
    const plyInput = el('cv-thread-ply');
    if (!metersInput || !kgInput || !countInput || !plyInput) return;
    let lastEdited = 'meters';

    function update() {
        const count = readNumber(countInput);
        const ply = readNumber(plyInput);
        if (count === null || count <= 0 || ply === null || ply <= 0) {
            kgInput.value = '';
            metersInput.value = '';
            return;
        }
        const tex = 590.5 / count;
        if (lastEdited === 'meters') {
            const meters = readNumber(metersInput);
            if (meters === null || meters < 0) { kgInput.value = ''; return; }
            kgInput.value = (meters * tex * ply / 1000000).toFixed(5);
        } else {
            const kg = readNumber(kgInput);
            if (kg === null || kg < 0) { metersInput.value = ''; return; }
            metersInput.value = (kg * 1000000 / (tex * ply)).toFixed(0);
        }
    }

    metersInput.addEventListener('input', () => { lastEdited = 'meters'; update(); });
    kgInput.addEventListener('input', () => { lastEdited = 'kg'; update(); });
    countInput.addEventListener('input', update);
    plyInput.addEventListener('input', update);
}

function initProductionConverters() {
    bindPair('cv-rpm', 'cv-spo', value => value, value => value, 0);
    bindPair('cv-cmps', 'cv-mpmin', value => value * 0.6, value => value / 0.6, 2);
}

function initConverterSearch() {
    const search = el('converter-search');
    const clearButton = el('converter-search-clear');
    const status = el('converter-search-status');
    const tools = [...document.querySelectorAll('#page-converter .converter-tool')];
    const navLinks = [...document.querySelectorAll('#converter-jump-nav a[data-target]')];
    const categories = [...document.querySelectorAll('#page-converter .converter-category')];
    if (!search) return;

    function applyFilter() {
        const query = search.value.trim().toLowerCase();
        let visibleCount = 0;
        tools.forEach(tool => {
            const haystack = (tool.dataset.search || '') + ' ' + tool.textContent;
            const visible = !query || haystack.toLowerCase().includes(query);
            tool.hidden = !visible;
            if (visible) visibleCount += 1;
        });
        categories.forEach(category => {
            const hasVisibleTool = category.querySelector('.converter-tool:not([hidden])');
            category.hidden = Boolean(query) && !hasVisibleTool;
        });
        navLinks.forEach(link => {
            const category = el(link.dataset.target);
            link.hidden = Boolean(query) && (!category || category.hidden);
        });
        if (clearButton) clearButton.hidden = !query;
        if (status) {
            status.textContent = query
                ? (visibleCount ? visibleCount + ' matching converter' + (visibleCount === 1 ? '' : 's') + '.'
                    : 'No matching converters. Try a different search.')
                : tools.length + ' garment and factory converters in 6 categories.';
        }
    }
    search.addEventListener('input', applyFilter);
    if (clearButton) clearButton.addEventListener('click', () => {
        search.value = '';
        applyFilter();
        search.focus();
    });
    applyFilter();
}

function readNumber(input) {
    if (!input || !input.value.trim()) return null;
    const value = Number(input.value);
    return Number.isFinite(value) ? value : null;
}

function bindPair(firstId, secondId, firstToSecond, secondToFirst, firstDecimals = 3, secondDecimals = firstDecimals) {
    const first = el(firstId);
    const second = el(secondId);
    if (!first || !second) return;

    function transfer(source, target, convert, decimals) {
        const value = readNumber(source);
        if (value === null) { target.value = ''; return; }
        const result = convert(value);
        target.value = Number.isFinite(result) ? result.toFixed(decimals) : '';
    }
    first.addEventListener('input', () => transfer(first, second, firstToSecond, firstDecimals));
    second.addEventListener('input', () => transfer(second, first, secondToFirst, secondDecimals));
}

function formatConverterNumber(value, decimals = 3) {
    if (!Number.isFinite(value)) return '—';
    return new Intl.NumberFormat('en-US', { minimumFractionDigits:0, maximumFractionDigits:decimals }).format(value);
}

function v(id) {
    const input = el(id);
    const value = readNumber(input);
    return value === null ? 0 : value;
}

function set(id, value) {
    const node = el(id);
    if (node) node.textContent = value;
}

function el(id) {
    return document.getElementById(id);
}

window.calcKgToMeter = calcKgToMeter;
window.calcMeterToKg = calcMeterToKg;
window.calcYardToKg = calcYardToKg;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initConverters, { once:true });
} else {
    initConverters();
}
