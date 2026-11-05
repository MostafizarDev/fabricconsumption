// ============================================
// TRIMS.JS - Order-based trims consumption planner
// All calculations and UI behavior are scoped to the Trims page.
// ============================================

(function () {
    'use strict';

    const page = document.getElementById('page-trims');
    if (!page) return;

    const presets = {
        '301': 2.5, '101': 4, '401': 5.5, '304': 7, '503': 12,
        '504': 14, '512': 18, '516': 20, '406': 18, '602': 25, '605': 28
    };

    const defaults = {
        thread: [{ name: 'Main seams', seam: 10, stitch: '301', ratio: 2.5 }],
        piece: [{ name: 'Button', qty: 8, waste: 5, pack: 1 }],
        length: [{ name: 'Main zipper', length: 60, qty: 1, allowance: 0 }],
        interlining: [{ name: 'Collar & cuff', length: 30, width: 10, qty: 2, waste: 0, roll: 90 }]
    };

    const el = function (id) { return document.getElementById(id); };
    const num = function (value) {
        const parsed = parseFloat(value);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
    };
    const value = function (id) { return el(id) ? el(id).value.trim() : ''; };
    const esc = function (text) {
        return String(text == null ? '' : text).replace(/[&<>"']/g, function (char) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
        });
    };
    const fmt = function (number, digits) {
        if (!Number.isFinite(number)) return '—';
        return number.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: digits == null ? 2 : digits
        });
    };
    const field = function (label, name, val, step, min, extra) {
        return '<label class="trims-data-field"><span>' + label + '</span><input type="number" data-field="' + name + '" min="' + min + '" step="' + step + '" inputmode="decimal" value="' + esc(val) + '"' + (extra || '') + '></label>';
    };
    const textField = function (label, name, val) {
        return '<label class="trims-data-field"><span>' + label + '</span><input type="text" data-field="' + name + '" value="' + esc(val) + '"></label>';
    };
    const removeButton = '<button type="button" class="trims-remove-btn" data-remove aria-label="Remove row" title="Remove row">×</button>';

    function threadRow(item) {
        const options = Object.keys(presets).map(function (code) {
            return '<option value="' + code + '"' + (item.stitch === code ? ' selected' : '') + '>Class ' + code + ' · ' + fmt(presets[code], 1) + '×</option>';
        }).join('');
        return '<article class="trims-data-row" data-kind="thread"><div class="trims-data-grid">' +
            textField('Operation', 'name', item.name) +
            field('Seam length (m / garment)', 'seam', item.seam, 'any', '0') +
            '<label class="trims-data-field"><span>Stitch class</span><select data-field="stitch">' + options + '<option value="custom"' + (item.stitch === 'custom' ? ' selected' : '') + '>Custom ratio</option></select></label>' +
            field('Thread / seam ratio', 'ratio', item.ratio, 'any', '0', ' aria-label="Thread length divided by seam length"') +
            removeButton + '</div><div class="trims-row-result" data-row-result></div></article>';
    }
    function pieceRow(item) {
        return '<article class="trims-data-row" data-kind="piece"><div class="trims-data-grid">' +
            textField('Trim name', 'name', item.name) +
            field('Pieces / garment', 'qty', item.qty, 'any', '0') +
            field('Spare allowance (%)', 'waste', item.waste, 'any', '0') +
            field('Pack multiple (pcs)', 'pack', item.pack, '1', '0', ' inputmode="numeric"') +
            removeButton + '</div><div class="trims-row-result" data-row-result></div></article>';
    }
    function lengthRow(item) {
        return '<article class="trims-data-row" data-kind="length"><div class="trims-data-grid">' +
            textField('Trim name', 'name', item.name) +
            field('Cut length (cm / garment)', 'length', item.length, 'any', '0') +
            field('Qty / garment', 'qty', item.qty, 'any', '0') +
            field('Allowance (%)', 'allowance', item.allowance, 'any', '0') +
            removeButton + '</div><div class="trims-row-result" data-row-result></div></article>';
    }
    function interliningRow(item) {
        return '<article class="trims-data-row" data-kind="interlining"><div class="trims-data-grid trims-data-grid-5">' +
            textField('Part / material', 'name', item.name) +
            field('Length (cm)', 'length', item.length, 'any', '0') +
            field('Width (cm)', 'width', item.width, 'any', '0') +
            field('Qty / garment', 'qty', item.qty, 'any', '0') +
            field('Wastage (%)', 'waste', item.waste, 'any', '0') +
            field('Roll width (cm)', 'roll', item.roll, 'any', '0') +
            removeButton + '</div><div class="trims-row-result" data-row-result></div></article>';
    }
    const builders = { thread: threadRow, piece: pieceRow, length: lengthRow, interlining: interliningRow };
    const lists = { thread: 'trims-thread-list', piece: 'trims-piece-list', length: 'trims-length-list', interlining: 'trims-interlining-list' };

    function renderList(kind, rows) {
        const target = el(lists[kind]);
        if (!target) return;
        target.innerHTML = rows.map(builders[kind]).join('');
    }
    Object.keys(defaults).forEach(function (kind) { renderList(kind, defaults[kind]); });

    function rows(kind) {
        const target = el(lists[kind]);
        if (!target) return [];
        return Array.from(target.querySelectorAll('[data-kind="' + kind + '"]')).map(function (row) {
            const result = { node: row };
            row.querySelectorAll('[data-field]').forEach(function (input) {
                result[input.dataset.field] = input.value;
            });
            return result;
        });
    }
    function orderQty() {
        return Math.max(0, Math.floor(num(value('trims-order-qty'))));
    }
    function wasteRate(id) { return num(value(id)) / 100; }

    function calculate() {
        const order = orderQty();
        const threadWaste = wasteRate('trims-thread-waste');
        const threadItems = rows('thread').map(function (item) {
            const seam = num(item.seam), ratio = num(item.ratio);
            const perGarment = seam * ratio * (1 + threadWaste);
            const orderMeters = perGarment * order;
            item.node.querySelector('[data-row-result]').innerHTML =
                '<span>Per garment <strong>' + fmt(perGarment, 3) + ' m</strong></span>' +
                '<span>Per dozen <strong>' + fmt(perGarment * 12, 2) + ' m</strong></span>' +
                '<span>Order <strong>' + fmt(orderMeters, 2) + ' m</strong></span>';
            return { name: item.name || 'Unnamed operation', seam: seam, stitch: item.stitch || 'custom', ratio: ratio, perGarment: perGarment, order: orderMeters };
        });
        const threadTotal = threadItems.reduce(function (sum, item) { return sum + item.order; }, 0);

        const pieceItems = rows('piece').map(function (item) {
            const perGarment = num(item.qty), spare = num(item.waste), pack = Math.floor(num(item.pack));
            const base = perGarment * order, required = base * (1 + spare / 100);
            const purchase = pack > 0 ? Math.ceil(required / pack) * pack : Math.ceil(required);
            item.node.querySelector('[data-row-result]').innerHTML =
                '<span>Base order <strong>' + fmt(base, 0) + ' pcs</strong></span>' +
                '<span>With spare <strong>' + fmt(required, 1) + ' pcs</strong></span>' +
                '<span>Purchase quantity <strong>' + fmt(purchase, 0) + ' pcs</strong></span>';
            return { name: item.name || 'Unnamed trim', perGarment: perGarment, spare: spare, pack: pack, base: base, required: required, purchase: purchase };
        });
        const pieceLineCount = pieceItems.length;

        const lengthItems = rows('length').map(function (item) {
            const cut = num(item.length), perGarment = num(item.qty), allowance = num(item.allowance);
            const baseMeters = cut * perGarment * order / 100;
            const orderMeters = baseMeters * (1 + allowance / 100);
            item.node.querySelector('[data-row-result]').innerHTML =
                '<span>Base length <strong>' + fmt(baseMeters, 2) + ' m</strong></span>' +
                '<span>With allowance <strong>' + fmt(orderMeters, 2) + ' m</strong></span>' +
                '<span>Items <strong>' + fmt(perGarment * order, 0) + ' pcs</strong></span>';
            return { name: item.name || 'Unnamed length trim', cut: cut, perGarment: perGarment, allowance: allowance, base: baseMeters, order: orderMeters };
        });
        const lengthTotal = lengthItems.reduce(function (sum, item) { return sum + item.order; }, 0);

        const interliningItems = rows('interlining').map(function (item) {
            const length = num(item.length), width = num(item.width), perGarment = num(item.qty), waste = num(item.waste), roll = num(item.roll);
            const netOrder = length * width * perGarment * order / 10000;
            const grossOrder = netOrder * (1 + waste / 100);
            const linearMeters = roll > 0 ? grossOrder / (roll / 100) : 0;
            item.node.querySelector('[data-row-result]').innerHTML =
                '<span>Net order area <strong>' + fmt(netOrder, 3) + ' m²</strong></span>' +
                '<span>With wastage <strong>' + fmt(grossOrder, 3) + ' m²</strong></span>' +
                '<span>Approx. roll length <strong>' + (roll > 0 ? fmt(linearMeters, 2) + ' m' : 'Enter roll width') + '</strong></span>';
            return { name: item.name || 'Unnamed interlining', length: length, width: width, perGarment: perGarment, waste: waste, roll: roll, net: netOrder, gross: grossOrder, linear: linearMeters };
        });
        const interliningGross = interliningItems.reduce(function (sum, item) { return sum + item.gross; }, 0);
        

        const put = function (id, text) { const node = el(id); if (node) node.textContent = text; };
        put('trims-thread-total', fmt(threadTotal, 2) + ' m');
        put('trims-summary-order', fmt(order, 0));
        put('trims-summary-thread', fmt(threadTotal, 2) + ' m');
        put('trims-summary-piece', fmt(pieceLineCount, 0) + ' lines');
        put('trims-summary-length', fmt(lengthTotal, 2) + ' m');
        put('trims-summary-area', fmt(interliningGross, 3) + ' m²');

        const resultRows = [
            ['Sewing thread', fmt(threadTotal, 2) + ' m', 'Seam length × stitch ratio × wastage'],
            ['Counted trims', fmt(pieceLineCount, 0) + ' purchase lines', 'Each trim is rounded to its supplier pack separately'],
            ['Length trims', fmt(lengthTotal, 2) + ' m', 'Cut length × quantity + allowance'],
            ['Interlining', fmt(interliningGross, 3) + ' m²', 'Cut-piece area + wastage'],
            ['Interlining roll estimate', interliningItems.length ? 'By material row' : '—', 'Approximate meters are shown per entered roll width']
        ];
        const body = el('trims-results-rows');
        if (body) body.innerHTML = resultRows.map(function (row) {
            return '<tr><td>' + esc(row[0]) + '</td><td>' + esc(row[1]) + '</td><td>' + esc(row[2]) + '</td></tr>';
        }).join('');

        return { order: order, buyer: value('trims-buyer'), style: value('trims-style'), po: value('trims-po'), garment: value('trims-garment'), remarks: value('trims-remarks'), threadWaste: threadWaste * 100, threadItems: threadItems, threadTotal: threadTotal, pieceItems: pieceItems, pieceLineCount: pieceLineCount, lengthItems: lengthItems, lengthTotal: lengthTotal, interliningItems: interliningItems, interliningGross: interliningGross };
    }

    function table(headers, bodyRows) {
        return '<table class="fabric-type-table"><thead><tr>' + headers.map(function (header) { return '<th>' + esc(header) + '</th>'; }).join('') + '</tr></thead><tbody>' + bodyRows.join('') + '</tbody></table>';
    }
    function report(model) {
        const now = new Date();
        const dateText = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        const timeText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateCode = now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0');
        const reportId = 'FC-TRIM-' + dateCode + '-' + String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
        const section = function (number, title, content) {
            return '<section class="section"><div class="section-head"><span>' + number + ' / ' + esc(title) + '</span></div>' + content + '</section>';
        };
        const meta = function (label, text) {
            return '<div><span>' + esc(label) + '</span><strong>' + (text ? esc(text) : '________________') + '</strong></div>';
        };
        const threadRows = model.threadItems.map(function (item) {
            return '<tr><td>' + esc(item.name) + '</td><td>' + esc(item.stitch) + '</td><td>' + fmt(item.seam, 2) + ' m</td><td>' + fmt(item.ratio, 2) + '×</td><td>' + fmt(item.perGarment, 3) + ' m</td><td>' + fmt(item.order, 2) + ' m</td></tr>';
        });
        threadRows.push('<tr class="total-row"><td colspan="5">Order thread total (includes ' + fmt(model.threadWaste, 1) + '% wastage)</td><td>' + fmt(model.threadTotal, 2) + ' m</td></tr>');
        const pieceRows = model.pieceItems.map(function (item) {
            return '<tr><td>' + esc(item.name) + '</td><td>' + fmt(item.perGarment, 2) + '</td><td>' + fmt(item.base, 0) + '</td><td>' + fmt(item.spare, 1) + '%</td><td>' + (item.pack > 0 ? fmt(item.pack, 0) : 'Single pieces') + '</td><td>' + fmt(item.purchase, 0) + '</td></tr>';
        });
        const lengthRows = model.lengthItems.map(function (item) {
            return '<tr><td>' + esc(item.name) + '</td><td>' + fmt(item.cut, 2) + ' cm</td><td>' + fmt(item.perGarment, 2) + '</td><td>' + fmt(item.allowance, 1) + '%</td><td>' + fmt(item.base, 2) + ' m</td><td>' + fmt(item.order, 2) + ' m</td></tr>';
        });
        lengthRows.push('<tr class="total-row"><td colspan="5">Total length trim estimate</td><td>' + fmt(model.lengthTotal, 2) + ' m</td></tr>');
        const liningRows = model.interliningItems.map(function (item) {
            return '<tr><td>' + esc(item.name) + '</td><td>' + fmt(item.length, 1) + ' × ' + fmt(item.width, 1) + ' cm</td><td>' + fmt(item.perGarment, 2) + '</td><td>' + fmt(item.waste, 1) + '%</td><td>' + fmt(item.gross, 3) + ' m²</td><td>' + (item.roll > 0 ? fmt(item.linear, 2) + ' m' : '—') + '</td></tr>';
        });
        liningRows.push('<tr class="total-row"><td colspan="4">Gross interlining area total</td><td>' + fmt(model.interliningGross, 3) + ' m²</td><td>By material row</td></tr>');

        const orderContent = '<div class="info-grid">' +
            meta('Buyer', model.buyer) + meta('Style No.', model.style) + meta('PO / Order No.', model.po) + meta('Garment', model.garment) +
            meta('Order Quantity', fmt(model.order, 0) + ' pcs') + meta('Report Date', dateText) + meta('Report Time', timeText) + '</div>' +
            '<div style="padding:8px 10px;font-size:9px;color:#334155"><strong>Remarks:</strong> ' + (model.remarks ? esc(model.remarks) : '—') + '</div>';
        const summary = '<div class="meta-grid">' +
            meta('Sewing Thread', fmt(model.threadTotal, 2) + ' m') + meta('Counted Trims', fmt(model.pieceLineCount, 0) + ' purchase lines') +
            meta('Length Trims', fmt(model.lengthTotal, 2) + ' m') + meta('Interlining', fmt(model.interliningGross, 3) + ' m²') + '</div>';
        const content = '<div class="report">' +
            '<div class="report-header"><div><div class="brand">FABRiCS <span>CONSUMPTiON</span></div><div class="subtitle">GARMENT CALCULATOR SUITE</div></div><div class="report-title"><div class="eyebrow">PROCUREMENT ESTIMATE</div><h1>Trims Consumption Planner</h1><div class="report-id">' + reportId + '</div></div></div>' +
            section('01', 'ORDER SETUP', orderContent) +
            section('02', 'SEWING THREAD', '<div class="meta-grid">' + meta('Thread wastage', fmt(model.threadWaste, 1) + '%') + meta('Order quantity', fmt(model.order, 0) + ' pcs') + '</div>' + table(['Operation', 'Stitch class', 'Seam / garment', 'Ratio', 'Thread / garment', 'Order thread'], threadRows)) +
            section('03', 'PIECE TRIMS', table(['Trim', 'Qty / garment', 'Base order', 'Spare', 'Pack multiple', 'Purchase qty'], pieceRows)) +
            section('04', 'LENGTH TRIMS', table(['Trim', 'Cut length', 'Qty / garment', 'Allowance', 'Base order', 'Purchase estimate'], lengthRows)) +
            section('05', 'INTERLINING', table(['Part / material', 'Cut size', 'Qty / garment', 'Wastage', 'Gross area', 'Roll estimate'], liningRows)) +
            section('06', 'CALCULATION RESULTS', summary +
                '<div style="padding:8px 10px;font-size:8px;line-height:1.6;color:#475569">Thread = seam length × stitch-class ratio × (1 + thread wastage). Counted trims round up to the supplier pack multiple. Length trims use centimeters converted to meters. Interlining roll length is approximate gross area divided by roll width.</div>') +
            '<div class="note"><div><strong>PLANNING NOTE:</strong> Estimates depend on confirmed garment construction and supplier specifications. Verify thread ratios, zipper length convention, trim packs, usable roll width and cutting efficiency before purchase.</div></div>' +
            '<div class="approval-grid"><div><span>PREPARED BY</span><strong></strong></div><div><span>CHECKED BY</span><strong></strong></div><div><span>APPROVED BY</span><strong></strong></div></div>' +
            '<div class="report-footer"><span>Fabrics Consumption - Garment Calculator Suite</span><span>' + dateText + ' · ' + timeText + ' · <a href="https://fabricconsumption.vercel.app/" target="_blank" rel="noopener noreferrer">fabricconsumption.vercel.app</a></span></div>' +
            '</div>';
        const safeTitleRef = (model.po || reportId).replace(/[^a-z0-9_-]+/gi, '_').slice(0, 40);
        return { title: 'Trims Consumption Planner - ' + safeTitleRef, content: content };
    }

    function downloadReport() {
        const model = calculate();
        const documentData = report(model);
        if (typeof generatePDF === 'function') generatePDF(documentData.title, documentData.content);
        else if (typeof window.print === 'function') window.print();
    }

    page.addEventListener('input', function (event) {
        if (event.target.matches('input')) calculate();
    });
    page.addEventListener('change', function (event) {
        if (event.target.matches('select[data-field="stitch"]')) {
            const row = event.target.closest('[data-kind="thread"]');
            const ratio = row && row.querySelector('[data-field="ratio"]');
            if (ratio && presets[event.target.value]) ratio.value = presets[event.target.value];
        }
        calculate();
    });
    page.addEventListener('click', function (event) {
        const add = event.target.closest('[data-add]');
        if (add) {
            const kind = add.dataset.add;
            const target = el(lists[kind]);
            if (target && builders[kind]) {
                const sample = Object.assign({}, defaults[kind][0]);
                sample.name = kind === 'thread' ? 'New operation' : kind === 'piece' ? 'New trim' : kind === 'length' ? 'New length trim' : 'New part';
                target.insertAdjacentHTML('beforeend', builders[kind](sample));
                calculate();
            }
            return;
        }
        const remove = event.target.closest('[data-remove]');
        if (remove) {
            const row = remove.closest('.trims-data-row');
            if (row) row.remove();
            calculate();
            return;
        }
        if (event.target.closest('#trims-download-pdf')) downloadReport();
    });

    window.TrimsPlanner = { calculate: calculate, downloadReport: downloadReport };
    calculate();
})();

// Retain the page hooks used by the shared navigation code.
function calcThread() { if (window.TrimsPlanner) window.TrimsPlanner.calculate(); }
function updateThread() { calcThread(); }
function calcButton() { if (window.TrimsPlanner) window.TrimsPlanner.calculate(); }
function updateButton() { calcButton(); }
function calcInterlining() { if (window.TrimsPlanner) window.TrimsPlanner.calculate(); }
function updateInterlining() { calcInterlining(); }
function downloadThreadReport() { if (window.TrimsPlanner) window.TrimsPlanner.downloadReport(); }
function downloadButtonReport() { if (window.TrimsPlanner) window.TrimsPlanner.downloadReport(); }
function downloadInterliningReport() { if (window.TrimsPlanner) window.TrimsPlanner.downloadReport(); }
