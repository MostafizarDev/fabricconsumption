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

// ========== PAGE NAVIGATION ==========
function showPage(pageId, btn) {
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
    if (pageId === 'knit' && typeof calcKnitGarments === 'function') {
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
    // Use a hidden iframe instead of window.open().
    // This avoids Chrome popup-blocking issues and the
    // "Cannot read properties of null (reading 'document')" error.
    const existingFrame = document.getElementById('pdf-print-frame');
    if (existingFrame) existingFrame.remove();

    const printFrame = document.createElement('iframe');
    printFrame.id = 'pdf-print-frame';
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '1px';
    printFrame.style.height = '1px';
    printFrame.style.border = '0';
    printFrame.style.opacity = '0';
    printFrame.style.pointerEvents = 'none';

    document.body.appendChild(printFrame);

    const printWindow = printFrame.contentWindow;
    const printDocument = printFrame.contentDocument || printWindow.document;

    if (!printWindow || !printDocument) {
        printFrame.remove();
        if (typeof showToast === 'function') {
            showToast('PDF preview could not be opened.', 'error');
        }
        return;
    }

    printDocument.open();
    printDocument.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${title}</title>
            <meta charset="UTF-8">
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Inter', sans-serif; padding: 30px; max-width: 1100px; margin: 0 auto; }
                h1 { color: #0f172a; border-bottom: 2px solid #0ea5e9; padding-bottom: 10px; margin-bottom: 20px; }
                h2 { color: #1e293b; font-size: 18px; margin: 20px 0 10px 0; }
                h3 { color: #475569; font-size: 14px; margin: 15px 0 8px 0; }
                .header { text-align: center; margin-bottom: 30px; }
                .date { color: #64748b; font-size: 12px; margin-top: 5px; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; }
                th { background: #f8fafc; font-weight: 600; }
                .total-row { background: #dbeafe; font-weight: bold; }
                .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 20px; }
                .box { background: linear-gradient(135deg, #0f172a, #1e3a5f); color: white; padding: 20px; border-radius: 12px; text-align: center; margin: 20px 0; }
                .box-value { font-size: 32px; font-weight: 800; }
                .highlight { color: #0ea5e9; }
                .report { max-width: 1080px; margin: 0 auto; color: #0f172a; }
                .report-header { display: flex; justify-content: space-between; align-items: flex-end; gap: 24px; padding: 0 0 18px; border-bottom: 3px solid #2563eb; }
                .brand { font-size: 24px; font-weight: 800; letter-spacing: -0.6px; color: #0f172a; }
                .brand span { color: #0891b2; }
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
                .section-head { background: #0f172a; color: #fff; padding: 8px 11px; font-size: 9px; font-weight: 700; letter-spacing: 1px; }
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
                .status-grid { display: flex; flex-wrap: wrap; gap: 7px; padding: 11px; }
                .status { flex: 1 1 150px; border-radius: 6px; padding: 8px 10px; font-size: 9px; border: 1px solid #e2e8f0; }
                .status b { float: right; }
                .status.included { background: #f0fdf4; border-color: #bbf7d0; color: #166534; }
                .status.excluded { background: #f8fafc; color: #64748b; }
                .formula { border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin: 14px 0; }
                .formula-text { padding: 11px; font-family: monospace; font-size: 9px; line-height: 1.7; color: #334155; }
                .note { background: #fffbeb; border: 1px solid #fde68a; border-radius: 7px; padding: 9px 11px; font-size: 8px; color: #92400e; margin-top: 14px; }
                .report-footer { display: flex; justify-content: space-between; gap: 12px; border-top: 1px solid #e2e8f0; margin-top: 18px; padding-top: 9px; font-size: 8px; color: #94a3b8; }

                @media print {
                    body { padding: 0; max-width: none; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            ${contentHtml}
            <div class="footer">
                © 2026 Mostafizar Rahman | TG: @mostafizarfiz
            </div>
        </body>
        </html>
    `);
    printDocument.close();

    const cleanup = () => {
        setTimeout(() => {
            if (printFrame.parentNode) printFrame.remove();
        }, 1500);
    };

    printFrame.onload = function() {
        setTimeout(() => {
            try {
                printWindow.focus();
                printWindow.print();
                cleanup();
            } catch (error) {
                console.error('PDF print error:', error);
                if (typeof showToast === 'function') {
                    showToast('PDF print failed. Please try again.', 'error');
                }
                cleanup();
            }
        }, 300);
    };

    // Some browsers do not fire iframe.onload after document.write(),
    // so use a safe fallback check.
    setTimeout(() => {
        if (document.getElementById('pdf-print-frame')) {
            try {
                if (printDocument.readyState === 'complete' || printDocument.readyState === 'interactive') {
                    printWindow.focus();
                    printWindow.print();
                    cleanup();
                }
            } catch (error) {
                console.error('PDF fallback print error:', error);
            }
        }
    }, 700);
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
