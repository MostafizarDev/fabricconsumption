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
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${title}</title>
            <meta charset="UTF-8">
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Inter', sans-serif; padding: 30px; max-width: 800px; margin: 0 auto; }
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
                @media print {
                    body { padding: 0; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            ${contentHtml}
            <div class="footer">
                © 2026 Mostafizar Rahman | TG: @mostafizarfiz
            </div>
            <script>
                window.onload = function() { 
                    window.print(); 
                    setTimeout(function() { window.close(); }, 1000);
                };
            <\/script>
        </body>
        </html>
    `);
    printWindow.document.close();
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
