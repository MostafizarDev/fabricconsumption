// ============================================
// UTILITIES.JS - Common Functions
// ============================================

// Get element value as number
function v(id) {
    return parseFloat(document.getElementById(id)?.value) || 0;
}

// Get element by ID
function el(id) {
    return document.getElementById(id);
}

// Set text content of an element
function set(id, val) {
    const e = el(id);
    if (e) e.textContent = val;
}

// Format number with decimal places
function fmt(n, d = 3) {
    return isNaN(n) ? '—' : n.toFixed(d);
}

// Get total of two inputs (actual + allowance)
function tot(aId, bId) {
    return v(aId) + v(bId);
}

// Update seam allowance total display
function saUpdate(aId, bId, tId, unit = 'cm') {
    const total = v(aId) + v(bId);
    const span = el(tId);
    if (span) span.innerHTML = total.toFixed(1) + ' ' + unit;
}

// Convert cm to inch
function cmToInch(cm) {
    return cm / 2.54;
}

// Convert inch to cm
function inchToCm(inch) {
    return inch * 2.54;
}

// ========== URL ROUTING (WEB + FUTURE MOBILE APP FRIENDLY) ==========
const FC_PAGE_ROUTES = {
    marker: '/Marker-Consumption',
    knit: '/knit-garments',
    knitpant: '/knit-pant',
    woven: '/woven-shirt',
    booking: '/booking-sheet',
    knitprice: '/knit-price',
    zipper: '/zipper',
    trims: '/trims',
    fob: '/fob-costing',
    sizeratio: '/size-ratio',
    converter: '/converter',
    myformulas: '/my-formulas'
};

const FC_PAGE_TITLES = {
    marker: 'Marker Consumption',
    knit: 'Knit Garments',
    knitpant: 'Knit Pant',
    woven: 'Woven Shirt',
    booking: 'Booking Sheet',
    knitprice: 'Knit Price',
    zipper: 'Zipper Calculator',
    trims: 'Trims Calculator',
    fob: 'FOB Costing',
    sizeratio: 'Size Ratio',
    converter: 'Unit Converter',
    myformulas: 'My Formulas'
};

function getPageIdFromPath(pathname = window.location.pathname) {
    const path = pathname.replace(/\/+$/, '') || '/';
    const match = Object.entries(FC_PAGE_ROUTES).find(([, route]) => route === path);
    return match ? match[0] : 'knit';
}

function getRouteForPage(pageId) {
    return FC_PAGE_ROUTES[pageId] || '/';
}

// ========== PAGE NAVIGATION ==========
function showPage(pageId, btn, routeOptions = {}) {
    // Keep browser URL, refresh, bookmarks, and browser back/forward in sync.
    const route = getRouteForPage(pageId);
    if (!routeOptions.fromHistory && route && window.location.pathname !== route) {
        const method = routeOptions.replace ? 'replaceState' : 'pushState';
        window.history[method]({ pageId }, '', route);
    }

    const pageTitle = FC_PAGE_TITLES[pageId] || 'Garment Calculator Suite';
    document.title = pageTitle + ' | Fabrics Consumption';

    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    // Show selected page
    const targetPage = document.getElementById('page-' + pageId);
    if (targetPage) targetPage.classList.add('active');

    // Update active tab button
    document.querySelectorAll('.tab-btn').forEach(button => {
        button.classList.remove('active');
    });

    if (btn) btn.classList.add('active');

    // Recalculate based on page
    if (pageId === 'marker' && typeof calcMarkerConsumption === 'function') {
        setTimeout(() => calcMarkerConsumption(), 50);
    } else if (pageId === 'knit' && typeof calcKnitGarments === 'function') {
        setTimeout(() => calcKnitGarments(), 50);
    } else if (pageId === 'knitpant' && typeof calcKnitPant === 'function') {
        setTimeout(() => calcKnitPant(), 50);
    } else if (pageId === 'woven' && typeof calcWoven === 'function') {
        setTimeout(() => calcWoven(), 50);
    } else if (pageId === 'booking' && typeof calcBooking === 'function') {
        setTimeout(() => calcBooking(), 50);
    } else if (pageId === 'knitprice' && typeof calcKnitPrice === 'function') {
        setTimeout(() => calcKnitPrice(), 50);
    } else if (pageId === 'zipper' && typeof calcZipper === 'function') {
        setTimeout(() => calcZipper(), 50);
    } else if (pageId === 'trims' && typeof calcThread === 'function') {
        setTimeout(() => {
            if (typeof calcThread === 'function') calcThread();
            if (typeof calcButton === 'function') calcButton();
            if (typeof calcInterlining === 'function') calcInterlining();
        }, 50);
    } else if (pageId === 'fob' && typeof calcFOB === 'function') {
        setTimeout(() => calcFOB(), 50);
    } else if (pageId === 'sizeratio' && typeof calcSizeRatio === 'function') {
        setTimeout(() => calcSizeRatio(), 50);
    } else if (pageId === 'converter' && typeof initConverters === 'function') {
        // Converter already initialized
    } else if (pageId === 'myformulas' && typeof loadMyFormulas === 'function') {
        setTimeout(() => loadMyFormulas(), 50);
    }
}

// ========== PDF GENERATOR ==========
function generatePDF(title, contentHtml) {
    // Open the print window directly from the user's button click.
    // This avoids Chrome iframe unload/Permissions Policy warnings.
    let printWindow = null;

    try {
        printWindow = window.open('', '_blank', 'width=1200,height=900');
    } catch (error) {
        printWindow = null;
    }

    if (!printWindow) {
        if (typeof showToast === 'function') {
            showToast('Please allow pop-ups for this site to print the report.', 'error');
        }
        return;
    }

    let logoSvg = document.querySelector('.logo-image')?.outerHTML || '';
    // Make the complete FABRICS CONSUMPTION wordmark black, while leaving the icon and subtitle unchanged.
    logoSvg = logoSvg.replace(/(<text\b[^>]*>)(FABRiCS|CONSUMPTiON)(<\/text>)/g, (match, open, word, close) => {
        const blackOpen = open
            .replace(/\sfill="[^"]*"/, ' fill="#0F172A"')
            .replace(/\sstroke="[^"]*"/, ' stroke="#0F172A"')
            .replace(/\sfilter="[^"]*"/, '');
        return blackOpen + word + close;
    });

    const fullHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${title}</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Inter', Arial, sans-serif; padding: 10mm; width: 210mm; min-height: 297mm; max-width: none; margin: 0 auto; color: #0f172a; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                h1 { color: #0f172a; border-bottom: 2px solid #0ea5e9; padding-bottom: 10px; margin-bottom: 20px; }
                h2 { color: #1e293b; font-size: 18px; margin: 20px 0 10px 0; }
                h3 { color: #475569; font-size: 14px; margin: 15px 0 8px 0; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; }
                th { background: #f8fafc; font-weight: 600; }
                .total-row { background: #dbeafe; font-weight: bold; }
                .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 20px; }
                .box { background: linear-gradient(135deg, #0f172a, #1e3a5f); color: white; padding: 20px; border-radius: 12px; text-align: center; margin: 20px 0; }
                .box-value { font-size: 32px; font-weight: 800; }
                .highlight { color: #0ea5e9; }

                .report { width: 100%; max-width: none; margin: 0 auto; color: #0f172a; }
                .report-header { display: flex; justify-content: space-between; align-items: center; gap: 24px; padding: 0 0 18px; border-bottom: 3px solid #2563eb; }
                .report-brand { display: inline-flex; align-items: center; background: transparent !important; padding: 0 !important; border-radius: 0 !important; }
                .report-brand svg { display: block; width: 360px; height: auto; }
                .report-header .subtitle { display: none; }
                .brand { font-size: 24px; font-weight: 800; letter-spacing: -0.6px; color: #0f172a; }
                .brand span { color: #0f172a; }
                .subtitle { margin-top: 4px; font-size: 9px; font-weight: 700; letter-spacing: 2px; color: #64748b; }
                .report-title { text-align: right; }
                .eyebrow { font-size: 9px; font-weight: 700; letter-spacing: 1.8px; color: #2563eb; margin-bottom: 3px; }
                .report-title h1 { border: 0; padding: 0; margin: 0; font-size: 22px; color: #0f172a; }
                .report-id { margin-top: 4px; font-size: 9px; color: #64748b; font-family: monospace; }
                .meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 16px 0; }
                .meta-grid > div { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 7px; padding: 9px 11px; }
                .meta-grid span, .info-grid span, .summary-card span { display: block; font-size: 8px; text-transform: uppercase; letter-spacing: .8px; color: #64748b; margin-bottom: 4px; }
                .meta-grid strong, .info-grid strong { font-size: 11px; color: #0f172a; }
                .section { border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin: 14px 0; background: #fff; }
                .section-head { background: #eff6ff; color: #10182d; padding: 8px 11px; font-size: 9px; font-weight: 700; letter-spacing: 1px; display: flex; align-items: center; gap: 7px; border-bottom: 1px solid #dbeafe; }
                .report-icon { width: 13px; height: 13px; flex: 0 0 13px; display: inline-block; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
                .section-head .report-icon { color: #2563eb; }
                .metric-head { display: flex; align-items: center; gap: 6px; margin-bottom: 5px; }
                .metric-head .report-icon { color: #2563eb; }
                .metric-head span { margin-bottom: 0; }
                .note { display: flex; align-items: flex-start; gap: 7px; }
                .info-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; padding: 13px; }
                table { margin: 0; font-size: 9px; }
                th, td { padding: 7px 6px; border: 1px solid #e2e8f0; }
                th { background: #f1f5f9; color: #334155; font-size: 8px; text-transform: uppercase; letter-spacing: .3px; }
                td { color: #1e293b; }
                .muted { color: #64748b; font-size: 7px; margin-top: 2px; }
                .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 9px; margin: 14px 0; }
                .summary-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; background: #fff; }
                .summary-card strong { display: block; font-size: 18px; line-height: 1.1; color: #0f172a; }
                .summary-card small { display: block; margin-top: 3px; font-size: 8px; color: #64748b; }
                .summary-card.primary { background: #eff6ff; border-color: #93c5fd; }
                .summary-card.primary strong { color: #2563eb; font-size: 21px; }
                .status-grid { display: flex; flex-wrap: wrap; gap: 6px 7px; padding: 9px 10px; align-items: center; }
                .status { display: inline-flex; align-items: center; gap: 5px; flex: 0 0 auto; min-width: 0; white-space: nowrap; border: 1px solid #e2e8f0; border-radius: 999px; padding: 4px 8px; font-size: 8px; color: #334155; background: #f8fafc !important; }
                .status b { float: none; margin-left: 1px; font-size: 7px; font-weight: 700; }
                .status.included { border-color: #bbf7d0; background: #f0fdf4 !important; color: #166534; }
                .status.included b { color: #15803d; }
                .status.excluded { border-color: #e2e8f0; background: #f8fafc !important; color: #64748b; }
                .status.excluded b { color: #64748b; }
                .comments-section { min-height: 57px; margin: 10px 0 12px; padding: 7px 10px 7px; border: 1px solid #cbd5e1; border-radius: 6px; }
                .comments-title { margin-bottom: 0; color: #475569; font-size: 8px; font-weight: 700; letter-spacing: 1px; }
                .comments-writing-area { height: 30px; background: transparent; }
                .status-section { margin-top: 8px; }
                .consumption-table th:nth-child(7) { width: 6%; white-space: nowrap; font-size: 6.5px; }
                .formula { border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin: 14px 0; }
                .formula-text { padding: 11px; font-family: monospace; font-size: 9px; line-height: 1.7; color: #334155; }
                .note { background: #fffbeb; border: 1px solid #fde68a; border-radius: 7px; padding: 9px 11px; font-size: 8px; color: #92400e; margin-top: 14px; }
                .report-footer { display: flex; justify-content: space-between; gap: 12px; border-top: 1px solid #e2e8f0; margin-top: 18px; padding-top: 9px; font-size: 8px; color: #94a3b8; }
                .report-footer a { color: inherit; text-decoration: underline; cursor: pointer; }
                .fabric-type-table { table-layout: fixed; font-size: 8px; }
                .fabric-type-table th, .fabric-type-table td { padding: 6px 5px; overflow-wrap: anywhere; }
                .fabric-type-table th { font-size: 7px; }
                .consumption-table { table-layout: fixed; font-size: 8px; }
                .consumption-table th, .consumption-table td { padding: 6px 3px; overflow-wrap: anywhere; vertical-align: middle; text-align: center; }
                .consumption-table th { font-size: 7.5px; letter-spacing: 0; text-align: center; }
                .consumption-table th:nth-child(1) { width: 3%; }
                .consumption-table th:nth-child(2) { width: 14%; }
                .consumption-table th:nth-child(3), .consumption-table th:nth-child(4), .consumption-table th:nth-child(5) { width: 6.2%; }
                .consumption-table th:nth-child(6) { width: 5%; }
                .consumption-table th:nth-child(8), .consumption-table th:nth-child(9) { width: 9%; }
                .consumption-table th:nth-child(10) { width: 9%; }
                .consumption-table th:nth-child(11) { width: 12%; }
                .consumption-table th:nth-child(12) { width: 13.5%; }
                .extra-summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 10px 0 14px; }
                .extra-summary > div { border: 1px solid #dbeafe; background: #f8fafc; border-radius: 7px; padding: 9px; }
                .extra-summary span, .approval-grid span { display: block; font-size: 7px; letter-spacing: .6px; color: #64748b; margin-bottom: 5px; }
                .extra-summary strong { font-size: 9px; color: #0f172a; }
                .approval-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 26px; padding: 10px 0; }
                .approval-grid > div { border-bottom: 1px solid #cbd5e1; padding-bottom: 7px; }
                .approval-grid strong { font-size: 8px; color: #334155; }
                .good-text { color: #047857 !important; }
                .draft-text { color: #b45309 !important; font-size: 8px !important; }

                @page { size: A4 portrait; margin: 0; }
                @media print {
                    html, body { width: 210mm; min-height: 297mm; margin: 0; }
                    body { padding: 10mm; max-width: none; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .no-print { display: none !important; }
                }
            </style>
        </head>
        <body>
            ${contentHtml}
        </body>
        </html>
    `;

    // Replace the report's plain brand block with the exact app logo.
    const brandedHtml = fullHtml.replace(
        '<div class="brand">FABRiCS <span>CONSUMPTiON</span></div>',
        '<div class="report-brand">' + logoSvg + '</div>'
    );

    try {
        printWindow.document.open();
        printWindow.document.write(brandedHtml);
        printWindow.document.close();

        printWindow.focus();

        setTimeout(() => {
            try {
                printWindow.print();
            } catch (error) {
                console.error('PDF print error:', error);
                if (typeof showToast === 'function') {
                    showToast('PDF print failed. Please try again.', 'error');
                }
            }
        }, 500);
    } catch (error) {
        console.error('PDF generation error:', error);
        try { printWindow.close(); } catch (_) {}
        if (typeof showToast === 'function') {
            showToast('PDF report could not be generated.', 'error');
        }
    }
}

// ========== TOAST NOTIFICATION ==========
function showToast(message, type = 'info') {
    let toast = document.getElementById('global-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'global-toast';
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #1e293b;
            color: white;
            padding: 10px 20px;
            border-radius: 8px;
            font-size: 13px;
            z-index: 9999;
            opacity: 0;
            transition: opacity 0.3s;
            pointer-events: none;
            white-space: nowrap;
        `;
        document.body.appendChild(toast);
    }

    const colors = {
        success: '#10b981',
        error: '#ef4444',
        info: '#0ea5e9',
        warning: '#f59e0b'
    };

    toast.style.backgroundColor = colors[type] || '#1e293b';
    toast.textContent = message;
    toast.style.opacity = '1';

    setTimeout(() => {
        toast.style.opacity = '0';
    }, 3000);
}

// ========== EXPORT FUNCTIONS TO GLOBAL ==========
window.v = v;
window.el = el;
window.set = set;
window.fmt = fmt;
window.tot = tot;
window.saUpdate = saUpdate;
window.cmToInch = cmToInch;
window.inchToCm = inchToCm;
window.showPage = showPage;
window.generatePDF = generatePDF;
window.showToast = showToast;
